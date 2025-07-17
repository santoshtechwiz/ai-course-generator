import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type LoaderState = "idle" | "loading" | "success" | "error";
export type LoaderTheme = "primary" | "secondary" | "accent" | "minimal";
export type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl";
export type LoaderVariant = "spinner" | "shimmer" | "progress" | "dots" | "pulse";

export interface LoaderOptions {
  message?: string;
  subMessage?: string;
  progress?: number;
  isBlocking?: boolean;
  theme?: LoaderTheme;
  size?: LoaderSize;
  variant?: LoaderVariant;
  duration?: number;
  priority?: number;
  id?: string;
}

interface LoaderInstance {
  id: string;
  state: LoaderState;
  message?: string;
  subMessage?: string;
  progress?: number;
  isBlocking: boolean;
  theme: LoaderTheme;
  size: LoaderSize;
  variant: LoaderVariant;
  priority: number;
  startTime: number;
  error?: string;
}

interface GlobalLoaderStore {
  // State
  activeLoaders: Map<string, LoaderInstance>;
  currentLoader: LoaderInstance | null;
  isLoading: boolean;
  
  // Computed getters
  getHighestPriorityLoader: () => LoaderInstance | null;
  
  // Actions
  startLoading: (options?: LoaderOptions) => string;
  stopLoading: (id?: string) => void;
  updateLoader: (id: string, updates: Partial<LoaderOptions>) => void;
  setSuccess: (id?: string, message?: string) => void;
  setError: (id?: string, error?: string) => void;
  setProgress: (progress: number, id?: string) => void;
  clearAll: () => void;

  // Async helper
  withLoading: <T>(
    promise: Promise<T>,
    options?: LoaderOptions & {
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
    }
  ) => Promise<T>;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createLoaderInstance = (options: LoaderOptions = {}): LoaderInstance => ({
  id: options.id || generateId(),
  state: "loading",
  message: options.message || "Loading...",
  subMessage: options.subMessage,
  progress: options.progress,
  isBlocking: options.isBlocking || false,
  theme: options.theme || "primary",
  size: options.size || "md",
  variant: options.variant || "spinner",
  priority: options.priority || 0,
  startTime: Date.now(),
  error: undefined,
});

export const useGlobalLoader = create<GlobalLoaderStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      activeLoaders: new Map(),
      currentLoader: null,
      isLoading: false,

      getHighestPriorityLoader: () => {
        const loaders = Array.from(get().activeLoaders.values());
        if (loaders.length === 0) return null;
        
        // Sort by priority (higher first), then by blocking status, then by start time
        const sorted = loaders.sort((a, b) => {
          if (a.priority !== b.priority) return b.priority - a.priority;
          if (a.isBlocking !== b.isBlocking) return a.isBlocking ? -1 : 1;
          return a.startTime - b.startTime;
        });
        
        return sorted[0];
      },

      startLoading: (options = {}) => {
        const loader = createLoaderInstance(options);
        const activeLoaders = new Map(get().activeLoaders);
        activeLoaders.set(loader.id, loader);
        
        const currentLoader = get().getHighestPriorityLoader();
        
        set({
          activeLoaders,
          currentLoader,
          isLoading: activeLoaders.size > 0,
        });
        
        return loader.id;
      },

      stopLoading: (id) => {
        const activeLoaders = new Map(get().activeLoaders);
        
        if (id) {
          activeLoaders.delete(id);
        } else {
          // If no ID specified, remove the current highest priority loader
          const current = get().getHighestPriorityLoader();
          if (current) {
            activeLoaders.delete(current.id);
          }
        }
        
        const currentLoader = activeLoaders.size > 0 ? get().getHighestPriorityLoader() : null;
        
        set({
          activeLoaders,
          currentLoader,
          isLoading: activeLoaders.size > 0,
        });
      },

      updateLoader: (id, updates) => {
        const activeLoaders = new Map(get().activeLoaders);
        const loader = activeLoaders.get(id);
        
        if (loader) {
          const updatedLoader = { ...loader, ...updates };
          activeLoaders.set(id, updatedLoader);
          
          const currentLoader = get().getHighestPriorityLoader();
          
          set({
            activeLoaders,
            currentLoader,
          });
        }
      },

      setSuccess: (id, message) => {
        const activeLoaders = new Map(get().activeLoaders);
        const targetId = id || get().currentLoader?.id;
        
        if (targetId) {
          const loader = activeLoaders.get(targetId);
          if (loader) {
            const updatedLoader = {
              ...loader,
              state: "success" as LoaderState,
              message: message || "Success!",
              error: undefined,
            };
            activeLoaders.set(targetId, updatedLoader);
            
            // Auto-remove success loaders after duration
            setTimeout(() => {
              get().stopLoading(targetId);
            }, 2000);
          }
        }
        
        set({
          activeLoaders,
          currentLoader: get().getHighestPriorityLoader(),
        });
      },

      setError: (id, error) => {
        const activeLoaders = new Map(get().activeLoaders);
        const targetId = id || get().currentLoader?.id;
        
        if (targetId) {
          const loader = activeLoaders.get(targetId);
          if (loader) {
            const updatedLoader = {
              ...loader,
              state: "error" as LoaderState,
              error: error || "An error occurred",
              message: "Error occurred",
            };
            activeLoaders.set(targetId, updatedLoader);
            
            // Auto-remove error loaders after duration
            setTimeout(() => {
              get().stopLoading(targetId);
            }, 4000);
          }
        }
        
        set({
          activeLoaders,
          currentLoader: get().getHighestPriorityLoader(),
        });
      },

      setProgress: (progress, id) => {
        const targetId = id || get().currentLoader?.id;
        if (targetId) {
          get().updateLoader(targetId, { 
            progress: Math.max(0, Math.min(100, progress)) 
          });
        }
      },

      clearAll: () => {
        set({
          activeLoaders: new Map(),
          currentLoader: null,
          isLoading: false,
        });
      },

      withLoading: async (promise, options = {}) => {
        const { onSuccess, onError, ...loaderOptions } = options;
        const { startLoading, setSuccess, setError, stopLoading } = get();

        const loaderId = startLoading(loaderOptions);

        try {
          const result = await promise;
          setSuccess(loaderId, options.message || "Operation completed!");
          onSuccess?.(result);
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An error occurred";
          setError(loaderId, errorMessage);
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

// Legacy compatibility helpers
export const useGlobalLoading = () => {
  console.warn("useGlobalLoading is deprecated. Use useGlobalLoader instead.");
  const store = useGlobalLoader();
  
  return {
    showLoading: (options: any) => store.startLoading(options),
    hideLoading: (id?: string) => store.stopLoading(id),
    updateLoading: (id: string, options: any) => store.updateLoader(id, options),
  };
};
