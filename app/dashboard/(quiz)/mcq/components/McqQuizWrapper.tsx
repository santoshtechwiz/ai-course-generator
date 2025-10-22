"use client"

import { useEffect, useCallback, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
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
  startQuestionTimer,
} from "@/store/slices/quiz/quiz-slice"

import { NoResults } from "@/components/ui/no-results"
import { isPrivateError } from "../../components/privateErrorUtils"
import McqQuiz from "./McqQuiz"
import { UnifiedLoader } from "@/components/loaders"
import { LOADER_MESSAGES } from "@/constants/loader-messages"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { SignInPrompt } from "@/components/shared"

 
interface McqQuizWrapperProps {
  slug: string
  title?: string
}

export default function McqQuizWrapper({ slug, title }: McqQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<any>()
  const { user } = useAuth()
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownLoaderRef = useRef(false)
  const questions = useSelector(selectQuizQuestions)
  const answers = useSelector(selectQuizAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)
  const requiresAuth = useSelector(selectRequiresAuth)
  const redirectAfterLogin = useSelector(selectRedirectAfterLogin)
  const quizError = useSelector((state: any) => state.quiz.error)

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
          // Extract error details reliably - Redux thunk passes payload as the error
          const errorCode = err?.code || 'UNKNOWN_ERROR'
          const errorMessage = err?.error || err?.message || 'Failed to load quiz'
          const errorStatus = err?.status || null
          
          // Log structured error information
          const errorDetails = {
            code: errorCode,
            message: errorMessage,
            status: errorStatus,
            slug,
            quizType: "mcq"
          };

          console.error("Failed to load quiz - error details:", errorDetails);

          // Handle empty or partial error objects - log additional context
          if (!err || (typeof err === 'object' && Object.keys(err).length === 0)) {
            console.warn("[McqQuizWrapper] Received empty error object - checking Redux state", {
              quizError,
              quizStatus,
              slug
            });
          }

          // Additional debugging in development mode
          if (process.env.NODE_ENV === 'development') {
            console.debug("[McqQuizWrapper] Detailed error trace:", {
              fullError: JSON.stringify(err, null, 2),
              errorKeys: err ? Object.keys(err) : [],
              errorStack: err?.stack,
              errorName: err?.name
            });
          }
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

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitQuiz = useCallback(async () => {
    try {
      setIsSubmitting(true)
      const result = await dispatch(submitQuiz()).unwrap()
      
      // Show success message
      if (result.requiresAuth) {
        toast.info("Quiz submitted! Sign in to save your results.")
      } else {
        toast.success("Quiz submitted successfully!")
      }
      
      // COMMIT: Remove delay to prevent layout shift, navigate immediately
      router.push(`/dashboard/mcq/${slug}/results`)
    } catch (err: any) {
      console.error("Error submitting quiz:", err)
      toast.error("Failed to submit quiz. Please try again.")
      setIsSubmitting(false)
    }
  }, [dispatch, router, slug])

  // COMMIT: Show calculating loader during submission with stable positioning
  if (isSubmitting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <UnifiedLoader
          state="loading"
          variant="spinner"
          size="lg"
          message={LOADER_MESSAGES.CALCULATING_RESULTS}
          className="p-8"
        />
      </div>
    )
  }

  // Loading state with improved handling
  if (quizStatus === 'loading' && !questions.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <UnifiedLoader
          state="loading"
          variant="spinner"
          size="lg"
          message={LOADER_MESSAGES.LOADING_MCQ}
        />
      </div>
    )
  }

  // Requires authentication state
  if (quizStatus === 'requires-auth') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <SignInPrompt
          variant="card"
          context="quiz"
          feature="quiz-access"
          callbackUrl={redirectAfterLogin || `/dashboard/mcq/${slug}`}
          customMessage="Sign in to submit quiz results and save your progress"
          className="max-w-md"
        />
      </div>
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
    const privateContent = isPrivateError(quizError)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <NoResults
          title={privateContent ? "This quiz is private" : "Quiz Not Found"}
          description={
            privateContent
              ? "This quiz exists but is not publicly accessible. Sign in or request access from the owner."
              : "The quiz you're looking for doesn't exist or has been removed."
          }
          action={{
            label: privateContent ? "Request Access" : "Browse Quizzes",
            onClick: () => router.push(privateContent ? '/dashboard/requests' : '/dashboard/quizzes')
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
        quizSlug={slug}
      />
    )
  }

  // Fallback loading state
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <UnifiedLoader
        state="loading"
        message={LOADER_MESSAGES.LOADING_QUIZ}
        variant="spinner"
        size="lg"
      />
    </div>
  )
}
