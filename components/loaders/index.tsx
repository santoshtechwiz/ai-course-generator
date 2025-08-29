"use client"

// Unified Loader (Recommended)
export {
  UnifiedLoader,
  PageLoader,
  InlineLoader,
  ButtonLoader,
  SkeletonLoader
} from './UnifiedLoader'

// Legacy Loaders (Deprecated - use UnifiedLoader instead)
export { SuspenseGlobalFallback } from './SuspenseGlobalFallback'
export { Loader } from './Loader'
export type { LoaderProps } from './Loader'

// Progress API
export { progressApi } from './progress-api'
export type { ProgressAPI, ProgressOptions } from './progress-api'
export { useProgress } from './use-progress'
