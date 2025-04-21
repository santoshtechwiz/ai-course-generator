"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

// Define the quiz state interface
export interface QuizState {
  quizId: string
  slug: string
  title: string
  description: string
  quizType: "mcq" | "openended" | "blanks" | "code" | "flashcard" | string
  questionCount: number
  estimatedTime: string
  currentQuestionIndex: number
  answers: any[]
  timeSpent: number[]
  isCompleted: boolean
  isLoading: boolean
  error: string | null
  score: number
  breadcrumbItems: { name: string; href: string }[]
  isSaving: boolean
  showFeedback: boolean
  feedbackMessage: string
  startTime: number
  totalQuestions?: number
  currentQuestion?: number
  redirectPath?: string
}

// Define action types
type QuizAction =
  | { type: "SET_CURRENT_QUESTION"; payload: number }
  | { type: "SET_ANSWERS"; payload: any[] }
  | { type: "SET_ANSWER"; payload: { index: number; answer: any } }
  | { type: "SET_SCORE"; payload: number }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_COMPLETED"; payload: boolean }
  | { type: "RESET_QUIZ" }
  | { type: "SET_TIME_SPENT"; payload: { index: number; time: number } }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SHOW_FEEDBACK"; payload: { show: boolean; message: string } }

// Initial state
const initialState: QuizState = {
  quizId: "",
  slug: "",
  title: "",
  description: "",
  quizType: "mcq",
  questionCount: 0,
  estimatedTime: "",
  currentQuestionIndex: 0,
  answers: [],
  timeSpent: [],
  isCompleted: false,
  isLoading: false,
  error: null,
  score: 0,
  breadcrumbItems: [],
  isSaving: false,
  showFeedback: false,
  feedbackMessage: "",
  startTime: 0,
}

// Define types for quiz state and results
// export interface QuizState {
//   quizId: string;
//   quizType: string;
//   slug: string;
//   currentQuestion: number;
//   answers: any[];
//   timeSpent: number[];
//   startTime: number;
//   isCompleted: boolean;
// }

export interface QuizResult {
  quizId: string
  quizType: string
  slug: string
  score: number
  answers: any[]
  totalTime: number
  timestamp: number
  redirectPath?: string
}

interface QuizContextType {
  saveGuestResult: (result: QuizResult) => void
  getGuestResult: (quizId: string) => QuizResult | null
  saveQuizState: (state: Partial<QuizState>) => void
  getQuizState: () => QuizState | null
  clearQuizState: () => void
  hasGuestResults: boolean
  isAuthenticated: boolean
  isLoading: boolean
  showSignInPrompt: boolean
  setShowSignInPrompt: (show: boolean) => void
  state: QuizState
  dispatch: React.Dispatch<QuizAction>
  nextQuestion: () => void
  prevQuestion: () => void
  submitAnswer: (answer: any) => void
  completeQuiz: () => void
  restartQuiz: () => void
}

// Create the reducer
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "SET_CURRENT_QUESTION":
      return { ...state, currentQuestionIndex: action.payload }
    case "SET_ANSWER":
      const newAnswers = [...state.answers]
      newAnswers[action.payload.index] = action.payload.answer
      return { ...state, answers: newAnswers }
    case "SET_TIME_SPENT":
      const newTimeSpent = [...state.timeSpent]
      newTimeSpent[action.payload.index] = action.payload.time
      return { ...state, timeSpent: newTimeSpent }
    case "SET_COMPLETED":
      return { ...state, isCompleted: action.payload }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "SET_SCORE":
      return { ...state, score: action.payload }
    case "SET_SAVING":
      return { ...state, isSaving: action.payload }
    case "SHOW_FEEDBACK":
      return {
        ...state,
        showFeedback: action.payload.show,
        feedbackMessage: action.payload.message,
      }
    case "RESET_QUIZ":
      return {
        ...initialState,
        quizId: state.quizId,
        slug: state.slug,
        title: state.title,
        description: state.description,
        quizType: state.quizType,
        questionCount: state.questionCount,
        estimatedTime: state.estimatedTime,
        breadcrumbItems: state.breadcrumbItems,
        answers: new Array(state.questionCount).fill(null),
        timeSpent: new Array(state.questionCount).fill(0),
        startTime: 0,
      }
    default:
      return state
  }
}

const QuizContext = createContext<QuizContextType | undefined>(undefined)

