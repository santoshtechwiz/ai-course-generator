// Centralized loader system - all loading should be controlled by global state
export { GlobalLoader } from "../loaders/GlobalLoader"
export { useGlobalLoader } from "../../store/global-loader"
export type { LoaderOptions, LoaderTheme, LoaderSize, LoaderVariant } from "../../store/global-loader"

// Legacy components for backward compatibility
export { LoadingSpinner } from "../loaders/GlobalLoader"

// Deprecated - use useGlobalLoader instead
export const useLoader = () => {
  console.warn("useLoader is deprecated. Use useGlobalLoader from @/store/global-loader instead.")
  return {
    showLoader: () => console.warn("Use useGlobalLoader().startLoading() instead"),
    hideLoader: () => console.warn("Use useGlobalLoader().stopLoading() instead"),
  }
}
