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
  autoDismissMs?: number;
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
  startedAtMs?: number;
  minVisibleMs: number;
  autoDismissMs: number;

  // Actions
  startLoading: (options?: LoaderOptions) => void;
  stopLoading: () => void;
  setSuccess: (message?: string) => void;
  setError: (error: string) => void;
  setProgress: (progress: number) => void;
  reset: () => void;

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
      startedAtMs: undefined,
      minVisibleMs: 500,
      autoDismissMs: 2000,

      startLoading: (options = {}) => {
        const startedAt = Date.now();
        const minVisible = Math.max(0, options.minVisibleMs ?? 500);
        const autoDismiss = Math.max(1000, options.autoDismissMs ?? 2000);

        set({
          state: "loading",
          isLoading: true,
          message: options.message || "Loading...",
          subMessage: options.subMessage,
          progress: options.progress,
          isBlocking: options.isBlocking || false,
          error: undefined,
          startedAtMs: startedAt,
          minVisibleMs: minVisible,
          autoDismissMs: autoDismiss,
        });
      },

      stopLoading: () => {
        const currentState = get();
        const elapsed = currentState.startedAtMs ? Date.now() - currentState.startedAtMs : 0;
        const remaining = Math.max(0, currentState.minVisibleMs - elapsed);

        if (remaining > 0) {
          // Wait for minimum visibility time
          setTimeout(() => {
            get().reset();
          }, remaining);
        } else {
          // Reset immediately
          get().reset();
        }
      },

      setSuccess: (message) => {
        const currentState = get();
        const elapsed = currentState.startedAtMs ? Date.now() - currentState.startedAtMs : 0;
        const remaining = Math.max(0, currentState.minVisibleMs - elapsed);

        set({
          state: "success",
          isLoading: false,
          message: message || "Operation completed successfully!",
          error: undefined,
          progress: 100,
        });

        // Auto-dismiss after minimum visibility time
        setTimeout(() => {
          const newState = get();
          if (newState.state === "success") {
            get().reset();
          }
        }, Math.max(remaining, 800));
      },

      setError: (error) => {
        const currentState = get();
        const elapsed = currentState.startedAtMs ? Date.now() - currentState.startedAtMs : 0;
        const remaining = Math.max(0, currentState.minVisibleMs - elapsed);

        set({
          state: "error",
          isLoading: false,
          error,
          message: undefined,
          progress: undefined,
        });

        // Auto-dismiss after minimum visibility time
        setTimeout(() => {
          const newState = get();
          if (newState.state === "error") {
            get().reset();
          }
        }, Math.max(remaining, 1500));
      },

      setProgress: (progress) => {
        set({ progress: Math.max(0, Math.min(100, progress)) });
      },

      reset: () => {
        set({
          state: "idle",
          isLoading: false,
          message: undefined,
          subMessage: undefined,
          progress: undefined,
          isBlocking: false,
          error: undefined,
          startedAtMs: undefined,
        });
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

// Simplified route change loader
export function useRouteLoaderBridge() {
  const pathname = usePathname();
  const { startLoading, stopLoading } = useGlobalLoader();
  
  useEffect(() => {
    // Only show loader for actual route changes, not initial load
    if (pathname) {
      startLoading({ 
        message: "Loading...", 
        isBlocking: false, 
        minVisibleMs: 200 
      });
      
      const timer = setTimeout(() => {
        stopLoading();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [pathname, startLoading, stopLoading]);
}
