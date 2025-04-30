// Import the shared types from quiz-types.ts
import {
  QuizType,
  type QuizAnswer,
  type QuizResult,
  type QuizSubmission,
  type StoredQuizState,
} from "@/app/types/quiz-types"
import { toast } from "@/hooks/use-toast"

// Storage keys
const STORAGE_KEYS = {
  STATE: (quizId: string, type: QuizType | string) => `quiz_state_${type}_${quizId}`,
  RESULT: (quizId: string) => `quiz_result_${quizId}`,
  COMPLETED: (quizId: string) => `quiz_${quizId}_completed`,
  SAVED: (quizId: string) => `quiz_${quizId}_saved`,
  GUEST_RESULT: (quizId: string) => `guest_quiz_${quizId}`,
  GUEST_RESULTS: "quiz_guest_results",
  CURRENT_STATE: "quiz_current_state",
  PENDING_DATA: "pendingQuizData",
  AUTH_REDIRECT: "quizAuthRedirect",
  IN_AUTH_FLOW: "inAuthFlow",
  AUTH_STATE: "quizAuthState",
  AUTH_FLOW_TIMESTAMP: "authFlowTimestamp",
}

// Make storage keys accessible externally
const get: {
  STORAGE_KEYS: () => typeof STORAGE_KEYS
} = {
  STORAGE_KEYS() {
    return STORAGE_KEYS
  },
}

/**
 * Simplified Quiz Service
 * Handles quiz state management, storage,age, and API interactions
 */
class QuizService {
  private static instance: QuizService
  private resultCache: Map<string, QuizResult> = new Map()
  private saveInProgress: Set<string> = new Set()
  private authState: boolean | null = null
  private storageListener = (event: StorageEvent) => {
    if (event.key === STORAGE_KEYS.AUTH_STATE) {
      this.authState = event.newValue === "true"
    }
  }
  private cleanupListeners: () => void = () => {}

  private constructor() {
    // Initialize auth state
    this.initAuthState()
  }

  public static getInstance(): QuizService {
    if (!QuizService.instance) {
      QuizService.instance = new QuizService()
    }
    return QuizService.instance
  }

  // Initialize auth state and set up listeners
  private initAuthState(): void {
    if (typeof window === "undefined") return

    // Try to get cached auth state first
    try {
      const cachedState = localStorage.getItem(STORAGE_KEYS.AUTH_STATE)
      if (cachedState) {
        this.authState = cachedState === "true"
      }
    } catch (e) {
      console.error("Error reading cached auth state:", e)
    }

    // Set up storage event listener to sync auth state across tabs
    window.addEventListener("storage", this.storageListener)

    // Add a cleanup method to the class
    this.cleanupListeners = () => {
      window.removeEventListener("storage", this.storageListener)
    }
  }

  // ===== Authentication Helpers =====

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false

    try {
      // First check cached state for performance
      if (this.authState !== null) {
        return this.authState
      }

      // Check for session token in cookies (most reliable method)
      const hasSessionCookie =
        document.cookie.includes("next-auth.session-token") ||
        document.cookie.includes("__Secure-next-auth.session-token")

      if (hasSessionCookie) {
        // Cache the result
        this.authState = true
        localStorage.setItem(STORAGE_KEYS.AUTH_STATE, "true")
        return true
      }

      // Fallback checks
      const hasUserData = localStorage.getItem("userData") !== null
      const hasAuthState =
        localStorage.getItem("isAuthenticated") === "true" ||
        sessionStorage.getItem("isAuthenticated") === "true" ||
        localStorage.getItem(STORAGE_KEYS.AUTH_STATE) === "true"
      const hasAuthToken = localStorage.getItem("token") !== null || sessionStorage.getItem("token") !== null

      const isAuth = hasUserData || hasAuthState || hasAuthToken

      // Update cached state
      this.authState = isAuth
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, isAuth ? "true" : "false")

