import { toast } from "@/hooks/use-toast"

// Define core types
export type QuizType = "mcq" | "blanks" | "openended" | "code"

export interface QuizAnswer {
  answer: string
  timeSpent: number
  isCorrect?: boolean
  similarity?: number
  hintsUsed?: boolean
}

export interface QuizState {
  quizId: string
  type: QuizType
  slug: string
  currentQuestion: number
  totalQuestions: number
  startTime: number
  isCompleted: boolean
  answers?: QuizAnswer[]
}

export interface QuizResult {
  quizId: string
  slug: string
  type: QuizType
  score: number
  answers: QuizAnswer[]
  totalTime: number
  totalQuestions: number
  completedAt?: string
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

// Storage keys
const STORAGE_KEYS = {
  STATE: (quizId: string, type: QuizType) => `quiz_state_${type}_${quizId}`,
  RESULT: (quizId: string) => `quiz_result_${quizId}`,
  COMPLETED: (quizId: string) => `quiz_${quizId}_completed`,
  SAVED: (quizId: string) => `quiz_${quizId}_saved`,
  GUEST_RESULT: (quizId: string) => `guest_quiz_${quizId}`,
  GUEST_RESULTS: "quiz_guest_results",
  CURRENT_STATE: "quiz_current_state",
  PENDING_DATA: "pendingQuizData",
  AUTH_REDIRECT: "quizAuthRedirect",
  IN_AUTH_FLOW: "inAuthFlow",
}

/**
 * Simplified Quiz Service
 * Handles quiz state management, storage, and API interactions
 */
class QuizService {
  private static instance: QuizService
  private resultCache: Map<string, QuizResult> = new Map()
  private saveInProgress: Set<string> = new Set()

  private constructor() {}

  public static getInstance(): QuizService {
    if (!QuizService.instance) {
      QuizService.instance = new QuizService()
    }
    return QuizService.instance
  }

  // ===== Authentication Helpers =====

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false

    try {
      // Check multiple sources to determine authentication status
      const hasSessionToken =
        sessionStorage.getItem("next-auth.session-token") || localStorage.getItem("next-auth.session-token")

      const hasUserData = localStorage.getItem("userData") !== null

      const hasAuthMarker =
        sessionStorage.getItem("isAuthenticated") === "true" || localStorage.getItem("isAuthenticated") === "true"

      return !!(hasSessionToken || hasUserData || hasAuthMarker)
    } catch (error) {
      console.error("Error checking authentication status:", error)
      return false
    }
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | undefined {
    if (typeof window === "undefined") return undefined

    // For client-side checks, we just need to know if a session exists
    return this.isAuthenticated() ? "authenticated" : undefined
  }

  // ===== Quiz State Management =====

  /**
   * Get quiz state from storage
   */
  getQuizState(quizId: string, type: QuizType): QuizState | null {
    if (typeof window === "undefined") return null

    try {
      const stateKey = STORAGE_KEYS.STATE(quizId, type)

      // Try localStorage first
      const localData = localStorage.getItem(stateKey)
      if (localData) {
        return JSON.parse(localData)
      }

      // Try sessionStorage as fallback
      const sessionData = sessionStorage.getItem(stateKey)
      if (sessionData) {
        return JSON.parse(sessionData)
      }

      // Try current state as last resort
      const currentStateData = localStorage.getItem(STORAGE_KEYS.CURRENT_STATE)
      if (currentStateData) {
        const currentState = JSON.parse(currentStateData)
        if (currentState.quizId === quizId && currentState.type === type) {
          return currentState
        }
      }

      return null
    } catch (error) {
      console.error("Error getting quiz state:", error)
      return null
    }
  }

  /**
   * Save quiz state to storage
   */
  saveQuizState(state: QuizState): void {
    if (typeof window === "undefined") return

    try {
      const stateKey = STORAGE_KEYS.STATE(state.quizId, state.type)
      const stateData = JSON.stringify(state)

      // Save to both storages for redundancy
      localStorage.setItem(stateKey, stateData)
      sessionStorage.setItem(stateKey, stateData)

      // Save current state for easier access
      localStorage.setItem(STORAGE_KEYS.CURRENT_STATE, stateData)
    } catch (error) {
      console.error("Error saving quiz state:", error)
    }
  }

