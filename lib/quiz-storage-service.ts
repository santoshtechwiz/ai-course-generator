/**
 * QuizStorageService
 *
 * A unified storage service for all quiz-related data.
 * Handles saving and loading quiz states, answers, and results.
 */

import type { QuizType } from "@/app/types/quiz-types"

// Define the types for our storage
export interface QuizAnswer {
  answer: string
  timeSpent: number
  isCorrect?: boolean
  similarity?: number
  hintsUsed?: boolean
}

export interface QuizState {
  quizId: string
  quizType: QuizType
  slug: string
  currentQuestion: number
  totalQuestions: number
  startTime: number
  isCompleted: boolean
  answers?: QuizAnswer[]
  redirectPath?: string
}

export interface QuizResult {
  quizId: string
  slug: string
  quizType: QuizType
  score: number
  answers: QuizAnswer[]
  totalTime: number
  timestamp: number
  isCompleted: boolean
  redirectPath?: string
}

class QuizStorageService {
  private static instance: QuizStorageService
  private storagePrefix = "quiz_"
  private resultCache: Map<string, QuizResult> = new Map()
  private pendingSaves: Map<string, Promise<any>> = new Map()

  // Make constructor private to enforce singleton pattern
  private constructor() {}

  // Get the singleton instance
  public static getInstance(): QuizStorageService {
    if (!QuizStorageService.instance) {
      QuizStorageService.instance = new QuizStorageService()
    }
    return QuizStorageService.instance
  }

  /**
   * Save quiz state to storage
   */
  public saveQuizState(state: QuizState): void {
    if (typeof window === "undefined") return

    try {
      const stateKey = `${this.storagePrefix}state_${state.quizType}_${state.quizId}`
      localStorage.setItem(
        stateKey,
        JSON.stringify({
          ...state,
          timestamp: Date.now(),
        }),
      )

      // Also save to sessionStorage for redundancy
      sessionStorage.setItem(
        stateKey,
        JSON.stringify({
          ...state,
          timestamp: Date.now(),
        }),
      )

      // Save current quiz state for navigation
      localStorage.setItem(
        `${this.storagePrefix}current_state`,
        JSON.stringify({
          ...state,
          timestamp: Date.now(),
        }),
      )

      console.log(`Saved quiz state for ${state.quizId}:`, state)
    } catch (error) {
      console.error("Error saving quiz state:", error)
    }
  }

  /**
   * Load quiz state from storage
   */
  public getQuizState(quizId: string, quizType: QuizType): QuizState | null {
    if (typeof window === "undefined") return null

    try {
      const stateKey = `${this.storagePrefix}state_${quizType}_${quizId}`

      // Try localStorage first
      const localData = localStorage.getItem(stateKey)
      if (localData) {
        const state = JSON.parse(localData)
        console.log(`Loaded quiz state from localStorage for ${quizId}:`, state)
        return state
      }

      // Try sessionStorage as fallback
      const sessionData = sessionStorage.getItem(stateKey)
      if (sessionData) {
        const state = JSON.parse(sessionData)
        console.log(`Loaded quiz state from sessionStorage for ${quizId}:`, state)
        return state
      }

      // Try current state as last resort
      const currentStateData = localStorage.getItem(`${this.storagePrefix}current_state`)
      if (currentStateData) {
        const currentState = JSON.parse(currentStateData)
        if (currentState.quizId === quizId && currentState.quizType === quizType) {
          console.log(`Loaded quiz state from current state for ${quizId}:`, currentState)
          return currentState
        }
      }

      return null
    } catch (error) {
      console.error("Error loading quiz state:", error)
      return null
    }
  }

  /**
   * Get current quiz state (the most recently saved quiz)
   */
  public getCurrentQuizState(): QuizState | null {
    if (typeof window === "undefined") return null

    try {
      const currentStateData = localStorage.getItem(`${this.storagePrefix}current_state`)
      if (currentStateData) {
        return JSON.parse(currentStateData)
      }
      return null
    } catch (error) {
      console.error("Error getting current quiz state:", error)
      return null
    }
  }

