// Unified Global Loader System
export { GlobalLoader } from './global-loader'
export { default } from './global-loader'
export { useNavigationLoader } from './use-navigation-loader'
export { GlobalLoaderProvider } from './global-loader-provider'
export { useGlobalLoading } from '@/store/slices/global-loading-slice'

// Type exports
export type { GlobalLoaderProps } from './global-loader'

// Backwards compatibility - these will be removed in future versions
export { GlobalLoader as CourseAILoader } from './global-loader'
