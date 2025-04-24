import type { QuizType } from "@/app/types/quiz-types"
import { toast } from "@/hooks/use-toast"

export interface QuizAnswer {
  answer: string | string[]
  isCorrect?: boolean
  timeSpent: number
  similarity?: number
  hintsUsed?: boolean
}

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
  id: string
  quizId: string
  userId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  totalTime: number
  completedAt: string
  answers: QuizAnswer[]
  type: QuizType
}

class QuizResultService {
  private static instance: QuizResultService
  private resultCache: Map<string, QuizResult> = new Map()
  private pendingSaves: Map<string, Promise<any>> = new Map()
  private saveInProgress: Set<string> = new Set()
  private saveAttempts: Map<string, number> = new Map()
  private MAX_SAVE_ATTEMPTS = 3
  private saveThrottleTimeouts: Map<string, NodeJS.Timeout> = new Map()

  private constructor() {}

  public static getInstance(): QuizResultService {
    if (!QuizResultService.instance) {
      QuizResultService.instance = new QuizResultService()
    }
    return QuizResultService.instance
  }

  /**
   * Submit quiz result to the server
   */
  public async submitQuizResult(submission: QuizSubmission): Promise<QuizResult | null> {
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
      setTimeout(() => this.saveThrottleTimeouts.delete(submissionKey), 5000) // 5 seconds
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
  public async getQuizResult(quizId: string, slug: string): Promise<QuizResult | null> {
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

  /**
   * Calculate correct answers count
   */
  public calculateCorrectAnswers(answers: QuizAnswer[], quizType: QuizType): number {
    if (!answers || !Array.isArray(answers)) {
      return 0
    }

    switch (quizType) {
      case "mcq":
        return answers.filter((a) => a.isCorrect).length
      case "blanks":
        return answers.filter((a) => (a.similarity || 0) > 80).length
      case "openended":
        return answers.filter((a) => (a.similarity || 0) > 70).length
      case "code":
        return answers.filter((a) => a.isCorrect).length
      default:
        return answers.filter((a) => a.isCorrect).length
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

  private async saveToServer(payload: any, slug: string): Promise<QuizResult | null> {
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
        const isTransientError = ["network", "timeout", "500", "503"].some((e) =>
          error.message.includes(e)
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

export const quizResultService = QuizResultService.getInstance()
