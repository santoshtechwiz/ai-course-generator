/**
 * Hooks Index - Re-export consolidated utilities and domain-specific hooks
 * 
 * This file maintains backward compatibility while redirecting to the new consolidated structure.
 */

// ============================================================================
// CORE UTILITIES (Re-exported from consolidated lib)
// ============================================================================

export {
  // Core utility hooks
  useDebounce,
  useDebouncedCallback,
  useInterval,
  useMediaQuery,
  useResponsive,
  useMobile,
  usePersistentState,
} from "@/lib/utils/hooks"

// Quiz-specific hooks
export { useQuizAttempts } from "./useQuizAttempts"

// ============================================================================
// TOAST UTILITIES
// ============================================================================

export * from "./use-toast"

// ============================================================================
// TEXT UTILITIES
// ============================================================================

export * from "./use-similarity"

// ============================================================================
// AUTH & USER HOOKS
// ============================================================================

// Import useAuth directly from auth-context
export { useAuth } from "@/modules/auth"
export * from "./use-subscription"
export * from "./use-subscription-optimized"
export * from "./use-notifications"
export * from "./use-user-dashboard"

// ============================================================================
// COURSE & QUIZ HOOKS
// ============================================================================

export * from "./use-chapter-summary" 
export * from "./useCourseActions"
export * from "../app/dashboard/course/[slug]/components/video/hooks/useVideoProgress"
export * from "./useRandomQuizzes"
