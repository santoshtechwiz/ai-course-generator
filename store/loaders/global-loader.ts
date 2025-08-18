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

      startLoading: (options = {}) => {
        // Clear any existing timeout
        const currentState = get();
        if (currentState.autoResetTimeoutId) {
          clearTimeout(currentState.autoResetTimeoutId);
        }
        if (currentState.autoProgressIntervalId) {
          clearInterval(currentState.autoProgressIntervalId);
        }

        const startedAt = Date.now();
        const minVisible = typeof options.minVisibleMs === 'number' ? Math.max(0, options.minVisibleMs) : 0;

        // Optional auto-progress up to 90%
        let intervalId: NodeJS.Timeout | null = null;
        if (options.autoProgress) {
          set({ progress: 5 });
          intervalId = setInterval(() => {
            const { progress } = get();
            const current = typeof progress === 'number' ? progress : 0;
            const next = Math.min(98, current + Math.random() * 6 + 4);
            set({ progress: next });
            if (next >= 98) {
              if (get().autoProgressIntervalId) {
                clearInterval(get().autoProgressIntervalId as NodeJS.Timeout);
              }
              set({ autoProgressIntervalId: null });
            }
          }, 150);
        }

        set({
          state: "loading",
          isLoading: true,
          message: options.message || "Loading...",
          subMessage: options.subMessage,
          progress: typeof options.progress === 'number' ? options.progress : get().progress,
          isBlocking: options.isBlocking || false,
          error: undefined,
          autoResetTimeoutId: undefined,
          startedAtMs: startedAt,
          minVisibleMs: minVisible,
          autoProgressIntervalId: intervalId,
        });
      },

      stopLoading: () => {
        const currentState = get();
        const elapsed = currentState.startedAtMs ? Date.now() - currentState.startedAtMs : 0;
        const minVisible = currentState.minVisibleMs || 0;
        const remaining = Math.max(0, minVisible - elapsed);

        // Clear any existing timeout
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
        });

        // If we had autoProgress, quickly animate to 100% before closing
        const bumpToFull = () => {
          const current = typeof get().progress === 'number' ? get().progress! : 0
          if (current < 100) set({ progress: 100 })
        }

        if (remaining > 0) {
          setTimeout(() => { bumpToFull(); setTimeout(finalize, 120) }, remaining);
        } else {
          bumpToFull();
          setTimeout(finalize, 120);
        }
      },

      setSuccess: (message) => {
        const currentState = get();
        
        // Clear any existing timeout
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
        }, 1200);

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
        
        // Clear any existing timeout
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
        }, 2000);

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

// Optional hook to tie loader to Next.js route changes
export function useRouteLoaderBridge() {
  const pathname = usePathname();
  const { startLoading, stopLoading } = useGlobalLoader();
  useEffect(() => {
    // Start quickly, auto-stop shortly after to avoid lingering
    startLoading({ message: "Loading...", isBlocking: true, minVisibleMs: 150, autoProgress: true });
    const id = setTimeout(() => stopLoading(), 200);
    return () => clearTimeout(id);
  }, [pathname, startLoading, stopLoading]);
}
