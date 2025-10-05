/**
 * Shared types for Course Details components
 * Prevents circular dependencies between CourseDetailsTabs and CourseQuiz
 */

export interface AccessLevels {
  isSubscribed: boolean
  isAuthenticated: boolean
  isAdmin: boolean
}
