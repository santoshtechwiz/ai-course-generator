"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode, useState, useCallback, useMemo } from "react"
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
  clearGuestResult: (quizId: string) => void
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
  const [guestResults, setGuestResults] = useState<{ [quizId: string]: QuizResult }>({})

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

  // Improve the saveGuestResult function to better handle the auth flow
  const saveGuestResult = useCallback(
    (result: QuizResult & { redirectPath?: string }) => {
      if (typeof window === "undefined") return

      try {
        console.log("Saving guest result:", result)

        // If user is already authenticated, don't save as guest result
        if (isAuthenticated) {
          console.log("User is authenticated, not saving as guest result")
          return
        }

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

        // Add timestamp to the result
        const resultWithTimestamp = {
          ...result,
          timestamp: Date.now(),
        }

        // Check if we already have a result for this quiz
        const existingIndex = existingResults.findIndex((r: QuizResult) => r.quizId === result.quizId)

        // Either update existing or add new result
        if (existingIndex >= 0) {
          existingResults[existingIndex] = resultWithTimestamp
        } else {
          existingResults.push(resultWithTimestamp)
        }

        // Save back to localStorage with a longer expiration (7 days)
        localStorage.setItem("guestQuizResults", JSON.stringify(existingResults))

        // Also save specifically for this quiz ID for easier retrieval
        localStorage.setItem(`guestQuizResults_${result.quizId}`, JSON.stringify(resultWithTimestamp))

        // Also save to the quiz_result key for compatibility
        localStorage.setItem(`quiz_result_${result.quizId}`, JSON.stringify(resultWithTimestamp))

        setHasGuestResults(true)

        // Also save the current quiz state with the redirect path
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

        // Also save to sessionStorage for the auth flow
        sessionStorage.setItem(
          "quizState",
          JSON.stringify({
            quizState: {
              quizId: result.quizId,
              quizType: result.quizType,
              slug: result.slug,
              isCompleted: true,
              redirectPath: result.redirectPath,
            },
            answers: result.answers,
          }),
        )

        // Show sign-in prompt after saving result
        setShowSignInPrompt(true)
      } catch (error) {
        console.error("Error saving guest result:", error)
      }
    },
    [isAuthenticated],
  )

  // Improve the getGuestResult function to be more robust
  const getGuestResult = useCallback((quizId: string): QuizResult | null => {
    if (typeof window === "undefined") return null

    try {
      console.log("Getting guest result for quiz ID:", quizId)

      // First check in the specific guest result storage
      const guestResultStr = localStorage.getItem(`guestQuizResults_${quizId}`)
      if (guestResultStr) {
        try {
          const result = JSON.parse(guestResultStr)
          console.log("Found specific guest result:", result)
          return result
        } catch (e) {
          console.error("Error parsing specific guest result:", e)
        }
      }

      // Then check in the specific quiz result storage
      const specificResultStr = localStorage.getItem(`quiz_result_${quizId}`)
      if (specificResultStr) {
        try {
          const result = JSON.parse(specificResultStr)
          console.log("Found specific quiz result:", result)
          return result
        } catch (e) {
          console.error("Error parsing specific quiz result:", e)
        }
      }

      // If not found, check in the guestQuizResults array
      const resultsStr = localStorage.getItem("guestQuizResults")
      if (resultsStr) {
        try {
          const results = JSON.parse(resultsStr)
          if (Array.isArray(results)) {
            const result = results.find((r: QuizResult) => r.quizId === quizId)
            if (result) {
              console.log("Found result in guestQuizResults array:", result)
              return result
            }
          }
        } catch (e) {
          console.error("Error parsing guestQuizResults:", e)
        }
      }

      console.log("No guest result found for quiz ID:", quizId)
      return null
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

  // Enhance the QuizContext to better handle guest results
  // Add a function to clear guest results after they've been saved

  // Add this function to the context provider
  const clearGuestResult = useCallback((quizId: string) => {
    if (typeof window === "undefined") return

    // Clear from both localStorage and sessionStorage
    localStorage.removeItem(`guestQuizResults_${quizId}`)
    sessionStorage.removeItem(`guestQuizResults_${quizId}`)

    // Also clear related quiz state
    localStorage.removeItem(`quiz_state_${quizId}`)
    sessionStorage.removeItem(`quiz_state_${quizId}`)

    // Update the state to remove this quiz result
    setGuestResults((prev) => {
      const newResults = { ...prev }
      delete newResults[quizId]
      return newResults
    })
  }, [])

  // Improve the authentication state handling in QuizContext
  // Add a function to check for and handle auth state transitions

  // Add this function after the clearGuestResult function:
  const handleAuthStateTransition = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      // Check if we just transitioned from guest to authenticated
      const wasGuest = sessionStorage.getItem("wasSignedIn") === "false"

      if (wasGuest && isAuthenticated) {
        console.log("Detected transition from guest to authenticated user")

        // Check if we have any guest results that need to be saved
        const guestResultsStr = localStorage.getItem("guestQuizResults")
        if (guestResultsStr) {
          try {
            const guestResults = JSON.parse(guestResultsStr)

            if (Array.isArray(guestResults) && guestResults.length > 0) {
              console.log(`Found ${guestResults.length} guest results to save`)

              // We'll handle the actual saving in the components that need it
              // Just mark that we have guest results to save
              setHasGuestResults(true)
            }
          } catch (e) {
            console.error("Error parsing guest results:", e)
          }
        }

        // Update the auth state
        sessionStorage.setItem("wasSignedIn", "true")
      }
    } catch (error) {
      console.error("Error handling auth state transition:", error)
    }
  }, [isAuthenticated])

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

  useEffect(() => {
    // Track authentication state changes
    if (typeof window !== "undefined") {
      // If user was authenticated and is now not, they signed out
      const wasAuthenticated = localStorage.getItem("wasAuthenticated") === "true"
      const preserveGuestResults = localStorage.getItem("preserveGuestResults") === "true"

      if (wasAuthenticated && !isAuthenticated && !isLoading && !preserveGuestResults) {
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

      // Clear the preserve flag after authentication is complete
      if (isAuthenticated && !isLoading && preserveGuestResults) {
        localStorage.removeItem("preserveGuestResults")
      }
    }
  }, [isAuthenticated, isLoading])

  // Add a useEffect to call this function when auth state changes
  useEffect(() => {
    if (!isLoading) {
      handleAuthStateTransition()
    }
  }, [isAuthenticated, isLoading, handleAuthStateTransition])

  // Add the function to the context value
  const value = useMemo(
    () => ({
      saveGuestResult,
      getGuestResult,
      clearGuestResult, // Add the new function here
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
      nextQuestion, // Include nextQuestion
      prevQuestion, // Include prevQuestion
      submitAnswer, // Include submitAnswer
      completeQuiz,
      restartQuiz,
    }),
    [
      saveGuestResult,
      getGuestResult,
      clearGuestResult,
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
      completeQuiz,
      restartQuiz,
      nextQuestion,
      submitAnswer,
    ],
  )

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