// Helper function to save data with expiration
const saveToStorage = (key: string, data: any, expirationHours = 24) => {
  try {
    if (typeof window === "undefined") return

    const item = {
      value: data,
      expiry: Date.now() + expirationHours * 60 * 60 * 1000,
    }
    localStorage.setItem(key, JSON.stringify(item))
  } catch (error) {
    console.error(`Error saving to storage with key ${key}:`, error)
  }
}

// Helper function to get data with expiration check
const getFromStorage = (key: string) => {
  try {
    if (typeof window === "undefined") return null

    const itemStr = localStorage.getItem(key)
    if (!itemStr) return null

    const item = JSON.parse(itemStr)

    // Check if the item has expired
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(key)
      return null
    }

    return item.value
  } catch (error) {
    console.error(`Error getting from storage with key ${key}:`, error)
    return null
  }
}

// Create the provider component
interface QuizProviderProps {
  children: ReactNode
  quizId: string
  slug: string
  title: string
  description: string
  quizType: "mcq" | "openended" | "fill-blanks" | "code" | "flashcard" | string
  questionCount: number
  estimatedTime: string
  breadcrumbItems: { name: string; href: string }[]
}

export function QuizProvider({
  children,
  quizId,
  slug,
  title,
  description,
  quizType,
  questionCount,
  estimatedTime,
  breadcrumbItems,
}: QuizProviderProps) {
  const initialStateWithProps: QuizState = {
    ...initialState,
    quizId,
    slug,
    title,
    description,
    quizType,
    questionCount,
    estimatedTime,
    breadcrumbItems,
    answers: new Array(questionCount).fill(null),
    timeSpent: new Array(questionCount).fill(0),
    startTime: 0,
  }

  const [state, dispatch] = useReducer(quizReducer, initialStateWithProps)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [hasGuestResults, setHasGuestResults] = useState(false)
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)

  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"

  // Check for guest results on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasResults = localStorage.getItem("guestQuizResults") !== null
      setHasGuestResults(hasResults)

      // If user has guest results and is now authenticated, show a toast or notification
      if (hasResults && isAuthenticated) {
        // You could implement a toast notification here
        console.log("Your guest results have been saved to your account!")
      }
    }
  }, [isAuthenticated])

  // Save quiz result for guest users
  const saveGuestResult = useCallback((result: QuizResult & { redirectPath?: string }) => {
    if (typeof window === "undefined") return

    try {
      // Get existing results or initialize empty array
      const existingResultsStr = localStorage.getItem("guestQuizResults")
      const existingResults = existingResultsStr ? JSON.parse(existingResultsStr) : []

      // Ensure we have a redirectPath for this quiz
      if (!result.redirectPath) {
        result.redirectPath = `/dashboard/${result.quizType}/${result.slug}`
      }

      // Make sure the redirectPath doesn't already have a completed parameter
      if (!result.redirectPath.includes("completed=true")) {
        result.redirectPath += `${result.redirectPath.includes("?") ? "&" : "?"}completed=true`
      }

      // Check if we already have a result for this quiz
      const existingIndex = existingResults.findIndex((r: QuizResult) => r.quizId === result.quizId)

      // Either update existing or add new result
      if (existingIndex >= 0) {
        existingResults[existingIndex] = result
      } else {
        existingResults.push(result)
      }

      // Save back to localStorage with a longer expiration (7 days)
      localStorage.setItem("guestQuizResults", JSON.stringify(existingResults))

      // Also save specifically for this quiz ID for easier retrieval
      localStorage.setItem(
        `quiz_result_${result.quizId}`,
        JSON.stringify({
          ...result,
          timestamp: Date.now(),
        }),
      )

      setHasGuestResults(true)

      // Also save the current quiz state with the redirect path
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "currentQuizState",
          JSON.stringify({
            quizId: result.quizId,
            quizType: result.quizType,
            redirectPath: result.redirectPath,
            timestamp: Date.now(),
            isCompleted: true,
            score: result.score,
            answers: result.answers,
          }),
        )
      }

      // Show sign-in prompt after saving result
      setShowSignInPrompt(true)
    } catch (error) {
      console.error("Error saving guest result:", error)
    }
  }, [])

  // Get guest result by quiz ID
  const getGuestResult = useCallback((quizId: string): QuizResult | null => {
    if (typeof window === "undefined") return null

    try {
      const resultsStr = localStorage.getItem("guestQuizResults")
      if (!resultsStr) return null

      const results = JSON.parse(resultsStr)
      return results.find((r: QuizResult) => r.quizId === quizId) || null
    } catch (error) {
      console.error("Error getting guest result:", error)
      return null
    }
  }, [])

  // Save current quiz state
  const saveQuizState = useCallback((state: Partial<QuizState>) => {
    if (typeof window === "undefined") return

    try {
      // Get current state from storage or use empty object
      const currentStateStr = localStorage.getItem("currentQuizState")
      const currentState = currentStateStr ? JSON.parse(currentStateStr) : {}

      // Merge with new state
      const updatedState = { ...currentState, ...state }

      localStorage.setItem("currentQuizState", JSON.stringify(updatedState))
    } catch (error) {
      console.error("Error saving quiz state:", error)
    }
  }, [])

  // Get current quiz state
  const getQuizState = useCallback((): QuizState | null => {
    if (typeof window === "undefined") return null

    try {
      const stateStr = localStorage.getItem("currentQuizState")
      return stateStr ? JSON.parse(stateStr) : null
    } catch (error) {
      console.error("Error getting quiz state:", error)
      return null
    }
  }, [])

  // Clear current quiz state
  const clearQuizState = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem("currentQuizState")
    } catch (error) {
      console.error("Error clearing quiz state:", error)
    }
  }, [])

  // Helper functions
  const nextQuestion = () => {
    if (state.currentQuestionIndex < state.questionCount - 1) {
      dispatch({ type: "SET_CURRENT_QUESTION", payload: state.currentQuestionIndex + 1 })
    }
  }

  const prevQuestion = () => {
    if (state.currentQuestionIndex > 0) {
      dispatch({ type: "SET_CURRENT_QUESTION", payload: state.currentQuestionIndex - 1 })
    }
  }

  const submitAnswer = (answer: any) => {
    dispatch({
      type: "SET_ANSWER",
      payload: { index: state.currentQuestionIndex, answer },
    })

    // Auto-advance to next question if not the last question
    if (state.currentQuestionIndex < state.questionCount - 1) {
      setTimeout(() => {
        nextQuestion()
      }, 1000)
    }
  }

  const completeQuiz = async () => {
    dispatch({ type: "SET_SAVING", payload: true })

    try {
      // Calculate score (simplified example)
      const correctAnswers = state.answers.filter((answer) => answer && answer.isCorrect).length

      const score = Math.round((correctAnswers / state.questionCount) * 100)
      dispatch({ type: "SET_SCORE", payload: score })

      // If user is logged in, save to database
      if (session?.user) {
        // Example API call to save results
        const response = await fetch(`/api/quiz/${slug}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizId,
            answers: state.answers,
            timeSpent: state.timeSpent,
            score,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to save quiz results")
        }
      }

      dispatch({ type: "SET_COMPLETED", payload: true })
      dispatch({
        type: "SHOW_FEEDBACK",
        payload: {
          show: true,
          message: `Quiz completed! Your score: ${score}%`,
        },
      })
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      dispatch({ type: "SET_SAVING", payload: false })
    }
  }

  const restartQuiz = () => {
    dispatch({ type: "RESET_QUIZ" })
  }

  // Add a function to clear all quiz data when signing out
  // Add this to the QuizProvider component
  useEffect(() => {
    // Track authentication state changes
    if (typeof window !== "undefined") {
      // If user was authenticated and is now not, they signed out
      const wasAuthenticated = localStorage.getItem("wasAuthenticated") === "true"

      if (wasAuthenticated && !isAuthenticated && !isLoading) {
        console.log("User signed out, clearing all quiz data")
        // Clear all quiz data
        if (typeof window !== "undefined") {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("quiz_result_") || key.startsWith("quiz_state_")) {
              localStorage.removeItem(key)
            }
          })

          Object.keys(sessionStorage).forEach((key) => {
            if (key.startsWith("quiz_result_") || key.startsWith("quiz_state_")) {
              sessionStorage.removeItem(key)
            }
          })
        }
      }

      // Update authentication state
      localStorage.setItem("wasAuthenticated", isAuthenticated ? "true" : "false")
    }
  }, [isAuthenticated, isLoading])

  const value = {
    saveGuestResult,
    getGuestResult,
    saveQuizState,
    getQuizState,
    clearQuizState,
    hasGuestResults,
    isAuthenticated,
    isLoading,
    showSignInPrompt,
    setShowSignInPrompt,
    state,
    dispatch,
    nextQuestion,
    prevQuestion,
    submitAnswer,
    completeQuiz,
    restartQuiz,
  }

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>
}

// Custom hook to use the quiz context
export function useQuiz() {
  const context = useContext(QuizContext)
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider")
  }
  return context
}
