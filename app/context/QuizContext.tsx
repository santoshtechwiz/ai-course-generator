"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { quizStorageService, type QuizState, type QuizResult, type QuizAnswer } from "@/lib/quiz-storage-service"
import type { QuizType } from "@/app/types/quiz-types"

// Define the quiz context state interface
interface QuizContextState {
  quizId: string
  slug: string
  title: string
  description: string
  quizType: QuizType
  questionCount: number
  estimatedTime: string
  currentQuestionIndex: number
  answers: QuizAnswer[]
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
  | { type: "SET_ANSWERS"; payload: QuizAnswer[] }
  | { type: "SET_ANSWER"; payload: { index: number; answer: QuizAnswer } }
  | { type: "SET_SCORE"; payload: number }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_COMPLETED"; payload: boolean }
  | { type: "RESET_QUIZ" }
  | { type: "SET_TIME_SPENT"; payload: { index: number; time: number } }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SHOW_FEEDBACK"; payload: { show: boolean; message: string } }

// Initial state
const initialState: QuizContextState = {
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
  state: QuizContextState
  dispatch: React.Dispatch<QuizAction>
  nextQuestion: () => void
  prevQuestion: () => void
  submitAnswer: (answer: any) => void
  completeQuiz: () => void
  restartQuiz: () => void
}

// Create the reducer
function quizReducer(state: QuizContextState, action: QuizAction): QuizContextState {
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

// Create the provider component
interface QuizProviderProps {
  children: ReactNode
  quizId: string
  slug: string
  title: string
  description: string
  quizType: QuizType
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
  const initialStateWithProps: QuizContextState = {
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
      const guestResults = quizStorageService.getGuestResults()
      setHasGuestResults(guestResults.length > 0)

      // If user has guest results and is now authenticated, show a toast or notification
      if (guestResults.length > 0 && isAuthenticated) {
        // You could implement a toast notification here
        console.log("Your guest results have been saved to your account!")
      }
    }
  }, [isAuthenticated])

  // Save guest result
  const saveGuestResult = useCallback(
    (result: QuizResult) => {
      if (typeof window === "undefined") return

      try {
        console.log("Saving guest result:", result)

        // If user is already authenticated, don't save as guest result
        if (isAuthenticated) {
          console.log("User is authenticated, not saving as guest result")
          return
        }

        // Save the result using our storage service
        quizStorageService.saveGuestResult(result)

        // Update state to reflect we have guest results
        setHasGuestResults(true)

        // Show sign-in prompt after saving result
        setShowSignInPrompt(true)
      } catch (error) {
        console.error("Error saving guest result:", error)
      }
    },
    [isAuthenticated],
  )

  // Get guest result
  const getGuestResult = useCallback((quizId: string): QuizResult | null => {
    if (typeof window === "undefined") return null

    try {
      console.log("Getting guest result for quiz ID:", quizId)
      return quizStorageService.getGuestResult(quizId)
    } catch (error) {
      console.error("Error getting guest result:", error)
      return null
    }
  }, [])

  // Save quiz state
  const saveQuizState = useCallback(
    (state: Partial<QuizState>) => {
      if (typeof window === "undefined") return

      try {
        // Convert from partial state to full state
        const fullState: QuizState = {
          quizId: state.quizId || quizId,
          quizType: state.quizType || (quizType as QuizType),
          slug: state.slug || slug,
          currentQuestion: state.currentQuestion || 0,
          totalQuestions: state.totalQuestions || questionCount,
          startTime: state.startTime || Date.now(),
          isCompleted: state.isCompleted || false,
          answers: state.answers || [],
          redirectPath: state.redirectPath,
        }

        quizStorageService.saveQuizState(fullState)
      } catch (error) {
        console.error("Error saving quiz state:", error)
      }
    },
    [quizId, quizType, slug, questionCount],
  )

