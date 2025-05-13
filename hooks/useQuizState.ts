"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useAppDispatch, useAppSelector } from "@/store"
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
  prepareResults,
  type Answer,
  type QuizState,
  type CompleteQuizPayload,
  type QuizResultsData,
} from "@/store/slices/quizSlice"
import { setIsAuthenticated, setIsProcessingAuth, setRedirectUrl, setUser } from "@/store/slices/authSlice"
import { calculateTotalTime } from "@/lib/utils/quiz-index"
import type { PersistPartial } from "redux-persist/es/persistReducer"
import type { RootState } from "@/store"
import type { Question } from "@/lib/quiz-store"

/**
 * Input parameters for quiz initialization
 */
export interface QuizInitializeInput {
  id?: string
  quizId?: string
  slug: string
  title: string
  quizType: string
  questions: Question[]
  requiresAuth?: boolean
  [key: string]: any
}

/**
 * Input parameters for submitting quiz results
 */
export interface SubmitResultsInput {
  quizId: string
  slug: string
  quizType: string
  answers: Answer[]
  score: number
}

/**
 * Return type for the useQuiz hook
 */
export interface UseQuizReturn {
  quizState: QuizState & PersistPartial
  authState: RootState["auth"]
  isAuthenticated: boolean
  isLoading: boolean
  initialize: (quizData: QuizInitializeInput) => void
  submitAnswer: (answerData: Answer) => void
  nextQuestion: () => void
  completeQuiz: (data?: CompleteQuizPayload) => Promise<boolean>
  restartQuiz: () => void
  submitResults: (data: SubmitResultsInput) => Promise<any>
  requireAuthentication: (redirectUrl: string) => void
  restoreState: () => Promise<boolean>
  getResultsData: () => QuizResultsData | null
  navigateToResults: (slug: string) => void
}

/**
 * Parameters for the useQuiz hook
 */
export interface UseQuizParams {
  quizData?: {
    questions?: Question[]
    [key: string]: any
  }
}

/**
 * Custom hook for managing quiz state
 */
