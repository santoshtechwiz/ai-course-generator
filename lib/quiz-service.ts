// Replace with a simplified version that only uses localStorage for guest users

import type { QuizType, QuizResult, QuizSubmission } from "@/app/types/quiz-types"
import { toast } from "@/hooks/use-toast"
import { quizApi } from "./quiz-api"

/**
 * Simplified Quiz Service
 * Handles quiz state management, storage, and API interactions
 */
class QuizService {
  private static instance: QuizService
  private authState: boolean | null = null

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

  // Initialize auth state
  private initAuthState(): void {
    if (typeof window === "undefined") return

    // Try to get cached auth state
    try {
      const cachedState = localStorage.getItem("quizAuthState")
      if (cachedState) {
        this.authState = cachedState === "true"
      }
    } catch (e) {
      console.error("Error reading cached auth state:", e)
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
        localStorage.setItem("quizAuthState", "true")
        return true
      }

      // Fallback checks
      const hasUserData = localStorage.getItem("userData") !== null
      const hasAuthState = localStorage.getItem("isAuthenticated") === "true"
      const hasAuthToken = localStorage.getItem("token") !== null

      const isAuth = hasUserData || hasAuthState || hasAuthToken

      // Update cached state
      this.authState = isAuth
      localStorage.setItem("quizAuthState", isAuth ? "true" : "false")

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
    return this.isAuthenticated() ? "authenticated" : undefined
  }

  // ===== Quiz State Management =====

