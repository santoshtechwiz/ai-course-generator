"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/unified-auth-provider"
import { quizService, type QuizAnswer } from "@/lib/quiz-service"
import { quizApi } from "@/lib/quiz-api"
import { quizUtils } from "@/lib/quiz-utils"
import { toast } from "@/hooks/use-toast"
import type { QuizType } from "../types/quiz-types"

// -- Context State & Actions ----------------------------------
interface QuizContextState {
  quizId: string
  slug: string
  title: string
  description: string
  quizType: QuizType
  questionCount: number
  currentQuestionIndex: number
  answers: (QuizAnswer | null)[]
  isCompleted: boolean
  isLoading: boolean
  error: string | null
  score: number
  animationState: "idle" | "completing" | "showing-results" | "redirecting"
  timeSpentPerQuestion: number[]
  lastQuestionChangeTime: number
  isProcessingAuth: boolean
  isLoadingResults: boolean
  resultsReady: boolean
  quizData?: any
  isRefreshed: boolean
  requiresAuth: boolean
  hasGuestResult: boolean
  // New state properties for better feedback
  authCheckComplete: boolean
  pendingAuthRequired: boolean
  savingResults: boolean
  resultLoadError: string | null
}

type QuizAction =
  | { type: "INITIALIZE_QUIZ"; payload: Partial<QuizContextState> }
  | { type: "SET_CURRENT_QUESTION"; payload: number }
  | { type: "SET_ANSWER"; payload: { index: number; answer: QuizAnswer } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_LOADING_RESULTS"; payload: boolean }
  | { type: "SET_RESULTS_READY"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "COMPLETE_QUIZ"; payload: { score: number; answers: (QuizAnswer | null)[] } }
  | { type: "RESET_QUIZ" }
  | { type: "SET_ANIMATION_STATE"; payload: QuizContextState["animationState"] }
  | { type: "UPDATE_TIME_SPENT"; payload: { questionIndex: number; time: number } }
  | { type: "SET_PROCESSING_AUTH"; payload: boolean }
  | { type: "SET_QUIZ_DATA"; payload: any }
  | { type: "SET_REFRESHED"; payload: boolean }
  | { type: "SET_REQUIRES_AUTH"; payload: boolean }
  | { type: "SET_HAS_GUEST_RESULT"; payload: boolean }
  // New actions for better state management
  | { type: "SET_AUTH_CHECK_COMPLETE"; payload: boolean }
  | { type: "SET_PENDING_AUTH_REQUIRED"; payload: boolean }
  | { type: "SET_SAVING_RESULTS"; payload: boolean }
  | { type: "SET_RESULT_LOAD_ERROR"; payload: string | null }
  | { type: "CLEAR_GUEST_RESULTS" }

interface QuizContextType {
  state: QuizContextState
  isAuthenticated: boolean
  nextQuestion: () => void
  prevQuestion: () => void
  submitAnswer: (answer: string, timeSpent: number, isCorrect: boolean) => void
  completeQuiz: (finalAnswers: (QuizAnswer | null)[], finalScore?: number) => void
  restartQuiz: () => void
  getTimeSpentOnCurrentQuestion: () => number
  fetchQuizResults: () => Promise<boolean>
  clearQuizData: () => Promise<void>
  retryLoadingResults: () => Promise<void>
  /**
   * Called when a user action requires authentication.
   * If provided, will be invoked with the post-login redirect URL.
   * Otherwise, defaults to internal signIn flow.
   */
  onAuthRequired?: (redirectUrl: string) => void
  handleAuthenticationRequired: () => void
  clearGuestResults: () => void
}

// -- Initial State --------------------------------------------
const initialState: QuizContextState = {
  quizId: "",
  slug: "",
  title: "",
  description: "",
  quizType: "mcq",
  questionCount: 0,
  currentQuestionIndex: 0,
  answers: [],
  isCompleted: false,
  isLoading: true,
  isLoadingResults: false,
  resultsReady: false,
  error: null,
  score: 0,
  animationState: "idle",
  timeSpentPerQuestion: [],
  lastQuestionChangeTime: Date.now(),
  isProcessingAuth: false,
  quizData: null,
  isRefreshed: false,
  requiresAuth: false,
  hasGuestResult: false,
  // New state properties with initial values
  authCheckComplete: false,
  pendingAuthRequired: false,
  savingResults: false,
  resultLoadError: null,
}

// -- Reducer --------------------------------------------------
const quizReducer = (state: QuizContextState, action: QuizAction): QuizContextState => {
  switch (action.type) {
    case "INITIALIZE_QUIZ":
      return { ...state, ...action.payload }

    case "SET_CURRENT_QUESTION": {
      const elapsed = Date.now() - state.lastQuestionChangeTime
      const times = [...state.timeSpentPerQuestion]
      times[state.currentQuestionIndex] = (times[state.currentQuestionIndex] || 0) + elapsed
      return {
        ...state,
        currentQuestionIndex: action.payload,
        timeSpentPerQuestion: times,
        lastQuestionChangeTime: Date.now(),
      }
    }

    case "SET_ANSWER": {
      const answers = [...state.answers]
      answers[action.payload.index] = action.payload.answer
      return { ...state, answers }
    }

    case "SET_LOADING":
      return { ...state, isLoading: action.payload }

    case "SET_LOADING_RESULTS":
      return { ...state, isLoadingResults: action.payload }

    case "SET_RESULTS_READY":
      return { ...state, resultsReady: action.payload }

    case "SET_ERROR":
      return { ...state, error: action.payload }

    case "UPDATE_TIME_SPENT": {
      const times = [...state.timeSpentPerQuestion]
      times[action.payload.questionIndex] = (times[action.payload.questionIndex] || 0) + action.payload.time
      return { ...state, timeSpentPerQuestion: times }
    }

    case "COMPLETE_QUIZ": {
      // If already completed, don't update again to prevent loops
      if (state.isCompleted) return state

      const elapsed = Date.now() - state.lastQuestionChangeTime
      const times = [...state.timeSpentPerQuestion]
      times[state.currentQuestionIndex] = (times[state.currentQuestionIndex] || 0) + elapsed
      return {
        ...state,
        isCompleted: true,
        score: action.payload.score,
        answers: action.payload.answers,
        timeSpentPerQuestion: times,
        animationState: "showing-results",
        resultsReady: true,
      }
    }

    case "RESET_QUIZ":
      return {
        ...state,
        currentQuestionIndex: 0,
        answers: new Array(state.questionCount).fill(null),
        isCompleted: false,
        score: 0,
        error: null,
        timeSpentPerQuestion: new Array(state.questionCount).fill(0),
        lastQuestionChangeTime: Date.now(),
        animationState: "idle",
        resultsReady: false,
        isRefreshed: false,
        requiresAuth: false,
        hasGuestResult: false,
      }

    case "SET_ANIMATION_STATE":
      return { ...state, animationState: action.payload }

    case "SET_PROCESSING_AUTH":
      return { ...state, isProcessingAuth: action.payload }

    case "SET_QUIZ_DATA":
      return { ...state, quizData: action.payload }

    case "SET_REFRESHED":
      return { ...state, isRefreshed: action.payload }

    case "SET_REQUIRES_AUTH":
      return { ...state, requiresAuth: action.payload }

    case "SET_HAS_GUEST_RESULT":
      return { ...state, hasGuestResult: action.payload }

    case "SET_AUTH_CHECK_COMPLETE":
      return { ...state, authCheckComplete: action.payload }

    case "SET_PENDING_AUTH_REQUIRED":
      return { ...state, pendingAuthRequired: action.payload }

    case "SET_SAVING_RESULTS":
      return { ...state, savingResults: action.payload }

    case "SET_RESULT_LOAD_ERROR":
      return { ...state, resultLoadError: action.payload }

    case "CLEAR_GUEST_RESULTS":
      return {
        ...initialState,
        quizId: state.quizId,
        slug: state.slug,
        quizType: state.quizType,
        questionCount: state.questionCount,
        quizData: state.quizData,
        authCheckComplete: true,
        answers: new Array(state.questionCount).fill(null),
        timeSpentPerQuestion: new Array(state.questionCount).fill(0),
      }

    default:
      return state
  }
}

// -- Provider --------------------------------------------------
interface QuizProviderProps {
  children: React.ReactNode
  quizData: any
  slug: string
  quizType: QuizType
  /**
   * Optional callback invoked instead of default signIn when auth is required.
   */
  onAuthRequired?: (redirectUrl: string) => void
}

const QuizContext = createContext<QuizContextType | undefined>(undefined)

// Update QuizProvider to use useAuth instead of any useSession references
export const QuizProvider: React.FC<QuizProviderProps> = ({ children, quizData, slug, quizType, onAuthRequired }) => {
  const [state, dispatch] = useReducer(quizReducer, {
    ...initialState,
    quizId: quizData?.id || "",
    slug,
    title: quizData?.title || "",
    description: quizData?.description || "",
    quizType: quizData?.quizType || quizType,
    questionCount: quizData?.questions?.length || 0,
    answers: new Array(quizData?.questions?.length || 0).fill(null),
    timeSpentPerQuestion: new Array(quizData?.questions?.length || 0).fill(0),
    quizData: quizData,
  })

  const { signIn, isAuthenticated: authIsAuthenticated } = useAuth()
  const router = useRouter()
  const [startTime] = useState(Date.now())
  const initializationDone = useRef(false)
  const completionInProgress = useRef(false)
  const authProcessingDone = useRef(false)
  const resultsCheckDone = useRef(false)
  const refreshDetected = useRef(false)
  const authCheckDone = useRef(false)
  const [isLoading, setIsLoading] = useState(true)

  // Declare the missing variables
  let animationTimeout: NodeJS.Timeout
  let authRedirectTimeout: NodeJS.Timeout

  // Helper function to clean up URL parameters
  const cleanupUrlIfNeeded = useCallback(() => {
    if (typeof window === "undefined") return

    // Clean up all URL parameters if we have any
    if (window.location.search && window.history && window.history.replaceState) {
      // Remove all URL parameters for a cleaner experience
      const url = new URL(window.location.href)
      url.search = ""
      window.history.replaceState({}, document.title, url.toString())
      console.log("URL cleaned up - removed all parameters")
    }
  }, [])

  // Add a clearGuestResults function to clear guest results
  const clearGuestResultsAction = useCallback(() => {
    // Clear any guest results for this quiz
    if (state.quizId) {
      quizService.clearGuestResult(state.quizId)
    }

    // Reset the quiz state
    dispatch({ type: "CLEAR_GUEST_RESULTS" })

    console.log("Cleared guest results and reset quiz state")
  }, [state.quizId])

  // Fix the handleAuthenticationRequired method to properly save state before redirecting
  const handleAuthenticationRequired = useCallback(() => {
    console.log("handleAuthenticationRequired called")

    // If user is already authenticated, don't redirect to sign-in
    if (authIsAuthenticated) {
      console.log("User is already authenticated, no need to redirect to sign-in")
      return
    }

    // Check if we're already in an auth flow to prevent loops
    const isInAuthFlow = quizService.isInAuthFlow()
    console.log("isInAuthFlow:", isInAuthFlow)

    if (isInAuthFlow) {
      console.log("Already in auth flow, preventing potential redirect loop")
      toast({
        title: "Authentication in progress",
        description: "Please complete the sign-in process or refresh the page to try again.",
        variant: "default",
      })
      return
    }

    // Create redirect URL with the correct quiz type
    const redirectUrl = `/dashboard/${state.quizType}/${state.slug}?completed=true`
    console.log("Created redirectUrl:", redirectUrl)

    try {
      // Save current state before redirecting - do this first
      console.log("Saving pending quiz data")
      quizService.savePendingQuizData()

      // Set auth flow state to prevent loops - ALWAYS call this before any auth action
      console.log("Saving auth redirect to:", redirectUrl)
      quizService.saveAuthRedirect(redirectUrl)

      if (!onAuthRequired) {
        console.log("No onAuthRequired handler provided, using fallback")
        // Fallback to direct sign-in if available
        if (typeof signIn === "function") {
          // Call signIn directly
          console.log("Calling signIn with redirectUrl:", redirectUrl)
          signIn("credentials", { callbackUrl: redirectUrl })
          return
        }

        // If no signIn function is available, try using quizService with force=true
        try {
          console.log("Using quizService.handleAuthRedirect as fallback")
          quizService.handleAuthRedirect(redirectUrl, true) // Changed to true to bypass loop detection
          return
        } catch (error) {
          console.error("Error during fallback auth redirect:", error)
          toast({
            title: "Authentication error",
            description: "There was a problem signing you in. Please try again.",
            variant: "destructive",
          })
        }

        return
      }

      // Call the provided auth handler
      console.log("Calling provided onAuthRequired with redirectUrl:", redirectUrl)
      onAuthRequired(redirectUrl)
    } catch (error) {
      console.error("Error in handleAuthenticationRequired:", error)
      toast({
        title: "Authentication error",
        description: "There was a problem with the authentication process. Please try again.",
        variant: "destructive",
      })
    }
  }, [onAuthRequired, state.quizType, state.slug, signIn, state, authIsAuthenticated])

  // Detect page refresh
  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if this is a page refresh - use a more reliable method
    const isRefresh =
      window.performance &&
      (window.performance.navigation?.type === 1 ||
        window.performance.getEntriesByType("navigation").some((nav) => (nav as any).type === "reload"))

    if (isRefresh && !refreshDetected.current) {
      refreshDetected.current = true
      dispatch({ type: "SET_REFRESHED", payload: true })
      console.log("Page refresh detected")

      // Clean up URL if needed on refresh
      cleanupUrlIfNeeded()
    }

    // Add event listener for beforeunload to detect refresh
    const handleBeforeUnload = () => {
      // If quiz is completed, we can clear temporary state
      if (state.isCompleted) {
        // Keep the result but clear the in-progress state
        quizService.clearQuizState(state.quizId, state.quizType)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    // Proper cleanup function
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      // Additional cleanup if component unmounts
      if (state.isCompleted && state.quizId) {
        quizService.clearQuizState(state.quizId, state.quizType)
      }
    }
  }, [state.isCompleted, state.quizId, state.quizType, cleanupUrlIfNeeded])

  // Initial auth check effect - runs once on mount
  useEffect(() => {
    if (typeof window === "undefined" || authCheckDone.current) return

    let isMounted = true
    const performAuthCheck = async () => {
      try {
        // Always mark auth check as complete to avoid getting stuck
        if (isMounted) {
          dispatch({ type: "SET_AUTH_CHECK_COMPLETE", payload: true })
        }

        // Force a fresh check of authentication status
        const isCurrentlyAuthenticated = quizService.isAuthenticated()

        console.log("Auth check result:", {
          authIsAuthenticated,
          serviceCheck: isCurrentlyAuthenticated,
        })

        // If we're authenticated, clean up the URL
        if (authIsAuthenticated) {
          cleanupUrlIfNeeded()

          // Check if we need to process any pending data
          const urlParams = new URLSearchParams(window.location.search)
          const fromAuth = urlParams.get("fromAuth") === "true"

          if (fromAuth) {
            console.log("Processing pending data after authentication")
            dispatch({ type: "SET_PROCESSING_AUTH", payload: true })

            try {
              await quizService.processPendingQuizData()
              // Clean up URL after processing
              cleanupUrlIfNeeded()
            } catch (error) {
              console.error("Error processing pending data:", error)
              toast({
                title: "Error processing data",
                description: "There was a problem loading your quiz data. Please try again.",
                variant: "destructive",
              })
            } finally {
              if (isMounted) {
                dispatch({ type: "SET_PROCESSING_AUTH", payload: false })
              }
            }
          }
        } else if (!authIsAuthenticated && isCurrentlyAuthenticated) {
          // There's a mismatch between auth states - clear any stale data
          console.warn("Auth state mismatch detected, clearing stale data")
          quizService.clearAuthFlow()
        }

        // Check if there's a guest result for this quiz
        const hasGuestResult = !!quizService.getGuestResult(state.quizId)
        if (isMounted) {
          dispatch({ type: "SET_HAS_GUEST_RESULT", payload: hasGuestResult })
        }
      } finally {
        // Mark as done to prevent multiple runs
        authCheckDone.current = true
      }
    }

    performAuthCheck()

    return () => {
      isMounted = false
    }
  }, [authIsAuthenticated, cleanupUrlIfNeeded, state.quizId])

  // Fetch quiz results using QuizService
  const fetchQuizResults = useCallback(async () => {
    if (!state.quizId || !state.slug || state.isLoadingResults) return false

    dispatch({ type: "SET_LOADING_RESULTS", payload: true })
    dispatch({ type: "SET_ERROR", payload: null })

    try {
      console.log("Fetching quiz results for:", state.quizId)

      // Use QuizService to fetch results
      const result = quizService.getQuizResult(state.quizId)

      if (result && result.answers && result.answers.length > 0) {
        console.log("Found quiz result in local storage:", result)

        // Update state with the result
        dispatch({
          type: "COMPLETE_QUIZ",
          payload: {
            score: result.score,
            answers: result.answers || [],
          },
        })

        dispatch({ type: "SET_RESULTS_READY", payload: true })
        dispatch({ type: "SET_LOADING_RESULTS", payload: false })
        return true
      }

      // If authenticated, try to fetch from API
      if (authIsAuthenticated) {
        try {
          console.log("User is authenticated, fetching results from API for:", state.quizId)
          const apiResult = await quizApi.fetchQuizResult(state.quizId, state.slug)

          if (apiResult && apiResult.answers && apiResult.answers.length > 0) {
            console.log("Found results from API:", apiResult)

            // Save the result to local storage for future use
            quizService.saveQuizResult({
              ...apiResult,
              completedAt: apiResult.completedAt || new Date().toISOString(),
            })

            // Clear guest result after successful fetch for authenticated users
            quizService.clearGuestResult(state.quizId)
            quizService.clearQuizState(state.quizId, state.quizType)

            dispatch({
              type: "COMPLETE_QUIZ",
              payload: {
                score: apiResult.score,
                answers: apiResult.answers,
              },
            })

            dispatch({ type: "SET_RESULTS_READY", payload: true })
            dispatch({ type: "SET_LOADING_RESULTS", payload: false })
            return true
          } else {
            console.log("No results found in API")
            dispatch({ type: "SET_ERROR", payload: "No saved results found." })
          }
        } catch (apiError) {
          console.error("Error fetching results from API:", apiError)
          dispatch({ type: "SET_ERROR", payload: "Failed to fetch results from server." })
        }
      } else {
        console.log("User is not authenticated, checking for guest results")
        // For guest users, check guest results
        const guestResult = quizService.getGuestResult(state.quizId)
        if (guestResult && guestResult.answers && guestResult.answers.length > 0) {
          console.log("Found guest result:", guestResult)

          // Mark that we have a guest result
          dispatch({ type: "SET_HAS_GUEST_RESULT", payload: true })

          // For MCQ and blanks quizzes, require authentication to see results
          if (state.quizType === "mcq" || state.quizType === "blanks") {
            console.log("Authentication required to view results for this quiz type")
            dispatch({ type: "SET_REQUIRES_AUTH", payload: true })
            dispatch({ type: "SET_LOADING_RESULTS", payload: false })
            return false
          }

          // For other quiz types, show guest results
          dispatch({
            type: "COMPLETE_QUIZ",
            payload: {
              score: guestResult.score,
              answers: guestResult.answers,
            },
          })

          dispatch({ type: "SET_RESULTS_READY", payload: true })
          dispatch({ type: "SET_LOADING_RESULTS", payload: false })
          return true
        }
      }

      console.log("No saved results found")
      dispatch({ type: "SET_LOADING_RESULTS", payload: false })
      return false
    } catch (error) {
      console.error("Error fetching quiz results:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch quiz results. Please try again." })
      dispatch({ type: "SET_LOADING_RESULTS", payload: false })
      return false
    }
  }, [state.quizId, state.slug, state.quizType, state.isLoadingResults, authIsAuthenticated])

  // Check storage for completed state
  useEffect(() => {
    if (typeof window === "undefined" || resultsCheckDone.current) return

    const isCompletedInStorage =
      localStorage.getItem(`quiz_${state.quizId}_completed`) === "true" ||
      sessionStorage.getItem(`quiz_${state.quizId}_completed`) === "true"

    const urlParams = new URLSearchParams(window.location.search)
    const fromAuth = urlParams.get("fromAuth") === "true"

    // If storage indicates completion, mark quiz as completed
    if (isCompletedInStorage && !state.isCompleted) {
      resultsCheckDone.current = true
      dispatch({ type: "SET_LOADING", payload: true })

      // If returning from auth, process pending data
      if (fromAuth && authIsAuthenticated && !authProcessingDone.current) {
        authProcessingDone.current = true
        dispatch({ type: "SET_PROCESSING_AUTH", payload: true })
        dispatch({ type: "SET_LOADING", payload: true })

        // Process pending data first
        quizService
          .processPendingQuizData()
          .then(() => {
            // Then fetch quiz results
            return fetchQuizResults()
          })
          .then((success) => {
            if (!success) {
              // If no result, just mark as completed with current state
              dispatch({
                type: "COMPLETE_QUIZ",
                payload: {
                  score: state.score || 0,
                  answers: state.answers,
                },
              })
            }
            dispatch({ type: "SET_PROCESSING_AUTH", payload: false })
            dispatch({ type: "SET_LOADING", payload: false })

            // Clean up URL after processing
            cleanupUrlIfNeeded()
          })
          .catch((error) => {
            console.error("Error processing auth data:", error)
            dispatch({ type: "SET_PROCESSING_AUTH", payload: false })
            dispatch({ type: "SET_LOADING", payload: false })
          })
      } else {
        // If not from auth, fetch results or mark as completed
        fetchQuizResults()
          .then((success) => {
            if (!success && !state.requiresAuth) {
              // Only mark as completed if authenticated or we have guest results for non-restricted quiz types
              if (
                authIsAuthenticated ||
                (quizService.getGuestResult(state.quizId) && state.quizType !== "mcq" && state.quizType !== "blanks")
              ) {
                dispatch({
                  type: "COMPLETE_QUIZ",
                  payload: {
                    score: state.score || 0,
                    answers: state.answers,
                  },
                })
              }
            }
            dispatch({ type: "SET_LOADING", payload: false })
          })
          .catch((error) => {
            console.error("Error fetching quiz results:", error)
            dispatch({ type: "SET_LOADING", payload: false })
          })
      }
    }
  }, [
    authIsAuthenticated,
    state.quizId,
    state.answers,
    state.score,
    state.isCompleted,
    state.slug,
    state.quizType,
    state.requiresAuth,
    cleanupUrlIfNeeded,
    fetchQuizResults,
  ])

  // Initialize quiz state and handle refresh
  const initializeQuiz = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })

      // Set a timeout to prevent getting stuck in loading state
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Quiz initialization timed out"))
        }, 10000) // 10 second timeout
      })

      // Race the actual initialization with the timeout
      await Promise.race([
        (async () => {
          // Original initialization code here
          if (!quizData?.questions?.length) {
            dispatch({ type: "SET_ERROR", payload: "No questions available." })
            dispatch({ type: "SET_LOADING", payload: false }) // Ensure loading is stopped
            initializationDone.current = true
            return
          }

          const isQuizCompleted = quizService.isQuizCompleted(state.quizId)

          if (state.isRefreshed && isQuizCompleted) {
            fetchQuizResults().then((success) => {
              if (!success && !state.requiresAuth) {
                dispatch({ type: "RESET_QUIZ" })
              }
              dispatch({ type: "SET_LOADING", payload: false }) // Ensure loading is stopped
              initializationDone.current = true
            })
          } else if (state.isRefreshed) {
            const savedState = quizService.getQuizState(state.quizId, state.quizType)

            if (savedState && !savedState.isCompleted) {
              dispatch({
                type: "INITIALIZE_QUIZ",
                payload: {
                  currentQuestionIndex: savedState.currentQuestion,
                  answers: savedState.answers || new Array(state.questionCount).fill(null),
                  timeSpentPerQuestion: savedState.timeSpentPerQuestion || new Array(state.questionCount).fill(0),
                  lastQuestionChangeTime: Date.now(),
                },
              })
            } else {
              const isCompletedInStorage =
                localStorage.getItem(`quiz_${state.quizId}_completed`) === "true" ||
                sessionStorage.getItem(`quiz_${state.quizId}_completed`) === "true"

              if (isCompletedInStorage) {
                fetchQuizResults()
              }
            }
          } else {
            const isCompletedInStorage =
              localStorage.getItem(`quiz_${state.quizId}_completed`) === "true" ||
              sessionStorage.getItem(`quiz_${state.quizId}_completed`) === "true"

            if (isCompletedInStorage) {
              fetchQuizResults()
            }
          }
        })(),
        timeoutPromise,
      ])
    } catch (error) {
      console.error("[QuizContext] Error initializing quiz:", error)
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to initialize quiz",
      })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [
    quizData,
    slug,
    state.isRefreshed,
    state.quizId,
    state.quizType,
    state.questionCount,
    state.requiresAuth,
    fetchQuizResults,
  ])

  // Calculate score
  const calculateScore = useCallback(
    (answers: (QuizAnswer | null)[]) => {
      const valid = answers.filter((a) => a !== null) as QuizAnswer[]
      if (!valid.length) return 0

      // Use quizUtils for score calculation
      return quizUtils.calculateScore(valid, state.quizType)
    },
    [state.quizType],
  )

  // Navigation
  const nextQuestion = useCallback(() => {
    if (state.currentQuestionIndex < state.questionCount - 1) {
      dispatch({ type: "SET_CURRENT_QUESTION", payload: state.currentQuestionIndex + 1 })

      // Save current state to storage
      const currentState = {
        quizId: state.quizId,
        type: state.quizType,
        slug: state.slug,
        currentQuestion: state.currentQuestionIndex + 1,
        totalQuestions: state.questionCount,
        startTime: startTime,
        isCompleted: false,
        answers: state.answers,
        timeSpentPerQuestion: state.timeSpentPerQuestion,
      }
      quizService.saveQuizState(currentState)
    }
  }, [
    state.currentQuestionIndex,
    state.questionCount,
    state.quizId,
    state.quizType,
    state.slug,
    state.answers,
    state.timeSpentPerQuestion,
    startTime,
  ])

  const prevQuestion = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      dispatch({ type: "SET_CURRENT_QUESTION", payload: state.currentQuestionIndex - 1 })

      // Save current state to storage
      const currentState = {
        quizId: state.quizId,
        type: state.quizType,
        slug: state.slug,
        currentQuestion: state.currentQuestionIndex - 1,
        totalQuestions: state.questionCount,
        startTime: startTime,
        isCompleted: false,
        answers: state.answers,
        timeSpentPerQuestion: state.timeSpentPerQuestion,
      }
      quizService.saveQuizState(currentState)
    }
  }, [
    state.currentQuestionIndex,
    state.quizId,
    state.quizType,
    state.slug,
    state.questionCount,
    state.answers,
    state.timeSpentPerQuestion,
    startTime,
  ])

  const submitAnswer = useCallback(
    (answer: string, timeSpent: number, isCorrect: boolean) => {
      const answerObj = { answer, timeSpent, isCorrect }

      dispatch({
        type: "SET_ANSWER",
        payload: { index: state.currentQuestionIndex, answer: answerObj },
      })

      // Save current state with the new answer
      const updatedAnswers = [...state.answers]
      updatedAnswers[state.currentQuestionIndex] = answerObj

      const currentState = {
        quizId: state.quizId,
        type: state.quizType,
        slug: state.slug,
        currentQuestion: state.currentQuestionIndex,
        totalQuestions: state.questionCount,
        startTime: startTime,
        isCompleted: false,
        answers: updatedAnswers,
        timeSpentPerQuestion: state.timeSpentPerQuestion,
      }
      quizService.saveQuizState(currentState)

      if (state.currentQuestionIndex < state.questionCount - 1) {
        setTimeout(nextQuestion, 500)
      }
    },
    [
      state.currentQuestionIndex,
      state.questionCount,
      state.quizId,
      state.quizType,
      state.slug,
      state.answers,
      state.timeSpentPerQuestion,
      startTime,
      nextQuestion,
    ],
  )

  // Retry loading results
  const retryLoadingResults = useCallback(async () => {
    dispatch({ type: "SET_ERROR", payload: null })
    await fetchQuizResults()
  }, [fetchQuizResults])

  // Fix the completeQuiz function to properly save guest results
  const handleCompleteQuiz = useCallback(
    (finalAnswers: (QuizAnswer | null)[], finalScore?: number) => {
      // Prevent multiple completions
      if (completionInProgress.current || state.isCompleted) {
        console.log("[QuizContext] Quiz completion already in progress or completed, ignoring duplicate call")
        return
      }

      // Validate input parameters
      if (!finalAnswers || !Array.isArray(finalAnswers)) {
        console.error("[QuizContext] Invalid finalAnswers provided:", finalAnswers)
        toast({
          title: "Error completing quiz",
          description: "Invalid quiz data. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Check if we have any non-null answers
      const validAnswerCount = finalAnswers.filter((a) => a !== null).length
      if (validAnswerCount === 0) {
        console.error("[QuizContext] No valid answers to submit")
        toast({
          title: "Cannot complete quiz",
          description: "No answers were provided. Please answer at least one question.",
          variant: "destructive",
        })
        return
      }

      completionInProgress.current = true
      console.log("[QuizContext] Starting quiz completion process")

      try {
        dispatch({ type: "SET_ANIMATION_STATE", payload: "completing" })
        const score = finalScore !== undefined ? finalScore : calculateScore(finalAnswers)
        const filled = [...finalAnswers]
        while (filled.length < state.questionCount) filled.push(null)

        animationTimeout = setTimeout(() => {
          try {
            // Batch state updates to reduce renders
            dispatch({
              type: "COMPLETE_QUIZ",
              payload: { score, answers: filled },
            })

            // Save the result using QuizService
            const validAnswers = filled.filter((a) => a !== null) as QuizAnswer[]

            // Create submission object
            const submission = {
              quizId: state.quizId || "",
              slug: state.slug || "",
              type: state.quizType,
              score,
              answers: validAnswers,
              totalTime: (Date.now() - startTime) / 1000,
              totalQuestions: state.questionCount,
            }

            // Validate submission before proceeding
            if (!submission.quizId || !submission.slug || !submission.answers || !submission.answers.length) {
              console.error("[QuizContext] Invalid submission data:", submission)
              toast({
                title: "Error completing quiz",
                description: "Missing required quiz data. Please try again or contact support.",
                variant: "destructive",
              })
              completionInProgress.current = false
              return
            }

            // Submit to server if authenticated, otherwise save locally
            if (authIsAuthenticated) {
              // Set saving state only once
              if (!state.savingResults) {
                dispatch({ type: "SET_SAVING_RESULTS", payload: true })
              }

              // Use a local flag to track if this specific save operation is still relevant
              let isSaving = true

              console.log("[QuizContext] User is authenticated, submitting quiz result to server")
              // Make sure we're actually calling submitQuizResult for authenticated users
              quizService
                .submitQuizResult(submission)
                .then(() => {
                  // Only show toast if this save operation is still relevant
                  if (isSaving) {
                    toast({
                      title: "Quiz completed!",
                      description: "Your results have been saved.",
                    })
                  }

                  // Clear in-progress state but keep the result
                  quizService.clearQuizState(state.quizId, state.quizType)

                  // Only update state if this save operation is still relevant
                  if (isSaving) {
                    dispatch({ type: "SET_SAVING_RESULTS", payload: false })
                  }
                })
                .catch((error) => {
                  console.error("[QuizContext] Error submitting quiz result:", error)

                  // Only show toast if this save operation is still relevant
                  if (isSaving) {
                    toast({
                      title: "Error saving results",
                      description: error instanceof Error ? error.message : "An unexpected error occurred",
                      variant: "destructive",
                    })
                    dispatch({ type: "SET_SAVING_RESULTS", payload: false })
                  }
                })
                .finally(() => {
                  // Always reset the completion flag when the promise resolves or rejects
                  completionInProgress.current = false

                  // Mark this save operation as no longer relevant
                  isSaving = false
                })
            } else {
              // Save locally for guest users
              quizService.saveQuizResult({
                ...submission,
                completedAt: new Date().toISOString(),
              })

              // Also save as guest result
              quizService.saveGuestResult({
                ...submission,
                completedAt: new Date().toISOString(),
              })

              // Mark that we have a guest result
              dispatch({ type: "SET_HAS_GUEST_RESULT", payload: true })

              // For MCQ and blanks quizzes, require authentication to see results
              // BUT ONLY if the user is not already authenticated
              if ((state.quizType === "mcq" || state.quizType === "blanks") && !authIsAuthenticated) {
                dispatch({ type: "SET_REQUIRES_AUTH", payload: true })
                dispatch({ type: "SET_PENDING_AUTH_REQUIRED", payload: true })

                // Prompt to sign in if onAuthRequired is provided
                if (onAuthRequired) {
                  authRedirectTimeout = setTimeout(() => {
                    const redirectUrl = `/dashboard/${state.quizType}/${state.slug}`
                    onAuthRequired(redirectUrl)
                  }, 1500)
                }
              } else {
                // User is already authenticated or this is a quiz type that doesn't require auth
                // Mark results as ready to view immediately
                dispatch({ type: "SET_RESULTS_READY", payload: true })
              }

              // Reset the completion flag for guest users
              completionInProgress.current = false
            }

            // Mark quiz as completed in storage instead of URL
            if (typeof window !== "undefined") {
              localStorage.setItem(`quiz_${state.quizId}_completed`, "true")
              sessionStorage.setItem(`quiz_${state.quizId}_completed`, "true")
            }
          } catch (innerError) {
            console.error("[QuizContext] Error in quiz completion process:", innerError)
            // Reset the completion flag on error
            completionInProgress.current = false

            // Show error toast
            toast({
              title: "Error completing quiz",
              description: "There was a problem completing your quiz. Please try again.",
              variant: "destructive",
            })
          }
        }, 800)
      } catch (outerError) {
        console.error("[QuizContext] Error initiating quiz completion:", outerError)
        // Reset the completion flag on error
        completionInProgress.current = false

        // Show error toast
        toast({
          title: "Error completing quiz",
          description: "There was a problem completing your quiz. Please try again.",
          variant: "destructive",
        })
      }

      // Return a cleanup function that can be called if the component unmounts
      return () => {
        if (animationTimeout) clearTimeout(animationTimeout)
        if (authRedirectTimeout) clearTimeout(authRedirectTimeout)
        completionInProgress.current = false
      }
    },
    [
      state.quizId,
      state.slug,
      state.quizType,
      state.questionCount,
      state.isCompleted,
      state.savingResults,
      authIsAuthenticated,
      onAuthRequired,
      calculateScore,
      startTime,
    ],
  )

  // Clear quiz data using QuizService
  const clearQuizData = useCallback(async () => {
    if (!state.quizId) return

    console.log("Clearing quiz data for:", state.quizId)

    try {
      // Use QuizService to clean up in-progress state
      // but keep the result for future reference
      quizService.clearQuizState(state.quizId, state.quizType)
    } catch (error) {
      console.error("Error clearing quiz data:", error)
    }
  }, [state.quizId, state.quizType])

  const restartQuiz = useCallback(() => {
    // First clean up all quiz data
    clearQuizData()

    // Clear completion state from storage
    if (typeof window !== "undefined") {
      localStorage.removeItem(`quiz_${state.quizId}_completed`)
      sessionStorage.removeItem(`quiz_${state.quizId}_completed`)

      // Clean up URL if needed
      cleanupUrlIfNeeded()
    }

    dispatch({ type: "RESET_QUIZ" })
  }, [clearQuizData, state.quizId, cleanupUrlIfNeeded])

  const getTimeSpentOnCurrentQuestion = useCallback(
    () => state.timeSpentPerQuestion[state.currentQuestionIndex] || 0,
    [state],
  )

  // Handle returning from authentication
  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if we're returning from authentication with completed=true
    const urlParams = new URLSearchParams(window.location.search)
    const isCompleted = urlParams.get("completed") === "true"
    const fromAuth = urlParams.get("fromAuth") === "true"

    // If returning from auth, process once and clean up
    if (fromAuth && !authProcessingDone.current && authIsAuthenticated) {
      authProcessingDone.current = true
      dispatch({ type: "SET_PROCESSING_AUTH", payload: true })
      dispatch({ type: "SET_LOADING", payload: true })

      console.log("Processing authentication return...")

      // Process pending data using QuizService
      quizService.processPendingQuizData().then(() => {
        // Fetch quiz results
        fetchQuizResults().then((success) => {
          if (!success && !state.requiresAuth) {
            console.log("No quiz result found, using current state")
            // If no result found, use current state
            dispatch({
              type: "COMPLETE_QUIZ",
              payload: {
                score: state.score || 0,
                answers: state.answers,
              },
            })
          }

          // Clean up URL parameters to prevent redirect loops
          cleanupUrlIfNeeded()

          dispatch({ type: "SET_PROCESSING_AUTH", payload: false })
          dispatch({ type: "SET_LOADING", payload: false })
        })
      })
    }
  }, [
    authIsAuthenticated,
    state.quizId,
    state.slug,
    state.answers,
    state.score,
    state.requiresAuth,
    fetchQuizResults,
    cleanupUrlIfNeeded,
  ])

  // Add a cleanup effect when the component unmounts
  useEffect(() => {
    return () => {
      // Clean up when component unmounts if the quiz is completed
      if (state.isCompleted && state.quizId) {
        // Only clear in-progress state, keep the result
        quizService.clearQuizState(state.quizId, state.quizType)
      }
    }
  }, [state.isCompleted, state.quizId, state.quizType])

  // Add a safety timeout to ensure initialization completes
  useEffect(() => {
    // Safety timeout to ensure we don't get stuck in loading state
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("Safety timeout triggered - forcing loading to complete")
        dispatch({ type: "SET_LOADING", payload: false })
        dispatch({ type: "SET_AUTH_CHECK_COMPLETE", payload: true })
      }
    }, 5000)

    return () => clearTimeout(safetyTimeout)
  }, [isLoading])

  // Add a timeout to prevent getting stuck in auth processing state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (state.isProcessingAuth) {
      console.log("[QuizContext] Auth processing started, setting safety timeout")
      timeoutId = setTimeout(() => {
        console.log("[QuizContext] Auth processing timeout reached, forcing state update")
        dispatch({ type: "SET_PROCESSING_AUTH", payload: false })

        // Provide feedback to user
        toast({
          title: "Processing timed out",
          description: "It's taking longer than expected to load your quiz data. Please refresh the page to try again.",
          variant: "destructive",
        })
      }, 12000) // 12 second timeout (slightly longer than component timeouts)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [state.isProcessingAuth])

  // Add a clearGuestResults function to clear guest results

  return (
    <QuizContext.Provider
      value={{
        state,
        isAuthenticated: authIsAuthenticated,
        nextQuestion,
        prevQuestion,
        submitAnswer,
        completeQuiz: handleCompleteQuiz,
        restartQuiz,
        getTimeSpentOnCurrentQuestion,
        fetchQuizResults,
        clearQuizData,
        retryLoadingResults,
        onAuthRequired,
        handleAuthenticationRequired,
        clearGuestResults: clearGuestResultsAction,
      }}
    >
      {children}
    </QuizContext.Provider>
  )
}

export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext)
  if (!context) throw new Error("useQuiz must be used within a QuizProvider")
  return context
}
