"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import {
  selectQuizQuestions,
  selectQuizAnswers,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizTitle,
  selectIsQuizComplete,
  setCurrentQuestionIndex,
  saveAnswer,
  resetQuiz,
  submitQuiz,
  selectQuizId,
  selectQuizType,
  fetchQuiz,
  resetSubmissionState,
} from "@/store/slices/quiz-slice"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { toast } from "sonner"
import { NoResults } from "@/components/ui/no-results"
import OpenEndedQuiz from "./OpenEndedQuiz"
import { useLoader } from "@/components/ui/loader/loader-context"
import { useAuth } from "@/hooks"
import { useSubscription } from "@/hooks/use-subscription"

interface OpenEndedQuizWrapperProps {
  slug: string
  title?: string
}

export default function OpenEndedQuizWrapper({ slug, title }: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const enhancedLoader = useLoader()
  const { isAuthenticated } = useAuth()
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const timeStartRef = useRef<number>(Date.now())

  // Use subscription hook with skipInitialFetch to prevent unnecessary API calls
  useSubscription({ skipInitialFetch: true })

  // Local state
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Redux selectors
  const questions = useSelector(selectQuizQuestions)
  const answers = useSelector(selectQuizAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)
  const quizId = useSelector(selectQuizId)
  const quizType = useSelector(selectQuizType)

  // Load quiz when component mounts
  useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true)
      try {
        // Reset quiz state
        dispatch(resetQuiz())
        dispatch(resetSubmissionState())

        // Fetch the quiz data
        await dispatch(fetchQuiz({ slug, quizType: "openended" })).unwrap()
        setError(null)
      } catch (err) {
        console.error("Failed to load quiz:", err)
        setError("Failed to load quiz. Please try again.")
        toast.error("Failed to load quiz. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()

    // Clean up any timeouts when unmounting
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [slug, dispatch])

  // Handle quiz completion and navigation to results
  useEffect(() => {
    if (!isCompleted || quizStatus === "submitting") return

    enhancedLoader.showLoader({ message: "🎉 Quiz completed! Analyzing your answers..." })

    submissionTimeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/openended/${slug}/results`)
    }, 800) // Slightly longer delay for open-ended questions to indicate the "analysis" process

    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [isCompleted, quizStatus, router, slug, enhancedLoader])

  // Get the current question
  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex] || null
  }, [questions, currentQuestionIndex])

  // Handle saving an answer
  const handleAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion) return false

      // Calculate time spent on question
      const timeSpent = Math.floor((Date.now() - timeStartRef.current) / 1000)
      timeStartRef.current = Date.now() // Reset timer for next question
      dispatch(
        saveAnswer({
          questionId: String(currentQuestion.id),
          answer,
          selectedOptionId: undefined
        }),
      )

      return true
    },
    [currentQuestion, dispatch],
  )

  // Handle moving to the next question
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
      // Reset timer when moving to next question
      timeStartRef.current = Date.now()
    }
  }, [currentQuestionIndex, questions.length, dispatch])

  // Handle moving to the previous question
  const handlePrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))
      // Reset timer when moving to previous question
      timeStartRef.current = Date.now()
    }
  }, [currentQuestionIndex, dispatch])

  // Handle quiz submission
  const handleSubmitQuiz = useCallback(async () => {
    try {
      await dispatch(submitQuiz()).unwrap()
      toast.success("Quiz submitted successfully!")
    } catch (err) {
      console.error("Error submitting quiz:", err)
      toast.error("Failed to submit quiz. Please try again.")
    }
  }, [dispatch])

  // Calculate UI state
  const isLoading = loading || quizStatus === "loading" || quizStatus === "idle"
  const hasError = quizStatus === "failed" || !!error
  const isSubmitting = quizStatus === "submitting"

  // Get the existing answer for the current question
  const existingAnswer = useMemo(() => {
    if (!currentQuestion) return undefined
    const answer = answers[String(currentQuestion.id)]
    return answer?.userAnswer || undefined
  }, [currentQuestion, answers])

  // Calculate navigation state
  const canGoNext = currentQuestionIndex < questions.length - 1
  const canGoPrevious = currentQuestionIndex > 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  // Format the question for the OpenEndedQuiz component
  const formattedQuestion = useMemo(() => {
    if (!currentQuestion) return null

    // Use type assertion to safely work with the question
    const cq = currentQuestion as any

    return {
      id: String(cq.id),
      text: cq.text || "",
      question: cq.question || cq.text || "",
      hint: cq.hint || "",
      model: cq.model || "gpt-3.5-turbo",
      maxLength: cq.maxLength || 500,
      answer: cq.answer || "",
      type: "openended",
    }
  }, [currentQuestion])

  // UI state renders with early returns to prevent unnecessary processing
  if (isLoading) {
    return <QuizLoader message="Loading quiz..." />
  }

  if (hasError) {
    return (
      <NoResults
        variant="error"
        title="Error Loading Quiz"
        description="We couldn't load this quiz. Please try again later or contact support if the problem persists."
        action={{
          label: "Return to Dashboard",
          onClick: () => router.push("/dashboard"),
        }}
      />
    )
  }

  if (!formattedQuestion) {
    return (
      <NoResults
        title="No Questions Found"
        description="This quiz doesn't have any questions yet."
        action={{
          label: "Return to Dashboard",
          onClick: () => router.push("/dashboard"),
        }}
      />
    )
  }

  return (
    <OpenEndedQuiz
      question={formattedQuestion as any}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={questions.length}
      existingAnswer={existingAnswer}
      onAnswer={handleAnswer}
      onNext={handleNextQuestion}
      onPrevious={handlePrevQuestion}
      onSubmit={handleSubmitQuiz}
      canGoNext={canGoNext}
      canGoPrevious={canGoPrevious}
      isLastQuestion={isLastQuestion}
    />
  )
}
