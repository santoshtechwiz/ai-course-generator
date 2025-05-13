"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
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
  type Answer,
  type QuizState,
  type CompleteQuizPayload,
} from "@/store/slices/quizSlice"
import {
  setIsAuthenticated,
  setIsProcessingAuth,
  setRedirectUrl,
  setUser,
} from "@/store/slices/authSlice"
import { calculateTotalTime } from "@/lib/utils/quiz-index"
import type { PersistPartial } from "redux-persist/es/persistReducer"
import type { RootState } from "@/store"
import type { Question } from "@/lib/quiz-store"

interface QuizInitializeInput {
  id?: string
  quizId?: string
  slug?: string
  title?: string
  quizType?: string
  questions?: Question[]
  requiresAuth?: boolean
  [key: string]: any
}

interface SubmitResultsInput {
  quizId: string
  slug: string
  quizType: string
  answers: Answer[]
  score: number
}

interface UseQuizReturn {
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
  restoreState: () => void
}

interface UseQuizParams {
  quizData?: {
    questions?: Question[]
  }
}

export function useQuiz({ quizData }: UseQuizParams = {}): UseQuizReturn {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { data: session, status } = useSession()

  const quizState = useAppSelector((state) => state.quiz) as QuizState & PersistPartial
  const authState = useAppSelector((state) => state.auth)

  const isMounted = useRef(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    return () => {
      isMounted.current = true;
    }
  }, [])

  const isAuthenticated = useMemo(
    () => status === "authenticated" && !!session?.user,
    [session, status]
  )

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

  const initialize = useCallback((quizData: QuizInitializeInput) => {
    if (!isMounted.current) return
    setIsLoading(true)
    try {
      dispatch(initQuiz({
        ...quizData,
        requiresAuth: quizData.requiresAuth ?? true,
      }))
    } catch (err) {
      console.error("Error initializing quiz:", err)
      dispatch(setError("Failed to initialize quiz. Please try again."))
    } finally {
      setTimeout(() => {
        if (isMounted.current) setIsLoading(false)
      }, 500)
    }
  }, [dispatch])

  const submitQuizAnswer = useCallback((answerData: Answer) => {
    if (!isMounted.current) return
    dispatch(submitAnswer(answerData))
  }, [dispatch])

  const goToNextQuestion = useCallback(() => {
    if (!isMounted.current) return
    dispatch(nextQuestion())
  }, [dispatch])

  const submitResults = useCallback(async ({
    quizId, slug, quizType, answers, score
  }: SubmitResultsInput) => {
    const totalTime = calculateTotalTime(answers)
    const totalQuestions = answers.length
    return dispatch(submitQuizResults({
      quizId,
      slug,
      quizType,
      answers,
      score,
      totalTime,
      totalQuestions,
    }))
  }, [dispatch])

  const completeQuizWithAnswers = useCallback(async (
    data?: CompleteQuizPayload
  ): Promise<boolean> => {
    try {
      const answers = data?.answers || []
      const score = data?.score ?? 0
      const completedAt = data?.completedAt || new Date().toISOString()

      dispatch(completeQuiz({ answers, score, completedAt }))

      if (isAuthenticated && quizState.quizId) {
        await submitResults({
          quizId: quizState.quizId,
          slug: quizState.slug,
          quizType: quizState.quizType,
          answers,
          score,
        })
      }
      return true
    } catch (err) {
      console.error("Error completing quiz:", err)
      dispatch(setError("Failed to complete quiz. Please try again."))
      return false
    }
  }, [dispatch, quizState, isAuthenticated, submitResults])

  const restartQuiz = useCallback(() => {
    if (!isMounted.current) return
    setIsLoading(true)
    dispatch(resetQuiz())
    setTimeout(() => {
      if (isMounted.current) setIsLoading(false)
    }, 300)
  }, [dispatch])

  const requireAuthentication = useCallback((redirectUrl: string) => {
    if (!isMounted.current) return
    if (quizState) {
      dispatch(saveStateBeforeAuth({
        quizId: quizState.quizId,
        slug: quizState.slug,
        quizType: quizState.quizType,
        currentQuestionIndex: quizState.currentQuestionIndex,
        answers: quizState.answers,
        isCompleted: quizState.isCompleted,
        score: quizState.score,
        completedAt: quizState.completedAt || new Date().toISOString(),
      }))
    }
    dispatch(setRequiresAuth(true))
    dispatch(setPendingAuthRequired(true))
    dispatch(setIsProcessingAuth(true))
    dispatch(setRedirectUrl(redirectUrl))
    router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`)
  }, [dispatch, router, quizState])

  const restoreState = useCallback(() => {
    if (!isMounted.current) return
    setIsLoading(true)

    dispatch(restoreFromSavedState())

    const saved = quizState.savedState
    if (saved && (!quizState.questions || quizState.questions.length === 0)) {
      if (quizData?.questions?.length) {
        dispatch(
          initQuiz({
            ...saved,
            questions: quizData.questions,
          })
        )
      } else {
        dispatch(setError("Failed to restore quiz: missing question data"))
      }
    }

    if (saved?.isCompleted) {
      dispatch(
        completeQuiz({
          answers: saved.answers || [],
          score: saved.score || 0,
          completedAt: saved.completedAt || new Date().toISOString(),
        })
      )
    }

    dispatch(clearSavedState())

    setTimeout(() => {
      if (isMounted.current) setIsLoading(false)
    }, 300)
  }, [dispatch, quizState.savedState, quizState.questions, quizData])

  useEffect(() => {
    if (!isMounted.current || !isAuthenticated) return

    const urlParams = new URLSearchParams(window.location.search)
    const fromAuth = urlParams.get("fromAuth") === "true"

    if (fromAuth && quizState.savedState) {
      restoreState()

      const url = new URL(window.location.href)
      url.searchParams.delete("fromAuth")
      window.history.replaceState({}, "", url.toString())
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
  }
}