  /**
   * Clear quiz state from storage
   */
  public clearQuizState(quizId: string, quizType: QuizType): void {
    if (typeof window === "undefined") return

    try {
      const stateKey = `${this.storagePrefix}state_${quizType}_${quizId}`
      localStorage.removeItem(stateKey)
      sessionStorage.removeItem(stateKey)

      // Also clear current state if it matches
      const currentStateData = localStorage.getItem(`${this.storagePrefix}current_state`)
      if (currentStateData) {
        const currentState = JSON.parse(currentStateData)
        if (currentState.quizId === quizId && currentState.quizType === quizType) {
          localStorage.removeItem(`${this.storagePrefix}current_state`)
        }
      }

      console.log(`Cleared quiz state for ${quizId}`)
    } catch (error) {
      console.error("Error clearing quiz state:", error)
    }
  }

  /**
   * Save quiz answers to storage
   */
  public saveQuizAnswers(quizId: string, answers: QuizAnswer[]): void {
    if (typeof window === "undefined") return

    try {
      const answersKey = `${this.storagePrefix}answers_${quizId}`
      localStorage.setItem(
        answersKey,
        JSON.stringify({
          answers,
          timestamp: Date.now(),
        }),
      )

      // Also save to sessionStorage for redundancy
      sessionStorage.setItem(
        answersKey,
        JSON.stringify({
          answers,
          timestamp: Date.now(),
        }),
      )

      console.log(`Saved ${answers.length} quiz answers for ${quizId}`)
    } catch (error) {
      console.error("Error saving quiz answers:", error)
    }
  }

  /**
   * Load quiz answers from storage
   */
  public getQuizAnswers(quizId: string): QuizAnswer[] | null {
    if (typeof window === "undefined") return null

    try {
      // Try multiple storage locations
      const storageKeys = [`${this.storagePrefix}answers_${quizId}`, `${this.storagePrefix}result_${quizId}`]

      for (const key of storageKeys) {
        // Try localStorage first
        const localData = localStorage.getItem(key)
        if (localData) {
          const parsed = JSON.parse(localData)
          if (parsed.answers && Array.isArray(parsed.answers) && parsed.answers.length > 0) {
            console.log(`Loaded answers from localStorage key ${key} for ${quizId}:`, parsed.answers)
            return parsed.answers
          }
        }

        // Try sessionStorage as fallback
        const sessionData = sessionStorage.getItem(key)
        if (sessionData) {
          const parsed = JSON.parse(sessionData)
          if (parsed.answers && Array.isArray(parsed.answers) && parsed.answers.length > 0) {
            console.log(`Loaded answers from sessionStorage key ${key} for ${quizId}:`, parsed.answers)
            return parsed.answers
          }
        }
      }

      // Check if we have a quiz result that contains answers
      const result = this.getQuizResult(quizId)
      if (result && result.answers && result.answers.length > 0) {
        console.log(`Loaded answers from quiz result for ${quizId}:`, result.answers)
        return result.answers
      }

      // Check if we have a quiz state that contains answers
      const state = this.getCurrentQuizState()
      if (state && state.quizId === quizId && state.answers && state.answers.length > 0) {
        console.log(`Loaded answers from quiz state for ${quizId}:`, state.answers)
        return state.answers
      }

      return null
    } catch (error) {
      console.error("Error loading quiz answers:", error)
      return null
    }
  }

  /**
   * Save quiz result to storage
   */
  public saveQuizResult(result: QuizResult): void {
    if (typeof window === "undefined") return

    try {
      const resultKey = `${this.storagePrefix}result_${result.quizId}`

      // Add timestamp if not present
      const resultWithTimestamp = {
        ...result,
        timestamp: result.timestamp || Date.now(),
      }

      localStorage.setItem(resultKey, JSON.stringify(resultWithTimestamp))

      // Also save to sessionStorage for redundancy
      sessionStorage.setItem(resultKey, JSON.stringify(resultWithTimestamp))

      // Cache the result
      this.resultCache.set(result.quizId, resultWithTimestamp)

      // Mark this quiz as completed
      localStorage.setItem(`${this.storagePrefix}${result.quizId}_completed`, "true")

      console.log(`Saved quiz result for ${result.quizId}:`, resultWithTimestamp)
    } catch (error) {
      console.error("Error saving quiz result:", error)
    }
  }

  /**
   * Load quiz result from storage
   */
  public getQuizResult(quizId: string): QuizResult | null {
    if (typeof window === "undefined") return null

    // Check cache first
    if (this.resultCache.has(quizId)) {
      return this.resultCache.get(quizId) || null
    }

    try {
      const resultKey = `${this.storagePrefix}result_${quizId}`

      // Try localStorage first
      const localData = localStorage.getItem(resultKey)
      if (localData) {
        const result = JSON.parse(localData)
        // Cache the result
        this.resultCache.set(quizId, result)
        console.log(`Loaded quiz result from localStorage for ${quizId}:`, result)
        return result
      }

      // Try sessionStorage as fallback
      const sessionData = sessionStorage.getItem(resultKey)
      if (sessionData) {
        const result = JSON.parse(sessionData)
        // Cache the result
        this.resultCache.set(quizId, result)
        console.log(`Loaded quiz result from sessionStorage for ${quizId}:`, result)
        return result
      }

      return null
    } catch (error) {
      console.error("Error loading quiz result:", error)
      return null
    }
  }

