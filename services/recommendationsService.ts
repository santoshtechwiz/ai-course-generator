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
  type?: "chapter-quiz" | "user-quiz" | "generic"
  attemptCount?: number
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
      console.warn('Failed to fetch quiz suggestions:', response.statusText)
      // Return generic suggestions as fallback
      return generateGenericSuggestions(chapterTitle)
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      return result.data
    }
    
    console.warn('Invalid quiz suggestions response:', result)
    return generateGenericSuggestions(chapterTitle)
  } catch (error) {
    console.error("Error fetching quiz suggestions:", error)
    return generateGenericSuggestions(chapterTitle)
  }
}

function generateGenericSuggestions(chapterTitle: string): QuizSuggestion[] {
  return [
    {
      id: `generic-${Date.now()}-1`,
      title: `${chapterTitle} - Quick Review`,
      description: "Test your understanding of the key concepts",
      estimatedTime: 5,
      difficulty: "easy",
      type: "generic",
    },
    {
      id: `generic-${Date.now()}-2`,
      title: `${chapterTitle} - Deep Dive`,
      description: "Challenge yourself with advanced questions",
      estimatedTime: 10,
      difficulty: "medium",
      type: "generic",
    },
    {
      id: `generic-${Date.now()}-3`,
      title: `${chapterTitle} - Practice Test`,
      description: "Comprehensive assessment of your knowledge",
      estimatedTime: 15,
      difficulty: "hard",
      type: "generic",
    },
  ]
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