"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
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
  hydrateQuiz,
  setCurrentQuestionIndex,
  saveAnswer,
  resetQuiz,
  setQuizResults,
  setQuizCompleted,
  fetchQuiz,
  resetSubmissionState,
  submitQuiz,
  selectQuizId,
  clearQuizState,
} from "@/store/slices/quiz-slice"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"
import CodeQuiz from "./CodeQuiz"
import { useEnhancedLoader } from "@/components/ui/enhanced-loader"

interface CodeQuizWrapperProps {
  slug: string
  title?: string
}

export default function CodeQuizWrapper({ slug, title }: CodeQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const enhancedLoader = useEnhancedLoader();

  const [isSubmitting, setIsSubmitting] = useState(false)
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)
  const quizId = useSelector(selectQuizId)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      dispatch(resetQuiz())

      try {
        const result = await dispatch(fetchQuiz({ slug, quizType: "code" })).unwrap()
        if (!result) throw new Error("No data received")

        dispatch(
          hydrateQuiz({
            slug,
            quizType: "code",
            quizData: result,
            currentState: {
              currentQuestionIndex: 0,
              answers: {},
              isCompleted: false,
              showResults: false,
            },
          }),
        )
        setError(null)
      } catch (err) {
        setError("Failed to load quiz. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    init()
    dispatch(resetSubmissionState())

    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [slug, dispatch])

  useEffect(() => {
    if (!isCompleted || isSubmitting) return

    enhancedLoader.showLoader({ message: "🎉 Quiz completed! Calculating your results..." })

    submissionTimeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/code/${slug}/results`)
    }, 500)
  }, [isCompleted, isSubmitting, router, slug])

  const currentQuestion = useMemo(() => {
    if (!questions.length || currentQuestionIndex >= questions.length) return null
    return questions[currentQuestionIndex]
  }, [questions, currentQuestionIndex])

  const handleAnswer = (selectedOption: string) => {
    if (!currentQuestion) return false

    // Always use string for questionId and selectedOptionId
    const questionId = String(currentQuestion.id)
    dispatch(
      saveAnswer({
        questionId,
        answer: {
          questionId,
          selectedOptionId: String(selectedOption),
          type: "code",
          timestamp: Date.now(),
        },
      }),
    )
    return true
  }

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }, [currentQuestionIndex, questions.length, dispatch])

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))
    }
  }, [currentQuestionIndex, dispatch])

  const handleSubmitQuiz = useCallback(async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    enhancedLoader.showLoader({ message: "Submitting your quiz...", variant: "shimmer", fullscreen: true });
    try {
      const validAnswers = Object.values(answers).filter(answer => answer !== null && answer !== undefined);
      
      const results = {
        quizId,
        slug,
        title: quizTitle || title || "Code Quiz",
        quizType: "code",
        questions,
        answers: validAnswers,
        completedAt: new Date().toISOString(),
      }

      dispatch(setQuizResults(results))
      dispatch(setQuizCompleted())

      await dispatch(submitQuiz()).unwrap()
    } catch (err) {
      console.error("Error submitting quiz:", err)
      enhancedLoader.showLoader({ message: "Failed to submit quiz. Please try again.", variant: "pulse", fullscreen: true });
      setTimeout(() => enhancedLoader.hideLoader(), 2000);
    } finally {
      setIsSubmitting(false)
      setTimeout(() => enhancedLoader.hideLoader(), 1200);
    }
  }, [isSubmitting, quizId, slug, quizTitle, title, questions, answers, dispatch, enhancedLoader])

  const handleRetakeQuiz = useCallback(() => {
    dispatch(clearQuizState())
    router.replace(`/dashboard/code/${slug}`)
  }, [dispatch, router, slug])

  const currentAnswer = useMemo(() => {
    if (!currentQuestion || !answers) return null;
    
    const questionId = currentQuestion.id?.toString() || currentQuestionIndex.toString();
    const answerObj = answers[questionId];
    
    return answerObj?.selectedOptionId || null;
  }, [currentQuestion, answers, currentQuestionIndex])
  const canGoNext = useMemo(
    () => currentQuestionIndex < questions.length - 1,
    [currentQuestionIndex, questions.length],
  )
  const canGoPrevious = currentQuestionIndex > 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const hasAnswer = !!currentAnswer
  const canSubmit = isLastQuestion ? hasAnswer : (hasAnswer && canGoNext)

  // ✅ Fixed condition to avoid unnecessary loading state flicker
  const isQuizLoading = loading || (quizStatus === "loading" && questions.length === 0)

  if (isQuizLoading) {
    return <QuizLoader message="Loading code quiz..." />
  }

  if (error || quizStatus === "failed") {
    return (
      <NoResults
        variant="error"
        title="Error Loading Quiz"
        description={error || "Unable to load the code quiz."}
        action={{
          label: "Back to Quizzes",
          onClick: () => router.push("/dashboard/quizzes"),
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
          onClick: () => window.location.reload(),
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
      <CodeQuiz
        question={currentQuestion}
        quizTitle={title || quizTitle || "Code Quiz"}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        existingAnswer={currentAnswer}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onSubmit={handleSubmitQuiz}
        onRetake={handleRetakeQuiz}
        canGoNext={hasAnswer && canGoNext}
        canGoPrevious={canGoPrevious}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
      />
    </motion.div>
  )
}
