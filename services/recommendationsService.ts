import type { FullCourseType } from "@/app/types/types"

export interface RelatedCourse {
  id: string | number
  slug: string
  title: string
  description: string
  image?: string
}

export interface PersonalizedRecommendation {
  id: string
  title: string
  description: string
  image?: string
  slug: string
  matchReason: string
}

export interface QuizSuggestion {
  id: string
  title: string
  description: string
  estimatedTime: number
  difficulty: "easy" | "medium" | "hard"
}

/**
 * Fetch related courses based on the current course
 */
export async function fetchRelatedCourses(
  courseId: string | number,
  limit: number = 10
): Promise<RelatedCourse[]> {
  try {
    const response = await fetch(`/api/recommendations/related-courses?courseId=${courseId}&limit=${limit}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      return result.data
    }
    
    throw new Error("Invalid response format")
  } catch (error) {
    console.error("Error fetching related courses:", error)
    // Return empty array on error instead of mock data
    return []
  }
}

/**
 * Fetch personalized recommendations based on user progress and preferences
 */
export async function fetchPersonalizedRecommendations(
  userId: string,
  completedCourses: string[],
  currentCourse: FullCourseType,
  limit: number = 3
): Promise<PersonalizedRecommendation[]> {
  try {
    const response = await fetch(`/api/recommendations/personalized?courseId=${currentCourse.id}&limit=${limit}`)
    
    if (!response.ok) {
      // If unauthorized or other error, return empty array
      if (response.status === 401) {
        console.warn("User not authenticated for personalized recommendations")
        return []
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      return result.data
    }
    
    throw new Error("Invalid response format")
  } catch (error) {
    console.error("Error fetching personalized recommendations:", error)
    return []
  }
}

/**
 * Fetch quiz suggestions for a specific chapter
 */
export async function fetchQuizSuggestions(
  courseId: string | number,
  chapterId: string | number,
  chapterTitle: string
): Promise<QuizSuggestion[]> {
  try {
    const response = await fetch(`/api/recommendations/quiz-suggestions?courseId=${courseId}&chapterId=${chapterId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      return result.data
    }
    
    throw new Error("Invalid response format")
  } catch (error) {
    console.error("Error fetching quiz suggestions:", error)
    return []
  }
}

/**
 * Get engagement metrics for better recommendations
 */
export async function getEngagementMetrics(userId: string) {
  try {
    // Mock engagement data
    return {
      averageCompletionRate: 0.85,
      preferredDifficulty: "medium" as const,
      topCategories: ["web-development", "javascript", "react"],
      learningStreak: 7,
      totalCoursesCompleted: 12
    }
  } catch (error) {
    console.error("Error fetching engagement metrics:", error)
    return null
  }
}

/**
 * Track user interaction with recommendations for better future suggestions
 */
export async function trackRecommendationInteraction(
  userId: string,
  recommendationId: string,
  action: "view" | "click" | "dismiss"
) {
  try {
    // In production, this would send analytics data to your backend
    console.log(`User ${userId} ${action}ed recommendation ${recommendationId}`)
  } catch (error) {
    console.error("Error tracking recommendation interaction:", error)
  }
}