  /**
   * Clear quiz state from storage
   */
  clearQuizState(quizId: string, type: QuizType): void {
    if (typeof window === "undefined") return

    try {
      const stateKey = STORAGE_KEYS.STATE(quizId, type)
      localStorage.removeItem(stateKey)
      sessionStorage.removeItem(stateKey)

      // Clear current state if it matches
      const currentStateData = localStorage.getItem(STORAGE_KEYS.CURRENT_STATE)
      if (currentStateData) {
        const currentState = JSON.parse(currentStateData)
        if (currentState.quizId === quizId && currentState.type === type) {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_STATE)
        }
      }

      // Clear related items
      localStorage.removeItem(STORAGE_KEYS.COMPLETED(quizId))
      localStorage.removeItem(STORAGE_KEYS.SAVED(quizId))
      localStorage.removeItem(STORAGE_KEYS.RESULT(quizId))

      // Clear from cache
      this.resultCache.delete(quizId)
    } catch (error) {
      console.error("Error clearing quiz state:", error)
    }
  }

  // ===== Quiz Results =====

  /**
   * Save quiz result to storage
   */
  saveQuizResult(result: QuizResult): void {
    if (typeof window === "undefined") return

    try {
      const resultKey = STORAGE_KEYS.RESULT(result.quizId)
      const resultData = JSON.stringify({
        ...result,
        timestamp: Date.now(),
      })

      // Save to both storages for redundancy
      localStorage.setItem(resultKey, resultData)
      sessionStorage.setItem(resultKey, resultData)

      // Mark as completed
      localStorage.setItem(STORAGE_KEYS.COMPLETED(result.quizId), "true")

      // Cache the result
      this.resultCache.set(result.quizId, result)
    } catch (error) {
      console.error("Error saving quiz result:", error)
    }
  }

  /**
   * Get quiz result from storage or cache
   */
  getQuizResult(quizId: string): QuizResult | null {
    if (typeof window === "undefined") return null

    // Check cache first
    if (this.resultCache.has(quizId)) {
      return this.resultCache.get(quizId) || null
    }

    try {
      const resultKey = STORAGE_KEYS.RESULT(quizId)

      // Try localStorage first
      const localData = localStorage.getItem(resultKey)
      if (localData) {
        try {
          const result = JSON.parse(localData)
          if (result && result.answers && result.answers.length > 0) {
            this.resultCache.set(quizId, result)
            return result
          }
        } catch (e) {
          console.error("Error parsing quiz result from localStorage:", e)
        }
      }

      // Try sessionStorage as fallback
      const sessionData = sessionStorage.getItem(resultKey)
      if (sessionData) {
        try {
          const result = JSON.parse(sessionData)
          if (result && result.answers && result.answers.length > 0) {
            this.resultCache.set(quizId, result)
            return result
          }
        } catch (e) {
          console.error("Error parsing quiz result from sessionStorage:", e)
        }
      }

      // Check for guest result
      const guestResult = this.getGuestResult(quizId)
      if (guestResult && guestResult.answers && guestResult.answers.length > 0) {
        return guestResult
      }

      return null
    } catch (error) {
      console.error("Error getting quiz result:", error)
      return null
    }
  }

  /**
   * Check if quiz is completed
   */
  isQuizCompleted(quizId: string): boolean {
    if (typeof window === "undefined") return false

    try {
      // Check direct completion marker
      if (localStorage.getItem(STORAGE_KEYS.COMPLETED(quizId)) === "true") {
        return true
      }

      // Check if we have a result with answers
      const result = this.getQuizResult(quizId)
      if (result && result.answers && result.answers.length > 0) {
        return true
      }

      // Check URL for completed parameter
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get("completed") === "true") {
          return true
        }
      }

