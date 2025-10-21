import { useMemo } from 'react'
import type { DashboardUser } from '@/app/types/types'

interface DashboardMetrics {
  courses: {
    total: number
    inProgress: number
    completed: number
    favorites: number
    notStarted: number
    badgeCount: number
    badgeVariant: 'primary' | 'warning' | 'success' | 'secondary'
    badgeTooltip: string
  }
  quizzes: {
    total: number
    incomplete: number
    completed: number
    recommended: number
    badgeCount: number
    badgeVariant: 'primary' | 'warning' | 'success' | 'secondary'
    badgeTooltip: string
  }
}

/**
 * Custom hook to calculate smart dashboard metrics from user data.
 * 
 * Provides actionable badge counts and contextual information:
 * - Courses: Shows in-progress courses (not total enrolled)
 * - Quizzes: Shows incomplete quizzes + recommendations (not total attempts)
 * 
 * @param userData - The user's dashboard data
 * @returns Computed metrics with badge counts, variants, and tooltips
 */
export function useDashboardMetrics(userData: DashboardUser | null): DashboardMetrics | null {
  return useMemo(() => {
    if (!userData) return null

    // ============================================
    // COURSE METRICS
    // ============================================
    const totalCourses = userData.courses?.length || 0
    
    // In-progress: Started but not completed (progress > 0 && !isCompleted)
    const inProgressCourses = (userData.courseProgress || []).filter(
      (p) => !p.isCompleted && (p.progress || 0) > 0
    ).length
    
    // Completed: All courses marked as complete
    const completedCourses = (userData.courseProgress || []).filter(
      (p) => p.isCompleted
    ).length
    
    // Favorites: User's favorited courses
    const favoriteCourses = userData.favorites?.length || 0
    
    // Not started: Enrolled but no progress yet
    const notStartedCourses = totalCourses - inProgressCourses - completedCourses
    
    // Badge shows: in-progress courses (actionable)
    const coursesBadgeCount = inProgressCourses
    
    // Badge variant based on state
    const coursesBadgeVariant: 'primary' | 'secondary' = 
      inProgressCourses > 0 ? 'primary' : 'secondary'
    
    // Tooltip with detailed breakdown
    const coursesTooltip = inProgressCourses > 0
      ? `${inProgressCourses} in progress • ${totalCourses} total enrolled`
      : totalCourses > 0
        ? `All caught up! • ${totalCourses} total enrolled`
        : 'No courses yet • Explore to get started'

    // ============================================
    // QUIZ METRICS
    // ============================================
    const totalQuizzes = userData.userQuizzes?.length || 0
    
    // Incomplete: Started but not finished (timeEnded is null)
    const incompleteQuizzes = (userData.userQuizzes || []).filter(
      (q) => q.timeEnded === null
    ).length
    
    // Completed: Finished quizzes (timeEnded is not null)
    const completedQuizzes = (userData.userQuizzes || []).filter(
      (q) => q.timeEnded !== null
    ).length
    
    // Recommended: Based on active courses (simplified: 1 quiz per active course, max 5)
    // In a real implementation, this would be more sophisticated
    const recommendedQuizzes = Math.min(
      Math.max(0, inProgressCourses), // At least 1 per active course
      5 // Cap at 5 recommendations
    )
    
    // Badge shows: incomplete + recommended (actionable)
    const quizzesBadgeCount = incompleteQuizzes + recommendedQuizzes
    
    // Badge variant based on state
    const quizzesBadgeVariant: 'primary' | 'warning' | 'success' | 'secondary' = 
      incompleteQuizzes > 0 
        ? 'warning'  // Amber: Has incomplete quizzes - needs attention
        : recommendedQuizzes > 0
          ? 'success'  // Green: Has recommendations - growth opportunity
          : 'secondary' // Gray: All caught up
    
    // Tooltip with detailed breakdown
    const quizzesTooltip = 
      incompleteQuizzes > 0 && recommendedQuizzes > 0
        ? `${incompleteQuizzes} incomplete • ${recommendedQuizzes} recommended`
        : incompleteQuizzes > 0
          ? `${incompleteQuizzes} incomplete • ${totalQuizzes} total attempts`
          : recommendedQuizzes > 0
            ? `${recommendedQuizzes} recommended for you • ${totalQuizzes} total attempts`
            : totalQuizzes > 0
              ? `All caught up! • ${totalQuizzes} total attempts`
              : 'No quizzes yet • Start your first quiz'

    // ============================================
    // RETURN COMPUTED METRICS
    // ============================================
    return {
      courses: {
        total: totalCourses,
        inProgress: inProgressCourses,
        completed: completedCourses,
        favorites: favoriteCourses,
        notStarted: notStartedCourses,
        badgeCount: coursesBadgeCount,
        badgeVariant: coursesBadgeVariant,
        badgeTooltip: coursesTooltip,
      },
      quizzes: {
        total: totalQuizzes,
        incomplete: incompleteQuizzes,
        completed: completedQuizzes,
        recommended: recommendedQuizzes,
        badgeCount: quizzesBadgeCount,
        badgeVariant: quizzesBadgeVariant,
        badgeTooltip: quizzesTooltip,
      },
    }
  }, [userData])
}
