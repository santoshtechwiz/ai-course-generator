"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useAuth } from "@/modules/auth"

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
import { QuizLoader } from "@/components/quiz/QuizLoader"
import { LOADER_MESSAGES } from "@/constants/loader-messages"
// Type removed - using any for quiz question types



interface BlanksQuizWrapperProps {
  slug: string
  title: string
}

export default function BlanksQuizWrapper({ slug, title }: BlanksQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownLoaderRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  // Redux selectors
  const questions = useAppSelector(selectQuizQuestions) as any[]
  const answers = useAppSelector(selectQuizAnswers)
  const currentQuestionIndex = useAppSelector(selectCurrentQuestionIndex)
  const quizStatus = useAppSelector(selectQuizStatus)
  const isCompleted = useAppSelector(selectIsQuizComplete)
  const quizTitle = useAppSelector(selectQuizTitle)
  const requiresAuth = useAppSelector(selectRequiresAuth)
  const redirectAfterLogin = useAppSelector(selectRedirectAfterLogin)
  
  // Load quiz on mount
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        dispatch(resetQuiz())
        hasShownLoaderRef.current = false
        await dispatch(fetchQuiz({ slug, quizType: "blanks" })).unwrap()
        setError(null)
      } catch (err) {
        // Enhanced error logging with more details
        const errorObj = err as any;
        console.error("Failed to load quiz:", {
          error: err,
          message: errorObj?.message,
          code: errorObj?.code,
          status: errorObj?.status,
          stack: errorObj?.stack,
          type: typeof err,
          keys: err ? Object.keys(errorObj) : [],
          slug,
          quizType: "blanks"
        });

        // Provide more specific error messages based on error type
        let errorMessage = "Failed to load quiz. Please try again.";

        // Handle empty error objects
        if (!errorObj || (typeof errorObj === 'object' && Object.keys(errorObj).length === 0)) {
          console.warn("Received empty error object, this may indicate a serialization issue");
          errorMessage = "Unable to load quiz. The quiz may not exist or there may be a connection issue.";
        } else if (errorObj && typeof errorObj === 'object' && 'code' in errorObj) {
          if (errorObj.code === 'NOT_FOUND') {
            errorMessage = "Quiz not found. It may have been deleted or the URL is incorrect.";
          } else if (errorObj.code === 'NETWORK_ERROR') {
            errorMessage = "Network error. Please check your internet connection.";
          } else if (errorObj.code === 'SERVER_ERROR') {
            errorMessage = "Server error. Please try again in a few moments.";
          } else if (errorObj.code === 'CANCELLED') {
            errorMessage = "Request was cancelled. Please try again.";
          }
        }

        setError(errorMessage);
        toast.error(errorMessage);
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
    (answer: string, similarity?: number, hintsUsed?: number) => {
      console.log('[BlanksQuizWrapper] handleAnswer called with:', { answer, similarity, hintsUsed, hasCurrentQuestion: !!currentQuestion })

      if (!currentQuestion) {
        console.log('[BlanksQuizWrapper] No current question - returning false')
        return false
      }

      // Check if answer meets minimum similarity threshold (50% for progression)
      const minSimilarity = 0.5
      const meetsThreshold = similarity !== undefined && similarity >= minSimilarity

      if (!meetsThreshold) {
        console.log(`[BlanksQuizWrapper] Answer similarity ${similarity} below threshold ${minSimilarity} - not proceeding`)
        return false
      }

      // SaveAnswer expects questionId as string
      dispatch(
        saveAnswer({
          questionId: String(currentQuestion.id),
          answer,
          selectedOptionId: undefined,
        }),
      )

      console.log('[BlanksQuizWrapper] Answer saved successfully - returning true')
      return true
    },
    [currentQuestion, dispatch],
  )  // Navigation
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Submit quiz and navigate to results
  const handleSubmitQuiz = useCallback(async () => {
    try {
      setIsSubmitting(true)
      const result = await dispatch(submitQuiz()).unwrap()
      
      if ('requiresAuth' in result && result.requiresAuth) {
        toast.info("Quiz submitted! Sign in to save your results.")
      } else {
        toast.success("Quiz submitted successfully!")
      }
      
      // COMMIT: Remove delay to prevent layout shift, navigate immediately
      router.push(`/dashboard/blanks/${slug}/results`)
    } catch (err: any) {
      console.error("Error submitting quiz:", err)
      toast.error("Failed to submit quiz. Please try again.")
      setIsSubmitting(false)
    }
  }, [dispatch, slug, router])

  // Show calculating loader during submission
  if (isSubmitting) {
    return (
      <QuizLoader
        state="loading"
        context="calculation"
        variant="spinner"
        size="lg"
        message={LOADER_MESSAGES.CALCULATING_RESULTS}
        fullPage
      />
    )
  }

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
    const cq = currentQuestion as any
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
      <QuizLoader
        state="loading"
        context="initial"
        variant="skeleton"
        message={LOADER_MESSAGES.LOADING_BLANKS}
        size="lg"
        className="min-h-[60vh]"
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
          slug={slug}
        />
      </div>
    </div>
  )
}