      return isAuth
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
  getQuizState(quizId: string, type: QuizType | string): StoredQuizState | null {
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
  saveQuizState(state: StoredQuizState): void {
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
  clearQuizState(quizId: string, type: QuizType | string): void {
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

      // Don't clear completion marker or result
      // localStorage.removeItem(STORAGE_KEYS.COMPLETED(quizId))
      // localStorage.removeItem(STORAGE_KEYS.SAVED(quizId))
      // localStorage.removeItem(STORAGE_KEYS.RESULT(quizId))

      // Don't clear from cache either
      // this.resultCache.delete(quizId)
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

      // Check for guest result if not authenticated
      if (!this.isAuthenticated()) {
        const guestResult = this.getGuestResult(quizId)
        if (guestResult && guestResult.answers && guestResult.answers.length > 0) {
          return guestResult
        }
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

      // Check storage for completed state - no need to check URL anymore
      if (typeof window !== "undefined") {
        if (
          localStorage.getItem(`quiz_${quizId}_completed`) === "true" ||
          sessionStorage.getItem(`quiz_${quizId}_completed`) === "true"
        ) {
          return true
        }
      }

      return false
    } catch (error) {
      console.error("Error checking if quiz is completed:", error)
      return false
    }
  }

  /**
   * Mark a quiz as completed in storage
   */
  markQuizCompleted(quizId: string): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(`quiz_${quizId}_completed`, "true")
      sessionStorage.setItem(`quiz_${quizId}_completed`, "true")
      localStorage.setItem(STORAGE_KEYS.COMPLETED(quizId), "true")
    } catch (error) {
      console.error("Error marking quiz as completed:", error)
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

    // Allow getting guest results even when authenticated
    // This helps with the transition from guest to authenticated

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

    // Allow getting guest results even when authenticated
    // This helps with the transition from guest to authenticated

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

    // Check if save is in progress - use a more robust approach
    if (this.saveInProgress.has(submissionKey)) {
      console.log("Save already in progress for this quiz, preventing duplicate API call")

      // Return a promise that resolves when the existing save completes
      return new Promise((resolve) => {
        const startTime = Date.now()
        const maxWaitTime = 8000 // 8 seconds max wait

        // Check every 100ms if the save is complete
        const checkInterval = setInterval(() => {
          if (!this.saveInProgress.has(submissionKey)) {
            clearInterval(checkInterval)
            resolve(this.resultCache.get(submissionKey) || null)
          }

          // Also check if we've waited too long
          if (Date.now() - startTime > maxWaitTime) {
            clearInterval(checkInterval)
            console.warn("Waited too long for save to complete, continuing anyway")
            this.saveInProgress.delete(submissionKey) // Force clear the flag
            resolve(this.resultCache.get(submissionKey) || null)
          }
        }, 100)
      })
    }

    // Mark save as in progress
    this.saveInProgress.add(submissionKey)
    console.log(
      `[QuizService] Starting save for quiz ${submissionKey}, saveInProgress:`,
      Array.from(this.saveInProgress),
    )

    // Set a timeout to clear the in-progress flag after 30 seconds
    // This prevents the app from getting stuck if the API call hangs
    const saveTimeout = setTimeout(() => {
      if (this.saveInProgress.has(submissionKey)) {
        console.warn("Quiz submission timed out after 30 seconds")
        this.saveInProgress.delete(submissionKey)
      }
    }, 30000)

    try {
      // Check if we already have a cached result to avoid unnecessary API calls
      const existingResult = this.resultCache.get(submissionKey)
      if (existingResult && localStorage.getItem(STORAGE_KEYS.SAVED(submission.quizId)) === "true") {
        console.log("Result already cached and saved, skipping API call")
        clearTimeout(saveTimeout)
        this.saveInProgress.delete(submissionKey)
        return existingResult
      }

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

      console.log("[QuizService] Sending API request to save quiz result:", payload)

      // Send to server - IMPORTANT: Use quizId instead of slug in the API endpoint
      const response = await fetch(`/api/quiz/${submission.quizId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include", // Important for auth cookies
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

      console.log(`[QuizService] Successfully saved quiz ${submissionKey}`)
      return result
    } catch (error) {
      console.error("[QuizService] Error submitting quiz result:", error)

      // Only show toast once per error
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      const errorKey = `error_${submissionKey}_${Date.now()}`

      if (!localStorage.getItem(errorKey)) {
        localStorage.setItem(errorKey, "true")
        // Set expiration for error key (5 minutes)
        setTimeout(() => localStorage.removeItem(errorKey), 5 * 60 * 1000)

        toast({
          title: "Error saving results",
          description: errorMessage,
          variant: "destructive",
        })
      }

      return null
    } finally {
      // Clear the timeout and mark save as no longer in progress
      clearTimeout(saveTimeout)
      this.saveInProgress.delete(submissionKey)
      console.log(
        `[QuizService] Completed save process for quiz ${submissionKey}, saveInProgress:`,
        Array.from(this.saveInProgress),
      )
    }
  }

  /**
   * Save complete quiz result (for backward compatibility)
   */
  saveCompleteQuizResult(submission: QuizSubmission): Promise<QuizResult | null> {
    return this.submitQuizResult(submission)
  }

  /**
   * Clear all storage
   */
  clearAllStorageData(): void {
    if (typeof window === "undefined") return

    try {
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

  // ===== Scoring Helpers =====

  /**
   * Calculate score for a quiz based on answers
   */
  calculateScore(answers: QuizAnswer[], type: QuizType | string): number {
    if (!answers || answers.length === 0) return 0

    switch (type) {
      case QuizType.MCQ:
      case "mcq":
      case QuizType.CODE:
      case "code":
        // Count correct answers
        const correctCount = answers.filter((a) => a.isCorrect).length
        return Math.round((correctCount / answers.length) * 100)

      case QuizType.BLANKS:
      case "blanks":
        // Average similarity scores with threshold of 80%
        const blanksSimilarity = answers.reduce((sum, a) => sum + (a.similarity || 0), 0)
        return Math.round(blanksSimilarity / answers.length)

      case QuizType.OPENENDED:
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
  countCorrectAnswers(answers: QuizAnswer[], type: QuizType | string): number {
    if (!answers || answers.length === 0) return 0

    switch (type) {
      case QuizType.MCQ:
      case "mcq":
      case QuizType.CODE:
      case "code":
        return answers.filter((a) => a.isCorrect).length

      case QuizType.BLANKS:
      case "blanks":
        return answers.filter((a) => (a.similarity || 0) > 80).length

      case QuizType.OPENENDED:
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
      // Check if the auth flow flag is set
      const inAuthFlow = localStorage.getItem(STORAGE_KEYS.IN_AUTH_FLOW) === "true"

      // If it's set, check if it's stale (older than 5 minutes)
      if (inAuthFlow) {
        const authFlowTimestamp = Number(localStorage.getItem(STORAGE_KEYS.AUTH_FLOW_TIMESTAMP) || "0")
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000

        // If the timestamp is older than 5 minutes, consider the auth flow expired
        if (now - authFlowTimestamp > fiveMinutes) {
          console.log("Auth flow timestamp expired, clearing stale auth flow state")
          this.clearAuthFlow()
          return false
        }
      }

      return inAuthFlow
    } catch (error) {
      console.error("Error checking auth flow:", error)
      return false
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
      localStorage.removeItem(STORAGE_KEYS.AUTH_FLOW_TIMESTAMP)
      console.log("Auth flow data cleared")
    } catch (error) {
      console.error("Error clearing auth flow:", error)
    }
  }

  /**
   * Handle auth redirect
   */
  handleAuthRedirect(redirectUrl: string, forceAuth = false): void {
    if (typeof window === "undefined") return

    try {
      // Check if already authenticated
      if (this.isAuthenticated() && !forceAuth) {
        console.log("User is already authenticated, redirecting directly")
        window.location.href = redirectUrl
        return
      }

      // Check if already in auth flow to prevent loops, unless forceAuth is true
      if (this.isInAuthFlow() && !forceAuth) {
        console.log("Already in auth flow and force=false, preventing potential redirect loop")

        // Check if the auth flow is stale (older than 5 minutes)
        const authFlowTimestamp = Number(localStorage.getItem(STORAGE_KEYS.AUTH_FLOW_TIMESTAMP) || "0")
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000

        if (now - authFlowTimestamp > fiveMinutes) {
          console.log("Auth flow is stale, clearing and continuing")
          this.clearAuthFlow()
        } else {
          // Still in recent auth flow, don't redirect again
          console.log("Recent auth flow detected, not redirecting again")
          return
        }
      }

      // Extract quiz type from the URL if possible
      let quizType: QuizType = QuizType.MCQ // Default fallback
      try {
        // Try to extract quiz type from the URL path
        const urlPath = redirectUrl.split("?")[0] // Get path without query params
        const pathParts = urlPath.split("/")

        // Look for known quiz types in the path
        const knownTypes = [
          QuizType.MCQ,
          QuizType.BLANKS,
          QuizType.OPENENDED,
          QuizType.CODE,
          QuizType.FLASHCARD,
          QuizType.DOCUMENT,
        ]

        for (const part of pathParts) {
          // Check if the part matches any of the enum values
          if (Object.values(QuizType).includes(part as QuizType)) {
            quizType = part as QuizType
            console.log(`Detected quiz type from URL: ${quizType}`)
            break
          }
        }

        // Save the detected quiz type to localStorage for later use
        localStorage.setItem("quiz_type_for_auth", quizType)
      } catch (error) {
        console.error("Error extracting quiz type from URL:", error)
      }

      // Add fromAuth parameter to the callback URL
      let callbackUrl: URL
      try {
        // Validate and sanitize the redirectUrl
        // Only allow relative URLs or URLs from the same origin
        if (redirectUrl.startsWith("/") || redirectUrl.startsWith(window.location.origin)) {
          callbackUrl = new URL(redirectUrl, window.location.origin)
        } else {
          // If it's not a valid URL, default to the home page
          console.warn("Invalid redirect URL detected, defaulting to home page")
          callbackUrl = new URL("/", window.location.origin)
        }

        callbackUrl.searchParams.set("fromAuth", "true")
        callbackUrl.searchParams.set("authTimestamp", Date.now().toString())

        // Add quiz type to the callback URL to ensure we return to the correct quiz type
        callbackUrl.searchParams.set("quizType", quizType)
      } catch (error) {
        console.error("Error creating callback URL:", error)
        // Fallback to a safe URL
        callbackUrl = new URL("/", window.location.origin)
        callbackUrl.searchParams.set("fromAuth", "true")
      }

      // Store the quiz ID for post-auth processing
      const quizIdMatch = redirectUrl.match(/\/([^/]+)\?/)
      if (quizIdMatch && quizIdMatch[1]) {
        const quizId = quizIdMatch[1]
        sessionStorage.setItem("returning_quiz_id", quizId)
      }

      // Save current state before redirecting
      this.savePendingQuizData()

      // Mark that we're in auth flow with a timestamp
      localStorage.setItem(STORAGE_KEYS.IN_AUTH_FLOW, "true")
      localStorage.setItem(STORAGE_KEYS.AUTH_FLOW_TIMESTAMP, Date.now().toString())
      localStorage.setItem(STORAGE_KEYS.AUTH_REDIRECT, callbackUrl.toString())

      // Redirect to sign in
      console.log("Redirecting to sign in with callback URL:", callbackUrl.toString())

      // Use the correct sign-in URL
      const signInUrl = `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl.toString())}`

      // Redirect with a small delay to ensure storage is updated
      setTimeout(() => {
        window.location.href = signInUrl
      }, 100)
    } catch (error) {
      console.error("Error handling auth redirect:", error)

      // Fallback to direct redirect in case of error
      try {
        window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`
      } catch (e) {
        console.error("Failed to redirect to sign in:", e)
      }
    }
  }

  /**
   * Check if returning from auth
   */
  isReturningFromAuth(): boolean {
    if (typeof window === "undefined") return false

    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search)
    const fromAuth = urlParams.get("fromAuth")

    // Check localStorage as fallback
    const authRedirect = localStorage.getItem("quizAuthRedirect")

    const isReturning = fromAuth === "true" || !!authRedirect
    console.log("[QuizService] isReturningFromAuth check:", isReturning, { fromAuth, authRedirect })

    return isReturning
  }

  /**
   * Manually save current quiz state as pending data
   */
  savePendingQuizData(): void {
    if (typeof window === "undefined") return

    try {
      console.log("Manually saving current quiz state as pending data")

      // Try to get current state
      const currentStateData = localStorage.getItem(STORAGE_KEYS.CURRENT_STATE)
      if (currentStateData) {
        // Parse the current state to extract the quiz type
        try {
          const currentState = JSON.parse(currentStateData)

          // Save the quiz type separately to ensure it's available during auth flow
          if (currentState.type) {
            localStorage.setItem("quiz_type_for_auth", currentState.type)
            console.log(`Saved quiz type for auth: ${currentState.type}`)
          }

          // Save to pending data
          localStorage.setItem(STORAGE_KEYS.PENDING_DATA, currentStateData)
          sessionStorage.setItem(STORAGE_KEYS.PENDING_DATA, currentStateData)
          console.log("Current quiz state saved as pending data")
        } catch (e) {
          console.error("Error parsing current state:", e)
          // Still save the raw data
          localStorage.setItem(STORAGE_KEYS.PENDING_DATA, currentStateData)
          sessionStorage.setItem(STORAGE_KEYS.PENDING_DATA, currentStateData)
        }
      } else {
        console.log("No current quiz state found to save")
      }
    } catch (error) {
      console.error("Error saving pending quiz data:", error)
    }
  }

  // Update the processPendingQuizData method to use the saved quiz type
  async processPendingQuizData(): Promise<void> {
    console.log("[QuizService] Processing pending quiz data")

    // Add a timeout promise to prevent hanging indefinitely
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Processing pending quiz data timed out"))
      }, 8000) // 8 second timeout
    })

    try {
      // Race the actual processing with the timeout
      await Promise.race([this._processPendingQuizDataInternal(), timeoutPromise])
    } catch (error) {
      console.error("[QuizService] Error processing pending quiz data:", error)
      // Clear pending data to prevent future issues
      this.clearPendingQuizData()
      // We don't rethrow to allow the UI to continue
    }
  }

  // Private method to do the actual processing
  private async _processPendingQuizDataInternal(): Promise<void> {
    // Get the pending quiz data from localStorage
    const pendingQuizData = this.getPendingQuizData()
    if (!pendingQuizData) {
      console.log("[QuizService] No pending quiz data found")
      return
    }

    console.log("[QuizService] Found pending quiz data:", pendingQuizData)

    // Clear the pending quiz data to prevent processing it multiple times
    this.clearPendingQuizData()

    // Try to get pending data
    let pendingData = null

    // Try sessionStorage first
    const sessionData = sessionStorage.getItem(STORAGE_KEYS.PENDING_DATA)
    if (sessionData) {
      try {
        pendingData = JSON.parse(sessionData)
      } catch (e) {
        console.error("Error parsing session data:", e)
      }
    }

    // Try localStorage if not in sessionStorage
    if (!pendingData) {
      const localData = localStorage.getItem(STORAGE_KEYS.PENDING_DATA)
      if (localData) {
        try {
          pendingData = JSON.parse(localData)
        } catch (e) {
          console.error("Error parsing local data:", e)
        }
      }
    }

    // If we don't have valid pending data, check for the saved quiz type
    if (!pendingData || !pendingData.quizId) {
      console.log("No valid pending quiz data found, checking for saved quiz type")

      // Try to get the saved quiz type
      const savedQuizType = localStorage.getItem("quiz_type_for_auth")
      if (savedQuizType) {
        console.log(`Found saved quiz type: ${savedQuizType}`)

        // If we have a quiz type but no pending data, create minimal pending data
        if (!pendingData) {
          pendingData = {
            type: savedQuizType as QuizType,
            // Other fields will be filled in later if needed
          }
        } else if (!pendingData.type) {
          // If we have pending data but no type, add the saved type
          pendingData.type = savedQuizType as QuizType
        }
      }

      // Check if we have a guest result that needs to be migrated
      if (this.isAuthenticated()) {
        const guestResults = this.getGuestResults()
        if (guestResults.length > 0) {
          console.log("Found guest results to migrate:", guestResults)

          // Submit each guest result to the server
          for (const result of guestResults) {
            try {
              await this.submitQuizResult({
                quizId: result.quizId,
                slug: result.slug,
                type: result.type,
                score: result.score,
                answers: result.answers,
                totalTime: result.totalTime,
                totalQuestions: result.totalQuestions,
              })

              // Mark this quiz as completed
              this.markQuizCompleted(result.quizId)

              // Save the result to local storage for immediate access
              this.saveQuizResult(result)
            } catch (e) {
              console.error("Error submitting guest result:", e)
            }
          }

          // Clear guest results after migration
          localStorage.removeItem(STORAGE_KEYS.GUEST_RESULTS)
        }
      }

      return
    }

    console.log("Found pending data:", pendingData)

    // If we have answers, save the result
    if (pendingData.answers && Array.isArray(pendingData.answers)) {
      const validAnswers = pendingData.answers.filter((a: QuizAnswer | null) => a !== null)

      if (validAnswers.length === 0) {
        console.log("No valid answers in pending data")
        this.clearPendingData()
        return
      }

      const result: QuizResult = {
        quizId: pendingData.quizId,
        slug: pendingData.slug,
        type: pendingData.type,
        score: pendingData.score || 0,
        answers: validAnswers,
        totalTime: pendingData.totalTime || 0,
        totalQuestions: pendingData.totalQuestions || pendingData.answers.length,
        completedAt: new Date().toISOString(),
      }

      // Cache the result
      this.resultCache.set(pendingData.quizId, result)

      // Mark as completed in storage
      this.markQuizCompleted(pendingData.quizId)

      // For authenticated users, save to server
      if (this.isAuthenticated()) {
        try {
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

          // Also clear any guest result for this quiz
          this.clearGuestResult(result.quizId)
        } catch (e) {
          console.error("Error submitting quiz result:", e)
        }
      } else {
        // For guest users, save to localStorage
        this.saveGuestResult(result)
      }
    } else {
      // Clear invalid pending data
      this.clearPendingData()
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

  /**
   * Add a method to detect and break redirect loops
   */
  isInRedirectLoop(): boolean {
    if (typeof window === "undefined") return false

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const authTimestamp = urlParams.get("authTimestamp")

      if (!authTimestamp) return false

      // Check if the auth timestamp is too old (more than 5 minutes)
      const timestamp = Number.parseInt(authTimestamp, 10)
      const now = Date.now()
      const fiveMinutes = 5 * 60 * 1000

      if (isNaN(timestamp) || now - timestamp > fiveMinutes) {
        console.log("Detected stale auth redirect, breaking potential loop")

        // Clean up URL parameters
        if (window.history && window.history.replaceState) {
          const url = new URL(window.location.href)
          url.searchParams.delete("authTimestamp")
          url.searchParams.delete("fromAuth")
          url.searchParams.delete("auth")
          url.searchParams.delete("session")
          window.history.replaceState({}, document.title, url.toString())
        }

        // Clear auth flow data
        this.clearAuthFlow()
        this.clearPendingData()

        return true
      }

      return false
    } catch (error) {
      console.error("Error checking for redirect loop:", error)
      return false
    }
  }

  /**
   * Cleanup after quiz completion
   */
  cleanupAfterQuizCompletion(quizId: string, type: QuizType | string): void {
    if (typeof window === "undefined") return

    try {
      // Only clear in-progress state, keep the result
      this.clearQuizState(quizId, type)
    } catch (error) {
      console.error("Error cleaning up after quiz completion:", error)
    }
  }

  /**
   * Get pending quiz data
   */
  getPendingQuizData(): any {
    if (typeof window === "undefined") return null

    try {
      const pendingData =
        localStorage.getItem(STORAGE_KEYS.PENDING_DATA) || sessionStorage.getItem(STORAGE_KEYS.PENDING_DATA)
      return pendingData ? JSON.parse(pendingData) : null
    } catch (error) {
      console.error("Error getting pending quiz data:", error)
      return null
    }
  }

  /**
   * Clear pending quiz data
   */
  clearPendingQuizData(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(STORAGE_KEYS.PENDING_DATA)
      sessionStorage.removeItem(STORAGE_KEYS.PENDING_DATA)
      console.log("[QuizService] Pending quiz data cleared")
    } catch (error) {
      console.error("Error clearing pending quiz data:", error)
    }
  }
}

// Export singleton instance
export const quizService = QuizService.getInstance()
