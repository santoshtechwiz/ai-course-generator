"use client"

import { useCallback, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/store"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  initQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  resetQuiz,
  setRequiresAuth,
  setPendingAuthRequired,
  setHasNonAuthenticatedUserResult,
  clearNonAuthenticatedUserResults,
  setAuthCheckComplete,
  setError,
  fetchQuizResults,
  submitQuizResults,
  restoreQuizState as restoreQuizStateAction,
  restoreFromSavedState,
  type Answer,
} from "@/store/slices/quizSlice"
import { setIsProcessingAuth, setRedirectUrl } from "@/store/slices/authSlice"
import { calculateTotalTime } from "@/lib/utils/quiz-index"

export const useQuizState = () => {
  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state) => state.quiz)
  const authState = useAppSelector((state) => state.auth)
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
      try {
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
        if (isAuthenticated && quizState.quizId) {
          handleSubmitQuizResults({
            quizId: quizState.quizId,
            slug: quizState.slug || "test-quiz",
            quizType: quizState.quizType || "mcq",
            answers: payload.answers,
            score: payload.score,
          }).catch((err) => {
            console.error("Failed to submit quiz results:", err)
            // Don't set error here to avoid disrupting the user experience
          })
        }

        return true // Return true to indicate success
      } catch (err) {
        console.error("Error completing quiz:", err)
        dispatch(setError("Failed to complete quiz. Please try again."))
        return false
      }
    },
    [dispatch, quizState, isAuthenticated, handleSubmitQuizResults],
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
      dispatch(setRedirectUrl(redirectUrl))

      // Redirect to sign-in page
      router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`)
    },
    [dispatch, router],
  )

  // Handle non-authenticated user results
  const handleNonAuthenticatedUserResults = useCallback(
    (hasResults: boolean) => {
      dispatch(setHasNonAuthenticatedUserResult(hasResults))
    },
    [dispatch],
  )

  // Clear non-authenticated user results
  const handleClearNonAuthenticatedUserResults = useCallback(() => {
    dispatch(clearNonAuthenticatedUserResults())
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

  // Restore quiz state from saved data
  const restoreQuizState = useCallback(
    (savedState: Partial<any>) => {
      if (!savedState) return

      // Log what we're restoring for debugging
      if (process.env.NODE_ENV === "development") {
        console.log("Restoring quiz state:", savedState)
      }

      // Dispatch the restore action to update Redux state
      dispatch(restoreQuizStateAction(savedState))

      // If the quiz was completed, handle completion again with simplified logic
      if (savedState.isCompleted && savedState.answers) {
        dispatch(
          completeQuiz({
            answers: savedState.answers,
            score: savedState.score || 0,
            completedAt: savedState.completedAt || new Date().toISOString(),
          }),
        )
      }
    },
    [dispatch],
  )

  // Restore from saved state in Redux
  const handleRestoreFromSavedState = useCallback(() => {
    // First dispatch the restore action
    dispatch(restoreFromSavedState())

    // Then check if we need to force completion
    const savedState = quizState.savedState
    if (savedState && savedState.isCompleted) {
      // Force the quiz to be completed with the saved data
      dispatch(
        completeQuiz({
          answers: savedState.answers || [],
          score: savedState.score || 0,
          completedAt: savedState.completedAt || new Date().toISOString(),
        }),
      )

      // Force the state to be updated
      dispatch({ type: "FORCE_QUIZ_COMPLETED" })
    }
  }, [dispatch, quizState.savedState])

  // Return these methods in the hook's return value
  return {
    state: quizState,
    authState,
    initializeQuiz,
    submitAnswer: handleSubmitAnswer,
    nextQuestion: handleNextQuestion,
    completeQuiz: handleCompleteQuiz,
    restartQuiz: handleRestartQuiz,
    handleAuthenticationRequired,
    handleNonAuthenticatedUserResults,
    clearNonAuthenticatedUserResults: handleClearNonAuthenticatedUserResults,
    setAuthCheckComplete: handleAuthCheckComplete,
    setError: handleSetError,
    fetchQuizResults: handleFetchQuizResults,
    submitQuizResults: handleSubmitQuizResults,
    restoreQuizState,
    restoreFromSavedState: handleRestoreFromSavedState,
    isAuthenticated,
  }
}
