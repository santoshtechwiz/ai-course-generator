import { QuizResult, QuizSubmission, QuizType } from "./quiz-service"


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
    try {
      const endpoint = quizType === "mcq" ? `/api/mcq/${slug}` : `/api/quiz/${slug}`

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
    try {
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
    try {
      const response = await fetch(`/api/quiz/${slug}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch quiz result: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching quiz result:", error)
      return null
    }
  }
}

// Export singleton instance
export const quizApi = QuizApi.getInstance()
