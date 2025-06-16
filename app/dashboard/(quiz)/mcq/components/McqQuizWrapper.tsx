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
  selectQuizType,
  clearQuizState,
} from "@/store/slices/quiz-slice"
import { QuizLoader } from "@/components/ui/quiz-loader"
import McqQuiz from "./McqQuiz"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"
import { useEnhancedLoader } from "@/components/ui/enhanced-loader/enhanced-loader-provider"

interface McqQuizWrapperProps {
  slug: string
  title?: string
}

export default function McqQuizWrapper({ slug, title }: McqQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)
  const quizId = useSelector(selectQuizId)
  const quizType = useSelector(selectQuizType)
  const enhancedLoader = useEnhancedLoader();
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      dispatch(resetQuiz())

      try {
        const result = await dispatch(fetchQuiz({ slug, quizType: "mcq" })).unwrap()
        if (!result) throw new Error("No data received")
        dispatch(
          hydrateQuiz({
            slug,
            quizType: "mcq",
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
      router.push(`/dashboard/mcq/${slug}/results`)
    }, 500)
  }, [isCompleted, isSubmitting, router, slug])

  const currentQuestion = useMemo(() => {
    if (!questions.length || currentQuestionIndex >= questions.length) return null
    return questions[currentQuestionIndex]
  }, [questions, currentQuestionIndex])

  const handleAnswer = (selectedOption: string) => {
    if (!currentQuestion) return false

    const questionId = currentQuestion.id?.toString() || currentQuestionIndex.toString()
    dispatch(
      saveAnswer({
        questionId,
        answer: {
          questionId,
          selectedOptionId: selectedOption,
          isCorrect: selectedOption === currentQuestion.answer,
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

  const handleSubmitQuiz = useCallback(async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const results = {
        quizId,
        slug,
        title: quizTitle || title,
        quizType: "mcq",
        questions,
        answers: Object.values(answers),
        completedAt: new Date().toISOString(),
      }

      dispatch(setQuizResults(results))
      dispatch(setQuizCompleted())

      await dispatch(submitQuiz()).unwrap()
    } catch (err) {
      console.error("Error submitting quiz:", err)
      toast.error("Failed to submit quiz. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, quizId, slug, quizTitle, title, questions, answers, dispatch])

  const handleRetakeQuiz = useCallback(() => {
    dispatch(clearQuizState())
    router.replace(`/dashboard/mcq/${slug}`)
  }, [dispatch, router, slug])

  const canGoNext = currentQuestionIndex < questions.length - 1
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const currentAnswerId =
    currentQuestion?.id?.toString()
      ? answers[currentQuestion.id.toString()]?.selectedOptionId
      : undefined

  if (loading || quizStatus === "loading") {
    return <QuizLoader message="Loading quiz..." />
  }

  if (error || quizStatus === "failed") {
    return (
      <NoResults
        variant="error"
        title="Error Loading Quiz"
        description={error || "Unable to load quiz."}
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
      <McqQuiz
        key={currentQuestion.id}
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        existingAnswer={currentAnswerId}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onSubmit={handleSubmitQuiz}
        onRetake={handleRetakeQuiz}
        canGoNext={isLastQuestion ? !!currentAnswerId : !!currentAnswerId && canGoNext}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting || quizStatus === "submitting"}
      />
    </motion.div>
  )
}
