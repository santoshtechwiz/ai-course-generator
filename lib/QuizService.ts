import { authOptions } from "@/lib/authOptions"
import { getServerSession } from "next-auth"
import { getQuiz } from "@/app/actions/getQuiz"
import getMcqQuestions from "@/app/actions/getMcqQuestions"
import {
  quizStorageService,
  type QuizState,
  type QuizResult as QuizResultType,
  type QuizAnswer,
} from "@/lib/quiz-storage-service"
import type { QuizType } from "@/app/types/quiz-types"
import { toast } from "@/hooks/use-toast"

// Define the interface for quiz submission
export interface QuizSubmission {
  quizId: string
  slug: string
  answers: QuizAnswer[]
  totalTime: number
  score: number
  type: QuizType
  totalQuestions: number
}

export interface QuizResult {
  id?: string
  quizId: string
  userId?: string
  score: number
  totalQuestions: number
  correctAnswers?: number
  totalTime: number
  completedAt?: string
  answers: QuizAnswer[]
  type?: QuizType
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

  saveQuizResult(result: QuizResultType): void {
    quizStorageService.saveQuizResult(result)
  }

  isQuizCompleted(quizId: string): boolean {
    return quizStorageService.isQuizCompleted(quizId)
  }

  saveGuestResult(result: QuizResultType): void {
    quizStorageService.saveGuestResult(result)
  }

  getGuestResult(quizId: string): QuizResultType | null {
    return quizStorageService.getGuestResult(quizId)
  }

  clearGuestResult(quizId: string, quizType: QuizType): void {
    quizStorageService.clearGuestResult(quizId, quizType)
  }

  clearAllQuizData(): void {
    quizStorageService.clearAllQuizData()
  }

  calculateScore(answers: QuizAnswer[], quizType: QuizType): number {
    return quizStorageService.calculateScore(answers, quizType)
  }

  countCorrectAnswers(answers: QuizAnswer[], quizType: QuizType): number {
    return quizStorageService.countCorrectAnswers(answers, quizType)
  }

  getAllQuizResults(): QuizResultType[] {
    return quizStorageService.getGuestResults()
  }

