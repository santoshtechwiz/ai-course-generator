"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/unified-auth-provider"
import { quizService } from "@/lib/QuizService"

// -- Quiz Types ------------------------------------------------
export type QuizType = "mcq" | "blanks" | "openended" | "code" | "flashcard"

export interface QuizAnswer {
  answer: string
  timeSpent: number
  isCorrect: boolean
  hintsUsed?: boolean
  similarity?: number
}

export interface QuizResult {
  quizId: string
  slug: string
  quizType: QuizType
  score: number
  answers: (QuizAnswer | null)[]
  totalTime: number
  timestamp: number
  isCompleted: boolean
  redirectPath: string
  timeSpentPerQuestion: number[]
}

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
}

type QuizAction =
  | { type: "INITIALIZE_QUIZ"; payload: Partial<QuizContextState> }
  | { type: "SET_CURRENT_QUESTION"; payload: number }
  | { type: "SET_ANSWER"; payload: { index: number; answer: QuizAnswer } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "COMPLETE_QUIZ"; payload: { score: number; answers: (QuizAnswer | null)[] } }
  | { type: "RESET_QUIZ" }
  | { type: "SET_ANIMATION_STATE"; payload: QuizContextState["animationState"] }
  | { type: "UPDATE_TIME_SPENT"; payload: { questionIndex: number; time: number } }
  | { type: "SET_PROCESSING_AUTH"; payload: boolean }

interface QuizContextType {
  state: QuizContextState
  isAuthenticated: boolean
  nextQuestion: () => void
  prevQuestion: () => void
  submitAnswer: (answer: string, timeSpent: number, isCorrect: boolean) => void
  completeQuiz: (finalAnswers: (QuizAnswer | null)[]) => void
  restartQuiz: () => void
  getTimeSpentOnCurrentQuestion: () => number
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
  error: null,
  score: 0,
  animationState: "idle",
  timeSpentPerQuestion: [],
  lastQuestionChangeTime: Date.now(),
  isProcessingAuth: false,
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
      }

    case "SET_ANIMATION_STATE":
      return { ...state, animationState: action.payload }

    case "SET_PROCESSING_AUTH":
      return { ...state, isProcessingAuth: action.payload }

    default:
      return state
  }
}

// -- Storage Helpers ------------------------------------------
const saveToStorage = (key: string, data: any, hours = 24) => {
  if (typeof window === "undefined") return
  try {
    const item = { value: data, expiry: Date.now() + hours * 3600 * 1000 }
    localStorage.setItem(key, JSON.stringify(item))
  } catch {
    // ignore
  }
}

