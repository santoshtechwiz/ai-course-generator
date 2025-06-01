
export * from "./use-responsive"


export * from "./use-similarity"

export * from "./use-debounce"
export * from "./use-interval"
export * from "./use-persistent-state"
export * from "./use-chapter-summary"
export * from "./use-toast"


// Export these hooks directly, not via the conditional block
export { useAuth } from "./useAuth"

export { _createMockUseAuth } from "./useAuth"

// Don't try to modify module.exports in test mode
// This was causing the error because module.exports is read-only after these exports
