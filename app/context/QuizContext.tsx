"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/unified-auth-provider"
import { quizService, type QuizType, type QuizAnswer } from "@/lib/quiz-service"
import { quizApi } from "@/lib/quiz-api"
import { quizUtils } from "@/lib/quiz-utils"
import { toast } from "@/hooks/use-toast"

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
      }

    case "SET_ANIMATION_STATE":
      return { ...state, animationState: action.payload }

    case "SET_PROCESSING_AUTH":
      return { ...state, isProcessingAuth: action.payload }

    case "SET_QUIZ_DATA":
      return { ...state, quizData: action.payload }

    case "SET_REFRESHED":
      return { ...state, isRefreshed: action.payload }

    default:
      return state
  }
}

// -- Provider --------------------------------------------------
interface QuizProviderProps {
  children: React.ReactNode
  quizData: any
  slug: string
  /**
   * Optional callback invoked instead of default signIn when auth is required.
   */
  onAuthRequired?: (redirectUrl: string) => void
}

const QuizContext = createContext<QuizContextType | undefined>(undefined)

export const QuizProvider: React.FC<QuizProviderProps> = ({ children, quizData, slug, onAuthRequired }) => {
  const [state, dispatch] = useReducer(quizReducer, {
    ...initialState,
    quizId: quizData?.id || "",
    slug,
    title: quizData?.title || "",
    description: quizData?.description || "",
    quizType: quizData?.type || "mcq",
    questionCount: quizData?.questions?.length || 0,
    answers: new Array(quizData?.questions?.length || 0).fill(null),
    timeSpentPerQuestion: new Array(quizData?.questions?.length || 0).fill(0),
    quizData: quizData,
  })

  const { isAuthenticated, signIn } = useAuth()
  const router = useRouter()
  const [startTime] = useState(Date.now())
  const initializationDone = useRef(false)
  const completionInProgress = useRef(false)
  const authProcessingDone = useRef(false)
  const resultsCheckDone = useRef(false)
  const refreshDetected = useRef(false)

  // Detect page refresh
  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if this is a page refresh
    const isRefresh = performance.navigation ? performance.navigation.type === 1 : false

    if (isRefresh && !refreshDetected.current) {
      refreshDetected.current = true
      dispatch({ type: "SET_REFRESHED", payload: true })
      console.log("Page refresh detected")
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
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [state.isCompleted, state.quizId, state.quizType])

  // Check URL parameters for completed state
  useEffect(() => {
    if (typeof window === "undefined") return

    const urlParams = new URLSearchParams(window.location.search)
    const isCompleted = urlParams.get("completed") === "true"
    const fromAuth = urlParams.get("fromAuth") === "true"

    // If URL has completed=true, mark quiz as completed
    if (isCompleted && !state.isCompleted && !resultsCheckDone.current) {
      resultsCheckDone.current = true
      dispatch({ type: "SET_LOADING", payload: true })

      // If returning from auth, process pending data
      if (fromAuth && isAuthenticated && !authProcessingDone.current) {
        authProcessingDone.current = true
        dispatch({ type: "SET_PROCESSING_AUTH", payload: true })

        // Process pending data first
        quizService.processPendingQuizData().then(() => {
          // Then fetch quiz results
          fetchQuizResults().then((success) => {
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
          })
        })
      } else {
        // If not from auth, fetch results or mark as completed
        fetchQuizResults().then((success) => {
          if (!success) {
            dispatch({
              type: "COMPLETE_QUIZ",
              payload: {
                score: state.score || 0,
                answers: state.answers,
              },
            })
          }
          dispatch({ type: "SET_LOADING", payload: false })
        })
      }
    }
  }, [isAuthenticated, state.quizId, state.isCompleted, state.answers, state.score, state.slug])

  // Initialize quiz state and handle refresh
  useEffect(() => {
    if (initializationDone.current) return

    dispatch({ type: "SET_LOADING", payload: true })

    if (!quizData?.questions?.length) {
      dispatch({ type: "SET_ERROR", payload: "No questions available." })
      dispatch({ type: "SET_LOADING", payload: false })
      initializationDone.current = true
      return
    }

    // Check if this is a refresh and if we have a completed quiz
    const isQuizCompleted = quizService.isQuizCompleted(state.quizId)

    if (state.isRefreshed && isQuizCompleted) {
      console.log("Refresh detected with completed quiz, loading results...")

      // Try to fetch results immediately on refresh
      fetchQuizResults().then((success) => {
        if (!success) {
          console.log("Failed to load results, showing fresh quiz")
          // If we can't load results, reset to fresh quiz
          dispatch({ type: "RESET_QUIZ" })
        }
        dispatch({ type: "SET_LOADING", payload: false })
        initializationDone.current = true
      })
    } else if (state.isRefreshed) {
      // Check if we have a saved state for this quiz
      const savedState = quizService.getQuizState(state.quizId, state.quizType)

      if (savedState && !savedState.isCompleted) {
        console.log("Restoring in-progress quiz state:", savedState)

        // Restore the saved state
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
        // Check URL parameters for completed=true
        const urlParams = new URLSearchParams(window.location.search)
        const isCompleted = urlParams.get("completed") === "true"

        if (isCompleted) {
          // If URL has completed=true, try to fetch results
          fetchQuizResults()
        }
      }
    } else {
      // Normal initialization (not a refresh)
      // Check URL parameters
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search)
        const isCompleted = urlParams.get("completed") === "true"

        if (isCompleted) {
          // If URL has completed=true, try to fetch results
          fetchQuizResults()
        }
      }
    }

    dispatch({ type: "SET_LOADING", payload: false })
    initializationDone.current = true
  }, [quizData, slug, state.isRefreshed, state.quizId, state.quizType, state.questionCount])

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

  // Fetch quiz results using QuizService
  const fetchQuizResults = useCallback(async () => {
    if (!state.quizId || !state.slug) return false

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
      if (isAuthenticated) {
        try {
          console.log("Fetching results from API for:", state.quizId)
          const apiResult = await quizApi.fetchQuizResult(state.quizId, state.slug)

          if (apiResult && apiResult.answers && apiResult.answers.length > 0) {
            console.log("Found results from API:", apiResult)

            // Save the result to local storage for future use
            quizService.saveQuizResult({
              ...apiResult,
              completedAt: apiResult.completedAt || new Date().toISOString(),
            })

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
        // For guest users, check guest results
        const guestResult = quizService.getGuestResult(state.quizId)
        if (guestResult && guestResult.answers && guestResult.answers.length > 0) {
          console.log("Found guest result:", guestResult)

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
  }, [state.quizId, state.slug, isAuthenticated])

  // Add a new effect to handle the completed URL parameter more consistently
  useEffect(() => {
    if (typeof window === "undefined") return

    // Only run this once
    const urlParams = new URLSearchParams(window.location.search)
    const isCompleted = urlParams.get("completed") === "true"

    if (isCompleted && !state.isCompleted && !state.isLoading) {
      // Set a loading state to prevent flicker
      dispatch({ type: "SET_LOADING", payload: true })

      // Attempt to fetch results with a small delay to ensure auth state is ready
      setTimeout(() => {
        fetchQuizResults().then((success) => {
          if (!success && isAuthenticated) {
            // If authenticated but no results, try API again
            console.log("Retrying API fetch after delay...")
            quizApi
              .fetchQuizResult(state.quizId, state.slug)
              .then((apiResult) => {
                if (apiResult && apiResult.answers && apiResult.answers.length > 0) {
                  dispatch({
                    type: "COMPLETE_QUIZ",
                    payload: {
                      score: apiResult.score,
                      answers: apiResult.answers,
                    },
                  })
                  quizService.saveQuizResult({
                    ...apiResult,
                    completedAt: apiResult.completedAt || new Date().toISOString(),
                  })
                } else {
                  // If still no results, just mark as completed with empty state
                  dispatch({
                    type: "COMPLETE_QUIZ",
                    payload: {
                      score: 0,
                      answers: [],
                    },
                  })
                }
                dispatch({ type: "SET_LOADING", payload: false })
              })
              .catch(() => {
                dispatch({ type: "SET_LOADING", payload: false })
              })
          } else {
            dispatch({ type: "SET_LOADING", payload: false })
          }
        })
      }, 500)
    }
  }, [state.isCompleted, state.isLoading, state.quizId, state.slug, fetchQuizResults, isAuthenticated])

  // Retry loading results
  const retryLoadingResults = useCallback(async () => {
    dispatch({ type: "SET_ERROR", payload: null })
    await fetchQuizResults()
  }, [fetchQuizResults])

  // Complete quiz
  const completeQuiz = useCallback(
    (finalAnswers: (QuizAnswer | null)[], finalScore?: number) => {
      // Prevent multiple completions
      if (completionInProgress.current || state.isCompleted) return
      completionInProgress.current = true

      dispatch({ type: "SET_ANIMATION_STATE", payload: "completing" })
      const score = finalScore !== undefined ? finalScore : calculateScore(finalAnswers)
      const filled = [...finalAnswers]
      while (filled.length < state.questionCount) filled.push(null)

      setTimeout(() => {
        dispatch({ type: "COMPLETE_QUIZ", payload: { score, answers: filled } })
        dispatch({ type: "SET_ANIMATION_STATE", payload: "showing-results" })

        // Save the result using QuizService
        const validAnswers = filled.filter((a) => a !== null) as QuizAnswer[]

        // Create submission object
        const submission = {
          quizId: state.quizId,
          slug: state.slug,
          type: state.quizType,
          score,
          answers: validAnswers,
          totalTime: (Date.now() - startTime) / 1000,
          totalQuestions: state.questionCount,
        }

        // Submit to server if authenticated, otherwise save locally
        if (isAuthenticated) {
          quizService
            .submitQuizResult(submission)
            .then(() => {
              toast({
                title: "Quiz completed!",
                description: "Your results have been saved.",
              })

              // Clear in-progress state but keep the result
              quizService.clearQuizState(state.quizId, state.quizType)
            })
            .catch((error) => {
              console.error("Error submitting quiz result:", error)
              toast({
                title: "Error saving results",
                description: "There was a problem saving your results. Please try again.",
                variant: "destructive",
              })
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

          // Prompt to sign in if onAuthRequired is provided
          if (onAuthRequired) {
            setTimeout(() => {
              const redirectUrl = `/dashboard/${state.quizType}/${state.slug}?completed=true`
              onAuthRequired(redirectUrl)
            }, 1500)
          }
        }

        // Update URL to include completed=true
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href)
          url.searchParams.set("completed", "true")
          window.history.replaceState({}, document.title, url.toString())
        }

        // Reset the completion flag
        completionInProgress.current = false
      }, 800)
    },
    [state, startTime, isAuthenticated, onAuthRequired, calculateScore],
  )

  // Clear quiz data using QuizService
  const clearQuizData = useCallback(async () => {
    if (!state.quizId) return

    console.log("Clearing quiz data for:", state.quizId)

    try {
      // Use QuizService to clean up in-progress state
      // but keep the result for future reference
      quizService.clearQuizState(state.quizId, state.quizType)

      // If authenticated, also clear on server
     
    } catch (error) {
      console.error("Error clearing quiz data:", error)
    }
  }, [state.quizId, state.quizType, state.slug, isAuthenticated])

  const restartQuiz = useCallback(() => {
    // First clean up all quiz data
    clearQuizData()

    // Update URL to remove completed parameter
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.delete("completed")
      url.searchParams.delete("fromAuth")
      window.history.replaceState({}, document.title, url.toString())
    }

    dispatch({ type: "RESET_QUIZ" })
  }, [clearQuizData])

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
    if (isCompleted && fromAuth && !authProcessingDone.current && isAuthenticated) {
      authProcessingDone.current = true
      dispatch({ type: "SET_PROCESSING_AUTH", payload: true })
      dispatch({ type: "SET_LOADING", payload: true })

      console.log("Processing authentication return...")

      // Process pending data using QuizService
      quizService.processPendingQuizData().then(() => {
        // Fetch quiz results
        fetchQuizResults().then((success) => {
          if (!success) {
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
          if (window.history && window.history.replaceState) {
            const url = new URL(window.location.href)
            url.searchParams.delete("fromAuth")
            url.searchParams.delete("auth")
            url.searchParams.delete("session")
            // Keep only completed=true
            url.searchParams.set("completed", "true")
            window.history.replaceState({}, document.title, url.toString())
          }

          dispatch({ type: "SET_PROCESSING_AUTH", payload: false })
          dispatch({ type: "SET_LOADING", payload: false })
        })
      })
    }
  }, [isAuthenticated, state.quizId, state.slug, state.isCompleted, state.answers, state.score, fetchQuizResults])

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

  return (
    <QuizContext.Provider
      value={{
        state,
        isAuthenticated,
        nextQuestion,
        prevQuestion,
        submitAnswer,
        completeQuiz,
        restartQuiz,
        getTimeSpentOnCurrentQuestion,
        fetchQuizResults,
        clearQuizData,
        retryLoadingResults,
        onAuthRequired,
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

