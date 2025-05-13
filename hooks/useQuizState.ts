"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAppDispatch } from "@/store"
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
  type QuizState,
  CompleteQuizPayload,
} from "@/store/slices/quizSlice"
import { setIsAuthenticated, setIsProcessingAuth, setRedirectUrl, setUser } from "@/store/slices/authSlice"
import { calculateTotalTime } from "@/lib/utils/quiz-index"
import type { PersistPartial } from "redux-persist/es/persistReducer"

// Define a custom selector for quiz state that handles PersistPartial
import { useAppSelector } from "@/store"

// Define the input types for the hook's methods
interface QuizInitializeInput {
  id?: string
  quizId?: string
  slug?: string
  title?: string
  quizType?: string
  questions?: any[]
  requiresAuth?: boolean
  [key: string]: any
}

interface CompleteQuizInput {
  answers?: Answer[]
  score?: number
  completedAt?: string
}

interface SubmitResultsInput {
  quizId: string
  slug: string
  quizType: string
  answers: Answer[]
  score: number
}

// Define the return type of the hook
interface UseQuizReturn {
  quizState: QuizState & PersistPartial
  authState: any
  isAuthenticated: boolean
  isLoading: boolean
  initialize: (quizData: QuizInitializeInput) => void
  submitAnswer: (answerData: Answer) => void
  nextQuestion: () => void
  completeQuiz: (data?: CompleteQuizInput) => Promise<boolean>
  restartQuiz: () => void
  submitResults: (data: SubmitResultsInput) => Promise<any>
  requireAuthentication: (redirectUrl: string) => void
  restoreState: () => void
}

export function useQuiz(): UseQuizReturn {
  const dispatch = useAppDispatch()
  // Use a type assertion to handle PersistPartial
  const quizState = useAppSelector((state) => state.quiz) as QuizState & PersistPartial
  const authState = useAppSelector((state) => state.auth)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Update authentication state based on session
  useEffect(() => {
    if (!isMounted.current) return

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

  // Update loading state when quiz state changes
  useEffect(() => {
    if (!isMounted.current) return

    // Set loading to false once we have questions or an error
    if (quizState.questions && quizState.questions.length > 0) {
      setIsLoading(false)
    } else if (quizState.error) {
      setIsLoading(false)
    }
  }, [quizState.questions, quizState.error])

  // Initialize the quiz with data
  const initialize = useCallback(
    (quizData: QuizInitializeInput) => {
      if (!isMounted.current) return

      setIsLoading(true)

      try {
        dispatch(
          initQuiz({
            ...quizData,
            requiresAuth: quizData.requiresAuth ?? true, // Use provided value or default to true
          }),
        )

        // Set loading to false after a short delay to ensure state is updated
        setTimeout(() => {
          if (isMounted.current) {
            setIsLoading(false)
          }
        }, 500)
      } catch (error) {
        console.error("Error initializing quiz:", error)
        dispatch(setError("Failed to initialize quiz. Please try again."))
        setIsLoading(false)
      }
    },
    [dispatch],
  )

  // Submit an answer for the current question
  const submitQuizAnswer = useCallback(
    (answerData: Answer) => {
      if (!isMounted.current) return

      dispatch(submitAnswer(answerData))
    },
    [dispatch],
  )

  // Move to the next question
  const goToNextQuestion = useCallback(() => {
    if (!isMounted.current) return

    dispatch(nextQuestion())
  }, [dispatch])

  // Complete the quiz and calculate score
  const completeQuizWithAnswers = useCallback(
    async (data?: CompleteQuizInput): Promise<boolean> => {
      if (!isMounted.current) return false

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
          await submitResults({
            quizId: quizState.quizId,
            slug: quizState.slug || "test-quiz",
            quizType: quizState.quizType || "code",
            answers: payload.answers,
            score: payload.score,
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
    async ({ quizId, slug, quizType, answers, score }: SubmitResultsInput) => {
      if (!isMounted.current) return

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
    if (!isMounted.current) return

    setIsLoading(true)
    dispatch(resetQuiz())

    // Set loading to false after a short delay to ensure state is updated
    setTimeout(() => {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }, 300)
  }, [dispatch])

  // Handle authentication flow
  const requireAuthentication = useCallback(
    (redirectUrl: string) => {
      if (!isMounted.current) return

      // Make sure we have the required properties before saving state
      if (quizState) {
        // Save current quiz state in Redux
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
      }

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
    if (!isMounted.current) return

    setIsLoading(true)
    dispatch(restoreFromSavedState())

    // If the quiz was completed before auth, force it to be completed again
    if (quizState.savedState?.isCompleted) {
      dispatch(
        completeQuiz({
          answers: quizState.savedState?.answers || [],
          score: quizState.savedState?.score || 0,
          completedAt: quizState.savedState?.completedAt || new Date().toISOString(),
        } as CompleteQuizPayload),
      )
    }

    // Clear saved state after restoration
    dispatch(clearSavedState())

    // Set loading to false after a short delay to ensure state is updated
    setTimeout(() => {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }, 300)
  }, [dispatch, quizState.savedState])

  // Check for auth return and restore state if needed
  useEffect(() => {
    if (!isMounted.current) return

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
    isLoading,

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
