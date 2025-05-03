"use client"

import React from "react"
import { createContext, useContext, useRef } from "react"
import { Provider } from "react-redux"
import { store } from "@/store"
import { useQuizState } from "@/hooks/useQuizState"

// Create the context
const QuizContext = createContext<any>(null)

// Provider component
interface QuizProviderProps {
  children: React.ReactNode
  quizId?: string
  quizData?: any
  slug?: string
  quizType?: string
  onAuthRequired?: (redirectUrl: string) => void
}

// Provider component
export const QuizProvider = ({ children, quizData, onAuthRequired }: QuizProviderProps) => {
  // Track if we've initialized to prevent infinite loops
  const initialized = useRef(false)

  return (
    <Provider store={store}>
      <QuizProviderInner quizData={quizData} initialized={initialized} onAuthRequired={onAuthRequired}>
        {children}
      </QuizProviderInner>
    </Provider>
  )
}

// Inner provider to use Redux after Provider is set up
const QuizProviderInner = ({
  children,
  quizData,
  initialized,
  onAuthRequired,
}: {
  children: React.ReactNode
  quizData?: any
  initialized: React.RefObject<boolean>
  onAuthRequired?: (redirectUrl: string) => void
}) => {
  const quizState = useQuizState()

  // Initialize quiz state if props are provided
  React.useEffect(() => {
    if (quizData && quizState.initializeQuiz && !initialized.current) {
      initialized.current = true
      quizState.initializeQuiz(quizData)
    }
  }, [quizData, quizState, initialized])

  // Set up auth required callback if provided
  React.useEffect(() => {
    if (onAuthRequired && quizState.state.requiresAuth && !quizState.state.isAuthenticated) {
      const currentUrl = typeof window !== "undefined" ? window.location.href : ""
      onAuthRequired(currentUrl)
    }
  }, [quizState.state.requiresAuth, quizState.state.isAuthenticated, onAuthRequired])

  return <QuizContext.Provider value={quizState}>{children}</QuizContext.Provider>
}

// Custom hook to use the context
export const useQuiz = () => {
  const context = useContext(QuizContext)

  // If there's no context (provider not used), throw an error
  if (!context) {
    throw new Error("useQuiz must be used within a QuizProvider")
  }

  return context
}

// Re-export from the slice for convenience
export {
  resetQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  setRequiresAuth,
  setPendingAuthRequired,
  setAuthCheckComplete,
  setHasGuestResult,
  clearGuestResults,
  setError,
  setIsProcessingAuth,
  fetchQuizResults,
  submitQuizResults,
} from "@/store/slices/quizSlice"
