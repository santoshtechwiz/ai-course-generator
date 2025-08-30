"use client"

import { useEffect, useCallback, useMemo, useRef } from "react"
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
  setCurrentQuestionIndex,
  saveAnswer,
  resetQuiz,
  submitQuiz,
  fetchQuiz,
  startQuestionTimer,
} from "@/store/slices/quiz/quiz-slice"

import { NoResults } from "@/components/ui/no-results"
import McqQuiz from "./McqQuiz"
import { UnifiedLoader, PageLoader } from "@/components/loaders"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


interface McqQuizWrapperProps {
  slug: string
  title?: string
}

export default function McqQuizWrapper({ slug, title }: McqQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useAuth()
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownLoaderRef = useRef(false)
  const questions = useSelector(selectQuizQuestions)
  const answers = useSelector(selectQuizAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)

  // Load the quiz with improved error handling
  useEffect(() => {
    let isMounted = true

    const loadQuiz = async () => {
      try {
        // Reset loading state and clear any previous errors
        dispatch(resetQuiz())
        hasShownLoaderRef.current = false

        // Only dispatch if component is still mounted
        if (isMounted) {
          await dispatch(fetchQuiz({ slug, quizType: "mcq" })).unwrap()
        }
      } catch (err: any) {
        // Only show error if component is still mounted and it's not a cancellation
        if (isMounted && err?.code !== 'CANCELLED') {
          console.error("Failed to load quiz:", err)
          // Don't use toast to avoid UI breaking - handle errors inline
          // toast.error(errorMessage)
        }
      }
    }

    loadQuiz()

    return () => {
      isMounted = false
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [slug, dispatch])

  // Navigate to result with improved completion handling
  useEffect(() => {
    // To prevent infinite loop, we track if we've already shown the loader for this completion
    if (isCompleted && quizStatus === "succeeded" && !hasShownLoaderRef.current) {
      hasShownLoaderRef.current = true

      submissionTimeoutRef.current = setTimeout(() => {
        router.push(`/dashboard/mcq/${slug}/results`)
      }, 500)
    }

    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [isCompleted, quizStatus, router, slug])

  // Handle retry functionality
  const handleRetry = useCallback(() => {
    dispatch(fetchQuiz({ slug, quizType: "mcq" }))
  }, [dispatch, slug])

  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex] || null
  }, [questions, currentQuestionIndex])

  // Start timing when question changes
  useEffect(() => {
    if (currentQuestion) {
      dispatch(startQuestionTimer({ questionId: String(currentQuestion.id) }))
    }
  }, [currentQuestion, dispatch])

  const handleAnswer = useCallback((selectedOptionId: string) => {
    if (!currentQuestion) return false

    dispatch(saveAnswer({
      questionId: String(currentQuestion.id),
      answer: selectedOptionId,
      selectedOptionId
    }))

    return true
  }, [currentQuestion, dispatch])

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }, [currentQuestionIndex, questions.length, dispatch])

  const handleSubmitQuiz = useCallback(async () => {
    try {
      await dispatch(submitQuiz()).unwrap()

      setTimeout(() => {
        router.push(`/dashboard/mcq/${slug}/results`)
      }, 500)
    } catch (err) {
      console.error("Error submitting quiz:", err)
    }
  }, [dispatch, router, slug])

  // Loading state with improved handling
  if (quizStatus === 'loading' && !questions.length) {
    return (
      <PageLoader
        message="Loading quiz questions..."
        variant="spinner"
        size="lg"
      />
    )
  }

  // Error states with retry functionality
  if (quizStatus === 'failed') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Failed to Load Quiz</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              We couldn't load the quiz. This might be due to a network issue or the quiz might not exist.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRetry} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={() => router.back()} variant="ghost">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not found state
  if (quizStatus === 'not-found') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <NoResults
          title="Quiz Not Found"
          description="The quiz you're looking for doesn't exist or has been removed."
          action={{
            label: "Browse Quizzes",
            onClick: () => router.push('/dashboard/quizzes')
          }}
        />
      </div>
    )
  }

  // No questions available
  if (quizStatus === 'succeeded' && (!questions || questions.length === 0)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <NoResults
          title="No Questions Available"
          description="This quiz doesn't have any questions yet."
          action={{
            label: "Browse Other Quizzes",
            onClick: () => router.push('/dashboard/quizzes')
          }}
        />
      </div>
    )
  }

  // Success state - render quiz
  if (quizStatus === 'succeeded' && questions.length > 0) {
    const currentQ = questions[currentQuestionIndex]
    
    if (!currentQ) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Question not found.</p>
        </div>
      )
    }
    
    const existingAnswer = answers[String(currentQ.id)]?.selectedOptionId

    return (
      <McqQuiz
        question={{
          id: String(currentQ?.id || ''),
          text: currentQ?.question || '',
          question: currentQ?.question || '',
          options: Array.isArray(currentQ?.options) 
            ? currentQ.options.map(opt => typeof opt === 'string' ? opt : opt.text || '')
            : []
        }}
        onAnswer={(answer) => {
          handleAnswer(answer)
          handleNextQuestion()
        }}
        onNext={handleNextQuestion}
        onSubmit={handleSubmitQuiz}
        isSubmitting={false} // Will be handled by the component's internal state
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        existingAnswer={existingAnswer || undefined}
        canGoNext={currentQuestionIndex < questions.length - 1}
        isLastQuestion={currentQuestionIndex === questions.length - 1}
        quizTitle={quizTitle}
      />
    )
  }

  // Fallback loading state
  return (
    <UnifiedLoader
      state="loading"
      message="Preparing quiz..."
      variant="spinner"
      size="md"
    />
  )
}
