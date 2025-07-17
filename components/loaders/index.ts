// Centralized Global Loader System
export { GlobalLoader, LoadingSpinner } from "./GlobalLoader"
export { useGlobalLoader } from "../../store/global-loader"
export type { LoaderOptions, LoaderTheme, LoaderSize, LoaderVariant } from "../../store/global-loader"

// Legacy exports for backward compatibility
export * from "./types"
