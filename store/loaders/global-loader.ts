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
  /** When true, legacy random auto progress (kept for backward compatibility). */
  autoProgress?: boolean;
  /** Deterministic linear progress target duration in ms (overrides autoProgress random mode). */
  linearDurationMs?: number;
  /** Use task based progress if tasks are registered. */
  useTasks?: boolean;
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
  linearProgressRaf?: number | null;

  // Task based deterministic progress
  tasks: Record<string, { weight: number; done: boolean }>; // active & completed tasks
  totalWeight: number; // sum of weights for all begun tasks
  completedWeight: number; // sum of weights for finished tasks
  recalcProgress: () => void;
  beginTask: (id: string, weight?: number) => void;
  endTask: (id: string) => void;
  withTask: <T>(id: string, task: () => Promise<T>, weight?: number) => Promise<T>;

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
      linearProgressRaf: null,
      tasks: {},
      totalWeight: 0,
      completedWeight: 0,
      recalcProgress: () => {
        const { tasks } = get();
        const entries = Object.values(tasks);
        if (!entries.length) return; // nothing to do
        const total = entries.reduce((a, t) => a + t.weight, 0) || 1;
        const completed = entries.filter(t => t.done).reduce((a, t) => a + t.weight, 0);
        const pct = Math.min(99, (completed / total) * 100);
        set({ progress: pct });
      },
      beginTask: (id: string, weight = 1) => {
        const { tasks, totalWeight, state } = get();
        if (state !== 'loading') {
          // Ensure loader started (non-blocking default)
          get().startLoading({ message: 'Loading...', useTasks: true });
        }
        if (!tasks[id]) {
          tasks[id] = { weight: Math.max(0.01, weight), done: false };
          set({ tasks: { ...tasks }, totalWeight: totalWeight + weight });
        }
        get().recalcProgress();
      },
      endTask: (id: string) => {
        const { tasks, state } = get();
        if (!tasks[id]) return;
        if (!tasks[id].done) {
          tasks[id].done = true;
          set({ tasks: { ...tasks } });
          get().recalcProgress();
        }
        // If all tasks complete, finish loader
        if (state === 'loading' && Object.values(tasks).every(t => t.done)) {
          // brief frame to show 100%
            set({ progress: 100 });
            setTimeout(() => get().stopLoading(), 150);
        }
      },
      withTask: async (id, task, weight = 1) => {
        get().beginTask(id, weight);
        try {
          const result = await task();
          get().endTask(id);
          return result;
        } catch (e) {
          get().setError(e instanceof Error ? e.message : 'Task failed');
          get().endTask(id);
          throw e;
        }
      },

      startLoading: (options = {}) => {
        // Clear any existing timeout
        const currentState = get();
        if (currentState.autoResetTimeoutId) {
          clearTimeout(currentState.autoResetTimeoutId);
        }
        if (currentState.autoProgressIntervalId) {
          clearInterval(currentState.autoProgressIntervalId);
        }
        if (currentState.linearProgressRaf) {
          cancelAnimationFrame(currentState.linearProgressRaf);
        }

        const startedAt = Date.now();
        const minVisible = typeof options.minVisibleMs === 'number' ? Math.max(0, options.minVisibleMs) : 0;

        // Determine progress strategy
        let intervalId: NodeJS.Timeout | null = null;
        let rafId: number | null = null;
        if (options.useTasks) {
          // Reset tasks for a fresh cycle
          set({ tasks: {}, totalWeight: 0, completedWeight: 0, progress: 0 });
        } else if (options.linearDurationMs && options.linearDurationMs > 300) {
          const totalMs = options.linearDurationMs;
          set({ progress: 0 });
          const start = performance.now();
          const step = () => {
            const elapsed = performance.now() - start;
            const ratio = Math.min(0.985, elapsed / totalMs); // cap before 100
            set({ progress: Math.max(5, ratio * 100) });
            if (ratio < 0.985) {
              rafId = requestAnimationFrame(step);
              set({ linearProgressRaf: rafId });
            }
          };
          rafId = requestAnimationFrame(step);
        } else if (options.autoProgress) {
          // Legacy random behavior retained if explicitly requested
          set({ progress: 5 });
          intervalId = setInterval(() => {
            const { progress } = get();
            const current = typeof progress === 'number' ? progress : 0;
            const next = Math.min(98, current + 5); // deterministic +5 steps
            set({ progress: next });
            if (next >= 98) {
              if (get().autoProgressIntervalId) {
                clearInterval(get().autoProgressIntervalId as NodeJS.Timeout);
              }
              set({ autoProgressIntervalId: null });
            }
          }, 160);
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
          linearProgressRaf: rafId,
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
  if (currentState.autoProgressIntervalId) clearInterval(currentState.autoProgressIntervalId);
  if (currentState.linearProgressRaf) cancelAnimationFrame(currentState.linearProgressRaf);

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
  if (currentState.autoProgressIntervalId) clearInterval(currentState.autoProgressIntervalId);
  if (currentState.linearProgressRaf) cancelAnimationFrame(currentState.linearProgressRaf);

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
  if (currentState.autoProgressIntervalId) clearInterval(currentState.autoProgressIntervalId);
  if (currentState.linearProgressRaf) cancelAnimationFrame(currentState.linearProgressRaf);

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
