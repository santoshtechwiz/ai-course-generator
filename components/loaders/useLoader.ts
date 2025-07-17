// Deprecated file - use useGlobalLoader from @/store/global-loader instead
console.warn("useLoader.ts is deprecated. Import useGlobalLoader from @/store/global-loader instead.")

export const useLoader = () => {
  console.warn("useLoader is deprecated. Use useGlobalLoader from @/store/global-loader instead.")
  return {
    showLoader: () => console.warn("Use useGlobalLoader().startLoading() instead"),
    hideLoader: () => console.warn("Use useGlobalLoader().stopLoading() instead"),
  }
}