  private resultCache: Map<string, QuizResultType> = new Map()
  private pendingSaves: Map<string, Promise<any>> = new Map()
  private saveInProgress: Set<string> = new Set()
  private saveAttempts: Map<string, number> = new Map()
  private MAX_SAVE_ATTEMPTS = 3
  private saveThrottleTimeouts: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Submit quiz result to the server
   */
  public async submitQuizResult(submission: QuizSubmission): Promise<QuizResultType | null> {
    // Validate required fields
    this.validateSubmission(submission)

    // Generate a unique key for this submission
    const submissionKey = `${submission.quizId}_${submission.type}`

    // Check if we've already saved this result
    if (typeof window !== "undefined" && localStorage.getItem(`quiz_${submission.quizId}_saved`) === "true") {
      console.log("Quiz result already saved, skipping submission")
      return this.resultCache.get(submissionKey) || null
    }

    // Check if a save is already in progress for this quiz
    if (this.saveInProgress.has(submissionKey)) {
      console.log("Save already in progress for this quiz, skipping duplicate submission")
      return null
    }

    // Check if we've exceeded the maximum number of save attempts
    const attempts = this.saveAttempts.get(submissionKey) || 0
    if (attempts >= this.MAX_SAVE_ATTEMPTS) {
      console.log(`Exceeded maximum save attempts (${this.MAX_SAVE_ATTEMPTS}) for this quiz`)
      toast({
        title: "Error saving results",
        description: "Maximum retry attempts reached. Please try again later.",
        variant: "destructive",
      })
      return null
    }

    // Increment save attempts
    this.saveAttempts.set(submissionKey, attempts + 1)

    // Mark save as in progress
    this.saveInProgress.add(submissionKey)

    // Throttle save attempts
    if (this.saveThrottleTimeouts.has(submissionKey)) {
      console.log("Throttling save attempt for:", submissionKey)
      return null
    }

    // Set throttle timeout
    this.saveThrottleTimeouts.set(
      submissionKey,
      setTimeout(() => this.saveThrottleTimeouts.delete(submissionKey), 5000), // 5 seconds
    )

    // Check if we already have a pending save for this quiz
    if (this.pendingSaves.has(submissionKey)) {
      console.log("Already saving this quiz result, waiting for completion")
      try {
        await this.pendingSaves.get(submissionKey)
        return this.resultCache.get(submissionKey) || null
      } catch (error) {
        console.error("Previous save attempt failed:", error)
        // Continue with a new save attempt
      }
    }

    // Format the answers based on quiz type
    const formattedAnswers = this.formatAnswers(submission)

    // Prepare the request payload
    const payload = {
      quizId: submission.quizId,
      slug: submission.slug,
      answers: formattedAnswers,
      totalTime: submission.totalTime,
      score: submission.score,
      type: submission.type,
      totalQuestions: submission.totalQuestions,
      completedAt: new Date().toISOString(),
    }

    console.log("Sending API request to save quiz result:", payload)

    // Create a promise for this save operation
    const savePromise = this.executeWithRetry(() => this.saveToServer(payload, submission.slug))

    // Store the promise so we can track it
    this.pendingSaves.set(submissionKey, savePromise)

    try {
      const result = await savePromise

      // Cache the result
      if (result) {
        this.resultCache.set(submissionKey, result)

        // Mark as saved in localStorage to prevent duplicate submissions
        if (typeof window !== "undefined") {
          localStorage.setItem(`quiz_${submission.quizId}_saved`, "true")

          // Clear any auth flow markers
          sessionStorage.removeItem("showQuizResults")
          sessionStorage.removeItem("quizRedirectPath")
          sessionStorage.removeItem("pendingQuizData")
          sessionStorage.removeItem("inAuthFlow")
        }
      }

      // Reset save attempts on success
      this.saveAttempts.set(submissionKey, 0)

      return result
    } catch (error) {
      console.error("Error submitting quiz result:", error)

      // Show error toast
      toast({
        title: "Error saving results",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })

      return null
    } finally {
      // Remove from pending saves and mark as not in progress
      this.pendingSaves.delete(submissionKey)
      this.saveInProgress.delete(submissionKey)
    }
  }