export function useQuiz({ quizData }: UseQuizParams = {}): UseQuizReturn {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { data: session, status } = useSession()

  const quizState = useAppSelector((state) => state.quiz) as QuizState & PersistPartial
  const authState = useAppSelector((state) => state.auth)

  const isMounted = useRef(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Fix the cleanup function to properly manage the mounted state
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = true;
    }
  }, [])

  const isAuthenticated = useMemo(() => status === "authenticated" && !!session?.user, [session, status])

  useEffect(() => {
    if (!isMounted.current) return
    dispatch(setIsAuthenticated(isAuthenticated))
    if (isAuthenticated && session?.user) {
      dispatch(setUser(session.user))
    }
  }, [isAuthenticated, session, dispatch])

  useEffect(() => {
    if (!isMounted.current) return
    if (quizState.questions?.length > 0 || quizState.error) {
      setIsLoading(false)
    }
  }, [quizState.questions, quizState.error])

  /**
   * Initializes the quiz with the provided data
   * @param quizData Quiz initialization data
   */
  const initialize = useCallback(
    (quizData: QuizInitializeInput) => {
      if (!isMounted.current) return
      setIsLoading(true)
      try {
        // Added validation for required quiz data
        if (!quizData) {
          throw new Error("No quiz data provided")
        }

        if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
          throw new Error("Invalid quiz data: questions array is empty or invalid")
        }

        if (!quizData.title) {
          throw new Error("Invalid quiz data: title is required")
        }

        if (!quizData.slug) {
          throw new Error("Invalid quiz data: slug is required")
        }

        // Validate each question has required properties
        quizData.questions.forEach((question, index) => {
          if (!question.question) {
            throw new Error(`Question at index ${index} is missing required 'question' property`)
          }
        })

        dispatch(
          initQuiz({
            ...quizData,
            requiresAuth: quizData.requiresAuth ?? true,
          }),
        )
      } catch (err) {
        console.error("Error initializing quiz:", err)
        dispatch(setError(err instanceof Error ? err.message : "Failed to initialize quiz. Please try again."))
      } finally {
        setTimeout(() => {
          if (isMounted.current) setIsLoading(false)
        }, 500)
      }
    },
    [dispatch],
  )

  /**
   * Submits an answer for the current question
   * @param answerData Answer data to submit
   */
  const submitQuizAnswer = useCallback(
    (answerData: Answer) => {
      if (!isMounted.current) return

      try {
        // Validate answer data
        if (!answerData) {
          throw new Error("No answer data provided")
        }

        if (answerData.answer === undefined || answerData.answer === null) {
          throw new Error("Answer cannot be null or undefined")
        }

        if (
          quizState.currentQuestionIndex < 0 ||
          !quizState.questions ||
          quizState.currentQuestionIndex >= quizState.questions.length
        ) {
          throw new Error(`Invalid question index: ${quizState.currentQuestionIndex}`)
        }

        dispatch(submitAnswer(answerData))
      } catch (error) {
        console.error("Error submitting answer:", error)
      }
    },
    [dispatch, quizState.currentQuestionIndex, quizState.questions],
  )

  /**
   * Navigates to the next question
   */
  const goToNextQuestion = useCallback(() => {
    if (!isMounted.current) return

    try {
      if (!quizState.questions || quizState.questions.length === 0) {
        throw new Error("No quiz questions available")
      }

      if (quizState.currentQuestionIndex >= quizState.questions.length - 1) {
        throw new Error("Already at the last question")
      }

      dispatch(nextQuestion())
    } catch (error) {
      console.error("Error moving to next question:", error)
    }
  }, [dispatch, quizState.currentQuestionIndex, quizState.questions])

  /**
   * Submits quiz results to the server
   * @param data Result data to submit
   */
  const submitResults = useCallback(
    async ({ quizId, slug, quizType, answers, score }: SubmitResultsInput) => {
      try {
        // Validate input data
        if (!quizId) throw new Error("quizId is required")
        if (!slug) throw new Error("slug is required")
        if (!quizType) throw new Error("quizType is required")
        if (!Array.isArray(answers)) throw new Error("answers must be an array")
        if (typeof score !== "number") throw new Error("score must be a number")

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
      } catch (error) {
        console.error("Error submitting results:", error)
        throw error
      }
    },
    [dispatch],
  )

  /**
   * Completes the quiz and optionally submits results
   * @param data Optional data for completing the quiz
   */
  const completeQuizWithAnswers = useCallback(
    async (data?: CompleteQuizPayload): Promise<boolean> => {
      try {
        // Ensure we have valid quiz data
        if (!quizState.questions || quizState.questions.length === 0) {
          throw new Error("Cannot complete quiz: no questions available")
        }

        const answers = data?.answers || quizState.answers || []

        // Filter only valid answers
        const validAnswers = answers.filter((answer) => answer !== null && answer !== undefined)

        if (validAnswers.length === 0) {
          console.warn("Completing quiz with no valid answers")
        }

        const correctAnswers = validAnswers.filter((a) => a?.isCorrect).length
        const score = data?.score ?? Math.round((correctAnswers / (validAnswers.length || 1)) * 100)
        const completedAt = data?.completedAt || new Date().toISOString()

        // Complete the quiz
        dispatch(completeQuiz({ answers, score, completedAt }))

        // Prepare results data for the results page
        dispatch(
          prepareResults({
            quizId: quizState.quizId,
            slug: quizState.slug || "",
            title: quizState.title || "",
            quizType: quizState.quizType || "code",
            score,
            totalQuestions: quizState.questions.length,
            correctAnswers,
            answers: validAnswers as Answer[],
            completedAt,
          }),
        )

        // Submit results if user is authenticated
        if (isAuthenticated && quizState.quizId) {
          await submitResults({
            quizId: quizState.quizId,
            slug: quizState.slug || "",
            quizType: quizState.quizType || "code",
            answers: validAnswers as Answer[],
            score,
          })
        }
        return true
      } catch (err) {
        console.error("Error completing quiz:", err)
        dispatch(setError(err instanceof Error ? err.message : "Failed to complete quiz. Please try again."))
        return false
      }
    },
    [dispatch, quizState, isAuthenticated, submitResults],
  )

  /**
   * Restarts the quiz
   */
  const restartQuiz = useCallback(() => {
    if (!isMounted.current) return
    setIsLoading(true)
    dispatch(resetQuiz())
    setTimeout(() => {
      if (isMounted.current) setIsLoading(false)
    }, 300)
  }, [dispatch])

  /**
   * Initiates authentication flow if required
   * @param redirectUrl URL to redirect to after authentication
   */
  const requireAuthentication = useCallback(
    (redirectUrl: string) => {
      if (!isMounted.current) return
      if (!redirectUrl) {
        console.error("No redirect URL provided for authentication")
        return
      }

      try {
        // Save current quiz state before redirecting
        if (quizState) {
          dispatch(
            saveStateBeforeAuth({
              quizId: quizState.quizId,
              slug: quizState.slug,
              quizType: quizState.quizType,
              currentQuestionIndex: quizState.currentQuestionIndex,
              answers: quizState.answers?.filter(Boolean) as Answer[],
              isCompleted: quizState.isCompleted,
              score: quizState.score,
              completedAt: quizState.completedAt || new Date().toISOString(),
            }),
          )
        }

        dispatch(setRequiresAuth(true))
        dispatch(setPendingAuthRequired(true))
        dispatch(setIsProcessingAuth(true))
        dispatch(setRedirectUrl(redirectUrl))

        // Redirect to auth page
        router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`)
      } catch (error) {
        console.error("Error during authentication redirect:", error)
      }
    },
    [dispatch, router, quizState],
  )

  /**
   * Restores quiz state after authentication
   */
  const restoreState = useCallback(async (): Promise<boolean> => {
    if (!isMounted.current) return false
    setIsLoading(true)

    try {
      // Check if we have a saved state to restore
      if (!quizState.savedState) {
        console.warn("No saved state to restore")
        setIsLoading(false)
        return false
      }

      dispatch(restoreFromSavedState())

      const saved = quizState.savedState

      // Reinitialize quiz if needed
      if (saved && (!quizState.questions || quizState.questions.length === 0)) {
        if (quizData?.questions?.length) {
          dispatch(
            initQuiz({
              id: saved.quizId,
              slug: saved.slug || "",
              title: "Restored Quiz",
              quizType: saved.quizType || "code",
              questions: quizData.questions,
            }),
          )
        } else {
          throw new Error("Failed to restore quiz: missing question data")
        }
      }

      // Restore completed state if quiz was completed
      if (saved?.isCompleted) {
        dispatch(
          completeQuiz({
            answers: saved.answers || [],
            score: saved.score || 0,
            completedAt: saved.completedAt || new Date().toISOString(),
          }),
        )
      }

      dispatch(clearSavedState())
      return true
    } catch (err) {
      console.error("Error restoring quiz state:", err)
      dispatch(setError(err instanceof Error ? err.message : "Failed to restore quiz state"))
      return false
    } finally {
      setTimeout(() => {
        if (isMounted.current) setIsLoading(false)
      }, 300)
    }
  }, [dispatch, quizState.savedState, quizState.questions, quizData])

  /**
   * Gets the formatted results data for the results page
   */
  const getResultsData = useCallback((): QuizResultsData | null => {
    if (!quizState.isCompleted || !quizState.resultsData) {
      return null
    }

    return quizState.resultsData
  }, [quizState.isCompleted, quizState.resultsData])

  /**
   * Navigates to the results page
   */
  const navigateToResults = useCallback(
    (slug: string) => {
      if (!quizState.isCompleted) {
        console.warn("Cannot navigate to results: quiz is not completed")
        return
      }

      router.push(`/dashboard/code/${slug}/results`)
    },
    [quizState.isCompleted, router],
  )

  // Auto-restore state after authentication
  useEffect(() => {
    if (!isMounted.current || !isAuthenticated) return

    const urlParams = new URLSearchParams(window.location.search)
    const fromAuth = urlParams.get("fromAuth") === "true"

    if (fromAuth && quizState.savedState) {
      restoreState().then(() => {
        // Clean up URL after successful restoration
        const url = new URL(window.location.href)
        url.searchParams.delete("fromAuth")
        window.history.replaceState({}, "", url.toString())
      })
    }
  }, [isAuthenticated, quizState.savedState, restoreState])

  return {
    quizState,
    authState,
    isAuthenticated,
    isLoading,
    initialize,
    submitAnswer: submitQuizAnswer,
    nextQuestion: goToNextQuestion,
    completeQuiz: completeQuizWithAnswers,
    restartQuiz,
    submitResults,
    requireAuthentication,
    restoreState,
    getResultsData,
    navigateToResults,
  }
}
