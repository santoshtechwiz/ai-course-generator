import type { QuizResult, QuizType } from "@/app/types/quiz-types"
import { handleApiError } from "../error-handler"
import { handleFetchError } from "./quiz-error-handling"

// Define the interface for quiz results
interface QuizResultOld {
  quizId: string
  slug: string
  type: QuizType
  score: number
  answers: any[]
  totalTime: number
  totalQuestions: number
  completedAt?: string
}

// Define the interface for quiz submission response
interface QuizSubmissionResponse {
  success: boolean
  result?: {
    updatedUserQuiz: any
    quizAttempt: any
    percentageScore: number
    totalQuestions: number
    score: number
    totalTime: number
  }
  error?: string
  details?: any
}

/**
 * Centralized service for quiz-related API calls and operations
 */
export const quizService = {
  /**
   * Fetch a quiz by its slug
   */
  async getQuiz(slug: string, signal?: AbortSignal) {
    try {
      const response = await fetch(`/api/quiz/${slug}`, { signal })

      if (!response.ok) {
        return { error: await handleApiError(response) }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: handleFetchError(error) }
    }
  },

  /**
   * Fetch a random quiz
   */
  async getRandomQuiz(type?: QuizType, signal?: AbortSignal) {
    try {
      const url = type ? `/api/quiz/random?type=${type}` : "/api/quiz/random"
      const response = await fetch(url, { signal })

      if (!response.ok) {
        return { error: await handleApiError(response) }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: handleFetchError(error) }
    }
  },

  /**
   * Submit quiz results
   */
  async submitQuizResults(slug: string, results: QuizResult) {
    try {
      const response = await fetch(`/api/quiz/${slug}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(results),
      })

      if (!response.ok) {
        return { error: await handleApiError(response) }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: handleFetchError(error) }
    }
  },

  /**
   * Rate a quiz
   */
  async rateQuiz(slug: string, rating: number) {
    try {
      const response = await fetch("/api/rating", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quizId: slug, rating }),
      })

      if (!response.ok) {
        return { error: await handleApiError(response) }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: handleFetchError(error) }
    }
  },

  /**
   * Save a quiz for later
   */
  async saveQuiz(slug: string) {
    try {
      const response = await fetch("/api/save-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quizId: slug }),
      })

      if (!response.ok) {
        return { error: await handleApiError(response) }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: handleFetchError(error) }
    }
  },

  /**
   * Get saved quizzes
   */
  async getSavedQuizzes() {
    try {
      const response = await fetch("/api/user/quizzes")

      if (!response.ok) {
        return { error: await handleApiError(response) }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: handleFetchError(error) }
    }
  },

  /**
   * Search for quizzes
   */
  async searchQuizzes(query: string, type?: QuizType, page = 1, limit = 10) {
    try {
      let url = `/api/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      if (type) {
        url += `&type=${type}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        return { error: await handleApiError(response) }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: handleFetchError(error) }
    }
  },
}

export default quizService
