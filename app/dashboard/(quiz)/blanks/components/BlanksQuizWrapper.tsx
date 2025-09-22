"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useAuth } from "@/modules/auth"
import type { AppDispatch } from "@/store"
import {
  selectQuizQuestions,
  selectQuizAnswers,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizTitle,
  selectIsQuizComplete,
  selectRequiresAuth,
  selectRedirectAfterLogin,
  setCurrentQuestionIndex,
  saveAnswer,
  resetQuiz,
  submitQuiz,
  fetchQuiz,
} from "@/store/slices/quiz/quiz-slice"

import { toast } from "sonner"
import { NoResults } from "@/components/ui/no-results"
import BlanksQuiz from "./BlanksQuiz"
import { UnifiedLoader } from "@/components/loaders"

import { BlankQuizQuestion } from "@/app/types/quiz-types"


interface BlanksQuizWrapperProps {
  slug: string
  title: string
}

export default function BlanksQuizWrapper({ slug, title }: BlanksQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useAuth()
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownLoaderRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  // Redux selectors
  const questions = useSelector(selectQuizQuestions) as BlankQuizQuestion[]
  const answers = useSelector(selectQuizAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const isCompleted = useSelector(selectIsQuizComplete)
  const quizTitle = useSelector(selectQuizTitle)
  const requiresAuth = useSelector(selectRequiresAuth)
  const redirectAfterLogin = useSelector(selectRedirectAfterLogin)
  
  // Load quiz on mount
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        dispatch(resetQuiz())
        hasShownLoaderRef.current = false
        await dispatch(fetchQuiz({ slug, quizType: "blanks" })).unwrap()
        setError(null)
      } catch (err) {
        console.error("Failed to load quiz:", err)
        setError("Failed to load quiz. Please try again.")
        toast.error("Failed to load quiz. Please try again.")
      }
    }

    loadQuiz()

    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [slug, dispatch])

  // Handle authentication redirect
  useEffect(() => {
    if (requiresAuth && redirectAfterLogin) {
      router.push(redirectAfterLogin)
    }
  }, [requiresAuth, redirectAfterLogin, router])

  // Auto-redirect if quiz already completed
  useEffect(() => {
    if (isCompleted && quizStatus === "succeeded") {
      router.push(`/dashboard/blanks/${slug}/results`)
    }
  }, [isCompleted, quizStatus, router, slug])

  // Get current question
  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex] || null
  }, [questions, currentQuestionIndex])

  // Save answer
  const handleAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion) return false

      dispatch(
        saveAnswer({
          questionId: String(currentQuestion.id),
          answer,
          selectedOptionId: undefined,
        }),
      )

      return true
    },
    [currentQuestion, dispatch],
  )

  // Navigation
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }, [currentQuestionIndex, questions.length, dispatch])

  const handlePrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))
    }
  }, [currentQuestionIndex, dispatch])
  // Submit quiz and navigate to results
  const handleSubmitQuiz = useCallback(async () => {
    try {
      await dispatch(submitQuiz()).unwrap()
      toast.success("Quiz submitted successfully!")
      router.push(`/dashboard/blanks/${slug}/results`)
    } catch (err: any) {
      // Check if it's an authentication error
      if (err?.requiresAuth) {
        // Authentication required, redirect will be handled by useEffect
        return
      }
      console.error("Error submitting quiz:", err)
      toast.error("Failed to submit quiz. Please try again.")
    } finally {
  // No global loader; rely on page state
    }
  }, [dispatch, slug, router, user?.id])

  // Loading & error states
  const isLoading = quizStatus === "loading" || quizStatus === "idle"
  const hasError = quizStatus === "failed" || !!error

  // Existing answer
  const existingAnswer = useMemo(() => {
    if (!currentQuestion) return undefined
    const answer = answers[String(currentQuestion.id)]
    return answer?.userAnswer || undefined
  }, [currentQuestion, answers])

  const canGoNext = currentQuestionIndex < questions.length - 1
  const canGoPrevious = currentQuestionIndex > 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const formattedQuestion = useMemo(() => {
    if (!currentQuestion) return null
    const cq = currentQuestion as BlankQuizQuestion
    return {
      id: cq.id, // Keep as number to match BlankQuizQuestion type
      text: cq.text || cq.question || "",
      question: cq.question || cq.text || "",
      answer: cq.answer || "",
      hints: cq.hints || [],
      tags: cq.tags || [],
      type: cq.type as "blanks", // Explicit type assertion
    }  }, [currentQuestion])
  
  if (isLoading) {
    return (
      <UnifiedLoader
        state="loading"
        variant="skeleton"
        message="Loading fill-in-the-blanks quiz..."
        size="md"
      />
    )
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
    <div className="w-full ">
      <div className="space-y-6">
        <BlanksQuiz
          key={formattedQuestion.id} // ✅ forces component reset per question
          question={formattedQuestion}
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
          isQuizCompleted={isCompleted}
        />
      </div>
    </div>
  )
}
