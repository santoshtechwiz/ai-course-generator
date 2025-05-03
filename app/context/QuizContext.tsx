"use client"

import React, { createContext, useContext, type ReactNode } from "react"
import { Provider } from "react-redux"
import { store } from "@/store"
import { useQuizState } from "@/hooks/useQuizState"
import type { QuizType } from "../types/quiz-types"

// Define the context type
export type QuizContextType = ReturnType<typeof useQuizState> & {
  handleAuthenticationRequired?: (redirectUrl?: string) => void
}

// Create the context with a default value
const QuizContext = createContext<QuizContextType | undefined>(undefined)

// Props for the QuizProvider component
interface QuizProviderProps {
  children: ReactNode
  quizData: any
  slug: string
  quizType: QuizType
  onAuthRequired?: (redirectUrl: string) => void
}

/**
 * QuizProvider component that wraps the application with Redux Provider
 * and initializes the quiz state
 */
export const QuizProvider: React.FC<QuizProviderProps> = ({ children, quizData, slug, quizType, onAuthRequired }) => {
  return (
    <Provider store={store}>
      <QuizProviderInner quizData={quizData} slug={slug} quizType={quizType} onAuthRequired={onAuthRequired}>
        {children}
      </QuizProviderInner>
    </Provider>
  )
}

/**
 * Inner provider component that uses the useQuizState hook
 * This separation allows us to use the Redux store inside the hook
 */
const QuizProviderInner: React.FC<QuizProviderProps> = ({ children, quizData, slug, quizType, onAuthRequired }) => {
  // Use our custom hook to get quiz state and actions
  const quizState = useQuizState()

  // Track initialization to prevent multiple initializations
  const hasInitialized = React.useRef(false)

  // Initialize the quiz when the component mounts
  React.useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Initialize with the provided quiz data
    quizState.initializeQuiz({
      ...quizData,
      slug,
      quizType,
    })

    // Set up auth required callback if provided
    if (onAuthRequired) {
      // Add the handleAuthenticationRequired function
      quizState.handleAuthenticationRequired = (redirectUrl?: string) => {
        if (redirectUrl && onAuthRequired) {
          onAuthRequired(redirectUrl)
        }
      }
    }

    // Cleanup function
    return () => {
      // Reset initialization flag when component unmounts
      hasInitialized.current = false
    }
  }, [quizData, slug, quizType, onAuthRequired, quizState])

  return <QuizContext.Provider value={quizState}>{children}</QuizContext.Provider>
}

/**
 * Custom hook to use the quiz context
 */
export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext)

  if (context === undefined) {
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
