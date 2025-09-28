"use client"

import { useEffect, useMemo, useCallback, useRef } from "react"
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
  selectQuizUserId,
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
import CodeQuiz from "./CodeQuiz"

import { QuizActions } from "@/components/quiz/QuizActions"
import { UnifiedLoader } from "@/components/loaders"


interface CodeQuizWrapperProps {
  slug: string
  title?: string
}

function CodeQuizWrapper({ slug, title }: CodeQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
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

  const quizId = useSelector((state: any) => state.quiz.quizId) // Assuming quizId is stored in quiz slice
  const quizOwnerId = useSelector(selectQuizUserId) // Get the actual quiz owner ID
  const userId = user?.id // Get user ID from session-based auth

  const pdfData = {
    title: quizTitle || title,
    description: "This is a code quiz. Solve the coding problems to complete the quiz.",
    questions: questions
  }
  // Track initialization to prevent duplicate loads
  const isInitializedRef = useRef(false);

  // Load the quiz
  useEffect(() => {
    // Store in variable to handle potential cleanup scenarios
    let isComponentMounted = true;

    const loadQuiz = async () => {
      // Prevent double initialization
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      try {
        dispatch(resetQuiz());

        // Only proceed if component is still mounted
        if (isComponentMounted) {
          await dispatch(fetchQuiz({ slug, quizType: "code" })).unwrap();
        }
      } catch (err) {
        if (isComponentMounted) {
          // Enhanced error logging with more details
          console.error("Failed to load quiz:", {
            error: err,
            message: err?.message,
            code: err?.code,
            status: err?.status,
            stack: err?.stack,
            type: typeof err,
            keys: err ? Object.keys(err) : [],
            slug,
            quizType: "code",
            // Check if it's a serialized error
            isSerializedError: err && typeof err === 'object' && !err.message && !err.code,
            stringified: JSON.stringify(err)
          });

          // Provide more specific error messages based on error type
          let errorMessage = "Failed to load quiz. Please try again.";

          // Handle empty error objects
          if (!err || (typeof err === 'object' && Object.keys(err).length === 0)) {
            console.warn("Received empty error object, this may indicate a serialization issue");
            errorMessage = "Unable to load quiz. The quiz may not exist or there may be a connection issue.";
          } else if (err?.code === 'NOT_FOUND') {
            errorMessage = "Quiz not found. It may have been deleted or the URL is incorrect.";
          } else if (err?.code === 'NETWORK_ERROR') {
            errorMessage = "Network error. Please check your internet connection.";
          } else if (err?.code === 'SERVER_ERROR') {
            errorMessage = "Server error. Please try again in a few moments.";
          } else if (err?.code === 'CANCELLED') {
            errorMessage = "Request was cancelled. Please try again.";
          }

          toast.error(errorMessage);
        }
      }
    }

    loadQuiz();

    return () => {
      isComponentMounted = false;
      if (submissionTimeoutRef.current) clearTimeout(submissionTimeoutRef.current);
    }
  }, [slug, dispatch])

  // Handle authentication redirect
  useEffect(() => {
    if (requiresAuth && redirectAfterLogin) {
      router.push(redirectAfterLogin)
    }
  }, [requiresAuth, redirectAfterLogin, router])

  // Navigate to result
  useEffect(() => {
    let isMounted = true;

    // To prevent infinite loop, we track if we've already shown the loader for this completion    
    if (isCompleted && quizStatus === "succeeded" && !hasShownLoaderRef.current && isMounted) {
      hasShownLoaderRef.current = true;

      // Prevent navigation if component gets unmounted
      submissionTimeoutRef.current = setTimeout(() => {
        if (isMounted) {
          router.push(`/dashboard/code/${slug}/results`)
        }
      }, 500)
    }

    return () => {
      isMounted = false;
      if (submissionTimeoutRef.current) clearTimeout(submissionTimeoutRef.current)
    }
  }, [isCompleted, quizStatus, router, slug])

  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex] || null
  }, [questions, currentQuestionIndex])

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
      const result = await dispatch(submitQuiz()).unwrap()
      if ('requiresAuth' in result && result.requiresAuth) {
        toast.info("Please sign in to save your results permanently")
      } else {
        toast.success("Quiz submitted successfully!")
      }

      setTimeout(() => {
        router.push(`/dashboard/code/${slug}/results`)
      }, 500)
    } catch (err: any) {
      console.error("Error submitting quiz:", err)
      toast.error("Failed to submit quiz. Please try again.")
    }
  }, [dispatch, router, slug])


  const isLoading = quizStatus === "loading" || quizStatus === "idle"
  const hasError = quizStatus === "failed"
  const isSubmitting = quizStatus === "submitting"
  const formattedQuestion = useMemo(() => {
    if (!currentQuestion) return null

    // Use type assertion to handle potential shape differences
    const currentQuestionAny = currentQuestion as any;
    const questionText = currentQuestionAny.question || ''
    const options = Array.isArray(currentQuestionAny.options)
      ? currentQuestionAny.options.map((opt: any) =>
        typeof opt === "string" ? opt : opt.text || ''
      )
      : []

    // Determine language with better fallback logic
    let detectedLanguage = currentQuestionAny.language?.trim() || ''
    
    // If no language is provided, try to detect from code snippet or use neutral fallback
    if (!detectedLanguage && currentQuestionAny.codeSnippet) {
      // Simple language detection based on common patterns
      const codeSnippet = currentQuestionAny.codeSnippet.toLowerCase()
      if (codeSnippet.includes('function') || codeSnippet.includes('const') || codeSnippet.includes('let')) {
        detectedLanguage = 'JavaScript'
      } else if (codeSnippet.includes('def ') || codeSnippet.includes('import ')) {
        detectedLanguage = 'Python'
      } else if (codeSnippet.includes('public class') || codeSnippet.includes('System.out')) {
        detectedLanguage = 'Java'
      } else if (codeSnippet.includes('#include') || codeSnippet.includes('cout <<')) {
        detectedLanguage = 'C++'
      } else {
        detectedLanguage = 'Code' // Neutral fallback
      }
    } else if (!detectedLanguage) {
      detectedLanguage = 'Code' // Neutral fallback when no code snippet
    }

    return {
      id: String(currentQuestion.id),
      text: questionText,
      question: questionText,
      options,
      codeSnippet: currentQuestionAny.codeSnippet || '',
      language: detectedLanguage,
      correctAnswer: currentQuestionAny.answer || '',
    }
  }, [currentQuestion])



  const existingAnswer = useMemo(() => {
    if (!currentQuestion) return undefined
    return answers[String(currentQuestion.id)]?.selectedOptionId || undefined
  }, [currentQuestion, answers])

  const canGoNext = currentQuestionIndex < questions.length - 1
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  if (isLoading) {
    return (
      <UnifiedLoader
        state="loading"
        variant="skeleton"
        message="Loading code quiz..."
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
      <UnifiedLoader
        state="loading"
        variant="skeleton"
        message="Loading quiz..."
        size="md"
      />
    )
  } 
  
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <CodeQuiz
          question={formattedQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          existingAnswer={existingAnswer}
          onAnswer={handleAnswer}
          onNext={handleNextQuestion}
          onSubmit={handleSubmitQuiz}
          isSubmitting={isSubmitting}
          canGoNext={canGoNext}
          isLastQuestion={isLastQuestion}
          quizTitle={quizTitle || title || "Code Quiz"}
        />
      </div>
    </div>
  )
}

// Export memoized version to prevent unnecessary re-renders
export default CodeQuizWrapper;
