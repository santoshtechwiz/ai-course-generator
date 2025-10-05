/**
 * Shared types for Course Details components
 * Prevents circular dependencies between CourseDetailsTabs and CourseQuiz
 */

/**
 * @deprecated AccessLevels is deprecated in favor of direct hook usage.
 * 
 * Migration Guide:
 * Instead of passing accessLevels as props, components should now use:
 * - `const { user } = useAuth()` for isAuthenticated checks
 * - `const { isSubscribed } = useUnifiedSubscription()` for subscription checks
 * - `const isAdmin = Boolean(user?.isAdmin)` for admin checks
 * 
 * This provides a single source of truth and eliminates prop drilling.
 * 
 * Kept for backward compatibility with CourseDetailsQuiz component.
 * Will be removed in a future refactor.
 */
export interface AccessLevels {
  isSubscribed: boolean
  isAuthenticated: boolean
  isAdmin: boolean
}
