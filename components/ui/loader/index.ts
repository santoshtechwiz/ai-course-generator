export { GlobalLoader } from "./global-loader"
export { useGlobalLoading } from "./use-global-loading"
export type { GlobalLoaderProps } from "./global-loader"

// Legacy exports - these will now use GlobalLoader under the hood for backward compatibility
export { 
  CourseAILoader as Loader,
  FullPageLoader, 
  InlineLoader, 
  MinimalLoader, 
  CardLoader, 
  SkeletonLoader 
} from "./courseai-loader-compat"
export { LoaderProvider, useLoader } from "./loader-context"
export type { LoaderProps, LoaderSize, LoaderVariant, LoaderContext } from "./types"
