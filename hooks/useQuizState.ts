"use client"

import { useCallback, useEffect, useMemo } from "react"
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
  setError,
  submitQuizResults,
  saveStateBeforeAuth,
  restoreFromSavedState,
  clearSavedState,
  type Answer,
} from "@/store/slices/quizSlice"
import { setIsAuthenticated, setIsProcessingAuth, setRedirectUrl, setUser } from "@/store/slices/authSlice"
import { calculateTotalTime } from "@/lib/utils/quiz-index"

export function useQuiz() {
  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state) => state.quiz)
  const authState = useAppSelector((state) => state.auth)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Update authentication state based on session
  useEffect(() => {
    const isAuthenticated = status === "authenticated" && !!session?.user
    dispatch(setIsAuthenticated(isAuthenticated))

    if (isAuthenticated && session?.user) {
      dispatch(setUser(session.user))
    }
  }, [dispatch, session, status])

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => {
    return status === "authenticated" && !!session?.user
  }, [session, status])

  // Initialize the quiz with data
  const initialize = useCallback(
    (quizData: any) => {
      dispatch(
        initQuiz({
          ...quizData,
          requiresAuth: true, // Always require auth for code quizzes
        }),
      )
    },
    [dispatch],
  )

  // Submit an answer for the current question
  const submitQuizAnswer = useCallback(
    (answerData: Answer) => {
      dispatch(submitAnswer(answerData))
    },
    [dispatch],
  )

  // Move to the next question
  const goToNextQuestion = useCallback(() => {
    dispatch(nextQuestion())
  }, [dispatch])

  // Complete the quiz and calculate score
  const completeQuizWithAnswers = useCallback(
    (data?: { answers?: Answer[]; score?: number; completedAt?: string }) => {
      try {
        // Ensure we have a valid payload
        const payload = {
          answers: data?.answers || [],
          score: data?.score !== undefined ? data.score : 0,
          completedAt: data?.completedAt || new Date().toISOString(),
        }

        // Dispatch the action with the payload
        dispatch(completeQuiz(payload))

        // If user is authenticated and we have a quizId, submit results
        if (isAuthenticated && quizState.quizId) {
          submitResults({
            quizId: quizState.quizId,
            slug: quizState.slug || "test-quiz",
            quizType: quizState.quizType || "code",
            answers: payload.answers,
            score: payload.score,
          }).catch((err) => {
            console.error("Failed to submit quiz results:", err)
          })
        }

        return true
      } catch (err) {
        console.error("Error completing quiz:", err)
        dispatch(setError("Failed to complete quiz. Please try again."))
        return false
      }
    },
    [dispatch, quizState, isAuthenticated],
  )

  // Submit quiz results to the server
  const submitResults = useCallback(
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

  // Restart the quiz
  const restartQuiz = useCallback(() => {
    dispatch(resetQuiz())
  }, [dispatch])

  // Handle authentication flow
  const requireAuthentication = useCallback(
    (redirectUrl: string) => {
      // Save current quiz state
      dispatch(
        saveStateBeforeAuth({
          quizId: quizState.quizId,
          slug: quizState.slug,
          quizType: quizState.quizType,
          currentQuestionIndex: quizState.currentQuestionIndex,
          answers: quizState.answers,
          isCompleted: quizState.isCompleted,
          score: quizState.score,
          completedAt: quizState.completedAt || new Date().toISOString(),
        }),
      )

      // Set up auth flow
      dispatch(setRequiresAuth(true))
      dispatch(setPendingAuthRequired(true))
      dispatch(setIsProcessingAuth(true))
      dispatch(setRedirectUrl(redirectUrl))

      // Redirect to sign-in page
      router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`)
    },
    [dispatch, router, quizState],
  )

  // Restore state after authentication
  const restoreState = useCallback(() => {
    dispatch(restoreFromSavedState())

    // If the quiz was completed before auth, force it to be completed again
    if (quizState.savedState?.isCompleted) {
      dispatch(
        completeQuiz({
          answers: quizState.savedState.answers || [],
          score: quizState.savedState.score || 0,
          completedAt: quizState.savedState.completedAt || new Date().toISOString(),
        }),
      )
    }

    // Clear saved state after restoration
    dispatch(clearSavedState())
  }, [dispatch, quizState.savedState])

  // Check for auth return and restore state if needed
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth") === "true"

      if (fromAuth && isAuthenticated && quizState.savedState) {
        restoreState()

        // Clean up URL
        const url = new URL(window.location.href)
        url.searchParams.delete("fromAuth")
        window.history.replaceState({}, "", url.toString())
      }
    }
  }, [isAuthenticated, quizState.savedState, restoreState])

  return {
    // State
    quizState,
    authState,
    isAuthenticated,

    // Quiz actions
    initialize,
    submitAnswer: submitQuizAnswer,
    nextQuestion: goToNextQuestion,
    completeQuiz: completeQuizWithAnswers,
    restartQuiz,
    submitResults,

    // Auth actions
    requireAuthentication,
    restoreState,
  }
}
