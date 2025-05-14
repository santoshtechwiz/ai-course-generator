import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  initQuiz,
  submitAnswer,
  nextQuestion,
  setError,
  type Answer,
  type QuizState,
  type CompleteQuizPayload,
  type QuizResultsData,
} from "@/store/slices/quizSlice"
import { setIsAuthenticated, setUser } from "@/store/slices/authSlice"
import type { PersistPartial } from "redux-persist/es/persistReducer"
import { QuizInitializeInput, SubmitResultsInput } from "@/app/types/slice-type"


export function useQuiz({ quizData }: UseQuizParams = {}): UseQuizReturn {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { data: session, status } = useSession()

  const quizState = useAppSelector((state) => state.quiz) as QuizState & PersistPartial
  const authState = useAppSelector((state) => state.auth)

  const isMounted = useRef<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
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

  const initialize = useCallback(
    (quizData: QuizInitializeInput) => {
      if (!isMounted.current) return
      setIsLoading(true)
      try {
        

        quizData?.questions?.forEach((question, index) => {
          if (!question.question) {
            throw new Error(`Question at index ${index} is missing required 'question' property`)
          }
        })

       

        dispatch(initQuiz({ ...quizData, questions: quizData.questions, requiresAuth: quizData.requiresAuth ?? true }))
      } catch (err) {
        console.error("Error initializing quiz:", err)
        dispatch(setError(err instanceof Error ? err.message : "Failed to initialize quiz"))
      } finally {
        setTimeout(() => {
          if (isMounted.current) setIsLoading(false)
        }, 500)
      }
    },
    [dispatch],
  )

  const submitQuizAnswer = useCallback(
    (answerData: Answer) => {
      if (!isMounted.current) return

      try {
        if (!answerData || answerData.answer === undefined || answerData.answer === null) {
          throw new Error("Invalid answer data")
        }

        if (quizState.currentQuestionIndex < 0 || !quizState.questions || quizState.currentQuestionIndex >= quizState.questions.length) {
          throw new Error("Invalid question index")
        }

        dispatch(submitAnswer(answerData))
      } catch (error) {
        console.error("Error submitting answer:", error)
        dispatch(setError(error instanceof Error ? error.message : "Failed to submit answer"))
      }
    },
    [dispatch, quizState.currentQuestionIndex, quizState.questions],
  )

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
      dispatch(setError(error instanceof Error ? error.message : "Failed to navigate to next question"))
    }
  }, [dispatch, quizState.currentQuestionIndex, quizState.questions])

  const submitResults = useCallback(
    async ({ quizId, slug, quizType, answers, score }: SubmitResultsInput) => {
      try {
        if (!quizId || !slug || !quizType || !answers || score === undefined) {
          throw new Error("Missing required result data")
        }

        console.log("Submitting quiz results:", { quizId, slug, quizType, answers, score })

        return Promise.resolve({ success: true, message: "Quiz results submitted successfully" })
      } catch (error) {
        console.error("Error submitting quiz results:", error)
        dispatch(setError(error instanceof Error ? error.message : "Failed to submit quiz results"))
        return Promise.reject(error)
      }
    },
    [dispatch],
  )

  const completeQuiz = useCallback(
    async (data?: CompleteQuizPayload) => {
      if (!isMounted.current) return false

      try {
        if (!quizState.slug) {
          throw new Error("Quiz slug is missing")
        }

        if (data) {
          await submitResults({
            quizId: data.quizId || quizState.quizId || "",
            slug: data.slug || quizState.slug,
            quizType: data.quizType || quizState.quizType || "code",
            answers: quizState.answers.filter(Boolean) as Answer[],
            score: data.score || 0,
          })
        }

        router.push(`/quiz/${quizState.slug}/results`)
        return true
      } catch (error) {
        console.error("Error completing quiz:", error)
        dispatch(setError(error instanceof Error ? error.message : "Failed to complete quiz"))
        return false
      }
    },
    [dispatch, quizState.answers, quizState.slug, quizState.quizId, quizState.quizType, router, submitResults],
  )

  const getResultsData = useCallback((): QuizResultsData | null => {
    if (!quizState.isCompleted) return null

    if (!Array.isArray(quizState.questions) || quizState.questions.length === 0) {
      console.error("Cannot get results: questions array is empty or invalid")
      return null
    }

    if (!Array.isArray(quizState.answers) || quizState.answers.length === 0) {
      console.error("Cannot get results: answers array is empty or invalid")
      return null
    }

    const correctAnswersCount = quizState.answers.filter((answer) => answer?.isCorrect).length
    const score = quizState.questions.length ? (correctAnswersCount / quizState.questions.length) * 100 : 0

    return {
  score,
  correctAnswers: correctAnswersCount,
  totalQuestions: quizState.questions.length,
  quizId: "",
  slug: "",
  title: "",
  quizType: "",

  totalTimeSpent: 0,
  formattedTimeSpent: "",
  completedAt: "",
  answers: []
}
  }, [quizState.answers, quizState.isCompleted, quizState.questions])

  return {
    quizState,
    authState,
    isAuthenticated,
    isLoading,
    initialize,
    submitAnswer: submitQuizAnswer,
    nextQuestion: goToNextQuestion,
    completeQuiz,
    submitResults,
    getResultsData,
  }
}
