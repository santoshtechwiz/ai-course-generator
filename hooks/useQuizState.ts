"use client"

import { useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  initQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  resetQuiz,
  setIsAuthenticated,
  setRequiresAuth,
  setPendingAuthRequired,
  setHasGuestResult,
  clearGuestResults,
  setAuthCheckComplete,
  setIsProcessingAuth,
  setError,
  fetchQuizResults,
  submitQuizResults,
  type Answer,
} from "@/store/slices/quizSlice"
import { calculateTotalTime } from "@/lib/utils/quiz-index"

export const useQuizState = () => {
  const dispatch = useDispatch()
  const state = useSelector((state: any) => state.quiz)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => {
    return status === "authenticated" && !!session?.user
  }, [session, status])

  // Submit quiz results
  const handleSubmitQuizResults = useCallback(
    async ({
      quizId,
      slug,
      quizType,
      answers,
      score,
    }: {
      quizId: string
      slug: string
      quizType: string
      answers: Answer[]
      score: number
    }) => {
      const totalTime = calculateTotalTime(answers)
      const totalQuestions = answers.length

      return dispatch(
        submitQuizResults({
          quizId,
          slug,
          quizType,
          answers,
          score,
          totalTime,
          totalQuestions,
        }),
      )
    },
    [dispatch],
  )

  // Initialize the quiz with data
  const initializeQuiz = useCallback(
    (quizData: any) => {
      dispatch(
        initQuiz({
          ...quizData,
          isAuthenticated,
        }),
      )
    },
    [dispatch, isAuthenticated],
  )

  // Submit an answer for the current question
  const handleSubmitAnswer = useCallback(
    (answerData: Answer) => {
      dispatch(submitAnswer(answerData))
    },
    [dispatch],
  )

  // Move to the next question
  const handleNextQuestion = useCallback(() => {
    dispatch(nextQuestion())
  }, [dispatch])

  // Complete the quiz and calculate score
  const handleCompleteQuiz = useCallback(
    (data?: { answers?: Answer[]; score?: number; completedAt?: string }) => {
      // Ensure we have a valid payload
      const payload = {
        answers: data?.answers || [],
        score: data?.score !== undefined ? data.score : 0,
        completedAt: data?.completedAt || new Date().toISOString(),
      }

      // Directly dispatch the action with the payload
      dispatch(completeQuiz(payload))

      // Force the state to be updated
      dispatch({ type: "FORCE_QUIZ_COMPLETED" })

      // If user is authenticated and we have a quizId, submit results
      if (isAuthenticated && state.quizId) {
        handleSubmitQuizResults({
          quizId: state.quizId,
          slug: state.slug || "test-quiz",
          quizType: state.quizType || "mcq",
          answers: payload.answers,
          score: payload.score,
        })
      }

      return true // Return true to indicate success
    },
    [dispatch, state, isAuthenticated, handleSubmitQuizResults],
  )

  // Helper function to calculate score
  const calculateScore = (answers: Answer[]) => {
    if (!Array.isArray(answers)) return 0
    const correctAnswers = answers.filter((a) => a?.isCorrect).length
    const totalQuestions = answers.length
    return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  }

  // Restart the quiz
  const handleRestartQuiz = useCallback(() => {
    dispatch(resetQuiz())
  }, [dispatch])

  // Handle authentication requirement
  const handleAuthenticationRequired = useCallback(
    (redirectUrl: string) => {
      dispatch(setRequiresAuth(true))
      dispatch(setPendingAuthRequired(true))
      dispatch(setIsProcessingAuth(true))

      // If we're in a browser environment, store the redirect URL
      if (typeof window !== "undefined") {
        sessionStorage.setItem("quizRedirectUrl", redirectUrl)
      }

      // Redirect to sign-in page
      router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`)
    },
    [dispatch, router],
  )

  // Handle guest results
  const handleGuestResults = useCallback(
    (hasResults: boolean) => {
      dispatch(setHasGuestResult(hasResults))
    },
    [dispatch],
  )

  // Clear guest results
  const handleClearGuestResults = useCallback(() => {
    dispatch(clearGuestResults())
  }, [dispatch])

  // Set auth check complete
  const handleAuthCheckComplete = useCallback(
    (isComplete: boolean) => {
      dispatch(setAuthCheckComplete(isComplete))
    },
    [dispatch],
  )

  // Set error
  const handleSetError = useCallback(
    (error: string | null) => {
      dispatch(setError(error))
    },
    [dispatch],
  )

  // Fetch quiz results
  const handleFetchQuizResults = useCallback(
    async ({ quizId, slug, quizType }: { quizId: string; slug: string; quizType: string }) => {
      return dispatch(fetchQuizResults({ quizId, slug, quizType }))
    },
    [dispatch],
  )

  // Update authentication status when session changes
  useMemo(() => {
    if (status !== "loading") {
      dispatch(setIsAuthenticated(isAuthenticated))
    }
  }, [dispatch, isAuthenticated, status])

  // Restore quiz state from saved data
  const restoreQuizState = useCallback(
    (savedState: Partial<any>) => {
      if (!savedState) return

      dispatch(restoreQuizState(savedState))

      // If the quiz was completed, handle completion again
      if (savedState.isCompleted) {
        handleCompleteQuiz({
          answers: savedState.answers || [],
          score: savedState.score || 0,
          completedAt: savedState.completedAt || new Date().toISOString(),
        })
      }
    },
    [dispatch, handleCompleteQuiz],
  )

  return {
    state,
    initializeQuiz,
    submitAnswer: handleSubmitAnswer,
    nextQuestion: handleNextQuestion,
    completeQuiz: handleCompleteQuiz,
    restartQuiz: handleRestartQuiz,
    handleAuthenticationRequired,
    handleGuestResults,
    clearGuestResults: handleClearGuestResults,
    setAuthCheckComplete: handleAuthCheckComplete,
    setError: handleSetError,
    fetchQuizResults: handleFetchQuizResults,
    submitQuizResults: handleSubmitQuizResults,
    restoreQuizState,
  }
}
