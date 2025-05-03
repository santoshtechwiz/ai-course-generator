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
    (data?: { answers?: Answer[]; score?: number }) => {
      dispatch(completeQuiz(data))
    },
    [dispatch],
  )

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

  // Update authentication status when session changes
  useMemo(() => {
    if (status !== "loading") {
      dispatch(setIsAuthenticated(isAuthenticated))
    }
  }, [dispatch, isAuthenticated, status])

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
  }
}