      return false
    } catch (error) {
      console.error("Error checking if quiz is completed:", error)
      return false
    }
  }

  // ===== Guest Results =====

  /**
   * Save guest result for unauthenticated users
   */
  saveGuestResult(result: QuizResult): void {
    if (typeof window === "undefined") return
    if (this.isAuthenticated()) return

    try {
      // Save individual result
      const guestKey = STORAGE_KEYS.GUEST_RESULT(result.quizId)
      localStorage.setItem(guestKey, JSON.stringify(result))

      // Add to guest results collection
      const guestResultsStr = localStorage.getItem(STORAGE_KEYS.GUEST_RESULTS)
      const guestResults = guestResultsStr ? JSON.parse(guestResultsStr) : []

      const existingIndex = guestResults.findIndex((r: QuizResult) => r.quizId === result.quizId)
      if (existingIndex >= 0) {
        guestResults[existingIndex] = result
      } else {
        guestResults.push(result)
      }

      localStorage.setItem(STORAGE_KEYS.GUEST_RESULTS, JSON.stringify(guestResults))
    } catch (error) {
      console.error("Error saving guest result:", error)
    }
  }

  /**
   * Get guest result
   */
  getGuestResult(quizId: string): QuizResult | null {
    if (typeof window === "undefined") return null
    if (this.isAuthenticated()) return null

    try {
      // Try direct guest result first
      const guestKey = STORAGE_KEYS.GUEST_RESULT(quizId)
      const guestData = localStorage.getItem(guestKey)
      if (guestData) {
        return JSON.parse(guestData)
      }

      // Try guest results collection
      const guestResultsStr = localStorage.getItem(STORAGE_KEYS.GUEST_RESULTS)
      if (guestResultsStr) {
        const guestResults = JSON.parse(guestResultsStr)
        return guestResults.find((r: QuizResult) => r.quizId === quizId) || null
      }

      return null
    } catch (error) {
      console.error("Error getting guest result:", error)
      return null
    }
  }

  /**
   * Get all guest results
   */
  getGuestResults(): QuizResult[] {
    if (typeof window === "undefined") return []
    if (this.isAuthenticated()) return []

    try {
      const guestResultsStr = localStorage.getItem(STORAGE_KEYS.GUEST_RESULTS)
      return guestResultsStr ? JSON.parse(guestResultsStr) : []
    } catch (error) {
      console.error("Error getting guest results:", error)
      return []
    }
  }

  /**
   * Clear guest result
   */
  clearGuestResult(quizId: string): void {
    if (typeof window === "undefined") return

    try {
      // Remove direct guest result
      localStorage.removeItem(STORAGE_KEYS.GUEST_RESULT(quizId))

      // Remove from guest results collection
      const guestResultsStr = localStorage.getItem(STORAGE_KEYS.GUEST_RESULTS)
      if (guestResultsStr) {
        const guestResults = JSON.parse(guestResultsStr)
        const filteredResults = guestResults.filter((r: QuizResult) => r.quizId !== quizId)
        localStorage.setItem(STORAGE_KEYS.GUEST_RESULTS, JSON.stringify(filteredResults))
      }
    } catch (error) {
      console.error("Error clearing guest result:", error)
    }
  }

  // ===== Quiz Submission =====

  /**
   * Submit quiz result to server
   */
  async submitQuizResult(submission: QuizSubmission): Promise<QuizResult | null> {
    // Validate submission
    if (
      !submission.quizId ||
      !submission.slug ||
      !submission.answers ||
      submission.totalTime <= 0 ||
      submission.score < 0 ||
      submission.score > 100
    ) {
      console.error("Invalid quiz submission:", submission)
      return null
    }

    const submissionKey = submission.quizId

    // Check if already saved
    if (localStorage.getItem(STORAGE_KEYS.SAVED(submission.quizId)) === "true" && !this.isAuthenticated()) {
      console.log("Quiz result already saved, skipping submission")
      return this.resultCache.get(submissionKey) || null
    }

    // Check if save is in progress
    if (this.saveInProgress.has(submissionKey)) {
      console.log("Save already in progress for this quiz")
      return null
    }

    // Mark save as in progress
    this.saveInProgress.add(submissionKey)

    try {
      // Prepare the request payload
      const payload = {
        quizId: submission.quizId,
        slug: submission.slug,
        answers: submission.answers,
        totalTime: submission.totalTime,
        score: submission.score,
        type: submission.type,
        totalQuestions: submission.totalQuestions,
        completedAt: new Date().toISOString(),
        userId: this.getCurrentUserId(),
      }

      console.log("Sending API request to save quiz result:", payload)

      // Send to server
      const response = await fetch(`/api/quiz/${submission.slug}/complete`, {
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
          const errorText = await response.text()
          if (errorText) {
            errorMessage += ` - ${errorText}`
          }
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()

      // Cache the result
      this.resultCache.set(submissionKey, result)

      // Mark as saved
      localStorage.setItem(STORAGE_KEYS.SAVED(submission.quizId), "true")

      // Clear guest result after successful save for authenticated users
      if (this.isAuthenticated()) {
        this.clearGuestResult(submission.quizId)
        this.clearQuizState(submission.quizId, submission.type)
      }

      return result
    } catch (error) {
      console.error("Error submitting quiz result:", error)

      toast({
        title: "Error saving results",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })

      return null
    } finally {
      // Mark save as no longer in progress
      this.saveInProgress.delete(submissionKey)
    }
  }

  // ===== Scoring Helpers =====

  /**
   * Calculate score for a quiz based on answers
   */
  calculateScore(answers: QuizAnswer[], type: QuizType): number {
    if (!answers || answers.length === 0) return 0

    switch (type) {
      case "mcq":
      case "code":
        // Count correct answers
        const correctCount = answers.filter((a) => a.isCorrect).length
        return Math.round((correctCount / answers.length) * 100)

      case "blanks":
        // Average similarity scores with threshold of 80%
        const blanksSimilarity = answers.reduce((sum, a) => sum + (a.similarity || 0), 0)
        return Math.round(blanksSimilarity / answers.length)

      case "openended":
        // Average similarity scores with threshold of 70%
        const openEndedSimilarity = answers.reduce((sum, a) => sum + (a.similarity || 0), 0)
        return Math.round(openEndedSimilarity / answers.length)

      default:
        return 0
    }
  }

  /**
   * Count correct answers in a quiz
   */
  countCorrectAnswers(answers: QuizAnswer[], type: QuizType): number {
    if (!answers || answers.length === 0) return 0

    switch (type) {
      case "mcq":
      case "code":
        return answers.filter((a) => a.isCorrect).length

      case "blanks":
        return answers.filter((a) => (a.similarity || 0) > 80).length

      case "openended":
        return answers.filter((a) => (a.similarity || 0) > 70).length

      default:
        return 0
    }
  }

  /**
   * Calculate similarity between two strings
   */
  calculateSimilarity(str1: string, str2: string): number {
    if (!str1 && !str2) return 100
    if (!str1 || !str2) return 0

    // Normalize strings
    const a = str1.toLowerCase().trim()
    const b = str2.toLowerCase().trim()

    if (a === b) return 100

    // Simple Levenshtein distance implementation
    const an = a.length
    const bn = b.length
    const matrix = Array(bn + 1)
      .fill(0)
      .map(() => Array(an + 1).fill(0))

    for (let i = 0; i <= an; i++) matrix[0][i] = i
    for (let j = 0; j <= bn; j++) matrix[j][0] = j

    for (let j = 1; j <= bn; j++) {
      for (let i = 1; i <= an; i++) {
        const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost, // substitution
        )
      }
    }

    return 100 - (matrix[bn][an] / Math.max(an, bn)) * 100
  }

  // ===== Authentication Flow =====

  /**
   * Save auth redirect information
   */
  saveAuthRedirect(redirectUrl: string): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_REDIRECT, redirectUrl)
      localStorage.setItem(STORAGE_KEYS.IN_AUTH_FLOW, "true")
    } catch (error) {
      console.error("Error saving auth redirect:", error)
    }
  }

  /**
   * Check if in auth flow
   */
  isInAuthFlow(): boolean {
    if (typeof window === "undefined") return false

    try {
      return localStorage.getItem(STORAGE_KEYS.IN_AUTH_FLOW) === "true"
    } catch (error) {
      console.error("Error checking auth flow:", error)
      return false
    }
  }

  /**
   * Get auth redirect URL
   */
  getAuthRedirect(): string | null {
    if (typeof window === "undefined") return null

    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_REDIRECT)
    } catch (error) {
      console.error("Error getting auth redirect:", error)
      return null
    }
  }

  /**
   * Clear auth flow data
   */
  clearAuthFlow(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_REDIRECT)
      localStorage.removeItem(STORAGE_KEYS.IN_AUTH_FLOW)
    } catch (error) {
      console.error("Error clearing auth flow:", error)
    }
  }

  /**
   * Handle auth redirect
   */
  handleAuthRedirect(redirectUrl: string): void {
    if (typeof window === "undefined") return

    try {
      // Save the redirect URL
      this.saveAuthRedirect(redirectUrl)

      // Save current quiz state
      const currentState = localStorage.getItem(STORAGE_KEYS.CURRENT_STATE)
      if (currentState) {
        localStorage.setItem(STORAGE_KEYS.PENDING_DATA, currentState)
        sessionStorage.setItem(STORAGE_KEYS.PENDING_DATA, currentState)
      }

      // Add fromAuth parameter to the callback URL
      const callbackUrl = new URL(redirectUrl, window.location.origin)
      callbackUrl.searchParams.set("fromAuth", "true")

      // Redirect to sign in
      window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl.toString())}`
    } catch (error) {
      console.error("Error handling auth redirect:", error)
    }
  }

  /**
   * Check if returning from auth
   */
  isReturningFromAuth(): boolean {
    if (typeof window === "undefined") return false

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const isCompleted = urlParams.get("completed") === "true"
      const fromAuth = urlParams.get("fromAuth") === "true"

      // If URL explicitly has fromAuth=true
      if (fromAuth) return true

      // Check for other indicators
      const hasAuthParam = urlParams.has("auth") || urlParams.has("session")
      const hasPendingData =
        sessionStorage.getItem(STORAGE_KEYS.PENDING_DATA) !== null ||
        localStorage.getItem(STORAGE_KEYS.PENDING_DATA) !== null ||
        localStorage.getItem(STORAGE_KEYS.AUTH_REDIRECT) !== null

      const inAuthFlow = localStorage.getItem(STORAGE_KEYS.IN_AUTH_FLOW) === "true"

      return (
        (isCompleted && (hasAuthParam || hasPendingData || inAuthFlow)) || (this.isAuthenticated() && hasPendingData)
      )
    } catch (error) {
      console.error("Error checking if returning from auth:", error)
      return false
    }
  }

  /**
   * Process pending quiz data after authentication
   */
  async processPendingQuizData(): Promise<void> {
    if (typeof window === "undefined") return

    try {
      console.log("Processing pending quiz data")

      // Try to get pending data
      let pendingData = null

      // Try sessionStorage first
      const sessionData = sessionStorage.getItem(STORAGE_KEYS.PENDING_DATA)
      if (sessionData) {
        pendingData = JSON.parse(sessionData)
      }

      // Try localStorage if not in sessionStorage
      if (!pendingData) {
        const localData = localStorage.getItem(STORAGE_KEYS.PENDING_DATA)
        if (localData) {
          pendingData = JSON.parse(localData)
        }
      }

      if (!pendingData || !pendingData.quizId) {
        console.log("No pending quiz data found")
        return
      }

      console.log("Found pending data:", pendingData)

      // If we have answers, save the result
      if (pendingData.answers && Array.isArray(pendingData.answers)) {
        const result: QuizResult = {
          quizId: pendingData.quizId,
          slug: pendingData.slug,
          type: pendingData.type,
          score: pendingData.score || 0,
          answers: pendingData.answers.filter((a) => a !== null),
          totalTime: pendingData.totalTime || 0,
          totalQuestions: pendingData.totalQuestions || pendingData.answers.length,
        }

        // Cache the result
        this.resultCache.set(pendingData.quizId, result)

        // For authenticated users, save to server
        if (this.isAuthenticated()) {
          await this.submitQuizResult({
            quizId: result.quizId,
            slug: result.slug,
            type: result.type,
            score: result.score,
            answers: result.answers,
            totalTime: result.totalTime,
            totalQuestions: result.totalQuestions,
          })

          // Clear storage after saving
          this.clearPendingData()
        } else {
          // For guest users, save to localStorage
          this.saveGuestResult(result)
        }
      }
    } catch (error) {
      console.error("Error processing pending quiz data:", error)
    }
  }

  /**
   * Clear pending data
   */
  clearPendingData(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(STORAGE_KEYS.PENDING_DATA)
      sessionStorage.removeItem(STORAGE_KEYS.PENDING_DATA)
      this.clearAuthFlow()
    } catch (error) {
      console.error("Error clearing pending data:", error)
    }
  }

  /**
   * Clear all quiz data
   */
  clearAllQuizData(): void {
    if (typeof window === "undefined") return

    try {
      console.log("Clearing all quiz data")

      // Clear all quiz-related localStorage items
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith("quiz_") ||
          key.includes("_quiz_") ||
          key === STORAGE_KEYS.PENDING_DATA ||
          key === STORAGE_KEYS.IN_AUTH_FLOW ||
          key === STORAGE_KEYS.AUTH_REDIRECT
        ) {
          localStorage.removeItem(key)
        }
      })

      // Clear all quiz-related sessionStorage items
      Object.keys(sessionStorage).forEach((key) => {
        if (
          key.startsWith("quiz_") ||
          key.includes("Quiz") ||
          key.includes("Auth") ||
          key === STORAGE_KEYS.PENDING_DATA
        ) {
          sessionStorage.removeItem(key)
        }
      })

      // Clear cache
      this.resultCache.clear()
      this.saveInProgress.clear()

      console.log("Successfully cleared all quiz data")
    } catch (error) {
      console.error("Error clearing all quiz data:", error)
    }
  }
}

// Export singleton instance
export const quizService = QuizService.getInstance()
