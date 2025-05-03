"use client"

import { useCallback, useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  setIsAuthenticated,
  setIsProcessingAuth,
  setAuthCheckComplete,
  setPendingAuthRequired,
  setRequiresAuth,
  setHasGuestResult,
  resetQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  clearGuestResults,
  setError,
  initQuiz,
  fetchQuizResults,
  submitQuizResults,
} from "@/store/slices/quizSlice"
import { calculateTotalTime } from "@/lib/utils/quiz-index"

export function useQuizState() {
  const dispatch = useDispatch()

  // Use session hook safely
  const sessionResult = useSession()
  const session = sessionResult.data
  const status = sessionResult.status

  const quizState = useSelector((state: any) => state.quiz || {})

  // Use router safely
  let router = {
    push: (url: string) => console.log(`Mock router push: ${url}`),
    replace: (url: string) => console.log(`Mock router replace: ${url}`),
    back: () => console.log("Mock router back"),
    forward: () => console.log("Mock router forward"),
    refresh: () => console.log("Mock router refresh"),
    prefetch: (url: string) => console.log(`Mock router prefetch: ${url}`),
  }

  try {
    router = useRouter()
  } catch (error) {
    console.warn("Router hook failed, using mock router")
  }

  // Use a ref to track if we've already updated the auth state
  const authStateUpdated = useRef(false)

  // Safely check if user is authenticated
  const isAuthenticated = !!session?.user

  // Handle authentication state changes
  useEffect(() => {
    // Only run this effect when the session status is determined (not "loading")
    if (status !== "loading") {
      const isUserAuthenticated = status === "authenticated"

      // Only dispatch if we haven't updated yet or if the auth state has changed
      if (!authStateUpdated.current || quizState.isAuthenticated !== isUserAuthenticated) {
        dispatch(setIsAuthenticated(isUserAuthenticated))

        // If this is the first time we're running this effect, mark it as updated
        if (!authStateUpdated.current) {
          authStateUpdated.current = true
        }
      }
    }
  }, [status, dispatch, quizState.isAuthenticated])

  // Initialize quiz with data
  const initializeQuiz = useCallback(
    (quizData: any) => {
      // Initialize with null values for each question
      const questionCount = quizData?.questions?.length || 0
      const initialAnswers = Array(questionCount).fill(null)
      const initialTimeSpent = Array(questionCount).fill(0)

      dispatch(
        initQuiz({
          ...quizData,
          isAuthenticated,
          initialAnswers,
          initialTimeSpent,
        }),
      )
    },
    [dispatch, isAuthenticated],
  )

  // Handle submitting an answer
  const handleSubmitAnswer = useCallback(
    (answer: any) => {
      dispatch(
        submitAnswer({
          ...answer,
          index: quizState.currentQuestionIndex,
        }),
      )
      return quizState.answers // Return answers for backward compatibility
    },
    [dispatch, quizState.answers, quizState.currentQuestionIndex],
  )

  // Handle moving to the next question
  const handleNextQuestion = useCallback(() => {
    dispatch(nextQuestion())
  }, [dispatch])

  // Handle completing the quiz
  const handleCompleteQuiz = useCallback(
    (answers: any[]) => {
      // Calculate score
      const correctAnswers = Array.isArray(answers) ? answers.filter((a) => a?.isCorrect).length : 0
      const totalQuestions = quizState.questions?.length || 0
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

      // Complete the quiz with calculated score
      dispatch(
        completeQuiz({
          answers,
          score,
          completedAt: new Date().toISOString(),
        }),
      )

      // If user is authenticated, submit results to the database
      if (isAuthenticated && quizState.quizId) {
        // Fix: Ensure answers is an array before using reduce
        const totalTime = Array.isArray(answers) ? calculateTotalTime(answers) : 0

        dispatch(
          submitQuizResults({
            quizId: quizState.quizId,
            slug: quizState.slug,
            quizType: quizState.quizType,
            answers,
            score,
            totalTime,
            totalQuestions: quizState.questions?.length || (Array.isArray(answers) ? answers.length : 0),
          }),
        )
      } else if (!isAuthenticated) {
        // For guest users, set flag that they need to authenticate
        dispatch(setHasGuestResult(true))
        dispatch(setRequiresAuth(true))
      }
    },
    [dispatch, isAuthenticated, quizState.quizId, quizState.slug, quizState.quizType, quizState.questions],
  )

  // Handle restarting the quiz
  const handleRestartQuiz = useCallback(() => {
    dispatch(resetQuiz())
  }, [dispatch])

  // Handle authentication required
  const handleAuthenticationRequired = useCallback(
    (redirectUrl?: string) => {
      // Set flag that auth is required
      dispatch(setRequiresAuth(true))
      dispatch(setPendingAuthRequired(true))
      dispatch(setIsProcessingAuth(true))

      // Redirect to sign in page if URL is provided
      if (redirectUrl && router && typeof router.push === "function") {
        // Use router to redirect to sign-in page
        router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`)
      }
    },
    [dispatch],
  )

  // Fetch quiz results
  const handleFetchQuizResults = useCallback(async () => {
    if (!quizState.quizId || !quizState.slug) {
      return false
    }

    try {
      const result = await dispatch(
        fetchQuizResults({
          quizId: quizState.quizId,
          slug: quizState.slug,
          quizType: quizState.quizType,
        }) as any,
      ).unwrap()

      return !!result
    } catch (error) {
      console.error("Error fetching quiz results:", error)
      return false
    }
  }, [dispatch, quizState.quizId, quizState.slug, quizState.quizType])

  // Retry loading results
  const handleRetryLoadingResults = useCallback(async () => {
    dispatch(setError(null))
    return handleFetchQuizResults()
  }, [dispatch, handleFetchQuizResults])

  // Clear guest results
  const handleClearGuestResults = useCallback(() => {
    dispatch(clearGuestResults())
  }, [dispatch])

  // Set authentication check complete
  const handleSetAuthCheckComplete = useCallback(() => {
    dispatch(setAuthCheckComplete(true))
    dispatch(setIsProcessingAuth(false))
  }, [dispatch])

  // Return the state and actions in a format compatible with the original QuizContext
  return {
    state: {
      ...quizState,
      isAuthenticated,
    },
    isAuthenticated,
    initializeQuiz,
    submitAnswer: handleSubmitAnswer,
    nextQuestion: handleNextQuestion,
    completeQuiz: handleCompleteQuiz,
    restartQuiz: handleRestartQuiz,
    handleAuthenticationRequired,
    fetchQuizResults: handleFetchQuizResults,
    retryLoadingResults: handleRetryLoadingResults,
    clearGuestResults: handleClearGuestResults,
    setAuthCheckComplete: handleSetAuthCheckComplete,
    dispatch,
  }
}

export default useQuizState
