"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import {
  selectQuestions,
  selectAnswers,
  selectQuizStatus,
  selectQuizTitle,
  selectIsQuizComplete,
  hydrateQuiz,
  resetQuiz,
  setQuizResults,
  setQuizCompleted,
  fetchQuiz,
  resetSubmissionState,
  submitQuiz,
  selectQuizType,
  clearQuizState,
  saveAnswer,
} from "@/store/slices/quiz-slice"
import { EnhancedLoader } from "@/components/ui/enhanced-loader"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Flag, RefreshCw } from "lucide-react"
import OpenEndedQuiz from "./OpenEndedQuiz"
import { toast } from "sonner"

import { motion, AnimatePresence } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"
import { OpenEndedQuestion } from "@/types/quiz"
import { useAuth } from "@/hooks"
import { useSubscription } from "@/hooks/use-subscription" // Import useSubscription

interface OpenEndedQuizWrapperProps {
  slug: string
  title?: string
}

export default function OpenEndedQuizWrapper({ slug, title }: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useAuth()
  
  // Use subscription hook with skipInitialFetch to prevent unnecessary API calls
  useSubscription({ skipInitialFetch: true })

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [attemptedQuestions, setAttemptedQuestions] = useState<Set<string>>(new Set())
  const [questionElapsedTime, setQuestionElapsedTime] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const timeStartRef = useRef<number>(Date.now())
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)
  const quizType = useSelector(selectQuizType)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      dispatch(resetQuiz())

      try {
        const result = await dispatch(fetchQuiz({ slug, quizType: "openended" })).unwrap()
        if (!result) throw new Error("No data received")
        dispatch(
          hydrateQuiz({
            slug,
            quizType: "openended",
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
      } catch {
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
      router.push(`/dashboard/openended/${slug}/results`)
    }, 1500)
  }, [isCompleted, isSubmitting, isAuthenticated, router, slug])

  const currentQuestion = useMemo(() => {
    if (!questions || questions.length === 0 || currentQuestionIdx >= questions.length) return null
    return questions[currentQuestionIdx] as OpenEndedQuestion
  }, [questions, currentQuestionIdx])

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1)
      timeStartRef.current = Date.now()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1)
      timeStartRef.current = Date.now()
    }
  }

  // Fix handleAnswer to return boolean for OpenEndedQuiz
  const handleAnswer = (answer: string, elapsed = 0, hintsUsed = false): boolean => {
    if (!currentQuestion) return false

    const questionId = currentQuestion.id.toString()
    const elapsedTime = elapsed || (Date.now() - timeStartRef.current) / 1000

    const updatedTime = [...questionElapsedTime]
    updatedTime[currentQuestionIdx] = elapsedTime
    setQuestionElapsedTime(updatedTime)

    setAttemptedQuestions((prev) => new Set(prev).add(questionId))

    timeStartRef.current = Date.now()

    dispatch(
      saveAnswer({
        questionId,
        answer: {
          questionId,
          text: answer,
          timestamp: Date.now(),
          elapsedTime,
          hintsUsed,
        },
      }),
    )

    if (currentQuestionIdx < questions.length - 1) handleNext()
    return true
  }

  const handleSubmitQuiz = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const results = {
        quizId: slug,
        slug,
        title: quizTitle || title || "Open-ended Quiz",
        quizType: "openended",
        completedAt: new Date().toISOString(),
        questions,
        answers: Object.values(answers),
      }

      dispatch(setQuizResults(results))
      dispatch(setQuizCompleted())
      await dispatch(submitQuiz()).unwrap()
    } catch (error) {
      console.error("Failed to submit quiz:", error)
      toast.error("Failed to submit quiz results. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetakeQuiz = () => {
    dispatch(clearQuizState())
    setCurrentQuestionIdx(0)
    setAttemptedQuestions(new Set())
    setQuestionElapsedTime([])
    timeStartRef.current = Date.now()
  }
  if (loading || quizStatus === "loading") {
    return <EnhancedLoader isLoading={true} message="Loading quiz..." subMessage="Preparing questions" />
  }

  if (error || quizStatus === "failed") {
    return (
      <NoResults
        variant="error"
        title="Error Loading Quiz"
        description={error || "Unable to load quiz."}
        action={{ label: "Back to Quizzes", onClick: () => router.push("/dashboard/quizzes") }}
      />
    )
  }

  if (!currentQuestion) {
    return (
      <NoResults
        variant="error"
        title="Quiz Error"
        description="Could not load quiz questions."
        action={{ label: "Try Again", onClick: () => window.location.reload() }}
        secondaryAction={{
          label: "Back to Quizzes",
          onClick: () => router.push("/dashboard/quizzes"),
          variant: "outline",
        }}
      />
    )
  }

  const currentAnswer = answers[currentQuestion.id.toString()]?.text || ""
  const hasCurrentAnswer = !!currentAnswer.trim()
  const allQuestionsAttempted = attemptedQuestions.size === questions.length

  return (
    <div className="space-y-6">
      <OpenEndedQuiz
        key={currentQuestion.id}
        question={currentQuestion}
        questionNumber={currentQuestionIdx + 1}
        totalQuestions={questions.length}
        isLastQuestion={currentQuestionIdx === questions.length - 1}
        onAnswer={handleAnswer}
        onNext={hasCurrentAnswer ? handleNext : undefined}
        onPrevious={currentQuestionIdx > 0 ? handlePrevious : undefined}
        onSubmit={hasCurrentAnswer && currentQuestionIdx === questions.length - 1 ? handleSubmitQuiz : undefined}
      />

     
    </div>
  )
}