  /**
   * Get quiz state from storage
   */
  getQuizState(quizId: string, type: QuizType | string): any | null {
    if (typeof window === "undefined") return null

    try {
      // Only use localStorage
      const stateKey = `quiz_state_${type}_${quizId}`
      const localData = localStorage.getItem(stateKey)

      if (localData) {
        return JSON.parse(localData)
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
  saveQuizState(state: any): void {
    if (typeof window === "undefined") return
    if (this.isAuthenticated()) return // Don't save state for authenticated users

    try {
      const stateKey = `quiz_state_${state.type}_${state.quizId}`
      localStorage.setItem(stateKey, JSON.stringify(state))
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
      const stateKey = `quiz_state_${type}_${quizId}`
      localStorage.removeItem(stateKey)
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
    if (this.isAuthenticated()) return // Don't save results for authenticated users

    try {
      const resultKey = `quiz_result_${result.quizId}`
      localStorage.setItem(
        resultKey,
        JSON.stringify({
          ...result,
          timestamp: Date.now(),
        }),
      )

      // Mark as completed
      localStorage.setItem(`quiz_${result.quizId}_completed`, "true")
    } catch (error) {
      console.error("Error saving quiz result:", error)
    }
  }

  /**
   * Get quiz result from storage
   */
  getQuizResult(quizId: string): QuizResult | null {
    if (typeof window === "undefined") return null

    try {
      // For authenticated users, don't use localStorage
      if (this.isAuthenticated()) {
        return null
      }

      const resultKey = `quiz_result_${quizId}`
      const localData = localStorage.getItem(resultKey)

      if (localData) {
        return JSON.parse(localData)
      }

      // Check for guest result
      return this.getGuestResult(quizId)
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
      return localStorage.getItem(`quiz_${quizId}_completed`) === "true"
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
      const guestKey = `guest_quiz_${result.quizId}`
      localStorage.setItem(guestKey, JSON.stringify(result))
    } catch (error) {
      console.error("Error saving guest result:", error)
    }
  }

  /**
   * Get guest result  {
      console.error("Error saving guest result:", error)
    }
  }

  /**
   * Get guest result
   */
  getGuestResult(quizId: string): QuizResult | null {
    if (typeof window === "undefined") return null

    try {
      const guestKey = `guest_quiz_${quizId}`
      const guestData = localStorage.getItem(guestKey)

      if (guestData) {
        return JSON.parse(guestData)
      }

      return null
    } catch (error) {
      console.error("Error getting guest result:", error)
      return null
    }
  }

  /**
   * Clear guest result
   */
  clearGuestResult(quizId: string): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(`guest_quiz_${quizId}`)
    } catch (error) {
      console.error("Error clearing guest result:", error)
    }
  }

  // ===== Quiz Submission =====

  /**
   * Submit quiz result to server
   */
  async submitQuizResult(submission: QuizSubmission): Promise<QuizResult | null> {
    if (!submission.quizId || !submission.slug) {
      console.error("Invalid submission: Missing quizId or slug")
      return null
    }

    try {
      // Use the quizApi service to submit the result
      const result = await quizApi.submitQuizResult(submission)

      if (result && this.isAuthenticated()) {
        // Clear guest result after successful save for authenticated users
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
    }
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
          key === "pendingQuizData" ||
          key === "inAuthFlow" ||
          key === "quizAuthRedirect"
        ) {
          localStorage.removeItem(key)
        }
      })

      console.log("Successfully cleared all quiz data")
    } catch (error) {
      console.error("Error clearing all quiz data:", error)
    }
  }

  // ===== Authentication Flow =====

  /**
   * Save auth redirect information
   */
  saveAuthRedirect(redirectUrl: string): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem("quizAuthRedirect", redirectUrl)
      localStorage.setItem("inAuthFlow", "true")
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
      return localStorage.getItem("inAuthFlow") === "true"
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
      localStorage.removeItem("quizAuthRedirect")
      localStorage.removeItem("inAuthFlow")
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
        window.location.href = redirectUrl
        return
      }

      // Check if already in auth flow to prevent loops, unless forceAuth is true
      if (this.isInAuthFlow() && !forceAuth) {
        return
      }

      // Add fromAuth parameter to the callback URL
      let callbackUrl: URL
      try {
        if (redirectUrl.startsWith("/") || redirectUrl.startsWith(window.location.origin)) {
          callbackUrl = new URL(redirectUrl, window.location.origin)
        } else {
          callbackUrl = new URL("/", window.location.origin)
        }

        callbackUrl.searchParams.set("fromAuth", "true")
      } catch (error) {
        console.error("Error creating callback URL:", error)
        callbackUrl = new URL("/", window.location.origin)
        callbackUrl.searchParams.set("fromAuth", "true")
      }

      // Save current state before redirecting
      this.savePendingQuizData()

      // Mark that we're in auth flow
      localStorage.setItem("inAuthFlow", "true")
      localStorage.setItem("quizAuthRedirect", callbackUrl.toString())

      // Redirect to sign in
      const signInUrl = `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl.toString())}`
      window.location.href = signInUrl
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
   * Manually save current quiz state as pending data
   */
  savePendingQuizData(): void {
    if (typeof window === "undefined") return

    try {
      // Get current state from localStorage
      const currentStateKey = Object.keys(localStorage).find((key) => key.startsWith("quiz_state_"))
      if (currentStateKey) {
        const currentStateData = localStorage.getItem(currentStateKey)
        if (currentStateData) {
          localStorage.setItem("pendingQuizData", currentStateData)
        }
      }
    } catch (error) {
      console.error("Error saving pending quiz data:", error)
    }
  }

  /**
   * Process pending quiz data after authentication
   */
  async processPendingQuizData(): Promise<void> {
    if (typeof window === "undefined") return

    try {
      const pendingDataStr = localStorage.getItem("pendingQuizData")
      if (!pendingDataStr) return

      const pendingData = JSON.parse(pendingDataStr)

      // Clear the pending data to prevent processing it multiple times
      localStorage.removeItem("pendingQuizData")

      // If we have a guest result, submit it to the server
      const guestResultKey = `guest_quiz_${pendingData.quizId}`
      const guestResultStr = localStorage.getItem(guestResultKey)

      if (guestResultStr && this.isAuthenticated()) {
        try {
          const guestResult = JSON.parse(guestResultStr)

          await this.submitQuizResult({
            quizId: guestResult.quizId,
            slug: guestResult.slug,
            type: guestResult.type,
            score: guestResult.score,
            answers: guestResult.answers,
            totalTime: guestResult.totalTime,
            totalQuestions: guestResult.totalQuestions,
          })

          // Clear guest result after successful submission
          localStorage.removeItem(guestResultKey)
        } catch (e) {
          console.error("Error submitting guest result:", e)
        }
      }
    } catch (error) {
      console.error("Error processing pending quiz data:", error)
    }
  }

  /**
   * Check if returning from auth
   */
  isReturningFromAuth(): boolean {
    if (typeof window === "undefined") return false

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get("fromAuth") === "true"
  }

  /**
   * Check for redirect loops
   */
  isInRedirectLoop(): boolean {
    if (typeof window === "undefined") return false

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth") === "true"
      const inAuthFlow = localStorage.getItem("inAuthFlow") === "true"

      // If we're returning from auth but still in auth flow, it might be a loop
      if (fromAuth && inAuthFlow) {
        // Clear auth flow data to break the loop
        this.clearAuthFlow()
        return true
      }

      return false
    } catch (error) {
      console.error("Error checking for redirect loop:", error)
      return false
    }
  }
}

// Export singleton instance
export const quizService = QuizService.getInstance()
