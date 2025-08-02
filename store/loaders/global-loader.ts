import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type LoaderState = "idle" | "loading" | "success" | "error";

export interface LoaderOptions {
  message?: string;
  subMessage?: string;
  progress?: number;
  isBlocking?: boolean;
  priority?: number;
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

      startLoading: (options = {}) => {
        set({
          state: "loading",
          isLoading: true,
          message: options.message || "Loading...",
          subMessage: options.subMessage,
          progress: options.progress,
          isBlocking: options.isBlocking || false,
          error: undefined,
        });
      },
      stopLoading: () => {
        // Force reset the state to idle regardless of current state
        set({
          state: "idle",
          isLoading: false,
          message: undefined,
          subMessage: undefined,
          progress: undefined,
          isBlocking: false,
          error: undefined,
        });
      },

      setSuccess: (message) => {
        set({
          state: "success",
          isLoading: false,
          message: message || "Success!",
          error: undefined,
        });
        // Auto-reset after 2 seconds, but only if still in success state
        setTimeout(() => {
          if (get().state === "success") {
            get().stopLoading();
          }
        }, 2000);
      },

      setError: (error) => {
        set({
          state: "error",
          isLoading: false,
          error,
          message: "Error occurred",
        });
        // Auto-reset after 3 seconds, but only if still in error state
        setTimeout(() => {
          if (get().state === "error") {
            get().stopLoading();
          }
        }, 3000);
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
