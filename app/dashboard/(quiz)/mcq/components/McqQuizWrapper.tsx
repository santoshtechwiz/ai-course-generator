"use client"

import { signIn } from "next-auth/react"
import { useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "sonner"

import McqQuiz from "./McqQuiz"
import { McqQuestion, QuizResultsPreview } from "./types"
import { AppDispatch, RootState } from "@/store"

import {
  selectQuestions,
  selectAnswers,
  selectQuizStatus,
  selectQuizError,
  selectIsQuizComplete,
  selectQuizResults,
  setCurrentQuestionIndex,
  fetchQuiz,
  saveAnswer,
  submitQuiz
} from "@/store/slices/quizSlice"
import { selectIsAuthenticated, selectUserId } from "@/store/slices/authSlice"
import { NonAuthenticatedUserSignInPrompt } from "../../components/NonAuthenticatedUserSignInPrompt"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"


interface McqQuizWrapperProps {
  slug: string
  userId?: string | null
  quizData?: any
}

type MCQAnswer = {
  questionId: string
  selectedOptionId: string
  timestamp: number
  type: "mcq"
}

export default function McqQuizWrapper({ slug, quizData }: McqQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Memoized Redux selectors for performance
  const questions = useSelector(selectQuestions) as McqQuestion[]
  const answers = useSelector(selectAnswers) as Record<string, MCQAnswer>
  const status = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const results = useSelector(selectQuizResults)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const userId = useSelector(selectUserId)
  const currentQuestionIndex = useSelector((state: RootState) => state.quiz.currentQuestionIndex)
  const quizId = useSelector((state: RootState) => state.quiz.quizId)
  const currentQuestion = questions[currentQuestionIndex]

  // Memoized computed states
  const isLoading = status === "loading"
  const isSubmitting = status === "submitting"
  const hasError = status === "error"
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const hasValidQuestions = Array.isArray(questions) && questions.length > 0
  const shouldShowSignIn = !isAuthenticated && isQuizComplete

  // Only reset quiz state on initial mount for this slug
  const didInitRef = useRef(false)
  useEffect(() => {
    if (!didInitRef.current) {
      dispatch({ type: "quiz/resetQuiz" })
      didInitRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, slug])

  // Initialize quiz
  useEffect(() => {
    if (slug && !quizId) {
      dispatch(fetchQuiz({ id: slug, data: quizData, type: "mcq" }))
    }
  }, [dispatch, slug, quizId, quizData])

  // Handle reset parameter
  useEffect(() => {
    if (searchParams && typeof searchParams.get === "function" && searchParams.get("reset") === "true") {
      dispatch(setCurrentQuestionIndex(0))
    }
  }, [searchParams, dispatch])

  // Handle answer submission
  const handleAnswer = useCallback(
    (selectedOption: string) => {
      if (!currentQuestion) return

      const answer: MCQAnswer = {
        questionId: currentQuestion.id,
        selectedOptionId: selectedOption,
        timestamp: Date.now(),
        type: "mcq"
      }

      dispatch(saveAnswer({ questionId: currentQuestion.id, answer }))
      if (currentQuestionIndex < questions.length - 1) {
        dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
      }
    },
    [currentQuestion, currentQuestionIndex, questions.length, dispatch],
  )

  // Handle quiz submission
  const submittingRef = useRef(false)
  const handleSubmitQuiz = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      await dispatch(submitQuiz()).unwrap()
      router.push(`/dashboard/mcq/${slug}/results`)
    } catch {
      toast.error("Failed to submit quiz. Please try again.")
    } finally {
      submittingRef.current = false
    }
  }, [dispatch, router, slug])

  // Handle sign-in for unauthenticated users
  const handleSignIn = useCallback(() => {
    signIn(undefined, {
      callbackUrl: `/dashboard/mcq/${slug}?fromAuth=true`,
    })
  }, [slug])

  // Handle retry
  const handleRetry = useCallback(() => {
    if (!userId) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/mcq/${slug}`)}`)
    } else if (slug) {
      dispatch(fetchQuiz({ id: slug }))
    }
  }, [userId, slug, router, dispatch])

  // Memoized current question answer
  const currentQuestionAnswer = useMemo(() => {
    if (!currentQuestion) return undefined
    const answer = answers[currentQuestion.id]
    return answer?.selectedOptionId
  }, [currentQuestion, answers])

  // Auto-submit for authenticated users when quiz is complete
  useEffect(() => {
    if (userId && isQuizComplete && status === "idle" && !results) {
      handleSubmitQuiz()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isQuizComplete, status, results])

  // Loading state
  if (isLoading) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Fetching quiz data", status: "loading" },
          { label: "Preparing questions", status: "pending" },
        ]}
      />
    )
  }

  // Submitting state
  if (isSubmitting) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Submitting your answers", status: "loading" }
        ]}
      />
    )
  }

  // Error state
  if (hasError) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Fetching quiz data", status: "error", errorMsg: error || "Failed to load quiz" }
        ]}
      />
    )
  }

  // Empty questions state
  if (!hasValidQuestions) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "No questions available for this quiz", status: "error", errorMsg: "This quiz doesn't contain any questions. Please try another quiz." }
        ]}
      />
    )
  }

  // Show sign-in prompt for completed quiz (unauthenticated users)
  if (shouldShowSignIn) {
    // Create a preview of the results
    const questionResults = questions.map(q => {
      const answer = answers[q.id]
      const selectedOption = q.options?.find(
        o => (typeof o === "string" ? o === answer?.selectedOptionId : o.id === answer?.selectedOptionId)
      )
      const correctOption = q.options?.find(
        o => (typeof o === "string"
          ? o === q.correctOptionId || o === q.correctAnswer
          : o.id === q.correctOptionId || o.text === q.correctAnswer)
      )
      const isCorrect = answer?.selectedOptionId === q.correctOptionId || answer?.selectedOptionId === q.correctAnswer
      return {
        id: q.id,
        question: q.text || q.question || "",
        userAnswer: typeof selectedOption === "string"
          ? selectedOption
          : selectedOption?.text || answer?.selectedOptionId || "Not answered",
        correctAnswer: typeof correctOption === "string"
          ? correctOption
          : correctOption?.text || q.correctAnswer || q.correctOptionId || "",
        isCorrect: !!isCorrect
      }
    })
    const score = questionResults.filter(q => q.isCorrect).length
    const preview: QuizResultsPreview = {
      title: quizData?.title || "",
      score,
      maxScore: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      questions: questionResults,
      slug
    }
    return (
      <NonAuthenticatedUserSignInPrompt
        onSignIn={handleSignIn}
        message="Please sign in to submit your quiz and save your results"
        previewData={preview}
        onDontSave={() => {
          // User chooses not to save: just show results page using Redux state
          router.push(`/dashboard/mcq/${slug}/results`)
        }}
      />
    )
  }

  // Show current question
  if (currentQuestion) {
    return (
      <McqQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
        existingAnswer={currentQuestionAnswer}
      />
    )
  }

  // Fallback
  return <div>Initializing...</div>
}