const getFromStorage = (key: string) => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { value, expiry } = JSON.parse(raw)
    if (expiry && Date.now() > expiry) {
      localStorage.removeItem(key)
      return null
    }
    return value
  } catch {
    return null
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
  })

  const { isAuthenticated, signIn } = useAuth()
  const router = useRouter()
  const [startTime] = useState(Date.now())
  const initializationDone = useRef(false)
  const completionInProgress = useRef(false)
  const authProcessingDone = useRef(false)

  // Check URL parameters for completed state
  useEffect(() => {
    if (typeof window === "undefined") return

    const urlParams = new URLSearchParams(window.location.search)
    const isCompleted = urlParams.get("completed") === "true"
    const fromAuth = urlParams.get("fromAuth") === "true"

    // If URL has completed=true, mark quiz as completed
    if (isCompleted && !state.isCompleted) {
      // If returning from auth, process pending data
      if (fromAuth && isAuthenticated && !authProcessingDone.current) {
        authProcessingDone.current = true
        dispatch({ type: "SET_PROCESSING_AUTH", payload: true })

        // Process pending data and then update state
        quizService.processPendingQuizData().then(() => {
          // Get the score from the service
          const result = quizService.getQuizResult(state.quizId)

          if (result) {
            // Update state with the result
            dispatch({
              type: "COMPLETE_QUIZ",
              payload: {
                score: result.score,
                answers: result.answers || [],
              },
            })
          } else {
            // If no result, just mark as completed
            dispatch({
              type: "COMPLETE_QUIZ",
              payload: {
                score: 0,
                answers: state.answers,
              },
            })
          }

          dispatch({ type: "SET_PROCESSING_AUTH", payload: false })
        })
      } else if (!fromAuth) {
        // If not from auth, just mark as completed
        dispatch({
          type: "COMPLETE_QUIZ",
          payload: {
            score: state.score || 0,
            answers: state.answers,
          },
        })
      }
    }
  }, [isAuthenticated, state.quizId, state.isCompleted, state.answers, state.score])

  // Initialize quiz state
  useEffect(() => {
    if (initializationDone.current) return

    dispatch({ type: "SET_LOADING", payload: true })
    if (!quizData?.questions?.length) {
      dispatch({ type: "SET_ERROR", payload: "No questions available." })
    } else {
      // Check URL parameters
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search)
        const isCompleted = urlParams.get("completed") === "true"

        if (isCompleted) {
          // If URL has completed=true, don't load from storage
          // The quiz will be marked as completed in the other effect
        } else {
          // Only load from storage if not completed
          const savedState = quizService.getQuizState(state.quizId, state.quizType)
          if (savedState) {
            dispatch({ type: "INITIALIZE_QUIZ", payload: savedState })
          }
        }
      }
    }
    dispatch({ type: "SET_LOADING", payload: false })
    initializationDone.current = true
  }, [quizData, slug, state.quizId, state.quizType])

  // Add this after the useEffect that initializes the quiz state
  useEffect(() => {
    // Check if we should show the guest sign-in prompt
    if (typeof window !== "undefined" && !isAuthenticated && !state.isCompleted) {
      const quizId = state.quizId
      if (quizId) {
        // Log the state for debugging
        console.log("Checking guest sign-in state:", {
          quizId,
          isCompleted: state.isCompleted,
          isAuthenticated,
          shouldShow: quizService.shouldShowGuestSignIn(quizId),
        })
      }
    }
  }, [state.quizId, state.isCompleted, isAuthenticated])

  // Auto-save progress
  useEffect(() => {
    if (!state.isCompleted && !state.isProcessingAuth) {
      quizService.saveQuizState({
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
        isCompleted: state.isCompleted,
        score: state.score,
        redirectPath: `/dashboard/${state.quizType}/${state.slug}?completed=true`,
        timeSpentPerQuestion: state.timeSpentPerQuestion,
      })
    }
  }, [
    state.answers,
    state.currentQuestionIndex,
    state.timeSpentPerQuestion,
    state.quizId,
    state.quizType,
    state.slug,
    state.isCompleted,
    state.score,
    state.isProcessingAuth,
  ])

  // Calculate score
  const calculateScore = (answers: (QuizAnswer | null)[]) => {
    const valid = answers.filter((a) => a !== null)
    if (!valid.length) return 0
    const correct = valid.filter((a) => a!.isCorrect).length
    return Math.round((correct / valid.length) * 100)
  }

  // Navigation
  const nextQuestion = useCallback(() => {
    if (state.currentQuestionIndex < state.questionCount - 1) {
      dispatch({ type: "SET_CURRENT_QUESTION", payload: state.currentQuestionIndex + 1 })
    }
  }, [state.currentQuestionIndex, state.questionCount])

  const prevQuestion = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      dispatch({ type: "SET_CURRENT_QUESTION", payload: state.currentQuestionIndex - 1 })
    }
  }, [state.currentQuestionIndex])

  const submitAnswer = useCallback(
    (answer: string, timeSpent: number, isCorrect: boolean) => {
      dispatch({
        type: "SET_ANSWER",
        payload: { index: state.currentQuestionIndex, answer: { answer, timeSpent, isCorrect } },
      })
      if (state.currentQuestionIndex < state.questionCount - 1) {
        setTimeout(nextQuestion, 500)
      }
    },
    [state.currentQuestionIndex, state.questionCount, nextQuestion],
  )

  // Complete quiz
  const completeQuiz = useCallback(
    (finalAnswers: (QuizAnswer | null)[]) => {
      // Prevent multiple completions
      if (completionInProgress.current || state.isCompleted) return
      completionInProgress.current = true

      dispatch({ type: "SET_ANIMATION_STATE", payload: "completing" })
      const score = calculateScore(finalAnswers)
      const filled = [...finalAnswers]
      while (filled.length < state.questionCount) filled.push(null)

      const result: QuizResult = {
        quizId: state.quizId,
        slug: state.slug,
        quizType: state.quizType,
        score,
        answers: filled,
        totalTime: (Date.now() - startTime) / 1000,
        timestamp: Date.now(),
        isCompleted: true,
        redirectPath: `/dashboard/${state.quizType}/${state.slug}?completed=true`,
        timeSpentPerQuestion: state.timeSpentPerQuestion,
      }

      setTimeout(() => {
        dispatch({ type: "COMPLETE_QUIZ", payload: { score, answers: filled } })
        dispatch({ type: "SET_ANIMATION_STATE", payload: "showing-results" })

        // Save the result using the service
        quizService.saveCompleteQuizResult({
          quizId: state.quizId,
          slug: state.slug,
          type: state.quizType,
          score,
          answers: filled,
          totalTime: (Date.now() - startTime) / 1000,
          totalQuestions: state.questionCount,
        })

        // Handle authentication if needed
        if (!isAuthenticated) {
          const redirectUrl = `/dashboard/${state.quizType}/${state.slug}?completed=true`

          // Save the quiz result to local storage before redirecting
          quizService.saveGuestResult({
            quizId: state.quizId,
            slug: state.slug,
            type: state.quizType,
            score,
            answers: filled,
            totalTime: (Date.now() - startTime) / 1000,
            timestamp: Date.now(),
            isCompleted: true,
            redirectPath: redirectUrl,
            timeSpentPerQuestion: state.timeSpentPerQuestion,
          })

          // Save current quiz state for retrieval after auth
          quizService.savePendingQuizData({
            quizId: state.quizId,
            slug: state.slug,
            type: state.quizType,
            score,
            totalTime: (Date.now() - startTime) / 1000,
            totalQuestions: state.questionCount,
            answers: filled,
          })

          // Add fromAuth parameter to the callback URL
          const callbackUrl = `${redirectUrl}&fromAuth=true`

          if (onAuthRequired) {
            onAuthRequired(callbackUrl)
          } else {
            signIn({ callbackUrl })
          }
        } else {
          // For authenticated users, save directly to server
          quizService.saveCompleteQuizResult({
            quizId: state.quizId,
            slug: state.slug,
            type: state.quizType,
            score,
            answers: filled,
            totalTime: (Date.now() - startTime) / 1000,
            totalQuestions: state.questionCount,
          })
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
    [state, startTime, isAuthenticated, signIn, onAuthRequired],
  )

  const restartQuiz = useCallback(() => {
    quizService.clearQuizState(state.quizId, state.quizType)

    // Update URL to remove completed parameter
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.delete("completed")
      url.searchParams.delete("fromAuth")
      window.history.replaceState({}, document.title, url.toString())
    }

    dispatch({ type: "RESET_QUIZ" })
  }, [state.quizId, state.quizType])

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
    if (isCompleted && fromAuth && !authProcessingDone.current) {
      authProcessingDone.current = true
      dispatch({ type: "SET_PROCESSING_AUTH", payload: true })
      dispatch({ type: "SET_LOADING", payload: true })

      // Generate a unique browser fingerprint to track this processing
      const browserFingerprint = `${navigator.userAgent}-${Date.now()}`
      sessionStorage.setItem("auth_processing_fingerprint", browserFingerprint)

      console.log("Processing authentication return...")

      // Process pending data and then update state
      quizService.processPendingQuizData().then(() => {
        // Get the score from the service
        const result = quizService.getQuizResult(state.quizId)

        if (result) {
          console.log("Found quiz result:", result)
          // Update state with the result
          dispatch({
            type: "COMPLETE_QUIZ",
            payload: {
              score: result.score,
              answers: result.answers || [],
            },
          })
        } else {
          console.log("No quiz result found, checking localStorage")
          // Try to get from localStorage directly as fallback
          try {
            const pendingData = localStorage.getItem("pendingQuizData")
            if (pendingData) {
              const data = JSON.parse(pendingData)
              if (data.quizId === state.quizId) {
                console.log("Using pending data from localStorage:", data)
                dispatch({
                  type: "COMPLETE_QUIZ",
                  payload: {
                    score: data.score || 0,
                    answers: data.answers || [],
                  },
                })
              }
            }
          } catch (e) {
            console.error("Error parsing localStorage data:", e)
          }
        }

        // Clean up URL parameters to prevent redirect loops
        if (window.history && window.history.replaceState) {
          const url = new URL(window.location.href)
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

        dispatch({ type: "SET_PROCESSING_AUTH", payload: false })
        dispatch({ type: "SET_LOADING", payload: false })
      })
    }
  }, [isAuthenticated, state.quizId, state.isCompleted, state.answers, state.score])

  // Handle URL parameters and authentication state
  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if we have completed=true in the URL
    const isCompleted = new URLSearchParams(window.location.search).get("completed") === "true"

    // If user is authenticated and URL has completed=true, ensure we show results
    if (isCompleted && isAuthenticated) {
      // Force the quiz to be marked as completed
      if (!state.isCompleted) {
        const savedState = getFromStorage(`quiz_state_${state.quizId}`)
        if (savedState) {
          dispatch({
            type: "COMPLETE_QUIZ",
            payload: {
              score: savedState.score || 0,
              answers: savedState.answers || [],
            },
          })
        }
      }

      // Clear any pending auth flow markers
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("showQuizResults")
        sessionStorage.removeItem("quizRedirectPath")
        sessionStorage.removeItem("pendingQuizData")
        sessionStorage.removeItem("inAuthFlow")
        localStorage.removeItem("quizAuthRedirect")
        localStorage.removeItem("inAuthFlow")
      }
    }
  }, [isAuthenticated, state.quizId, state.isCompleted])

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
