"use client"

import { useEffect, useCallback, useState, useRef } from "react"
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

export function useQuiz() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const quizState = useAppSelector((state) => state.quiz)
  const [isAuthRedirect, setIsAuthRedirect] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Timer effect
  useEffect(() => {
    if (quizState.timerActive && quizState.timeRemaining !== null) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          dispatch(decrementTimer())
        }, 1000)
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [quizState.timerActive, quizState.timeRemaining, dispatch])

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (
      quizState.timeRemaining === 0 &&
      !quizState.isCompleted &&
      quizState.quizData &&
      quizState.userAnswers.length > 0
    ) {
      void handleSubmitQuiz(quizState.quizData.slug)
    }
  }, [quizState.timeRemaining, quizState.isCompleted, quizState.quizData, quizState.userAnswers])

  // Restore after auth redirect
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAuthRedirect(hasAuthRedirectState())
    }
  }, [])

  useEffect(() => {
    if (!isAuthRedirect) return

    const persisted = loadPersistedQuizState()
    if (!persisted || !persisted.quizData) {
      setIsAuthRedirect(false)
      return
    }

    const { quizData, currentQuestion, userAnswers, timerActive, timeRemaining } = persisted

    void dispatch(fetchQuiz.fulfilled(quizData, "", {} as any)) // Manually inject quiz data into Redux

    if (typeof currentQuestion === "number") dispatch(setCurrentQuestion(currentQuestion))
    if (Array.isArray(userAnswers)) userAnswers.forEach((ans) => dispatch(setUserAnswer(ans)))
    if (typeof timeRemaining === "number") dispatch(startTimer())
    if (!timerActive) dispatch(pauseTimer())

    setIsAuthRedirect(false)
  }, [isAuthRedirect, dispatch])

  const requireAuthentication = useCallback((callbackUrl: string) => {
    signIn(undefined, { callbackUrl })
  }, [])

const loadQuiz = useCallback(
  async (slug: string, type: QuizType = "mcq", initialData = null) => {
    if (initialData) {
      dispatch(fetchQuiz.fulfilled(initialData, "", { slug, type })) // ✅ hydrate Redux state
      return initialData
    }

    try {
      const result = await dispatch(fetchQuiz({ slug, type })).unwrap()
      return result
    } catch (error) {
      console.error("Error loading quiz:", error)
      throw error
    }
  },
  [dispatch],
)


const nextQuestion = useCallback(() => {
  const questions = quizState.quizData?.questions
  if (questions && quizState.currentQuestion < questions.length - 1) {
    dispatch(setCurrentQuestion(quizState.currentQuestion + 1))
    return true
  }
  return false
}, [dispatch, quizState.currentQuestion, quizState.quizData])


  const previousQuestion = useCallback(() => {
    if (quizState.currentQuestion <= 0) return false
    dispatch(setCurrentQuestion(quizState.currentQuestion - 1))
    return true
  }, [dispatch, quizState.currentQuestion])

  const isLastQuestion = useCallback(() => {
    return (
      quizState.quizData?.questions &&
      quizState.currentQuestion === quizState.quizData.questions.length - 1
    )
  }, [quizState.quizData, quizState.currentQuestion])

  const saveAnswer = useCallback(
    (questionId: string, answer: string | Record<string, string>) => {
      dispatch(setUserAnswer({ questionId, answer }))
    },
    [dispatch],
  )

  const handleSubmitAnswer = useCallback(
    async ({ slug, questionId, answer }: { slug: string; questionId: string; answer: string | Record<string, string> }) => {
      try {
        return await dispatch(submitAnswer({ slug, questionId, answer })).unwrap()
      } catch (err) {
        console.error("Answer submission error:", err)
        throw new Error("Failed to submit answer.")
      }
    },
    [dispatch],
  )

const handleSubmitQuiz = useCallback(
  async (slug: string) => {
    if (!quizState.userAnswers.length) {
      throw new Error("No answers to submit")
    }

    const quizMeta = quizState.quizData
    if (!quizMeta || !quizMeta.id || !quizMeta.type) {
      throw new Error("Missing quiz metadata for submission")
    }

    const payload = {
      slug,
      quizId: quizMeta.id,
      type: quizMeta.type,
      answers: quizState.userAnswers.map((a) => ({
        questionId: a.questionId,
        answer: a.answer,
      })),
      timeTaken:
        quizMeta.timeLimit && quizState.timeRemaining != null
          ? quizMeta.timeLimit * 60 - quizState.timeRemaining
          : undefined,
    }

    try {
      const result = await dispatch(submitQuiz(payload)).unwrap()
      return result
    } catch (error) {
      console.error("Error submitting quiz:", error)
      throw error
    }
  },
  [dispatch, quizState.userAnswers, quizState.quizData, quizState.timeRemaining],
)


  const startQuizTimer = useCallback(() => dispatch(startTimer()), [dispatch])
  const pauseQuizTimer = useCallback(() => dispatch(pauseTimer()), [dispatch])
  const resumeQuizTimer = useCallback(() => dispatch(resumeTimer()), [dispatch])

  const getResults = useCallback((slug: string) => dispatch(getQuizResults(slug)).unwrap(), [dispatch])
  const loadQuizHistory = useCallback(() => dispatch(fetchQuizHistory()).unwrap(), [dispatch])

  const formatRemainingTime = useCallback(() => formatTime(quizState.timeRemaining), [quizState.timeRemaining])

  const getCurrentQuestion = useCallback(() => {
    const list = quizState.quizData?.questions
    return list?.[quizState.currentQuestion] || null
  }, [quizState.quizData, quizState.currentQuestion])

  const getCurrentAnswer = useCallback(() => {
    const current = getCurrentQuestion()
    if (!current) return null
    const match = quizState.userAnswers.find((a) => a.questionId === current.id)
    return match?.answer ?? null
  }, [getCurrentQuestion, quizState.userAnswers])

  const areAllQuestionsAnswered = useCallback(() => {
    return (
      quizState.quizData?.questions?.length === quizState.userAnswers.length
    )
  }, [quizState.quizData, quizState.userAnswers])

  const navigateToResults = useCallback(
    (slug: string) => {
      const type = quizState.quizData?.type || "mcq"
      router.push(`/dashboard/${type}/${slug}/results`)
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
    error: quizState.quizError,
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
    submitQuiz: handleSubmitQuiz,
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