  /**
   * Check if a quiz is completed
   */
  public isQuizCompleted(quizId: string): boolean {
    if (typeof window === "undefined") return false

    try {
      // Check if we have a direct completion marker
      const isCompleted = localStorage.getItem(`${this.storagePrefix}${quizId}_completed`) === "true"
      if (isCompleted) {
        return true
      }

      // Check if we have a result with isCompleted flag
      const result = this.getQuizResult(quizId)
      if (result && result.isCompleted) {
        return true
      }

      // Check if we have a state with isCompleted flag
      const state =
        this.getQuizState(quizId, "mcq") ||
        this.getQuizState(quizId, "openended") ||
        this.getQuizState(quizId, "blanks") ||
        this.getQuizState(quizId, "code")

      if (state && state.isCompleted) {
        return true
      }

      return false
    } catch (error) {
      console.error("Error checking if quiz is completed:", error)
      return false
    }
  }

  /**
   * Save guest result for unauthenticated users
   */
  public saveGuestResult(result: QuizResult): void {
    if (typeof window === "undefined") return

    try {
      // Save the individual result
      this.saveQuizResult(result)

      // Also add to the guest results collection
      const guestResultsKey = `${this.storagePrefix}guest_results`
      const existingResultsStr = localStorage.getItem(guestResultsKey)
      const existingResults = existingResultsStr ? JSON.parse(existingResultsStr) : []

      // Check if we already have a result for this quiz
      const existingIndex = existingResults.findIndex((r: QuizResult) => r.quizId === result.quizId)

      // Either update existing or add new result
      if (existingIndex >= 0) {
        existingResults[existingIndex] = result
      } else {
        existingResults.push(result)
      }

      // Save back to localStorage
      localStorage.setItem(guestResultsKey, JSON.stringify(existingResults))

      console.log(`Saved guest result for ${result.quizId}:`, result)
    } catch (error) {
      console.error("Error saving guest result:", error)
    }
  }

  /**
   * Get all guest results
   */
  public getGuestResults(): QuizResult[] {
    if (typeof window === "undefined") return []

    try {
      const guestResultsKey = `${this.storagePrefix}guest_results`
      const resultsStr = localStorage.getItem(guestResultsKey)
      return resultsStr ? JSON.parse(resultsStr) : []
    } catch (error) {
      console.error("Error getting guest results:", error)
      return []
    }
  }

  /**
   * Get a specific guest result
   */
  public getGuestResult(quizId: string): QuizResult | null {
    if (typeof window === "undefined") return null

    try {
      // First check if we have a direct result
      const result = this.getQuizResult(quizId)
      if (result) {
        return result
      }

      // Then check in the guest results collection
      const guestResults = this.getGuestResults()
      return guestResults.find((r) => r.quizId === quizId) || null
    } catch (error) {
      console.error("Error getting guest result:", error)
      return null
    }
  }

  /**
   * Clear guest result
   */
  public clearGuestResult(quizId: string): void {
    if (typeof window === "undefined") return

    try {
      // Remove from guest results collection
      const guestResultsKey = `${this.storagePrefix}guest_results`
      const existingResultsStr = localStorage.getItem(guestResultsKey)

      if (existingResultsStr) {
        const existingResults = JSON.parse(existingResultsStr)
        const filteredResults = existingResults.filter((r: QuizResult) => r.quizId !== quizId)
        localStorage.setItem(guestResultsKey, JSON.stringify(filteredResults))
      }

      console.log(`Cleared guest result for ${quizId}`)
    } catch (error) {
      console.error("Error clearing guest result:", error)
    }
  }

