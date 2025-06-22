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
import BlanksQuiz from "./BlanksQuiz"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"

interface BlanksQuizWrapperProps {
  slug: string
  title: string
}

export default function BlanksQuizWrapper({ slug, title }: BlanksQuizWrapperProps) {
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
        const result = await dispatch(fetchQuiz({ slug, quizType: "blanks" })).unwrap()
        if (!result) throw new Error("No data received")
        dispatch(
          hydrateQuiz({
            slug,
            quizType: "blanks",
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
      router.push(`/dashboard/blanks/${slug}/results`)
    }, 1500)
  }, [isCompleted, isSubmitting, router, slug])

  const currentQuestion = useMemo(() => {
    if (!questions.length || currentQuestionIndex >= questions.length) return null
    return questions[currentQuestionIndex]
  }, [questions, currentQuestionIndex])

  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return false

    const questionId = currentQuestion.id?.toString() || currentQuestionIndex.toString()
    const isCorrect = answer.trim().toLowerCase() === (currentQuestion.answer || "").trim().toLowerCase()

    dispatch(
      saveAnswer({
        questionId,
        answer: {
          questionId,
          userAnswer: answer,
          text: answer,
          type: "blanks",
          isCorrect,
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

    try {
      const questionResults = questions.map((question, index) => {
        const id = question.id?.toString() || index.toString()
        const userAnswer = answers[id]?.text || answers[id]?.userAnswer || ""
        const isCorrect = userAnswer.trim().toLowerCase() === (question.answer || "").trim().toLowerCase()

        return {
          questionId: id,
          question: question.question || question.text,
          correctAnswer: question.answer || "",
          userAnswer,
          isCorrect,
          type: "blanks",
        }
      })

      const correctCount = questionResults.filter((q) => q.isCorrect).length
      const percentage = Math.round((correctCount / questions.length) * 100)

      const results = {
        quizId,
        slug,
        title: quizTitle || title,
        quizType: "blanks",
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
    } catch (err) {
      console.error("Error submitting quiz:", err)
      toast.error("Failed to submit quiz. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, questions, answers, quizId, slug, quizTitle, title, dispatch])

  const handleRetakeQuiz = useCallback(() => {
    dispatch(clearQuizState()) // Use clearQuizState to reset the state completely
    router.replace(`/dashboard/blanks/${slug}`) // Redirect to the quiz start page
  }, [dispatch, router, slug])

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
    answers[currentQuestion?.id?.toString() || currentQuestionIndex.toString()]?.text ||
    answers[currentQuestion?.id?.toString() || currentQuestionIndex.toString()]?.userAnswer ||
    ""

  const answeredQuestions = Object.keys(answers).length
  const allQuestionsAnswered = answeredQuestions === questions.length

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <BlanksQuiz
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        existingAnswer={currentAnswer}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSubmit={handleSubmitQuiz}
        onRetake={handleRetakeQuiz}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting || quizStatus === "submitting"}
      />

    
    </motion.div>
  )
}
