"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  initQuiz,
  submitAnswer,
  nextQuestion,
  previousQuestion,
  goToQuestion,
  completeQuiz,
  resetQuiz,
  setIsAuthenticated,
  setRequiresAuth,
  setIsProcessingAuth,
  setAuthCheckComplete,
  submitQuizResults,
  setForceShowResults,
  type Answer,
  type QuizState,
} from "@/store/slices/quizSlice"
import { useToast } from "@/hooks/use-toast"
import type { RootState } from "@/store"

// Define return type for useQuizState hook
interface UseQuizStateReturn {
  // State
  state: QuizState
  isAuthenticated: boolean
  isLastQuestion: boolean
  currentQuestion: any

  // Quiz initialization
  initializeQuiz: (quizData: any) => void

  // Navigation
  submitAnswer: (answerData: Answer) => void
  goToNextQuestion: () => void
  goToPreviousQuestion: () => void
  goToQuestionIndex: (index: number) => void

  // Quiz completion
  completeQuiz: () => Promise<boolean>
  restartQuiz: () => void

  // Authentication
  handleAuthenticationRequired: (redirectUrl: string) => void
  forceShowResults: () => void
}

export const useQuizState = (): UseQuizStateReturn => {
  const dispatch = useDispatch()
  const state = useSelector((state: RootState) => state.quiz)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // Derive authentication status from session
  const isAuthenticated = useMemo(() => {
    return status === "authenticated" && !!session?.user
  }, [session, status])

  // Sync authentication status with Redux state
  useEffect(() => {
    dispatch(setIsAuthenticated(isAuthenticated))

    // Mark auth check as complete when session status is determined
    if (status !== "loading") {
      dispatch(setAuthCheckComplete(true))
    }
  }, [dispatch, isAuthenticated, status])

  // Derive current question and last question status
  const currentQuestion = useMemo(() => {
    return state.questions[state.currentQuestionIndex] || null
  }, [state.questions, state.currentQuestionIndex])

  const isLastQuestion = useMemo(() => {
    return state.currentQuestionIndex === state.questions.length - 1
  }, [state.currentQuestionIndex, state.questions.length])

  // Initialize quiz
  const initializeQuiz = useCallback(
    (quizData: any) => {
      dispatch(
        initQuiz({
          ...quizData,
          isAuthenticated: quizData.isAuthenticated !== undefined ? quizData.isAuthenticated : isAuthenticated,
        }),
      )
    },
    [dispatch, isAuthenticated],
  )

  // Submit answer for current question
  const handleSubmitAnswer = useCallback(
    (answerData: Answer) => {
      dispatch(submitAnswer(answerData))
    },
    [dispatch],
  )

  // Navigation functions
  const goToNextQuestion = useCallback(() => {
    dispatch(nextQuestion())
  }, [dispatch])

  const goToPreviousQuestion = useCallback(() => {
    dispatch(previousQuestion())
  }, [dispatch])

  const goToQuestionIndex = useCallback(
    (index: number) => {
      dispatch(goToQuestion(index))
    },
    [dispatch],
  )

  // Force show results (used after authentication)
  const forceShowResults = useCallback(() => {
    dispatch(setForceShowResults(true))
  }, [dispatch])

  // Complete quiz and submit results if authenticated
  const handleCompleteQuiz = useCallback(async () => {
    dispatch(completeQuiz())

    // If authenticated and quiz has an ID, submit results
    if (isAuthenticated && state.quizId) {
      const totalTime = state.timeSpent.reduce((sum, time) => sum + (time || 0), 0)
      const totalQuestions = state.questions.length

      try {
        await dispatch(
          submitQuizResults({
            quizId: state.quizId,
            slug: state.slug || "quiz",
            quizType: state.quizType || "mcq",
            answers: state.answers,
            score: state.score,
            totalTime,
            totalQuestions,
          }) as any,
        )
      } catch (error) {
        console.error("Failed to submit quiz results:", error)
      }
    }

    return true
  }, [dispatch, isAuthenticated, state])

  // Restart quiz
  const handleRestartQuiz = useCallback(() => {
    dispatch(resetQuiz())
  }, [dispatch])

  // Handle authentication requirement
  const handleAuthenticationRequired = useCallback(
    (redirectUrl: string) => {
      // Set auth processing state
      dispatch(setIsProcessingAuth(true))
      dispatch(setRequiresAuth(true))

      if (typeof window !== "undefined") {
        // Save current quiz state to localStorage before redirecting
        try {
          const quizStateToSave = {
            quizId: state.quizId,
            slug: state.slug,
            quizType: state.quizType,
            isCompleted: state.isCompleted,
            score: state.score,
            answers: state.answers,
            completedAt: state.completedAt,
          }

          localStorage.setItem("pendingQuizState", JSON.stringify(quizStateToSave))
        } catch (err) {
          console.error("Failed to save quiz state to localStorage:", err)
        }

        // Redirect to sign-in
        window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`
      }
    },
    [dispatch, state],
  )

  // Return all functions and state
  return {
    state,
    isAuthenticated,
    isLastQuestion,
    currentQuestion,
    initializeQuiz,
    submitAnswer: handleSubmitAnswer,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestionIndex,
    completeQuiz: handleCompleteQuiz,
    restartQuiz: handleRestartQuiz,
    handleAuthenticationRequired,
    forceShowResults,
  }
}
