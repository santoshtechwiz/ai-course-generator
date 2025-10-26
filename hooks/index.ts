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
  
  
  
  useMediaQuery,
  
  useMobile,
  
} from "@/lib/utils/hooks"

// Quiz-specific hooks



// ============================================================================
// TOAST UTILITIES
// ============================================================================

// Re-export unified toast to keep imports stable
export { useToast,  } from "@/components/ui/use-toast"

// ============================================================================
// TEXT UTILITIES
// ============================================================================

export * from "./use-similarity"

// ============================================================================
// AUTH & USER HOOKS
// ============================================================================

// Import useAuth directly from auth-context
export { useAuth } from "@/modules/auth"
export * from "./use-notifications"
export * from "./useUserDashboard"

// ============================================================================
// COURSE & QUIZ HOOKS
// ============================================================================

export * from "./use-chapter-summary" 
export * from "./useCourseActions"
// Removed legacy useVideoProgress hook export; use Redux progress-slice instead
export * from "./useRandomQuizzes"
export * from "./useVideoProcessing"

// ============================================================================
// GUEST STATE HOOKS (Week 1 Foundation)
// ============================================================================





// ============================================================================
// GUEST STATE MIGRATION HOOKS (Week 2 Migration)
// ============================================================================




