import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type LoaderState = "idle" | "loading" | "success" | "error";
export type LoaderTheme = "primary" | "secondary" | "accent" | "minimal";
export type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl";
export type LoaderVariant = "spinner" | "shimmer" | "progress" | "dots" | "pulse";
export type LoaderContext = 
  | "route" | "api" | "upload" | "download" | "auth" | "save" | "delete" 
  | "generate" | "process" | "search" | "quiz" | "course" | "user" | "default";

export interface LoaderOptions {
  message?: string;
  subMessage?: string;
  progress?: number;
  isBlocking?: boolean;
  theme?: LoaderTheme;
  size?: LoaderSize;
  variant?: LoaderVariant;
  context?: LoaderContext;
  priority?: number;
  id?: string;
  timeout?: number;
  retryable?: boolean;
}

interface LoaderInstance {
  id: string;
  state: LoaderState;
  message: string;
  subMessage?: string;
  progress?: number;
  isBlocking: boolean;
  theme: LoaderTheme;
  size: LoaderSize;
  variant: LoaderVariant;
  context: LoaderContext;
  priority: number;
  startTime: number;
  timeout?: number;
  retryable: boolean;
  error?: string;
}

interface GlobalLoaderStore {
  // State
  activeLoaders: Map<string, LoaderInstance>;
  currentLoader: LoaderInstance | null;
  isLoading: boolean;
  context: LoaderContext;
  
  // Context-aware helpers
  getContextualMessage: (context: LoaderContext) => string;
  getContextualConfig: (context: LoaderContext) => Partial<LoaderOptions>;
  
  // Actions
  startLoading: (options?: LoaderOptions) => string;
  stopLoading: (id?: string) => void;
  updateLoader: (id: string, updates: Partial<LoaderOptions>) => void;
  setProgress: (progress: number, id?: string) => void;
  setSuccess: (id?: string, message?: string) => void;
  setError: (id?: string, error?: string) => void;
  retry: (id?: string) => void;
  clearAll: () => void;

