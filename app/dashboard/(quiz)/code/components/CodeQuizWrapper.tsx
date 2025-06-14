"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import {
  selectQuestions,
  selectAnswers,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizResults,
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
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Flag, RefreshCw } from "lucide-react"
import CodeQuiz from "./CodeQuiz"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"

interface CodeQuizWrapperProps {
  slug: string
  title?: string
}

export default function CodeQuizWrapper({ slug, title }: CodeQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Redux state
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)
  const quizId = useSelector(selectQuizId)
  const quizType = useSelector(selectQuizType)

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

    toast.success("🎉 Quiz completed! Calculating your results...", { duration: 2000 })

    submissionTimeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/code/${slug}/results`)
    }, 1500)
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
          type: "code",
          timestamp: Date.now(),
        },
      }),
    )
    return true
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))
    }
  }

  const handleSubmitQuiz = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const results = {
        quizId,
        slug,
        title: quizTitle,
        quizType: "code",
        questions,
        answers: Object.values(answers),
        completedAt: new Date().toISOString(),
      }

      dispatch(setQuizResults(results))
      dispatch(setQuizCompleted())

      await dispatch(submitQuiz()).unwrap()
      router.push(`/dashboard/code/${slug}/results`)
    } catch (err) {
      console.error("Error submitting quiz:", err)
      toast.error("Failed to submit quiz. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetakeQuiz = () => {
    dispatch(clearQuizState())
    router.replace(`/dashboard/code/${slug}`)
  }

  const canGoNext = currentQuestionIndex < questions.length - 1
  const canGoPrevious = currentQuestionIndex > 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  if (loading || quizStatus === "loading") {
    return <QuizLoader message="Loading quiz..." subMessage="Preparing questions" />
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

  const currentAnswer =
    answers[currentQuestion.id?.toString() || currentQuestionIndex.toString()]?.selectedOptionId || ""

  const answeredQuestions = Object.keys(answers).length
  const allQuestionsAnswered = answeredQuestions === questions.length

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <CodeQuiz
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        existingAnswer={currentAnswer}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSubmit={handleSubmitQuiz}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        isLastQuestion={isLastQuestion}
      />

      <AnimatePresence>
        {answeredQuestions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <Button
              onClick={handleSubmitQuiz}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl px-8 gap-2 shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz and View Results"}
            </Button>
            <Button
              onClick={handleRetakeQuiz}
              size="lg"
              variant="outline"
              className="mt-4 text-blue-700 border-blue-500 hover:bg-blue-100 rounded-2xl px-8 gap-2 shadow-lg"
            >
              Retake Quiz
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
