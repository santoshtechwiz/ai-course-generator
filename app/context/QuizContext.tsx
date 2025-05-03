"use client"

import { createContext, useContext, useRef, useEffect, type ReactNode } from "react"
import { Provider as ReduxProvider, useDispatch, useSelector } from "react-redux"
import { store } from "@/store"
import { useSession } from "next-auth/react"
import { useQuizState } from "@/hooks/useQuizState"
import { setIsAuthenticated, setIsProcessingAuth } from "@/store/slices/quizSlice"

interface QuizProviderProps {
  children: ReactNode
  quizId?: string
  slug?: string
  quizType?: string
  quizData?: any
  onAuthRequired?: (redirectUrl: string) => void
}

type QuizContextValue = ReturnType<typeof useQuizState> & {
  quizData?: any
  quizId?: string
  slug?: string
  quizType?: string
}

const QuizContext = createContext<QuizContextValue | null>(null)

export const QuizProvider = ({ children, quizId, slug, quizType, quizData, onAuthRequired }: QuizProviderProps) => {
  const initializedQuizId = useRef<string | undefined>(undefined)
  const quizState = useQuizState()
  const reduxState = useSelector((s: any) => s.quiz)
  const dispatch = useDispatch()
  const { data: session, status } = useSession()
  const isAuthenticated = Boolean(session?.user)

  // Reset init when we switch quizzes
  useEffect(() => {
    if (quizId !== initializedQuizId.current) {
      initializedQuizId.current = undefined
    }
  }, [quizId])

  // Initialize quiz data once per quiz
  useEffect(() => {
    if (quizData && quizState.initializeQuiz && initializedQuizId.current !== quizId) {
      quizState.initializeQuiz(quizData)
      initializedQuizId.current = quizId
    }
  }, [quizData, quizId, quizState])

  // Keep Redux slice in sync with NextAuth
  useEffect(() => {
    if (status !== "loading") {
      dispatch(setIsAuthenticated(isAuthenticated))
    }
  }, [status, isAuthenticated, dispatch])

  // Trigger onAuthRequired callback
  useEffect(() => {
    if (onAuthRequired && reduxState.requiresAuth && !reduxState.isAuthenticated && !reduxState.isProcessingAuth) {
      const currentUrl = typeof window !== "undefined" ? window.location.href : ""

      // Save quiz state to localStorage before redirecting
      if (typeof window !== "undefined" && quizData) {
        const stateToSave = {
          quizData,
          quizId,
          slug,
          quizType,
          isCompleted: reduxState.isCompleted,
          currentQuestionIndex: reduxState.currentQuestionIndex,
          answers: reduxState.answers,
          score: reduxState.score,
          completedAt: reduxState.completedAt || new Date().toISOString(),
        }
        localStorage.setItem(`quiz_context_${slug || quizId}`, JSON.stringify(stateToSave))
      }

      // Set processing auth to prevent multiple redirects
      dispatch(setIsProcessingAuth(true))

      // Trigger the redirect
      onAuthRequired(currentUrl)
    }
  }, [
    reduxState.requiresAuth,
    reduxState.isAuthenticated,
    reduxState.isProcessingAuth,
    onAuthRequired,
    quizData,
    quizId,
    slug,
    quizType,
    dispatch,
    reduxState.isCompleted,
    reduxState.currentQuestionIndex,
    reduxState.answers,
    reduxState.score,
    reduxState.completedAt,
  ])

  // Add a new useEffect to restore state when returning from auth
  useEffect(() => {
    if (typeof window !== "undefined" && status === "authenticated" && reduxState.isProcessingAuth) {
      // Check if we're returning from auth
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth")

      if (fromAuth === "true") {
        try {
          // Try to restore state from localStorage
          const savedState = localStorage.getItem(`quiz_context_${slug || quizId}`)
          if (savedState) {
            const parsedState = JSON.parse(savedState)

            // If we had completed the quiz before auth, complete it again
            if (parsedState.isCompleted && quizState.completeQuiz) {
              quizState.completeQuiz({
                answers: parsedState.answers,
                score: parsedState.score,
                completedAt: parsedState.completedAt,
              })
            }

            // Clear the saved state after restoring
            localStorage.removeItem(`quiz_context_${slug || quizId}`)
          }
        } catch (err) {
          console.error("Error restoring quiz context state:", err)
        }

        // Reset processing auth state
        dispatch(setIsProcessingAuth(false))
      }
    }
  }, [status, reduxState.isProcessingAuth, slug, quizId, quizState, dispatch])

  const contextValue: QuizContextValue = {
    ...quizState,
    quizData,
    quizId,
    slug,
    quizType,
  }

  return (
    <ReduxProvider store={store}>
      <QuizContext.Provider value={contextValue}>{children}</QuizContext.Provider>
    </ReduxProvider>
  )
}

export const useQuiz = () => {
  const ctx = useContext(QuizContext)
  if (!ctx) {
    throw new Error("useQuiz must be used within a QuizProvider")
  }
  return ctx
}

// re-export slice actions for convenience
export {
  resetQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  setRequiresAuth,
  setIsProcessingAuth,
  fetchQuizResults,
  submitQuizResults,
  setPendingAuthRequired,
  setAuthCheckComplete,
  setHasGuestResult,
  clearGuestResults,
  setError,
} from "@/store/slices/quizSlice"
