"use client"

import { useEffect, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  fetchQuiz,
  submitAnswer,
  submitQuiz,
  getQuizResults,
  fetchQuizHistory,
  resetQuizState,
  setCurrentQuestion,
  setUserAnswer,
  startTimer,
  pauseTimer,
  resumeTimer,
  decrementTimer,
} from "@/store/slices/quizSlice"
import type { QuizType } from "@/app/types/quiz-types"
import { signIn } from "next-auth/react"
import { loadPersistedQuizState, hasAuthRedirectState } from "@/store/middleware/persistQuizMiddleware"
import { formatTime } from "@/lib/utils/quiz-utils"
import { getQuizFromApi } from "@/app/actions/getQuizFromApi"


export function useQuiz() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const quizState = useAppSelector((state) => state.quiz)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  const [isAuthRedirect, setIsAuthRedirect] = useState(false)

  // Check for auth redirect on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAuthRedirect(hasAuthRedirectState())
    }
  }, [])

  // Handle authentication requirement
  const requireAuthentication = useCallback((callbackUrl: string) => {
    signIn(undefined, { callbackUrl })
  }, [])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [timerInterval])

  // Handle timer
  useEffect(() => {
    if (quizState.timerActive && quizState.timeRemaining !== null) {
      const interval = setInterval(() => {
        dispatch(decrementTimer())
      }, 1000)

      setTimerInterval(interval)

      return () => clearInterval(interval)
    } else if (!quizState.timerActive && timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
  }, [quizState.timerActive, quizState.timeRemaining, dispatch])

  // Auto-submit when timer reaches zero
  useEffect(() => {
    if (quizState.timeRemaining === 0 && quizState.quizData) {
      handleSubmitQuiz()
    }
  }, [quizState.timeRemaining])

  // Restore persisted state after authentication redirect
  useEffect(() => {
    if (isAuthRedirect) {
      const persistedState = loadPersistedQuizState()
      if (persistedState && persistedState.currentQuizId) {
        // Restore the quiz
        loadQuiz(persistedState.currentQuizId, (persistedState.quizData?.type as QuizType) || "mcq")
          .then(() => {
            // Restore current question
            if (persistedState.currentQuestion !== undefined) {
              dispatch(setCurrentQuestion(persistedState.currentQuestion))
            }

            // Restore user answers
            if (persistedState.userAnswers && persistedState.userAnswers.length > 0) {
              persistedState.userAnswers.forEach((answer) => {
                dispatch(setUserAnswer(answer))
              })
            }

            // Restore timer state
            if (persistedState.timeRemaining !== null) {
              dispatch(startTimer())
              if (!persistedState.timerActive) {
                dispatch(pauseTimer())
              }
            }

            setIsAuthRedirect(false)
          })
          .catch((error) => {
            console.error("Failed to restore quiz after auth redirect:", error)
            setIsAuthRedirect(false)
          })
      }
    }
  }, [isAuthRedirect, dispatch])

  // Handle API errors, especially authentication errors
  const handleApiError = useCallback(
    (error: any, redirectPath?: string) => {
      console.error("API Error:", error)

      // Check if it's an authentication error
      if (typeof error === "string" && (error === "Unauthorized" || error.includes("Session"))) {
        // Redirect to login if path is provided
        if (redirectPath) {
          requireAuthentication(redirectPath)
        }
      }

      throw error
    },
    [requireAuthentication],
  )

  // Load quiz data
   const loadQuiz = useCallback(
    async (slug: string, type: QuizType = "mcq", initialData = null) => {
      if (initialData) {
        // If we have initial data, use that instead of fetching
        dispatch(fetchQuiz.fulfilled(initialData, "", { slug, type }))
        return initialData
      }

      try {
        // Otherwise fetch from API
        dispatch(fetchQuiz.pending("", { slug, type }))
        const data = await getQuizFromApi(slug, type)
        dispatch(fetchQuiz.fulfilled(data, "", { slug, type }))
        return data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load quiz"
        dispatch(fetchQuiz.rejected(null, "", { slug, type }, errorMessage))
        throw error
      }
    },
    [dispatch],
  )

  // Navigate to next question
  const nextQuestion = useCallback(() => {
    if (quizState.quizData && quizState.currentQuestion < quizState.quizData.questions.length - 1) {
      dispatch(setCurrentQuestion(quizState.currentQuestion + 1))
      return true
    }
    return false
  }, [dispatch, quizState.currentQuestion, quizState.quizData])

  // Navigate to previous question
  const previousQuestion = useCallback(() => {
    if (quizState.currentQuestion > 0) {
      dispatch(setCurrentQuestion(quizState.currentQuestion - 1))
      return true
    }
    return false
  }, [dispatch, quizState.currentQuestion])

  // Check if current question is the last one
  const isLastQuestion = useCallback(() => {
    if (!quizState.quizData) return true
    return quizState.currentQuestion === quizState.quizData.questions.length - 1
  }, [quizState.currentQuestion, quizState.quizData])

  // Save user answer
  const saveAnswer = useCallback(
    (questionId: string, answer: string | Record<string, string>) => {
      dispatch(setUserAnswer({ questionId, answer }))
    },
    [dispatch],
  )

  // Submit answer for a single question
  const handleSubmitAnswer = useCallback(
    async ({
      questionId,
      answer,
      slug,
    }: { questionId: string; answer: string | Record<string, string>; slug: string }) => {
      try {
        const result = await dispatch(submitAnswer({ questionId, answer, slug })).unwrap()
        return result
      } catch (error) {
        console.error("Failed to submit answer:", error)
        throw error
      }
    },
    [dispatch],
  )

  // Submit entire quiz
 const submitQuizAction = useCallback(
    async (slug: string) => {
      try {
        if (!quizState.userAnswers.length) {
          throw new Error("No answers to submit")
        }

        const results = await dispatch(
          submitQuiz({
            slug,
            answers: quizState.userAnswers,
          }),
        ).unwrap()

        return results
      } catch (error) {
        console.error("Error submitting quiz:", error)
        throw error
      }
    },
    [dispatch, quizState.userAnswers],
  )
  // Start quiz timer
  const startQuizTimer = useCallback(() => {
    dispatch(startTimer())
  }, [dispatch])

  // Pause quiz timer
  const pauseQuizTimer = useCallback(() => {
    dispatch(pauseTimer())
  }, [dispatch])

  // Resume quiz timer
  const resumeQuizTimer = useCallback(() => {
    dispatch(resumeTimer())
  }, [dispatch])

  // Get quiz results
  const getResults = useCallback(
    (slug: string) => {
      return dispatch(getQuizResults(slug)).unwrap()
    },
    [dispatch],
  )

  // Load quiz history
  const loadQuizHistory = useCallback(() => {
    return dispatch(fetchQuizHistory()).unwrap()
  }, [dispatch])

  // Format remaining time
  const formatRemainingTime = useCallback(() => {
    return formatTime(quizState.timeRemaining)
  }, [quizState.timeRemaining])

  // Get current question
  const getCurrentQuestion = useCallback(() => {
    if (!quizState.quizData || !quizState.quizData.questions.length) return null

    const index = quizState.currentQuestion
    if (index < 0 || index >= quizState.quizData.questions.length) return null

    return quizState.quizData.questions[index]
  }, [quizState.quizData, quizState.currentQuestion])

  // Get user answer for current question
  const getCurrentAnswer = useCallback(() => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion) return null

    const answer = quizState.userAnswers.find((a) => a.questionId === currentQuestion.id)
    return answer ? answer.answer : null
  }, [getCurrentQuestion, quizState.userAnswers])

  // Check if all questions are answered
  const areAllQuestionsAnswered = useCallback(() => {
    if (!quizState.quizData) return false

    return quizState.userAnswers.length === quizState.quizData.questions.length
  }, [quizState.quizData, quizState.userAnswers])

  // Navigate to quiz results
  const navigateToResults = useCallback(
    (slug: string) => {
      if (!quizState.quizData) return
      router.push(`/dashboard/${quizState.quizData.type}/${slug}/results`)
    },
    [router, quizState.quizData],
  )

  return {
    // State
    quizData: quizState.quizData,
    currentQuestion: quizState.currentQuestion,
    userAnswers: quizState.userAnswers,
    isLoading: quizState.isLoading,
    isSubmitting: quizState.isSubmitting,
    error: quizState.error,
    results: quizState.results,
    isCompleted: quizState.isCompleted,
    quizHistory: quizState.quizHistory,
    currentQuizId: quizState.currentQuizId,
    timeRemaining: quizState.timeRemaining,
    timerActive: quizState.timerActive,
    isAuthRedirect,

    // Actions
    loadQuiz,
    resetQuizState: () => dispatch(resetQuizState()),
    nextQuestion,
    previousQuestion,
    isLastQuestion,
    saveAnswer,
    setUserAnswer: saveAnswer,
    submitAnswer: handleSubmitAnswer,
    submitQuiz: submitQuizAction,
    startTimer: startQuizTimer,
    pauseTimer: pauseQuizTimer,
    resumeTimer: resumeQuizTimer,
    getResults,
    loadQuizHistory,
    requireAuthentication,

    // Helpers
    formatRemainingTime,
    getCurrentQuestion,
    getCurrentAnswer,
    areAllQuestionsAnswered,
    navigateToResults,
  }
}
