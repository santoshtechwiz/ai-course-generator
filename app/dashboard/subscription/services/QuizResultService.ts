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

    // Check if we already have a pending save for this quiz
    if (this.pendingSaves.has(submission.quizId)) {
      console.log("Already saving this quiz result, waiting for completion")
      try {
        await this.pendingSaves.get(submission.quizId)
        return this.resultCache.get(submission.quizId) || null
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
      answers: formattedAnswers,
      totalTime: submission.totalTime,
      score: submission.score,
      type: submission.type,
      totalQuestions: submission.totalQuestions,
      completedAt: new Date().toISOString(),
    }

    console.log("Sending API request to save quiz result:", payload)

    // Create a promise for this save operation
    const savePromise = this.executeWithRetry(() => this.saveToServer(payload))

    // Store the promise so we can track it
    this.pendingSaves.set(submission.quizId, savePromise)

    try {
      const result = await savePromise

      // Cache the result
      if (result) {
        this.resultCache.set(submission.quizId, result)
      }

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
      // Remove from pending saves
      this.pendingSaves.delete(submission.quizId)
    }
  }

  /**
   * Get quiz result from the server
   */
  public async getQuizResult(quizId: string,slug:string): Promise<QuizResult | null> {
    // Check cache first
    if (this.resultCache.has(quizId)) {
      return this.resultCache.get(quizId) || null
    }

    try {
      const response = await fetch(`/api/quiz/${slug}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch quiz result: ${response.status}`)
      }

      const result = await response.json()

      // Cache the result
      this.resultCache.set(quizId, result)

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
      this.resultCache.delete(quizId)
    } else {
      this.resultCache.clear()
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

  private async saveToServer(payload: any): Promise<QuizResult | null> {
    const response = await fetch(`/api/quiz/${payload.slug}/complete`, {
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
          lastError.message.includes("timeout")
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