  /**
   * Clear all guest results
   */
  public clearAllGuestResults(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(`${this.storagePrefix}guest_results`)
      console.log("Cleared all guest results")
    } catch (error) {
      console.error("Error clearing all guest results:", error)
    }
  }

  /**
   * Calculate similarity between two strings (for open-ended and fill-in-the-blanks quizzes)
   */
  public calculateSimilarity(str1: string, str2: string): number {
    if (!str1 && !str2) return 100
    if (!str1 || !str2) return 0

    // Normalize strings
    const a = str1.toLowerCase().trim()
    const b = str2.toLowerCase().trim()

    if (a === b) return 100

    // Simple Levenshtein distance implementation
    const matrix = []

    // Increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }

    // Increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1, // deletion
            ),
          )
        }
      }
    }

    // Calculate similarity as a percentage
    const maxLength = Math.max(a.length, b.length)
    const distance = matrix[b.length][a.length]
    const similarity = ((maxLength - distance) / maxLength) * 100

    return Math.round(similarity)
  }

  /**
   * Calculate score for a quiz based on answers
   */
  public calculateScore(answers: QuizAnswer[], quizType: QuizType): number {
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return 0
    }

    switch (quizType) {
      case "mcq":
        // For MCQ, count correct answers
        const correctCount = answers.filter((a) => a.isCorrect).length
        return Math.round((correctCount / answers.length) * 100)

      case "blanks":
        // For fill-in-the-blanks, average the similarity scores
        const totalSimilarity = answers.reduce((sum, a) => sum + (a.similarity || 0), 0)
        return Math.round(totalSimilarity / answers.length)

      case "openended":
        // For open-ended, average the similarity scores
        const openEndedSimilarity = answers.reduce((sum, a) => sum + (a.similarity || 0), 0)
        return Math.round(openEndedSimilarity / answers.length)

      case "code":
        // For code quizzes, count correct answers
        const codeCorrectCount = answers.filter((a) => a.isCorrect).length
        return Math.round((codeCorrectCount / answers.length) * 100)

      default:
        // Default scoring method
        const defaultCorrectCount = answers.filter((a) => a.isCorrect).length
        return Math.round((defaultCorrectCount / answers.length) * 100)
    }
  }

  /**
   * Count correct answers in a quiz
   */
  public countCorrectAnswers(answers: QuizAnswer[], quizType: QuizType): number {
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
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

  /**
   * Clear all quiz data
   */
  public clearAllQuizData(): void {
    if (typeof window === "undefined") return

    try {
      // Clear all quiz-related data from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key)
        }
      })

      // Clear all quiz-related data from sessionStorage
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(this.storagePrefix)) {
          sessionStorage.removeItem(key)
        }
      })

      // Clear cache
      this.resultCache.clear()

      console.log("Cleared all quiz data")
    } catch (error) {
      console.error("Error clearing all quiz data:", error)
    }
  }

  /**
   * Handle authentication state change
   * This should be called when a user signs in or out
   */
  public handleAuthStateChange(isAuthenticated: boolean): void {
    if (typeof window === "undefined") return

    try {
      if (isAuthenticated) {
        // User just signed in - preserve guest results for transfer to account
        localStorage.setItem(`${this.storagePrefix}preserve_guest_results`, "true")
      } else {
        // User just signed out - clear all quiz data
        this.clearAllQuizData()
      }
    } catch (error) {
      console.error("Error handling auth state change:", error)
    }
  }

  /**
   * Save pending quiz result for authentication flow
   */
  public savePendingQuizResult(result: QuizResult): void {
    if (typeof window === "undefined") return

    try {
      const pendingKey = `${this.storagePrefix}pending_result`
      localStorage.setItem(pendingKey, JSON.stringify(result))
      console.log(`Saved pending quiz result for ${result.quizId}:`, result)
    } catch (error) {
      console.error("Error saving pending quiz result:", error)
    }
  }

  /**
   * Get pending quiz result
   */
  public getPendingQuizResult(): QuizResult | null {
    if (typeof window === "undefined") return null

    try {
      const pendingKey = `${this.storagePrefix}pending_result`
      const pendingData = localStorage.getItem(pendingKey)
      if (pendingData) {
        return JSON.parse(pendingData)
      }
      return null
    } catch (error) {
      console.error("Error getting pending quiz result:", error)
      return null
    }
  }

  /**
   * Clear pending quiz result
   */
  public clearPendingQuizResult(): void {
    if (typeof window === "undefined") return

    try {
      const pendingKey = `${this.storagePrefix}pending_result`
      localStorage.removeItem(pendingKey)
      console.log("Cleared pending quiz result")
    } catch (error) {
      console.error("Error clearing pending quiz result:", error)
    }
  }
}

// Export the singleton instance
export const quizStorageService = QuizStorageService.getInstance()