  // Get quiz state
  const getQuizState = useCallback((): QuizState | null => {
    if (typeof window === "undefined") return null

    try {
      return quizStorageService.getCurrentQuizState()
    } catch (error) {
      console.error("Error getting quiz state:", error)
      return null
    }
  }, [])

  // Clear quiz state
  const clearQuizState = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      quizStorageService.clearQuizState(quizId, quizType as QuizType)
    } catch (error) {
      console.error("Error clearing quiz state:", error)
    }
  }, [quizId, quizType])

  // Clear guest result
  const clearGuestResult = useCallback((quizId: string) => {
    if (typeof window === "undefined") return

    quizStorageService.clearGuestResult(quizId)

    // Update state to reflect guest results status
    const remainingResults = quizStorageService.getGuestResults()
    setHasGuestResults(remainingResults.length > 0)
  }, [])

  // Handle auth state transition
  const handleAuthStateTransition = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      // Check if we just transitioned from guest to authenticated
      const wasGuest = sessionStorage.getItem("wasSignedIn") === "false"

      if (wasGuest && isAuthenticated) {
        console.log("Detected transition from guest to authenticated user")

        // Check if we have any guest results that need to be saved
        const guestResults = quizStorageService.getGuestResults()

        if (guestResults.length > 0) {
          console.log(`Found ${guestResults.length} guest results to save`)
          setHasGuestResults(true)
        }

        // Update the auth state
        sessionStorage.setItem("wasSignedIn", "true")
      }
    } catch (error) {
      console.error("Error handling auth state transition:", error)
    }
  }, [isAuthenticated])

  // Helper functions
  const nextQuestion = useCallback(() => {
    if (state.currentQuestionIndex < state.questionCount - 1) {
      dispatch({ type: "SET_CURRENT_QUESTION", payload: state.currentQuestionIndex + 1 })
    }
  }, [state.currentQuestionIndex, state.questionCount, dispatch])

  const prevQuestion = () => {
    if (state.currentQuestionIndex > 0) {
      dispatch({ type: "SET_CURRENT_QUESTION", payload: state.currentQuestionIndex - 1 })
    }
  }

  const submitAnswer = useCallback(
    (answer: any) => {
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
    },
    [state.currentQuestionIndex, state.questionCount, dispatch, nextQuestion],
  )

  const completeQuiz = useCallback(async () => {
    dispatch({ type: "SET_SAVING", payload: true });

    try {
      const score = quizStorageService.calculateScore(state.answers, quizType as QuizType);
      dispatch({ type: "SET_SCORE", payload: score });

      const result = {
        quizId,
        slug,
        quizType,
        score,
        answers: state.answers,
        totalTime: state.timeSpent.reduce((a, b) => a + b, 0),
        timestamp: Date.now(),
        isCompleted: true,
      };

      if (isAuthenticated) {
        // Save results to the server for authenticated users
        const response = await fetch(`/api/quiz/${slug}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        });

        if (!response.ok) throw new Error("Failed to save quiz results");

        dispatch({ type: "SET_COMPLETED", payload: true });
        dispatch({
          type: "SHOW_FEEDBACK",
          payload: { show: true, message: `Quiz completed! Your score: ${score}%` },
        });
      } else {
        // Save results temporarily in localStorage for non-authenticated users
        quizStorageService.saveGuestResult(result);
        setShowSignInPrompt(true);
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  }, [
    dispatch,
    quizStorageService,
    state.answers,
    quizType,
    isAuthenticated,
    slug,
    quizId,
    state.timeSpent,
  ]);

  const restartQuiz = useCallback(() => {
    dispatch({ type: "RESET_QUIZ" })
  }, [dispatch])

  // Context value
  const value = useMemo(
    () => ({
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
      nextQuestion,
      prevQuestion,
      submitAnswer,
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
      nextQuestion,
      prevQuestion,
      submitAnswer,
      completeQuiz,
      restartQuiz,
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