  /**
   * Get quiz result from the server
   */
  public async getQuizResult(quizId: string, slug: string): Promise<QuizResultType | null> {
    // Generate a unique key for this quiz
    const cacheKey = `${quizId}_${slug}`

    // Check cache first
    if (this.resultCache.has(cacheKey)) {
      return this.resultCache.get(cacheKey) || null
    }

    try {
      const response = await fetch(`/api/quiz/${slug}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch quiz result: ${response.status}`)
      }

      const result = await response.json()

      // Cache the result
      this.resultCache.set(cacheKey, result)

      return result
    } catch (error) {
      console.error("Error fetching quiz result:", error)
      return null
    }
  }

  /**
   * Clear cached results
   */
  public clearCache(quizId?: string) {
    if (quizId) {
      // Clear all cache entries for this quiz ID
      for (const key of this.resultCache.keys()) {
        if (key.startsWith(`${quizId}_`)) {
          this.resultCache.delete(key)
        }
      }

      // Clear pending saves for this quiz ID
      for (const key of this.pendingSaves.keys()) {
        if (key.startsWith(`${quizId}_`)) {
          this.pendingSaves.delete(key)
        }
      }

      // Clear save in progress flags for this quiz ID
      for (const key of this.saveInProgress) {
        if (key.startsWith(`${quizId}_`)) {
          this.saveInProgress.delete(key)
        }
      }

      // Clear save attempts for this quiz ID
      for (const key of this.saveAttempts.keys()) {
        if (key.startsWith(`${quizId}_`)) {
          this.saveAttempts.delete(key)
        }
      }
    } else {
      this.resultCache.clear()
      this.pendingSaves.clear()
      this.saveInProgress.clear()
      this.saveAttempts.clear()
    }
  }

  private validateSubmission(submission: QuizSubmission) {
    if (!submission.totalTime || submission.totalTime <= 0) {
      console.error("Missing or invalid totalTime:", submission.totalTime)
      throw new Error("Missing required field: totalTime")
    }

    if (!submission.quizId) {
      console.error("Missing quizId")
      throw new Error("Missing required field: quizId")
    }

    if (!submission.slug) {
      console.error("Missing slug")
      throw new Error("Missing required field: slug")
    }

    if (!submission.answers || !Array.isArray(submission.answers)) {
      console.error("Missing or invalid answers:", submission.answers)
      throw new Error("Missing required field: answers")
    }

    if (submission.score === undefined || submission.score < 0 || submission.score > 100) {
      console.error("Invalid score:", submission.score)
      throw new Error("Invalid score value")
    }
  }

  private formatAnswers(submission: QuizSubmission): QuizAnswer[] {
    let formattedAnswers = submission.answers

    // For fill-in-the-blanks quizzes
    if (submission.type === "blanks") {
      formattedAnswers = submission.answers.map((answer) => ({
        answer: typeof answer.answer === "string" ? answer.answer : "",
        userAnswer: typeof answer.answer === "string" ? answer.answer : "",
        timeSpent: answer.timeSpent || 0,
        hintsUsed: answer.hintsUsed || false,
        similarity: answer.similarity || 0,
        isCorrect: (answer.similarity || 0) > 80,
      }))
    }

    // For open-ended quizzes
    if (submission.type === "openended") {
      formattedAnswers = submission.answers.map((answer) => ({
        answer: typeof answer.answer === "string" ? answer.answer : "",
        timeSpent: answer.timeSpent || 0,
        hintsUsed: answer.hintsUsed || false,
        similarity: answer.similarity || 0,
        isCorrect: (answer.similarity || 0) > 70,
      }))
    }

    return formattedAnswers
  }

  calculateSimilarity(str1: string, str2: string): number {
    const an = str1.length
    const bn = str2.length
    if (an === 0) return bn
    if (bn === 0) return an

    const matrix = Array(bn + 1)
      .fill(0)
      .map(() => Array(an + 1).fill(0))

    for (let i = 0; i <= an; i++) matrix[0][i] = i
    for (let j = 0; j <= bn; j++) matrix[j][0] = j

    for (let j = 1; j <= bn; j++) {
      for (let i = 1; i <= an; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost, // substitution
        )
      }
    }

    return 100 - (matrix[bn][an] / Math.max(str1.length, str2.length)) * 100
  }

  private async saveToServer(payload: any, slug: string): Promise<QuizResultType | null> {
    // Add retry logic for transient errors
    const maxRetries = 3
    let retries = 0

    while (retries < maxRetries) {
      try {
        const response = await fetch(`/api/quiz/${slug}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          let errorMessage = `Failed to save quiz result: ${response.status}`

          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch (e) {
            // If JSON parsing fails, try to get the text response
            try {
              const errorText = await response.text()
              if (errorText) {
                errorMessage += ` - ${errorText}`
              }
            } catch (textError) {
              // If text extraction fails, just use the status code error
            }
          }

          throw new Error(errorMessage)
        }

        return await response.json()
      } catch (error) {
        const isTransientError = ["network", "timeout", "500", "503"].some(
          (e) => error instanceof Error && error.message.includes(e),
        )
        if (isTransientError) {
          retries++
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries))
        } else {
          throw error
        }
      }
    }

    return null
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
    let retries = 0
    let lastError: Error | null = null

    while (retries < maxRetries) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Only retry on deadlock errors or network issues
        if (
          lastError.message.includes("deadlock") ||
          lastError.message.includes("write conflict") ||
          lastError.message.includes("network") ||
          lastError.message.includes("timeout") ||
          lastError.message.includes("failed to fetch") ||
          lastError.message.includes("500") ||
          lastError.message.includes("503")
        ) {
          retries++
          if (retries < maxRetries) {
            // Exponential backoff
            const delay = initialDelay * Math.pow(2, retries - 1)
            console.log(`Retrying after error (${retries}/${maxRetries}). Waiting ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            continue
          }
        } else {
          // Don't retry for other types of errors
          break
        }
      }
    }

    throw lastError || new Error("Failed after multiple retry attempts")
  }
}

export const quizService = QuizService.getInstance()
