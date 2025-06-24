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
} from "@/store/slices/quiz-slice"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { toast } from "sonner"
import { NoResults } from "@/components/ui/no-results"
import BlanksQuiz from "./BlanksQuiz"
import { useLoader } from "@/components/ui/loader/loader-context"

interface BlanksQuizWrapperProps {
  slug: string
  title: string
}

export default function BlanksQuizWrapper({ slug, title }: BlanksQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const enhancedLoader = useLoader()
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      try {
        // Reset quiz state
        dispatch(resetQuiz())

        // Fetch the quiz data
        await dispatch(fetchQuiz({ slug, quizType: "blanks" })).unwrap()
        setError(null)
      } catch (err) {
        console.error("Failed to load quiz:", err)
        setError("Failed to load quiz. Please try again.")
        toast.error("Failed to load quiz. Please try again.")
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

    enhancedLoader.showLoader({ message: "🎉 Quiz completed! Calculating your results..." })

    submissionTimeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/blanks/${slug}/results`)
    }, 500)

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

      dispatch(
        saveAnswer({
          questionId: String(currentQuestion.id),
          answer,
          selectedOptionId: undefined, // Use undefined instead of null
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
    }
  }, [currentQuestionIndex, questions.length, dispatch])

  // Handle moving to the previous question
  const handlePrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))
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
  const isLoading = quizStatus === "loading" || quizStatus === "idle"
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

  // Format the question for the BlanksQuiz component
  const formattedQuestion = useMemo(() => {
    if (!currentQuestion) return null

    // Use type assertion to safely work with the question
    const cq = currentQuestion as any

    // Create a formatted question for BlanksQuiz component
    return {
      id: String(cq.id),
      text: cq.text || cq.question || "",
      question: cq.question || cq.text || "",
      blanks: cq.blanks || [],
      promptText: cq.promptText || cq.text || "",
      correctAnswers: cq.correctAnswers || {},
      answer: cq.answer || "",
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
    <BlanksQuiz
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