  // Context-specific methods
  startRouteLoading: (route: string) => string;
  startApiLoading: (endpoint: string, method?: string) => string;
  startUploadLoading: (filename?: string) => string;
  startQuizLoading: (quizType?: string) => string;
  startAuthLoading: (action?: string) => string;

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

const CONTEXT_CONFIGS: Record<LoaderContext, Partial<LoaderOptions>> = {
  route: {
    theme: "primary",
    variant: "shimmer",
    size: "md",
    isBlocking: true,
    timeout: 10000,
    message: "Navigating...",
    subMessage: "Loading your destination",
  },
  api: {
    theme: "primary",
    variant: "spinner",
    size: "sm",
    isBlocking: false,
    timeout: 30000,
    message: "Fetching data...",
    subMessage: "Please wait while we get your information",
  },
  upload: {
    theme: "accent",
    variant: "progress",
    size: "md",
    isBlocking: true,
    message: "Uploading file...",
    subMessage: "Please don't close this window",
  },
  download: {
    theme: "accent",
    variant: "progress",
    size: "sm",
    isBlocking: false,
    message: "Downloading...",
    subMessage: "Preparing your file",
  },
  auth: {
    theme: "secondary",
    variant: "pulse",
    size: "md",
    isBlocking: true,
    timeout: 15000,
    message: "Authenticating...",
    subMessage: "Securing your session",
  },
  save: {
    theme: "primary",
    variant: "dots",
    size: "sm",
    isBlocking: false,
    message: "Saving changes...",
    subMessage: "Your work is being preserved",
  },
  delete: {
    theme: "minimal",
    variant: "spinner",
    size: "sm",
    isBlocking: false,
    message: "Deleting...",
    subMessage: "Removing the item safely",
  },
  generate: {
    theme: "secondary",
    variant: "shimmer",
    size: "lg",
    isBlocking: true,
    timeout: 60000,
    message: "AI is working...",
    subMessage: "Generating personalized content with advanced AI",
  },
  process: {
    theme: "primary",
    variant: "progress",
    size: "md",
    isBlocking: true,
    timeout: 45000,
    message: "Processing...",
    subMessage: "Analyzing and preparing your content",
  },
  search: {
    theme: "minimal",
    variant: "pulse",
    size: "xs",
    isBlocking: false,
    message: "Searching...",
    subMessage: "Finding relevant results",
  },
  quiz: {
    theme: "accent",
    variant: "shimmer",
    size: "md",
    isBlocking: true,
    timeout: 20000,
    message: "Loading quiz...",
    subMessage: "Preparing your learning experience",
  },
  course: {
    theme: "primary",
    variant: "shimmer",
    size: "md",
    isBlocking: true,
    timeout: 15000,
    message: "Loading course...",
    subMessage: "Setting up your learning environment",
  },
  user: {
    theme: "secondary",
    variant: "pulse",
    size: "sm",
    isBlocking: false,
    message: "Loading profile...",
    subMessage: "Getting your account information",
  },
  default: {
    theme: "primary",
    variant: "spinner",
    size: "md",
    isBlocking: false,
    message: "Loading...",
    subMessage: "Please wait a moment",
  },
};

const CONTEXT_PRIORITIES: Record<LoaderContext, number> = {
  auth: 100,        // Highest priority
  upload: 90,
  delete: 80,
  save: 70,
  route: 60,
  generate: 50,
  process: 40,
  quiz: 30,
  course: 25,
  download: 20,
  api: 15,
  user: 10,
  search: 5,
  default: 0,       // Lowest priority
};

const createLoaderInstance = (options: LoaderOptions = {}): LoaderInstance => {
  const context = options.context || "default";
  const contextConfig = CONTEXT_CONFIGS[context];
  const priority = options.priority ?? CONTEXT_PRIORITIES[context];

  return {
    id: options.id || generateId(),
    state: "loading",
    message: options.message || contextConfig.message || "Loading...",
    subMessage: options.subMessage || contextConfig.subMessage,
    progress: options.progress,
    isBlocking: options.isBlocking ?? contextConfig.isBlocking ?? false,
    theme: options.theme || contextConfig.theme || "primary",
    size: options.size || contextConfig.size || "md",
    variant: options.variant || contextConfig.variant || "spinner",
    context,
    priority,
    startTime: Date.now(),
    timeout: options.timeout || contextConfig.timeout,
    retryable: options.retryable ?? false,
    error: undefined,
  };
};

const getHighestPriorityLoader = (loaders: Map<string, LoaderInstance>): LoaderInstance | null => {
  const loaderArray = Array.from(loaders.values());
  if (loaderArray.length === 0) return null;

  // Sort by priority (higher first), then by blocking status, then by start time
  const sorted = loaderArray.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.isBlocking !== b.isBlocking) return a.isBlocking ? -1 : 1;
    return a.startTime - b.startTime;
  });

  return sorted[0];
};

