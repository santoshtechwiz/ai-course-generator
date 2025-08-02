import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type LoaderState = "idle" | "loading" | "success" | "error";

export interface LoaderOptions {
  message?: string;
  subMessage?: string;
  progress?: number;
  isBlocking?: boolean;
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

      startLoading: (options = {}) => {
        // Clear any existing timeout
        const currentState = get();
        if (currentState.autoResetTimeoutId) {
          clearTimeout(currentState.autoResetTimeoutId);
        }

        set({
          state: "loading",
          isLoading: true,
          message: options.message || "Loading...",
          subMessage: options.subMessage,
          progress: options.progress,
          isBlocking: options.isBlocking || false,
          error: undefined,
          autoResetTimeoutId: undefined,
        });
      },

      stopLoading: () => {
        const currentState = get();
        
        // Clear any existing timeout
        if (currentState.autoResetTimeoutId) {
          clearTimeout(currentState.autoResetTimeoutId);
        }

        set({
          state: "idle",
          isLoading: false,
          message: undefined,
          subMessage: undefined,
          progress: undefined,
          isBlocking: false,
          error: undefined,
          autoResetTimeoutId: undefined,
        });
      },

      setSuccess: (message) => {
        const currentState = get();
        
        // Clear any existing timeout
        if (currentState.autoResetTimeoutId) {
          clearTimeout(currentState.autoResetTimeoutId);
        }

        const timeoutId = setTimeout(() => {
          // Only reset if still in success state and this is the same timeout
          const newState = get();
          if (newState.state === "success" && newState.autoResetTimeoutId === timeoutId) {
            get().stopLoading();
          }
        }, 2000);

        set({
          state: "success",
          isLoading: false,
          message: message || "Operation completed successfully!",
          error: undefined,
          autoResetTimeoutId: timeoutId,
        });
      },

      setError: (error) => {
        const currentState = get();
        
        // Clear any existing timeout
        if (currentState.autoResetTimeoutId) {
          clearTimeout(currentState.autoResetTimeoutId);
        }

        const timeoutId = setTimeout(() => {
          // Only reset if still in error state and this is the same timeout
          const newState = get();
          if (newState.state === "error" && newState.autoResetTimeoutId === timeoutId) {
            get().stopLoading();
          }
        }, 3000);

        set({
          state: "error",
          isLoading: false,
          error,
          message: undefined,
          autoResetTimeoutId: timeoutId,
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
