import type { QuizType, QuizResult, QuizSubmission } from "./quiz-service"

/**
 * Quiz API Service
 * Handles server communication for quizzes
 */
class QuizApi {
  private static instance: QuizApi

  private constructor() {}

  public static getInstance(): QuizApi {
    if (!QuizApi.instance) {
      QuizApi.instance = new QuizApi()
    }
    return QuizApi.instance
  }

  /**
   * Fetch quiz data from the server
   */
  async getQuizData(slug: string, quizType: QuizType): Promise<any> {
    // Validate inputs to prevent "unknown" API calls
    if (!slug || slug === "unknown") {
      console.error("Invalid slug provided to getQuizData:", slug)
      throw new Error("Invalid quiz slug. Please try again with a valid quiz.")
    }

    try {
      const endpoint = quizType === "mcq" ? `/api/mcq/${slug}` : `/api/quiz/${slug}`
      console.log(`Fetching quiz data from ${endpoint}`)

      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error(`Failed to fetch quiz data: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error fetching quiz data for slug: ${slug}, type: ${quizType}`, error)
      throw new Error("Failed to fetch quiz data. Please try again later.")
    }
  }

  /**
   * Submit quiz result to the server
   */
  async submitQuizResult(submission: QuizSubmission): Promise<QuizResult | null> {
    // Validate inputs to prevent "unknown" API calls
    if (!submission.slug || submission.slug === "unknown" || !submission.quizId || submission.quizId === "unknown") {
      console.error("Invalid submission data:", submission)
      throw new Error("Invalid quiz data. Cannot submit results.")
    }

    try {
      console.log(`Submitting quiz result to /api/quiz/${submission.slug}/complete`)

      const response = await fetch(`/api/quiz/${submission.slug}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId: submission.quizId,
          slug: submission.slug,
          answers: submission.answers,
          totalTime: submission.totalTime,
          score: submission.score,
          type: submission.type,
          totalQuestions: submission.totalQuestions,
          completedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to save quiz result: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error submitting quiz result:", error)
      throw error
    }
  }

  /**
   * Fetch quiz result from the server
   */
  async fetchQuizResult(quizId: string, slug: string): Promise<QuizResult | null> {
    // Validate inputs to prevent "unknown" API calls
    if (!quizId || quizId === "unknown" || !slug || slug === "unknown") {
      console.error("Invalid parameters for fetchQuizResult:", { quizId, slug })
      throw new Error("Invalid quiz parameters. Cannot fetch results.")
    }

    try {
      console.log(`Fetching quiz result from API for quizId: ${quizId}, slug: ${slug}`)

      // Add cache-busting parameter to prevent caching issues
      const timestamp = Date.now()
      const response = await fetch(`/api/quiz/${slug}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        const statusText = response.statusText || "Unknown error"
        console.error(`Failed to fetch quiz result: ${response.status} ${statusText}`)

        // Try to get more detailed error information
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to fetch quiz result: ${response.status}`)
        } catch (parseError) {
          throw new Error(`Failed to fetch quiz result: ${response.status} ${statusText}`)
        }
      }

      const result = await response.json()

      // Validate the result
      if (!result || !result.quizId || !Array.isArray(result.answers)) {
        console.error("Invalid quiz result format received from API:", result)
        throw new Error("Invalid quiz result format received from server")
      }

      console.log("Successfully fetched quiz result from API:", result)
      return result
    } catch (error) {
      console.error("Error fetching quiz result:", error)
      throw error
    }
  }
}

// Export singleton instance
export const quizApi = QuizApi.getInstance()
