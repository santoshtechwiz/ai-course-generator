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
  slug?: string
}

// Dummy implementations for getMcqQuestions and getQuiz
// Replace these with your actual implementations
async function getMcqQuestions(slug: string): Promise<any> {
  // Implement your logic to fetch MCQ questions based on the slug
  return Promise.resolve({ questions: [], type: "mcq" })
}

async function getQuiz(slug: string): Promise<any> {
  // Implement your logic to fetch quiz data based on the slug
  return Promise.resolve({ questions: [], type: "quiz" })
}

class QuizService {
  private static instance: QuizService
  private authRedirectInProgress = false
  private processingPendingData = false
  private quizResultCache: Map<string, QuizResult> = new Map()

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

  // Check if user is authenticated - aligned with UnifiedAuthProvider
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false

    try {
      // Check multiple sources to determine authentication status
      // 1. Check for auth session token
      const hasSessionToken =
        sessionStorage.getItem("next-auth.session-token") || localStorage.getItem("next-auth.session-token")

      // 2. Check for user data in localStorage (some auth providers store this)
      const hasUserData = localStorage.getItem("userData") !== null

      // 3. Check for our own auth markers
      const hasAuthMarker =
        sessionStorage.getItem("isAuthenticated") === "true" || localStorage.getItem("isAuthenticated") === "true"

      return !!(hasSessionToken || hasUserData || hasAuthMarker)
    } catch (error) {
      console.error("Error checking authentication status:", error)
      // Default to not authenticated on error
      return false
    }
  }

  // Get the current user ID - aligned with UnifiedAuthProvider
  getCurrentUserId(): string | undefined {
    if (typeof window === "undefined") return undefined

    const session = this.getAuthSession()
    return session?.user?.id
  }

  // Get auth session from storage - same approach as UnifiedAuthProvider
  private getAuthSession(): any {
    if (typeof window === "undefined") return null

    try {
      // Check sessionStorage first (where next-auth stores session data)
      const sessionData =
        sessionStorage.getItem("next-auth.session-token") || localStorage.getItem("next-auth.session-token")

      if (!sessionData) return null

      // For client-side checks, we just need to know if a session exists
      // The actual session data is handled by next-auth
      return { user: { id: "authenticated" } }
    } catch (error) {
      console.error("Error getting auth session:", error)
      return null
    }
  }

  saveQuizState(state: QuizState): void {
    // Only save state for guest users
    if (this.isAuthenticated()) return

    quizStorageService.saveQuizState(state)
  }

  getQuizState(quizId: string, quizType: QuizType): QuizState | null {
    // For authenticated users, try to get state from server first
    if (this.isAuthenticated()) {
      // Try to get from server (implementation would depend on your API)
      // For now, return null to indicate no local state
      return null
    }

    return quizStorageService.getQuizState(quizId, quizType)
  }

  clearQuizState(quizId: string, quizType: QuizType): void {
    quizStorageService.clearQuizState(quizId, quizType)

    // Also clear from localStorage directly to ensure it's gone
    if (typeof window !== "undefined") {
      localStorage.removeItem(`quiz_state_${quizId}`)
      localStorage.removeItem(`guest_quiz_${quizId}`)
      localStorage.removeItem(`quiz_${quizId}_saved`)

      // Clear session storage items
      sessionStorage.removeItem(`quiz_result_${quizId}_pending`)
      sessionStorage.removeItem("showQuizResults")
      sessionStorage.removeItem("quizRedirectPath")
      sessionStorage.removeItem("pendingQuizData")
      sessionStorage.removeItem("inAuthFlow")
      sessionStorage.removeItem("quizAuthData")
      sessionStorage.removeItem("quizReturnUrl")

      // Remove URL parameters if present
      if (window.location.search.includes("completed=true")) {
        const url = new URL(window.location.href)
        url.searchParams.delete("completed")
        url.searchParams.delete("session")
        window.history.replaceState({}, document.title, url.toString())
      }
    }
  }

  saveQuizResult(result: QuizResultType): void {
    // For authenticated users, don't save to local storage
    if (this.isAuthenticated()) return

    quizStorageService.saveQuizResult(result)
  }

  isQuizCompleted(quizId: string): boolean {
    return quizStorageService.isQuizCompleted(quizId)
  }

  saveGuestResult(result: QuizResultType): void {
    // Only save guest results for non-authenticated users
    if (this.isAuthenticated()) return

    quizStorageService.saveGuestResult(result)
  }

  getGuestResult(quizId: string): QuizResultType | null {
    // Authenticated users don't have guest results
    if (this.isAuthenticated()) return null

    return quizStorageService.getGuestResult(quizId)
  }

  clearGuestResult(quizId: string, quizType: QuizType): void {
    quizStorageService.clearGuestResult(quizId, quizType)

    // Also clear from localStorage directly to ensure it's gone
    if (typeof window !== "undefined") {
      localStorage.removeItem(`guest_quiz_${quizId}`)

      // Clear any related state
      localStorage.removeItem(`quiz_state_${quizId}`)

      // Remove URL parameters if present
      if (window.location.search.includes("completed=true")) {
        const url = new URL(window.location.href)
        url.searchParams.delete("completed")
        window.history.replaceState({}, document.title, url.toString())
      }
    }
  }

  clearAllQuizData(): void {
    if (typeof window !== "undefined") {
      // Clear all quiz-related localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith("quiz_") || key.startsWith("guest_quiz_") || key.includes("_quiz_"))) {
          localStorage.removeItem(key)
        }
      }

      // Clear all quiz-related sessionStorage items
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.startsWith("quiz_") || key.includes("Quiz") || key.includes("Auth"))) {
          sessionStorage.removeItem(key)
        }
      }
    }

    // Call the storage service method after our own cleanup
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

    // For authenticated users, always try to save to server
    const isAuthenticated = this.isAuthenticated()
    const userId = this.getCurrentUserId()

    // Check if we've already saved this result
    if (
      typeof window !== "undefined" &&
      localStorage.getItem(`quiz_${submission.quizId}_saved`) === "true" &&
      !isAuthenticated
    ) {
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
      userId: userId, // Add user ID if authenticated
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

        // Also cache in the quiz result cache
        this.quizResultCache.set(submission.quizId, {
          ...result,
          quizId: submission.quizId,
          slug: submission.slug,
          type: submission.type,
        })

        // Mark as saved in localStorage to prevent duplicate submissions
        if (typeof window !== "undefined") {
          localStorage.setItem(`quiz_${submission.quizId}_saved`, "true")

          // Clear any guest results for this quiz after successful save
          const guestResultKey = `guest_quiz_${submission.quizId}`
          if (localStorage.getItem(guestResultKey)) {
            console.log("Clearing guest result after successful save")
            localStorage.removeItem(guestResultKey)
          }

          // Clear any auth flow markers
          sessionStorage.removeItem("showQuizResults")
          sessionStorage.removeItem("quizRedirectPath")
          sessionStorage.removeItem("pendingQuizData")
          sessionStorage.removeItem("inAuthFlow")
          sessionStorage.removeItem("quizAuthData")
          sessionStorage.removeItem("quizReturnUrl")
          sessionStorage.removeItem(`quiz_result_${submission.quizId}_pending`)

          // For authenticated users, clear all local storage related to this quiz
          if (isAuthenticated) {
            this.clearQuizState(submission.quizId, submission.type)
          }
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
   * Get quiz result from the server or cache
   */
  public getQuizResult(quizId: string, slug?: string): QuizResult | null {
    // Check our internal cache first
    if (this.quizResultCache.has(quizId)) {
      return this.quizResultCache.get(quizId) || null
    }

    // If not in cache, check localStorage for guest users
    if (!this.isAuthenticated() && typeof window !== "undefined") {
      try {
        const guestResult = this.getGuestResult(quizId)
        if (guestResult) {
          return guestResult as QuizResult
        }
      } catch (e) {
        console.error("Error getting guest result:", e)
      }
    }

    return null
  }

  /**
   * Fetch quiz result from the server
   */
  public async fetchQuizResult(quizId: string, slug: string): Promise<QuizResultType | null> {
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

      // Also cache in the quiz result cache
      this.quizResultCache.set(quizId, {
        ...result,
        quizId,
        slug,
      })

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

      // Clear from quiz result cache
      this.quizResultCache.delete(quizId)

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
      this.quizResultCache.clear()
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

    // Ensure all answers are valid objects
    formattedAnswers = formattedAnswers.map((answer) => {
      if (!answer) {
        return {
          answer: "",
          timeSpent: 0,
          isCorrect: false,
          similarity: 0,
          hintsUsed: false,
        }
      }
      return answer
    })

    // For fill-in-the-blanks quizzes
    if (submission.type === "blanks") {
      formattedAnswers = formattedAnswers.map((answer) => ({
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
      formattedAnswers = formattedAnswers.map((answer) => ({
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

  // Enhanced saveQuizResult method to ensure complete data is saved
  saveCompleteQuizResult = async (result: QuizResult) => {
    if (!result.quizId) return

    // Prevent recursive calls
    if (this.processingPendingData) return

    // Ensure we have valid answers before saving
    const validAnswers = result.answers.map((answer) => {
      // If answer is null, create a default answer object
      if (!answer) {
        return { answer: "", timeSpent: 0, isCorrect: false }
      }
      return answer
    })

    // Create a complete result with valid answers
    const completeResult = {
      ...result,
      answers: validAnswers,
    }

    // Cache the result
    this.quizResultCache.set(result.quizId, completeResult)

    // Check authentication status
    const isAuthenticated = this.isAuthenticated()

    // Always save to localStorage for recovery purposes
    quizStorageService.saveQuizResult(completeResult)

    // If authenticated, save to server
    if (isAuthenticated) {
      try {
        const response = await fetch(`/api/quiz/${result.slug}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizId: result.quizId,
            slug: result.slug,
            answers: validAnswers,
            totalTime: result.totalTime,
            score: result.score,
            type: result.type,
            totalQuestions: validAnswers.length,
            completedAt: new Date().toISOString(),
            userId: this.getCurrentUserId(),
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to save quiz result: ${response.status}`)
        }

        // Mark as saved to server and clear local storage
        if (typeof window !== "undefined") {
          localStorage.setItem(`quiz_${result.quizId}_saved`, "true")

          // Clear guest result since it's now saved to server
          this.clearGuestResult(result.quizId, result.type as QuizType)

          // Clear quiz state after successful save to server
          this.clearQuizState(result.quizId, result.type as QuizType)

          // Clear any auth flow markers
          this.clearAllStorage()
        }

        // Show success toast
        toast({
          title: "Quiz results saved",
          description: "Your quiz results have been saved successfully.",
        })
      } catch (error) {
        console.error("Error saving quiz result to server:", error)

        // Show error toast
        toast({
          title: "Error saving results",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        })
      }
    }
  }

  // Add a method to save auth redirect information
  saveAuthRedirect(redirectUrl: string): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem("quizAuthRedirect", redirectUrl)
      localStorage.setItem("inAuthFlow", "true")
    } catch (error) {
      console.error("Error saving auth redirect:", error)
    }
  }

  // Check if we're in an auth flow
  isInAuthFlow(): boolean {
    if (typeof window === "undefined") return false

    try {
      return localStorage.getItem("inAuthFlow") === "true"
    } catch (error) {
      console.error("Error checking auth flow:", error)
      return false
    }
  }

  // Get the auth redirect URL
  getAuthRedirect(): string | null {
    if (typeof window === "undefined") return null

    try {
      return localStorage.getItem("quizAuthRedirect")
    } catch (error) {
      console.error("Error getting auth redirect:", error)
      return null
    }
  }

  // Clear auth flow data
  clearAuthFlow(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem("quizAuthRedirect")
      localStorage.removeItem("inAuthFlow")
    } catch (error) {
      console.error("Error clearing auth flow:", error)
    }
  }

  // Handle auth redirect in a generic way
  handleAuthRedirect(redirectUrl: string): void {
    if (typeof window === "undefined") return

    // Prevent multiple redirects
    if (this.authRedirectInProgress) return
    this.authRedirectInProgress = true

    try {
      // Save the redirect URL
      this.saveAuthRedirect(redirectUrl)

      // Save current quiz state before redirecting
      this.savePendingQuizData()

      // Add fromAuth parameter to the callback URL
      const callbackUrl = new URL(redirectUrl, window.location.origin)
      callbackUrl.searchParams.set("fromAuth", "true")

      // Redirect to sign in
      window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl.toString())}`
    } catch (error) {
      console.error("Error handling auth redirect:", error)
      this.authRedirectInProgress = false
    }
  }

  // Get the correct redirect path for a quiz
  getQuizRedirectPath(quizId: string, quizType: QuizType, slug: string): string {
    return `/dashboard/${quizType}/${slug}?completed=true`
  }

  // Check if returning from auth
  isReturningFromAuth(): boolean {
    if (typeof window === "undefined") return false

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const isCompleted = urlParams.get("completed") === "true"
      const fromAuth = urlParams.get("fromAuth") === "true"

      // If URL explicitly has fromAuth=true, we're returning from auth
      if (fromAuth) {
        console.log("Detected fromAuth=true in URL")
        return true
      }

      // Check for other indicators of returning from auth
      const hasAuthParam = urlParams.has("auth") || urlParams.has("session")

      // Check if we have pending quiz data or are in auth flow
      const hasPendingData =
        sessionStorage.getItem("pendingQuizData") !== null ||
        localStorage.getItem("pendingQuizData") !== null ||
        localStorage.getItem("quizAuthRedirect") !== null

      const inAuthFlow =
        sessionStorage.getItem("inAuthFlow") === "true" || localStorage.getItem("inAuthFlow") === "true"

      // Consider it returning from auth if:
      // 1. URL has completed=true AND (has auth param OR we have pending data OR we're in auth flow)
      // 2. We're authenticated and have pending data
      const isReturning =
        (isCompleted && (hasAuthParam || hasPendingData || inAuthFlow)) || (this.isAuthenticated() && hasPendingData)

      if (isReturning) {
        console.log("Detected returning from auth:", {
          isCompleted,
          hasAuthParam,
          hasPendingData,
          inAuthFlow,
          isAuthenticated: this.isAuthenticated(),
        })
      }

      return isReturning
    } catch (error) {
      console.error("Error checking if returning from auth:", error)
      return false
    }
  }

  // Check if should show guest sign-in
  shouldShowGuestSignIn(quizId: string): boolean {
    if (typeof window === "undefined") return false

    try {
      // Never show guest sign-in if authenticated
      if (this.isAuthenticated()) {
        console.log("User is authenticated, not showing guest sign-in")
        return false
      }

      // Never show guest sign-in if returning from auth
      if (this.isReturningFromAuth()) {
        console.log("Returning from auth, not showing guest sign-in")
        return false
      }

      // Never show guest sign-in if URL has completed=true
      const isCompleted = new URLSearchParams(window.location.search).get("completed") === "true"
      if (isCompleted) {
        console.log("URL has completed=true, not showing guest sign-in")
        return false
      }

      // Check if quiz is completed or in progress
      const isQuizCompleted = this.isQuizCompleted(quizId)
      const hasQuizState = localStorage.getItem(`quiz_state_${quizId}`) !== null

      // For debugging
      console.log("Guest sign-in check:", {
        quizId,
        isQuizCompleted,
        hasQuizState,
        isAuthenticated: this.isAuthenticated(),
      })

      // Show guest sign-in if:
      // 1. Quiz is completed but user is not authenticated, OR
      // 2. Quiz has state (in progress) but user is not authenticated
      return (isQuizCompleted || hasQuizState) && !this.isAuthenticated()
    } catch (error) {
      console.error("Error checking if should show guest sign-in:", error)
      return false
    }
  }

  // Save pending quiz data before authentication
  savePendingQuizData(data?: any): void {
    if (typeof window === "undefined") return

    try {
      // If data is provided, use it
      if (data) {
        const pendingData = JSON.stringify(data)
        // Save to both localStorage and sessionStorage for redundancy
        localStorage.setItem("pendingQuizData", pendingData)
        sessionStorage.setItem("pendingQuizData", pendingData)
        return
      }

      // Otherwise, get the current quiz state from localStorage
      const quizState = localStorage.getItem("currentQuizState")
      if (quizState) {
        // Save to both localStorage and sessionStorage for redundancy
        localStorage.setItem("pendingQuizData", quizState)
        sessionStorage.setItem("pendingQuizData", quizState)
      }
    } catch (error) {
      console.error("Error saving pending quiz data:", error)
    }
  }

  // Process pending quiz data after authentication
  async processPendingQuizData(): Promise<void> {
    if (typeof window === "undefined") return

    // Prevent recursive calls
    if (this.processingPendingData) return
    this.processingPendingData = true

    try {
      console.log("Processing pending quiz data")

      // Check if we've already processed this auth session
      const browserFingerprint = sessionStorage.getItem("auth_processing_fingerprint")
      const processedFingerprints = sessionStorage.getItem("processed_fingerprints")

      if (browserFingerprint && processedFingerprints && processedFingerprints.includes(browserFingerprint)) {
        console.log("Already processed this authentication session")
        this.processingPendingData = false
        return
      }

      // Mark that we've processed auth
      sessionStorage.setItem("auth_processed", "true")
      sessionStorage.setItem("auth_processed_time", Date.now().toString())

      // Add this fingerprint to processed list
      if (browserFingerprint) {
        const fingerprints = processedFingerprints ? JSON.parse(processedFingerprints) : []
        fingerprints.push(browserFingerprint)
        sessionStorage.setItem("processed_fingerprints", JSON.stringify(fingerprints))
      }

      // Try to get pending data from multiple sources
      let pendingData

      // Try multiple storage locations for better cross-browser support
      const sources = [
        () => {
          const data = sessionStorage.getItem("pendingQuizData")
          return data ? JSON.parse(data) : null
        },
        () => {
          const data = localStorage.getItem("pendingQuizData")
          return data ? JSON.parse(data) : null
        },
        () => {
          // Try to parse from URL parameters as a fallback
          const urlParams = new URLSearchParams(window.location.search)
          const quizId = urlParams.get("quizId")
          const slug = urlParams.get("slug")
          const type = urlParams.get("type")
          const score = urlParams.get("score")

          if (quizId && slug && type) {
            return {
              quizId,
              slug,
              type,
              score: score ? Number.parseInt(score, 10) : 0,
            }
          }
          return null
        },
      ]

      // Try each source until we find valid data
      for (const getSource of sources) {
        try {
          const data = getSource()
          if (data && data.quizId) {
            pendingData = data
            console.log("Found pending data:", data)
            break
          }
        } catch (e) {
          console.error("Error parsing source:", e)
        }
      }

      if (!pendingData || !pendingData.quizId) {
        console.log("No pending quiz data found")
        this.processingPendingData = false
        return // No pending data found
      }

      // If we have answers directly in the pending data, use them
      if (pendingData.answers && Array.isArray(pendingData.answers)) {
        console.log("Using answers from pending data")

        // Cache the result first so it's immediately available
        this.quizResultCache.set(pendingData.quizId, {
          quizId: pendingData.quizId,
          slug: pendingData.slug,
          type: pendingData.type as QuizType,
          score: pendingData.score,
          answers: pendingData.answers,
          totalTime: pendingData.totalTime || 0,
          totalQuestions: pendingData.totalQuestions || pendingData.answers.length,
          isCompleted: true,
        })

        // Save to server now that we're authenticated
        if (this.isAuthenticated()) {
          await this.saveCompleteQuizResult({
            quizId: pendingData.quizId,
            slug: pendingData.slug,
            type: pendingData.type as QuizType,
            score: pendingData.score,
            answers: pendingData.answers,
            totalTime: pendingData.totalTime || 0,
            totalQuestions: pendingData.totalQuestions || pendingData.answers.length,
          })
        } else {
          // For guest users, make sure the result is available in localStorage
          quizStorageService.saveGuestResult({
            quizId: pendingData.quizId,
            slug: pendingData.slug,
            type: pendingData.type as QuizType,
            score: pendingData.score,
            answers: pendingData.answers,
            totalTime: pendingData.totalTime || 0,
            totalQuestions: pendingData.totalQuestions || pendingData.answers.length,
            timestamp: Date.now(),
            isCompleted: true,
            redirectPath: `/dashboard/${pendingData.type}/${pendingData.slug}?completed=true`,
          })
        }
      } else {
        console.log("No answers in pending data, trying to get quiz state")

        // Try to get the saved quiz state
        let quizState = null

        // Try localStorage first
        try {
          const stateKey = `quiz_state_${pendingData.quizId}`
          const rawState = localStorage.getItem(stateKey)
          if (rawState) {
            quizState = JSON.parse(rawState)
            console.log("Found quiz state in localStorage:", quizState)
          }
        } catch (e) {
          console.error("Error getting quiz state from localStorage:", e)
        }

        // If no state in localStorage, try sessionStorage
        if (!quizState) {
          try {
            const stateKey = `quiz_state_${pendingData.quizId}`
            const rawState = sessionStorage.getItem(stateKey)
            if (rawState) {
              quizState = JSON.parse(rawState)
              console.log("Found quiz state in sessionStorage:", quizState)
            }
          } catch (e) {
            console.error("Error getting quiz state from sessionStorage:", e)
          }
        }

        if (quizState && quizState.answers) {
          console.log("Using answers from quiz state")

          // Cache the result
          this.quizResultCache.set(pendingData.quizId, {
            quizId: pendingData.quizId,
            slug: pendingData.slug,
            type: pendingData.type as QuizType,
            score: pendingData.score || quizState.score || 0,
            answers: quizState.answers,
            totalTime: pendingData.totalTime || 0,
            totalQuestions: pendingData.totalQuestions || quizState.answers.length,
            isCompleted: true,
          })

          // Save to server if authenticated
          if (this.isAuthenticated()) {
            await this.saveCompleteQuizResult({
              quizId: pendingData.quizId,
              slug: pendingData.slug,
              type: pendingData.type as QuizType,
              score: pendingData.score || quizState.score || 0,
              answers: quizState.answers,
              totalTime: pendingData.totalTime || 0,
              totalQuestions: pendingData.totalQuestions || quizState.answers.length,
            })
          } else {
            // For guest users, make sure the result is available in localStorage
            quizStorageService.saveGuestResult({
              quizId: pendingData.quizId,
              slug: pendingData.slug,
              type: pendingData.type as QuizType,
              score: pendingData.score || quizState.score || 0,
              answers: quizState.answers,
              totalTime: pendingData.totalTime || 0,
              totalQuestions: pendingData.totalQuestions || quizState.answers.length,
              timestamp: Date.now(),
              isCompleted: true,
              redirectPath: `/dashboard/${pendingData.type}/${pendingData.slug}?completed=true`,
            })
          }
        } else {
          console.log("No quiz state found for pending data")
        }
      }

      // Don't clear storage immediately for guest users to ensure data is available
      if (this.isAuthenticated()) {
        // Clear all storage after saving to database for authenticated users
        this.clearAllStorage()
      }
    } catch (error) {
      console.error("Error processing pending quiz data:", error)
    } finally {
      this.processingPendingData = false
    }
  }

  // Add a missing method to clear all storage
  clearAllStorage(): void {
    if (typeof window === "undefined") return

    try {
      // Clear specific items related to quiz auth flow
      sessionStorage.removeItem("showQuizResults")
      sessionStorage.removeItem("quizRedirectPath")
      sessionStorage.removeItem("pendingQuizData")
      sessionStorage.removeItem("inAuthFlow")
      sessionStorage.removeItem("quizAuthData")
      sessionStorage.removeItem("quizReturnUrl")

      localStorage.removeItem("pendingQuizData")
      localStorage.removeItem("quizAuthRedirect")
      localStorage.removeItem("inAuthFlow")

      // Don't clear quiz results for guest users
      // This ensures they can still see their results
    } catch (error) {
      console.error("Error clearing storage:", error)
    }
  }

  // Complete reset after authentication
  completeAuthReset(): void {
    if (typeof window === "undefined") return

    try {
      // Clear all storage
      this.clearAllStorage()

      // Clean up URL parameters
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href)
        // Remove all auth-related parameters
        url.searchParams.delete("fromAuth")
        url.searchParams.delete("auth")
        url.searchParams.delete("session")
        url.searchParams.delete("quizId")
        url.searchParams.delete("slug")
        url.searchParams.delete("type")
        url.searchParams.delete("score")
        url.searchParams.delete("browser")
        // Keep only completed=true
        url.searchParams.set("completed", "true")
        window.history.replaceState({}, document.title, url.toString())
      }

      // Set a flag to prevent further processing
      sessionStorage.setItem("auth_reset_complete", "true")
      sessionStorage.setItem("auth_reset_time", Date.now().toString())
    } catch (error) {
      console.error("Error during complete auth reset:", error)
    }
  }
}

export const quizService = QuizService.getInstance()
