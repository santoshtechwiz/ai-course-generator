import { authOptions } from "@/lib/authOptions"
import { getServerSession } from "next-auth"

import { getQuiz } from "@/app/actions/getQuiz"
import { quizStorageService, type QuizState, type QuizResult, type QuizAnswer } from "@/lib/quiz-storage-service"
import type { QuizType } from "@/app/types/quiz-types"
import getMcqQuestions from "@/app/actions/getMcqQuestions"

// Define the interface for quiz submission
export interface QuizSubmission {
  quizId: string | number
  slug: string
  answers: QuizAnswer[]
  totalTime: number
  score: number
  type: QuizType
  totalQuestions: number
}

class QuizService {
  private static instance: QuizService

  private constructor() {}

  public static getInstance(): QuizService {
    if (!QuizService.instance) {
      QuizService.instance = new QuizService()
    }
    return QuizService.instance
  }

  async getQuizData(slug: string, quizType: QuizType): Promise<any> {
    try {
      switch (quizType) {
        case "mcq":
          const mcqData = await getMcqQuestions(slug)
          return mcqData
        default:
          const quizData = await getQuiz(slug)
          return quizData
      }
    } catch (error) {
      console.error(`Error fetching quiz data for slug: ${slug}, type: ${quizType}`, error)
      throw new Error("Failed to fetch quiz data. Please try again later.")
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await getServerSession(authOptions)
      return !!session?.user
    } catch (error) {
      console.error("Error checking authentication status:", error)
      return false
    }
  }

  async checkAuthStatus(): Promise<{ isAuthenticated: boolean }> {
    // Use the session directly instead of making an API call
    try {
      const session = await getServerSession(authOptions)
      return { isAuthenticated: !!session?.user }
    } catch (error) {
      console.error("Error checking authentication status:", error)
      return { isAuthenticated: false }
    }
  }

  async getCurrentUserId(): Promise<string | undefined> {
    try {
      const session = await getServerSession(authOptions)
      return session?.user?.id
    } catch (error) {
      console.error("Error fetching current user ID:", error)
      return undefined
    }
  }

  saveQuizState(state: QuizState): void {
    quizStorageService.saveQuizState(state)
  }

  getQuizState(quizId: string, quizType: QuizType): QuizState | null {
    return quizStorageService.getQuizState(quizId, quizType)
  }

  clearQuizState(quizId: string, quizType: QuizType): void {
    quizStorageService.clearQuizState(quizId, quizType)
  }

  saveQuizResult(result: QuizResult): void {
    quizStorageService.saveQuizResult(result)
  }

  getQuizResult(quizId: string): QuizResult | null {
    return quizStorageService.getQuizResult(quizId)
  }

  isQuizCompleted(quizId: string): boolean {
    return quizStorageService.isQuizCompleted(quizId)
  }

  saveGuestResult(result: QuizResult): void {
    quizStorageService.saveGuestResult(result)
  }

  getGuestResult(quizId: string): QuizResult | null {
    return quizStorageService.getGuestResult(quizId)
  }

  clearGuestResult(quizId: string): void {
    quizStorageService.clearGuestResult(quizId)
  }

  clearAllQuizData(): void {
    quizStorageService.clearAllQuizData()
  }

  calculateSimilarity(str1: string, str2: string): number {
    return quizStorageService.calculateSimilarity(str1, str2)
  }

  calculateScore(answers: QuizAnswer[], quizType: QuizType): number {
    return quizStorageService.calculateScore(answers, quizType)
  }

  countCorrectAnswers(answers: QuizAnswer[], quizType: QuizType): number {
    return quizStorageService.countCorrectAnswers(answers, quizType)
  }

  getAllQuizResults(): QuizResult[] {
    return quizStorageService.getGuestResults()
  }

  // Add the missing submitQuizResult method
  async submitQuizResult(submission: any): Promise<any> {
    try {
      // First save to local storage
      this.saveQuizResult({
        quizId: submission.quizId,
        quizType: submission.type,
        slug: submission.slug,
        score: submission.score,
        answers: submission.answers,
        totalTime: submission.totalTime,
        timestamp: Date.now(),
        isCompleted: true,
      })

      // Then try to submit to the server if we're in a browser context
      if (typeof window !== "undefined") {
        try {
          const response = await fetch(`/api/quiz/${submission.slug}/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submission),
          })

          if (!response.ok) {
            throw new Error(`Failed to save quiz result: ${response.status}`)
          }

          // Mark as saved in localStorage to prevent duplicate submissions
          localStorage.setItem(`quiz_result_${submission.quizId}_saved`, "true")

          return await response.json()
        } catch (error) {
          console.error("Error submitting to server:", error)
          // We've already saved to local storage, so just return success
          return { success: true, savedLocally: true }
        }
      }

      return { success: true, savedLocally: true }
    } catch (error) {
      console.error("Error submitting quiz result:", error)
      throw error
    }
  }
}

export const quizService = QuizService.getInstance()
