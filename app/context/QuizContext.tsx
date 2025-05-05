"use client"

import { createContext, useContext, useRef, useEffect, type ReactNode } from "react"
import { useAppDispatch, useAppSelector } from "@/store"
import { useSession } from "next-auth/react"
import { useQuizState } from "@/hooks/useQuizState"
import {
  setPendingAuthRequired,
  saveStateBeforeAuth,
  restoreFromSavedState,
  completeQuiz,
} from "@/store/slices/quizSlice"
import { setIsProcessingAuth, setRedirectUrl } from "@/store/slices/authSlice"

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
  const dispatch = useAppDispatch()
  const { data: session, status } = useSession()
  const isAuthenticated = Boolean(session?.user)
  const authState = useAppSelector((state) => state.auth)
  const quizReduxState = useAppSelector((state) => state.quiz)

  // Reset init when we switch quizzes
  useEffect(() => {
    if (quizId !== initializedQuizId.current) {
      initializedQuizId.current = undefined
    }
  }, [quizId])

  // Initialize quiz data once per quiz
  useEffect(() => {
    if (quizData && quizState.initializeQuiz && initializedQuizId.current !== quizId) {
      quizState.initializeQuiz({
        ...quizData,
        quizId,
        slug,
        quizType,
        isAuthenticated,
      })
      initializedQuizId.current = quizId
    }
  }, [quizData, quizId, quizState, slug, quizType, isAuthenticated])

  // Trigger onAuthRequired callback
  useEffect(() => {
    if (onAuthRequired && quizReduxState.requiresAuth && !authState.isAuthenticated && !authState.isProcessingAuth) {
      const currentUrl = typeof window !== "undefined" ? window.location.href : ""

      // Save quiz state to Redux before redirecting
      dispatch(
        saveStateBeforeAuth({
          quizId,
          slug,
          quizType,
          isCompleted: quizReduxState.isCompleted || true, // Force isCompleted to true
          currentQuestionIndex: quizReduxState.currentQuestionIndex,
          answers: quizReduxState.answers,
          score: quizReduxState.score,
          completedAt: quizReduxState.completedAt || new Date().toISOString(),
        }),
      )

      // Set processing auth to prevent multiple redirects
      dispatch(setIsProcessingAuth(true))
      dispatch(setPendingAuthRequired(true))
      dispatch(setRedirectUrl(currentUrl))

      // Trigger the redirect
      onAuthRequired(currentUrl)
    }
  }, [quizReduxState, authState, onAuthRequired, quizId, slug, quizType, dispatch])

  // Add a new useEffect to restore state when returning from auth
  useEffect(() => {
    if (typeof window !== "undefined" && status === "authenticated") {
      // Check if we're returning from auth
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth")

      if (fromAuth === "true" && quizReduxState.pendingAuthRequired && quizReduxState.savedState) {
        // Reset the processing flags
        dispatch(setIsProcessingAuth(false))

        // Restore from saved state
        dispatch(restoreFromSavedState())

        // Force quiz to completed state if it was completed before
        if (quizReduxState.savedState.isCompleted) {
          dispatch(
            completeQuiz({
              answers: quizReduxState.savedState.answers,
              score: quizReduxState.savedState.score,
              completedAt: quizReduxState.savedState.completedAt,
            }),
          )
        }

        if (process.env.NODE_ENV === "development") {
          console.log("Auth completed, state restored from Redux")
        }
      }
    }
  }, [status, quizReduxState, dispatch])

  const contextValue: QuizContextValue = {
    ...quizState,
    quizData,
    quizId,
    slug,
    quizType,
  }

  return <QuizContext.Provider value={contextValue}>{children}</QuizContext.Provider>
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
  fetchQuizResults,
  submitQuizResults,
  setPendingAuthRequired,
  setAuthCheckComplete,
  setHasNonAuthenticatedUserResult,
  clearNonAuthenticatedUserResults,
  setError,
} from "@/store/slices/quizSlice"
