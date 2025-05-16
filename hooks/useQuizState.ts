"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  fetchQuiz,
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
  markQuizCompleted,
} from "@/store/slices/quizSlice"

import type { QuizData, QuizType } from "@/app/types/quiz-types"
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

  // Start countdown timer
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

  // Auto-submit when time runs out
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

  // Auth redirect state restore
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

    void dispatch(fetchQuiz.fulfilled(quizData, "", {} as any))

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
    async (slug: string, type: QuizType = "mcq", initialData?: QuizData) => {
      if (initialData && Array.isArray(initialData.questions)) {
        // 🔐 Check for required fields
        if (!initialData.id || !initialData.type) {
          console.warn("initialData missing id or type:", initialData)
        }

        dispatch(fetchQuiz.fulfilled(initialData, "", { slug, type }))
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
    return quizState.quizData?.questions && quizState.currentQuestion === quizState.quizData.questions.length - 1
  }, [quizState.quizData, quizState.currentQuestion])

  const saveAnswer = useCallback(
    (questionId: string, answer: string | Record<string, string>) => {
      dispatch(setUserAnswer({ questionId, answer }))
    },
    [dispatch],
  )

const handleSubmitQuiz = useCallback(
  async (slug: string) => {
    if (quizState.isCompleted) {
      console.warn("Quiz already submitted.")
      return
    }

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
      // Set submitting state first to prevent multiple submissions
      dispatch(pauseTimer());
      
      const result = await dispatch(submitQuiz(payload)).unwrap()
      
      // Ensure we mark the quiz as completed even if the unwrap doesn't throw
      if (!quizState.isCompleted) {
        dispatch(markQuizCompleted(result))
      }
      
      return result
    } catch (error: any) {
      console.error("Error submitting quiz:", error?.message || error)
      // Re-enable timer if submission fails
      if (quizState.timeRemaining && quizState.timeRemaining > 0) {
        dispatch(resumeTimer())
      }
      throw error
    }
  },
  [dispatch, quizState.userAnswers, quizState.quizData, quizState.timeRemaining, quizState.isCompleted]
)

  const isAuthenticated = useCallback(() => {
    // This is a simple check - in a real app, you might want to use the session state
    return (typeof window !== "undefined" && !!sessionStorage.getItem("user")) || false
  }, [])

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
    
    // Improved performance by using find direct by question id instead of calling getCurrentQuestion twice
    return quizState.userAnswers.find((a) => a.questionId === current.id)?.answer ?? null
  }, [getCurrentQuestion, quizState.userAnswers])

  const getQuestionById = useCallback((questionId: string) => {
    return quizState.quizData?.questions?.find(q => q.id === questionId) || null
  }, [quizState.quizData])

  const getAnswerById = useCallback((questionId: string) => {
    return quizState.userAnswers.find(a => a.questionId === questionId)?.answer || null
  }, [quizState.userAnswers])

  const getQuizProgress = useCallback(() => {
    if (!quizState.quizData?.questions?.length) return 0
    return (quizState.userAnswers.length / quizState.quizData.questions.length) * 100
  }, [quizState.quizData, quizState.userAnswers])

  const areAllQuestionsAnswered = useCallback(() => {
    if (!quizState.quizData?.questions) return false
    const uniqueAnswers = new Set(quizState.userAnswers.map(a => a.questionId))
    return uniqueAnswers.size === quizState.quizData.questions.length
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
    setUserAnswer: saveAnswer, // backward compatible
    submitQuiz: handleSubmitQuiz, // renamed but backward compatible
    startTimer: startQuizTimer,
    pauseTimer: pauseQuizTimer,
    resumeTimer: resumeQuizTimer,
    getResults,
    loadQuizHistory,
    requireAuthentication,
    isAuthenticated,

    // Helpers
    formatRemainingTime,
    getCurrentQuestion,
    getCurrentAnswer,
    getQuestionById,
    getAnswerById,
    getQuizProgress,
    areAllQuestionsAnswered,
    navigateToResults,
  }
}
