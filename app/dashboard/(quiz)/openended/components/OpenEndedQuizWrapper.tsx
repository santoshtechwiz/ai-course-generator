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
} from "@/store/slices/quiz-slice"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Flag, RefreshCw } from "lucide-react"
import OpenEndedQuiz from "./OpenEndedQuiz"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { motion, AnimatePresence } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"

interface OpenEndedQuizWrapperProps {
  slug: string
  title: string
}

export default function OpenEndedQuizWrapper({ slug, title }: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useAuth()

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

  const handleAnswer = (answer: string, elapsed = 0, hintsUsed = false) => {
    if (!currentQuestion) return

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
    return <QuizLoader message="Loading quiz..." subMessage="Preparing questions" />
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
        onRetake={handleRetakeQuiz}
      />

      <AnimatePresence>
        {attemptedQuestions.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-2 border-green-500/30 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg rounded-2xl">
              <CardContent className="p-6 text-center">
                <motion.p
                  className="mb-4 font-medium text-green-800 dark:text-green-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {allQuestionsAttempted
                    ? "All questions answered. Ready to submit?"
                    : `${attemptedQuestions.size} questions answered. Submit quiz?`}
                </motion.p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Button
                    onClick={handleSubmitQuiz}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl px-8 gap-2 shadow-lg"
                    disabled={isSubmitting}
                  >
                    <Flag className="w-4 h-4" />
                    {isSubmitting ? "Submitting..." : "Submit Quiz and View Results"}
                  </Button>
                  <Button
                    onClick={handleRetakeQuiz}
                    size="lg"
                    variant="outline"
                    className="mt-4 text-green-700 border-green-500 hover:bg-green-100 rounded-2xl px-8 gap-2 shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retake Quiz
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
