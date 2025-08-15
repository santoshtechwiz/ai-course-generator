import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export type LoaderState = "idle" | "loading" | "success" | "error";

export interface LoaderOptions {
  message?: string;
  subMessage?: string;
  progress?: number;
  isBlocking?: boolean;
  minVisibleMs?: number;
  autoProgress?: boolean;
  deterministic?: boolean;
}

interface GlobalLoaderStore {
  // State
  state: LoaderState;
  isLoading: boolean;
  message?: string;
  subMessage?: string;
  progress?: number;
  isBlocking: boolean;
  error?: string;
  autoResetTimeoutId?: NodeJS.Timeout;
  startedAtMs?: number;
  minVisibleMs?: number;
  autoProgressIntervalId?: NodeJS.Timeout | null;
  deterministic: boolean;

  // Actions
  startLoading: (options?: LoaderOptions) => void;
  stopLoading: () => void;
  setSuccess: (message?: string) => void;
  setError: (error: string) => void;
  setProgress: (progress: number) => void;

  // Async helper
  withLoading: <T>(
    promise: Promise<T>,
    options?: LoaderOptions & {
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
    }
  ) => Promise<T>;
}

export const useGlobalLoader = create<GlobalLoaderStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      state: "idle",
      isLoading: false,
      message: undefined,
      subMessage: undefined,
      progress: undefined,
      isBlocking: false,
      error: undefined,
      autoResetTimeoutId: undefined,
      startedAtMs: undefined,
      minVisibleMs: 0,
      autoProgressIntervalId: null,
      deterministic: true,

      startLoading: (options = {}) => {
        // Clear any existing timeouts and intervals
        const currentState = get();
        if (currentState.autoResetTimeoutId) {
          clearTimeout(currentState.autoResetTimeoutId);
        }
        if (currentState.autoProgressIntervalId) {
          clearInterval(currentState.autoProgressIntervalId);
        }

        const startedAt = Date.now();
        const minVisible = typeof options.minVisibleMs === 'number' ? Math.max(0, options.minVisibleMs) : 0;
        const deterministic = options.deterministic !== false; // Default to true

        // Deterministic auto-progress: smooth progression to 90%
        let intervalId: NodeJS.Timeout | null = null;
        if (options.autoProgress) {
          set({ progress: 0 });
          intervalId = setInterval(() => {
            const { progress } = get();
            const current = typeof progress === 'number' ? progress : 0;
            
            if (deterministic) {
              // Deterministic: smooth progression with easing
              const remaining = 90 - current;
              const increment = Math.max(1, remaining * 0.1); // 10% of remaining
              const next = Math.min(90, current + increment);
              set({ progress: next });
              
              if (next >= 90) {
                if (get().autoProgressIntervalId) {
                  clearInterval(get().autoProgressIntervalId as NodeJS.Timeout);
                }
                set({ autoProgressIntervalId: null });
              }
            } else {
              // Non-deterministic: random increments (for legacy support)
              const next = Math.min(90, current + Math.random() * 6 + 4);
              set({ progress: next });
              if (next >= 90) {
                if (get().autoProgressIntervalId) {
                  clearInterval(get().autoProgressIntervalId as NodeJS.Timeout);
                }
                set({ autoProgressIntervalId: null });
              }
            }
          }, deterministic ? 100 : 150); // Faster updates for deterministic
        }

        set({
          state: "loading",
          isLoading: true,
          message: options.message || "Loading...",
          subMessage: options.subMessage,
          progress: typeof options.progress === 'number' ? options.progress : (options.autoProgress ? 0 : undefined),
          isBlocking: options.isBlocking || false,
          error: undefined,
          autoResetTimeoutId: undefined,
          startedAtMs: startedAt,
          minVisibleMs: minVisible,
          autoProgressIntervalId: intervalId,
          deterministic,
        });
      },

      stopLoading: () => {
        const currentState = get();
        const elapsed = currentState.startedAtMs ? Date.now() - currentState.startedAtMs : 0;
        const minVisible = currentState.minVisibleMs || 0;
        const remaining = Math.max(0, minVisible - elapsed);

        // Clear any existing timeout and interval
        if (currentState.autoResetTimeoutId) {
          clearTimeout(currentState.autoResetTimeoutId);
        }
        if (currentState.autoProgressIntervalId) {
          clearInterval(currentState.autoProgressIntervalId);
        }

        const finalize = () => set({
          state: "idle",
          isLoading: false,
          message: undefined,
          subMessage: undefined,
          progress: undefined,
          isBlocking: false,
          error: undefined,
          autoResetTimeoutId: undefined,
          startedAtMs: undefined,
          minVisibleMs: 0,
          autoProgressIntervalId: null,
          deterministic: true,
        });

        // If we had autoProgress, quickly animate to 100% before closing
        const bumpToFull = () => {
          const current = typeof get().progress === 'number' ? get().progress! : 0;
          if (current < 100) set({ progress: 100 });
        };

        if (remaining > 0) {
          setTimeout(() => { 
            bumpToFull(); 
            setTimeout(finalize, 200); // Slightly longer delay for smooth transition
          }, remaining);
        } else {
          bumpToFull();
          setTimeout(finalize, 200);
        }
      },

      setSuccess: (message) => {
        const currentState = get();
        
        // Clear any existing timeout and interval
        if (currentState.autoResetTimeoutId) {
          clearTimeout(currentState.autoResetTimeoutId);
        }
        if (currentState.autoProgressIntervalId) {
          clearInterval(currentState.autoProgressIntervalId);
        }

        const timeoutId = setTimeout(() => {
          // Only reset if still in success state and this is the same timeout
          const newState = get();
          if (newState.state === "success" && newState.autoResetTimeoutId === timeoutId) {
            get().stopLoading();
          }
        }, 1500); // Slightly longer to show success state

        set({
          state: "success",
          isLoading: false,
          message: message || "Operation completed successfully!",
          error: undefined,
          autoResetTimeoutId: timeoutId,
          progress: 100,
        });
      },

      setError: (error) => {
        const currentState = get();
        
        // Clear any existing timeout and interval
        if (currentState.autoResetTimeoutId) {
          clearTimeout(currentState.autoResetTimeoutId);
        }
        if (currentState.autoProgressIntervalId) {
          clearInterval(currentState.autoProgressIntervalId);
        }

        const timeoutId = setTimeout(() => {
          // Only reset if still in error state and this is the same timeout
          const newState = get();
          if (newState.state === "error" && newState.autoResetTimeoutId === timeoutId) {
            get().stopLoading();
          }
        }, 3000); // Longer timeout for errors to allow user to read

        set({
          state: "error",
          isLoading: false,
          error,
          message: undefined,
          autoResetTimeoutId: timeoutId,
          progress: undefined,
        });
      },

      setProgress: (progress) => {
        set({ progress: Math.max(0, Math.min(100, progress)) });
      },

      withLoading: async (promise, options = {}) => {
        const { onSuccess, onError, ...loaderOptions } = options;
        const { startLoading, setSuccess, setError } = get();

        startLoading(loaderOptions);

        try {
          const result = await promise;
          setSuccess();
          onSuccess?.(result);
          return result;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "An error occurred";
          setError(errorMessage);
          onError?.(error);
          throw error;
        }
      },
    }),
    {
      name: "global-loader-store",
    }
  )
);

// Improved route loader bridge with better timing
export function useRouteLoaderBridge() {
  const pathname = usePathname();
  const { startLoading, stopLoading } = useGlobalLoader();
  
  useEffect(() => {
    // Only show loader for actual route changes, not initial load
    if (pathname) {
      startLoading({ 
        message: "Loading...", 
        isBlocking: true, 
        minVisibleMs: 300, // Minimum visibility to prevent flickering
        autoProgress: true,
        deterministic: true, // Use deterministic progress
      });
      
      // Stop after a reasonable delay
      const id = setTimeout(() => stopLoading(), 800);
      return () => clearTimeout(id);
    }
  }, [pathname, startLoading, stopLoading]);
}
