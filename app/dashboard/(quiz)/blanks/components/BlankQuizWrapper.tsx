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
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Flag, RefreshCw } from "lucide-react"

import { getBestSimilarityScore } from "@/lib/utils/text-similarity"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { motion, AnimatePresence } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"
import BlanksQuiz from "./BlanksQuiz"
import { useEnhancedLoader } from "@/components/ui/enhanced-loader/enhanced-loader-provider"

interface BlankQuizWrapperProps {
  slug: string
  title: string
}

export default function BlankQuizWrapper({ slug, title }: BlankQuizWrapperProps) {
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
  const enhancedLoader = useEnhancedLoader();
  const calculateSimilarity = (userAnswer: string, correctAnswer: string) =>
    getBestSimilarityScore(userAnswer, correctAnswer) / 100

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
    if (!isCompleted || isSubmitting || !isAuthenticated) return

      enhancedLoader.showLoader({ message: "Calculating your results..." })

    submissionTimeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/blanks/${slug}/results`)
    }, 500)
  }, [isCompleted, isSubmitting, isAuthenticated, router, slug])

  const currentQuestion = useMemo(() => {
    if (!questions.length || currentQuestionIndex >= questions.length) return null
    return questions[currentQuestionIndex]
  }, [questions, currentQuestionIndex])

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion) return false

      const questionId = currentQuestion.id?.toString() || currentQuestionIndex.toString()
      const similarity = calculateSimilarity(answer, currentQuestion.answer || "")
      const isCorrect = similarity >= 0.7

      dispatch(
        saveAnswer({
          questionId,
          answer: {
            questionId,
            text: answer,
            userAnswer: answer,
            type: "blanks",
            similarity,
            isCorrect,
            timestamp: Date.now(),
          },
        }),
      )
      return true
    },
    [currentQuestion, currentQuestionIndex, dispatch],
  )

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
    if (isSubmitting || !allQuestionsAnswered) return // Ensure all questions are answered before submitting

    setIsSubmitting(true)

    try {
      const questionResults = questions.map((question, index) => {
        const id = question.id?.toString() || index.toString()
        const userAnswer = answers[id]?.text || answers[id]?.userAnswer || ""
        const similarity = calculateSimilarity(userAnswer, question.answer || "")
        const isCorrect = similarity >= 0.7

        return {
          questionId: id,
          question: question.question || question.text,
          correctAnswer: question.answer || "",
          userAnswer,
          similarity,
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
      router.push(`/dashboard/blanks/${slug}/results`)
    } catch (err) {
      console.error("Error submitting quiz:", err)
      toast.error("Failed to submit quiz. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetakeQuiz = () => {
    dispatch(clearQuizState()) // Use clearQuizState to reset the state completely
    router.replace(`/dashboard/blanks/${slug}`) // Redirect to the quiz start page
  }

  const canGoNext = currentQuestionIndex < questions.length - 1
  const canGoPrevious = currentQuestionIndex > 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const currentAnswer =
    answers[currentQuestion.id?.toString() || currentQuestionIndex.toString()]?.text ||
    answers[currentQuestion.id?.toString() || currentQuestionIndex.toString()]?.userAnswer ||
    ""

  const answeredQuestions = Object.keys(answers).length
  const allQuestionsAnswered = answeredQuestions === questions.length

  if (loading || quizStatus === "loading") {
    return <QuizLoader message="Loading quiz..." subMessage="Preparing questions" className="min-h-[400px]" />
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
      <BlanksQuiz
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
            <Card className="border-2 border-green-500/30 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg rounded-2xl">
              <CardContent className="p-6 text-center">
                <motion.p
                  className="mb-4 font-medium text-green-800 dark:text-green-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {allQuestionsAnswered
                    ? "All questions answered. Ready to submit?"
                    : `${answeredQuestions} questions answered. Submit quiz?`}
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
    </motion.div>
  )
}
