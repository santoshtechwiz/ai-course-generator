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
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react"
import McqQuiz from "./McqQuiz"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { motion, AnimatePresence } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"

interface McqQuizWrapperProps {
  slug: string
  title?: string
}

export default function McqQuizWrapper({ slug, title }: McqQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useAuth()

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
    if (!isCompleted || isSubmitting || !isAuthenticated) return

    toast.success("🎉 Quiz completed! Calculating your results...", { duration: 2000 })

    submissionTimeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/mcq/${slug}/results`)
    }, 1500)
  }, [isCompleted, isSubmitting, isAuthenticated, router, slug])

  const currentQuestion = useMemo(() => {
    if (!questions.length || currentQuestionIndex >= questions.length) return null
    const question = questions[currentQuestionIndex]
    return {
      id: question.id,
      question: question.question || question.text || "Question text unavailable",
      options: question.options || [],
      answer: question.answer || "",
    }
  }, [questions, currentQuestionIndex])

  const handleAnswer = (selectedOptionId: string) => {
    if (!currentQuestion) return false

    dispatch(
      saveAnswer({
        questionId: currentQuestion.id,
        answer: {
          questionId: currentQuestion.id,
          selectedOptionId,
          isCorrect: selectedOptionId === currentQuestion.correctOptionId,
          type: "mcq",
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
      const questionResults = questions.map((question, index) => {
        const id = question.id?.toString() || index.toString()
        const userAnswer = answers[id]?.selectedOptionId || ""
        const isCorrect = userAnswer === question.correctOptionId

        return {
          questionId: id,
          question: question.question || question.text,
          correctAnswer: question.correctOptionId || "",
          userAnswer,
          isCorrect,
          type: "mcq",
        }
      })

      const correctCount = questionResults.filter((q) => q.isCorrect).length
      const percentage = Math.round((correctCount / questions.length) * 100)

      const results = {
        quizId,
        slug,
        title: quizTitle || title,
        quizType: "mcq",
        maxScore: questions.length,
        userScore: correctCount,
        score: correctCount,
        percentage,
        completedAt: new Date().toISOString(),
        questionResults,
        questions: questionResults,
      }

      dispatch(setQuizResults(results))
      dispatch(setQuizCompleted())

      await dispatch(submitQuiz()).unwrap()
      router.push(`/dashboard/mcq/${slug}/results`)
    } catch (err) {
      console.error("Error submitting quiz:", err)
      toast.error("Failed to submit quiz. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetakeQuiz = () => {
    dispatch(clearQuizState()) // Use clearQuizState to reset the state completely
    router.replace(`/dashboard/mcq/${slug}`) // Redirect to the quiz start page
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

  // Ensure unique keys for children in McqQuiz
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
      <McqQuiz
        key={currentQuestion.id} // Add unique key for each question
        question={currentQuestion} // Ensure question matches the provided format
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

    
    </motion.div>
  )
}