export const useGlobalLoader = create<GlobalLoaderStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      activeLoaders: new Map(),
      currentLoader: null,
      isLoading: false,
      context: "default",

      getContextualMessage: (context: LoaderContext) => {
        return CONTEXT_CONFIGS[context]?.message || "Loading...";
      },

      getContextualConfig: (context: LoaderContext) => {
        return CONTEXT_CONFIGS[context] || CONTEXT_CONFIGS.default;
      },

      startLoading: (options = {}) => {
        const loader = createLoaderInstance(options);
        const activeLoaders = new Map(get().activeLoaders);
        activeLoaders.set(loader.id, loader);
        
        // Get current loader AFTER adding the new one
        const currentLoader = getHighestPriorityLoader(activeLoaders);
        
        set({
          activeLoaders,
          currentLoader,
          isLoading: activeLoaders.size > 0,
          context: loader.context,
        });

        // Auto-timeout if specified
        if (loader.timeout) {
          setTimeout(() => {
            const state = get();
            if (state.activeLoaders.has(loader.id)) {
              get().setError(loader.id, "Operation timed out");
            }
          }, loader.timeout);
        }
        
        return loader.id;
      },

      stopLoading: (id) => {
        const activeLoaders = new Map(get().activeLoaders);
        
        if (id) {
          activeLoaders.delete(id);
        } else {
          // If no ID specified, remove the current highest priority loader
          const current = get().currentLoader;
          if (current) {
            activeLoaders.delete(current.id);
          }
        }
        
        const currentLoader = getHighestPriorityLoader(activeLoaders);
        
        set({
          activeLoaders,
          currentLoader,
          isLoading: activeLoaders.size > 0,
          context: currentLoader?.context || "default",
        });
      },

      updateLoader: (id, updates) => {
        const activeLoaders = new Map(get().activeLoaders);
        const loader = activeLoaders.get(id);
        
        if (loader) {
          const updatedLoader = { ...loader, ...updates };
          activeLoaders.set(id, updatedLoader);
          
          const currentLoader = getHighestPriorityLoader(activeLoaders);
          
          set({
            activeLoaders,
            currentLoader,
            context: currentLoader?.context || "default",
          });
        }
      },

      setProgress: (progress, id) => {
        const targetId = id || get().currentLoader?.id;
        if (targetId) {
          get().updateLoader(targetId, { 
            progress: Math.max(0, Math.min(100, progress)) 
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
            
            const currentLoader = getHighestPriorityLoader(activeLoaders);
            
            set({
              activeLoaders,
              currentLoader,
              context: currentLoader?.context || "default",
            });
            
            // Auto-remove success loaders after 2 seconds
            setTimeout(() => {
              get().stopLoading(targetId);
            }, 2000);
          }
        }
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
            
            const currentLoader = getHighestPriorityLoader(activeLoaders);
            
            set({
              activeLoaders,
              currentLoader,
              context: currentLoader?.context || "default",
            });
            
            // Auto-remove error loaders after 4 seconds
            setTimeout(() => {
              get().stopLoading(targetId);
            }, 4000);
          }
        }
      },

      retry: (id) => {
        const targetId = id || get().currentLoader?.id;
        if (targetId) {
          const loader = get().activeLoaders.get(targetId);
          if (loader && loader.retryable) {
            get().updateLoader(targetId, {
              state: "loading",
              error: undefined,
              startTime: Date.now(),
            });
          }
        }
      },

      clearAll: () => {
        set({
          activeLoaders: new Map(),
          currentLoader: null,
          isLoading: false,
          context: "default",
        });
      },

      // Context-specific methods
      startRouteLoading: (route: string) => {
        return get().startLoading({
          context: "route",
          message: `Loading ${route}...`,
          subMessage: "Preparing your destination",
        });
      },

      startApiLoading: (endpoint: string, method = "GET") => {
        return get().startLoading({
          context: "api",
          message: `${method} ${endpoint}...`,
          subMessage: "Fetching data from server",
        });
      },

      startUploadLoading: (filename) => {
        return get().startLoading({
          context: "upload",
          message: filename ? `Uploading ${filename}...` : "Uploading file...",
          subMessage: "Please don't close this window",
          progress: 0,
        });
      },

      startQuizLoading: (quizType) => {
        return get().startLoading({
          context: "quiz",
          message: quizType ? `Loading ${quizType} quiz...` : "Loading quiz...",
          subMessage: "Preparing your learning experience",
        });
      },

      startAuthLoading: (action) => {
        return get().startLoading({
          context: "auth",
          message: action ? `${action}...` : "Authenticating...",
          subMessage: "Securing your session",
        });
      },

      withLoading: async (promise, options = {}) => {
        const { onSuccess, onError, ...loaderOptions } = options;
        const { startLoading, setSuccess, setError } = get();

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
