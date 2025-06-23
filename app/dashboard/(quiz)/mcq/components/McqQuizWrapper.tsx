/**
 * Fixed McqQuizWrapper - Resolves Infinite Update Issues
 * 
 * Key fixes applied:
 * 1. Fixed useEffect dependencies to prevent infinite loops
 * 2. Proper memoization of expensive operations
 * 3. Stable references for callback functions
 * 4. Corrected Redux action imports and usage
 * 5. Improved state management flow
 * 
 * @author Manus AI
 * @version Fixed
 */

'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import {
  selectQuestions,
  selectAnswers,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizTitle,
  selectIsQuizComplete,
  selectQuizId,
  selectQuizType,
  fetchQuiz,
  hydrateQuiz,
  saveAnswer,
  setCurrentQuestionIndex,
  setQuizResults,
  setQuizCompleted,
  resetQuiz,
  resetSubmissionState,
  submitQuiz,
  clearQuizState, // Fixed: Use correct action name
} from "@/store/slices/quiz-slice"
import McqQuiz from "./McqQuiz"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { NoResults } from "@/components/ui/no-results"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { useLoader } from "@/components/ui/loader/loader-context"

interface McqQuizWrapperProps {
  slug: string
  title?: string
}

export default function McqQuizWrapper({ slug, title }: McqQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const enhancedLoader = useLoader()

  // Local state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false) // Fix: Track initialization
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Redux selectors
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)
  const quizId = useSelector(selectQuizId)
  const quizType = useSelector(selectQuizType)

  // Fix: Memoize the slug to prevent unnecessary re-renders
  const memoizedSlug = useMemo(() => slug, [slug])

  // Fix: Stable loadQuiz function with proper error handling
  const loadQuiz = useCallback(async () => {
    if (isInitialized) return // Prevent multiple initializations
    
    try {
      setLoading(true)
      setError(null)
      
      // Reset quiz state first
      dispatch(resetQuiz())
      dispatch(resetSubmissionState())

      // Fetch quiz data
      const data = await dispatch(fetchQuiz({ slug: memoizedSlug, quizType: "mcq" })).unwrap()
      
      // Hydrate quiz with initial state
      dispatch(
        hydrateQuiz({
          slug: memoizedSlug,
          quizType: "mcq",
          quizData: data,
          currentState: {
            currentQuestionIndex: 0,
            answers: {},
            isCompleted: false,
            showResults: false,
          },
        })
      )
      
      setIsInitialized(true)
    } catch (err: any) {
      console.error("Failed to load quiz:", err)
      setError(err?.message || "Failed to load quiz. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [dispatch, memoizedSlug, isInitialized])

  // Fix: Proper useEffect with correct dependencies
  useEffect(() => {
    loadQuiz()

    // Cleanup function
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [loadQuiz]) // Only depend on the memoized loadQuiz function

  // Fix: Separate effect for handling completion redirect with proper dependencies
  useEffect(() => {
    if (!isCompleted || isSubmitting || !isInitialized) return

    enhancedLoader.showLoader({ message: "🎉 Quiz completed! Calculating your results..." })

    submissionTimeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/mcq/${memoizedSlug}/results`)
    }, 500)

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [isCompleted, isSubmitting, isInitialized, router, memoizedSlug, enhancedLoader])

  // Fix: Memoize current question with proper dependencies
  const currentQuestion = useMemo(() => {
    if (!questions.length || currentQuestionIndex >= questions.length || currentQuestionIndex < 0) {
      return null
    }
    return questions[currentQuestionIndex]
  }, [questions, currentQuestionIndex])

  // Fix: Stable handleAnswer function with proper validation
  const handleAnswer = useCallback((selectedOptionId: string) => {
    if (!currentQuestion || !selectedOptionId) {
      console.warn("Cannot save answer: missing question or option")
      return false
    }

    try {
      dispatch(
        saveAnswer({
          questionId: currentQuestion.id.toString(),
          answer: {
            selectedOptionId,
            isCorrect: selectedOptionId === String(currentQuestion.correctOptionId || currentQuestion.answer),
            timestamp: Date.now(),
          },
        })
      )
      return true
    } catch (error) {
      console.error("Error saving answer:", error)
      return false
    }
  }, [currentQuestion, dispatch])

  // Fix: Stable handleNext function with bounds checking
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }, [currentQuestionIndex, questions.length, dispatch])

  // Fix: Improved handleSubmitQuiz with better error handling and state management
  const handleSubmitQuiz = useCallback(async () => {
    
    setIsSubmitting(true)

    try {
      // Validate we have answers
      if (!Object.keys(answers).length) {
        throw new Error("No answers to submit")
      }

      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        selectedOptionId: answer.selectedOptionId,
        isCorrect: answer.isCorrect,
        timestamp: answer.timestamp,
      }))

      // Set quiz results in Redux
      dispatch(
        setQuizResults({
          quizId: quizId || memoizedSlug,
          slug: memoizedSlug,
          title: quizTitle || title || "MCQ Quiz",
          quizType: "mcq",
          questions,
          answers: formattedAnswers,
          completedAt: new Date().toISOString(),
        })
      )

      // Mark quiz as completed
      dispatch(setQuizCompleted())
      
      // Submit to backend
      await dispatch(submitQuiz()).unwrap()
      
      toast.success("Quiz submitted successfully!")
      // Redirect to results page
      router.push(`/dashboard/mcq/${memoizedSlug}/results`)
    } catch (err: any) {
      console.error("Error submitting quiz:", err)
      toast.error(err?.message || "Failed to submit quiz. Please try again.")
      
      // Reset submission state on error
      setIsSubmitting(false)
    }
    // Note: Don't reset isSubmitting on success - let the completion redirect handle it
  }, [
    isSubmitting,
    answers,
    dispatch,
    quizId,
    memoizedSlug,
    quizTitle,
    title,
    questions,
  ])

  // Fix: Stable handleRetakeQuiz function with proper cleanup
  const handleRetakeQuiz = useCallback(() => {
    // Clear any pending timeouts
    if (submissionTimeoutRef.current) {
      clearTimeout(submissionTimeoutRef.current)
    }
    
    // Reset local state
    setIsSubmitting(false)
    setIsInitialized(false)
    setError(null)
    
    // Clear Redux state
    dispatch(clearQuizState())
    
    // Navigate to quiz start
    router.replace(`/dashboard/mcq/${memoizedSlug}`)
  }, [dispatch, router, memoizedSlug])

  // Fix: Memoize computed values to prevent unnecessary re-renders
  const quizState = useMemo(() => {
    const canGoNext = currentQuestionIndex < questions.length - 1
    const isLastQuestion = currentQuestionIndex === questions.length - 1
    const currentAnswerId = currentQuestion?.id?.toString()
      ? answers[currentQuestion.id.toString()]?.selectedOptionId
      : undefined
    const hasAnswer = Boolean(currentAnswerId)

    return {
      canGoNext,
      isLastQuestion,
      currentAnswerId,
      hasAnswer,
    }
  }, [currentQuestionIndex, questions.length, currentQuestion, answers])

  // Fix: Memoize loading state check
  const isLoading = useMemo(() => {
    return loading || quizStatus === "loading"
  }, [loading, quizStatus])

  // Fix: Memoize error state check
  const hasError = useMemo(() => {
    return Boolean(error) || quizStatus === "failed"
  }, [error, quizStatus])

  // UI state renders with early returns to prevent unnecessary processing

  if (isLoading) {
    return <QuizLoader message="Loading quiz..." />
  }

  if (hasError) {
    return (
      <NoResults
        variant="error"
        title="Error Loading Quiz"
        description={error || "Unable to load quiz."}
        action={{
          label: "Try Again",
          onClick: () => {
            setError(null)
            setIsInitialized(false)
            loadQuiz()
          },
        }}
        secondaryAction={{
          label: "Back to Quizzes",
          onClick: () => router.push("/dashboard/quizzes"),
          variant: "outline",
        }}
      />
    )
  }

  if (!currentQuestion) {
    return (
      <NoResults
        variant="error"
        title="Quiz Error"
        description="Could not load quiz questions."
        action={{
          label: "Try Again",
          onClick: () => {
            setIsInitialized(false)
            loadQuiz()
          },
        }}
        secondaryAction={{
          label: "Back to Quizzes",
          onClick: () => router.push("/dashboard/quizzes"),
          variant: "outline",
        }}
      />
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <McqQuiz
        key={`${currentQuestion.id}-${currentQuestionIndex}`} // Fix: More stable key
        quizTitle={quizTitle || title}
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        existingAnswer={quizState.currentAnswerId}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onSubmit={handleSubmitQuiz}
        onRetake={handleRetakeQuiz}
        canGoNext={quizState.hasAnswer && quizState.canGoNext}
        isLastQuestion={quizState.isLastQuestion}
        isSubmitting={isSubmitting || quizStatus === "submitting"}
      />
    </motion.div>
  )
}

/**
 * Additional Performance Optimizations:
 * 
 * 1. Consider wrapping this component with React.memo() if parent re-renders frequently
 * 2. Use React.useMemo() for expensive calculations
 * 3. Consider using React.useCallback() for event handlers passed to child components
 * 4. Implement proper error boundaries for better error handling
 * 
 * Example usage with React.memo:
 * 
 * export default React.memo(McqQuizWrapper, (prevProps, nextProps) => {
 *   return prevProps.slug === nextProps.slug && prevProps.title === nextProps.title
 * })
 */

