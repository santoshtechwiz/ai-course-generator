"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import {
  selectQuestions,
  selectAnswers,
  selectQuizStatus,
  selectQuizError,
  selectCurrentQuestionIndex,
  selectCurrentQuestion,
  selectQuizTitle,
  selectIsQuizComplete,
  setCurrentQuestionIndex,
  saveAnswer,
  fetchQuiz,
  setQuizCompleted,
  submitQuiz,
  resetSubmissionState,
} from "@/store/slices/quiz-slice"

import { Button } from "@/components/ui/button"
import McqQuiz from "./McqQuiz"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { ChevronLeft, ChevronRight, CheckCircle, Trophy } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { QuizType } from "@/types/quiz"
import { useAuth } from "@/hooks/use-auth"
import { motion, AnimatePresence } from "framer-motion"

interface McqQuizWrapperProps {
  slug: string
  quizData?: {
    title?: string
    questions?: any[]
  }
}

export default function McqQuizWrapper({ slug, quizData }: McqQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  // Track submission state locally to prevent multiple submissions
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxSubmitAttemptsRef = useRef<number>(0)

  // Redux selectors - pure quiz state
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const currentQuestion = useSelector(selectCurrentQuestion)
  const quizTitle = useSelector(selectQuizTitle)
  const isQuizComplete = useSelector(selectIsQuizComplete)

  // Load quiz data on mount
  useEffect(() => {
    if (quizStatus === "idle") {
      const quizPayload = quizData?.questions?.length
        ? {
            slug,
            data: {
              slug,
              title: quizData.title || "MCQ Quiz",
              questions: quizData.questions,
              type: "mcq" as QuizType,
            },
            type: "mcq" as QuizType,
          }
        : { slug, type: "mcq" as QuizType }

      dispatch(fetchQuiz(quizPayload))
    }

    // Clear any previous submission state on component mount
    dispatch(resetSubmissionState())

    // Cleanup
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [quizStatus, dispatch, slug, quizData])

  // Add safety timeout to prevent UI freeze
  useEffect(() => {
    // If we've been submitting for more than 10 seconds, something is wrong
    if (isSubmitting) {
      const safetyTimeout = setTimeout(() => {
        // Force navigation to results
        const safeSlug = typeof slug === "string" ? slug : String(slug)
        router.push(`/dashboard/mcq/${safeSlug}/results`)
      }, 10000) // 10 seconds timeout

      return () => clearTimeout(safetyTimeout)
    }
  }, [isSubmitting, router, slug])

  // Handle quiz completion - only when explicitly triggered
  useEffect(() => {
    if (!isQuizComplete || hasSubmitted || !isAuthenticated) return

    // Show completion toast with celebration
    toast.success("🎉 Quiz completed! Calculating your results...", {
      duration: 2000,
    })

    // Navigate to results page with safety timeout
    const safeSlug = typeof slug === "string" ? slug : String(slug)
    setHasSubmitted(true)

    // Add a small delay for better UX
    submissionTimeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/mcq/${safeSlug}/results`)
    }, 1500)
  }, [isQuizComplete, router, slug, hasSubmitted, isAuthenticated])

  // Handle answer selection
  const handleAnswerQuestion = (selectedOptionId: string) => {
    if (!currentQuestion) return

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
  }

  // Navigation handlers
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }

  // Complete the quiz - now with better safeguards and retry mechanism
  const handleFinish = () => {
    if (hasSubmitted || isSubmitting) return

    setIsSubmitting(true)

    try {
      // First mark as completed
      dispatch(setQuizCompleted())

      // Store answers in localStorage as backup
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "quiz_answers_backup",
            JSON.stringify({
              slug,
              answers,
              timestamp: Date.now(),
            }),
          )
        } catch (e) {
          console.error("Failed to backup answers:", e)
        }
      }

      // Then submit the quiz to generate results
      dispatch(submitQuiz())
        .unwrap()
        .then(() => {
          setHasSubmitted(true)
          const safeSlug = typeof slug === "string" ? slug : String(slug)

          // Navigate to results page after a short delay
          submissionTimeoutRef.current = setTimeout(() => {
            router.push(`/dashboard/mcq/${safeSlug}/results`)
          }, 1000)
        })
        .catch((err) => {
          console.error("Quiz submission error:", err)
          maxSubmitAttemptsRef.current += 1

          // If we've tried 3 times or more, just navigate to results
          if (maxSubmitAttemptsRef.current >= 3) {
            toast.error("Having trouble submitting quiz. Redirecting to results page.")
            const safeSlug = typeof slug === "string" ? slug : String(slug)
            setTimeout(() => {
              router.push(`/dashboard/mcq/${safeSlug}/results`)
            }, 1000)
            return
          }

          // Otherwise show error and reset submission state
          setIsSubmitting(false)
          toast.error("Failed to submit quiz. Please try again.")
        })
    } catch (err) {
      console.error("Error in quiz submission flow:", err)
      setIsSubmitting(false)
      toast.error("Failed to submit quiz. Please try again.")
    }
  }

  // UI calculations
  const answeredQuestions = Object.keys(answers).length
  const progressPercentage = (answeredQuestions / questions.length) * 100
  const allQuestionsAnswered = answeredQuestions === questions.length
  const actualSubmittingState = isSubmitting || quizStatus === "submitting"

  // Loading state
  if (quizStatus === "loading") {
    return <QuizLoader message="Loading quiz data" subMessage="Getting your questions ready" />
  }

  // Error state
  if (quizStatus === "failed") {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quiz Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">{error || "Unable to load quiz data."}</p>
            <div className="space-x-4">
              <Button onClick={() => window.location.reload()}>Try Again</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")}>
                Back to Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Empty questions state
  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">No Questions Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">This quiz has no questions.</p>
            <Button onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No current question state
  if (!currentQuestion) {
    return <QuizLoader steps={[{ label: "Initializing quiz", status: "loading" }]} />
  }

  // Get current answer
  const currentAnswer = answers[currentQuestion.id]
  const existingAnswer = currentAnswer?.selectedOptionId

  // Submitting state
  if (actualSubmittingState) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5 }}
      >
        <QuizLoader full message="🎉 Quiz Completed!" subMessage="Calculating your results..." />
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Quiz Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg rounded-2xl border-0 bg-gradient-to-r from-background to-muted/20">
            <CardHeader className="p-6">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {quizTitle || "MCQ Quiz"}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {answeredQuestions} of {questions.length} questions answered
                  </p>
                </div>
                <motion.div
                  className="flex items-center gap-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-2xl border border-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      {answeredQuestions}/{questions.length}
                    </span>
                  </div>
                </motion.div>
              </div>
              <div className="mt-6">
                <Progress value={progressPercentage} className="h-3 rounded-2xl" />
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Question Navigation */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="shadow-lg rounded-2xl border-0">
            <CardContent className="p-4">
              <div className="flex justify-between items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => dispatch(setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1)))}
                  disabled={currentQuestionIndex === 0 || actualSubmittingState}
                  className="rounded-2xl px-6"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>

                <div className="flex gap-2 overflow-x-auto py-2 px-1">
                  {questions.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => dispatch(setCurrentQuestionIndex(index))}
                      disabled={actualSubmittingState}
                      className={`w-10 h-10 rounded-2xl text-sm font-medium transition-all duration-300 ${
                        index === currentQuestionIndex
                          ? "bg-primary text-primary-foreground shadow-lg scale-110"
                          : answers[questions[index].id]
                            ? "bg-green-500 text-white shadow-md"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105"
                      }`}
                      whileHover={{ scale: actualSubmittingState ? 1 : 1.1 }}
                      whileTap={{ scale: actualSubmittingState ? 1 : 0.95 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {index + 1}
                    </motion.button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() =>
                    dispatch(setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1)))
                  }
                  disabled={currentQuestionIndex === questions.length - 1 || actualSubmittingState}
                  className="rounded-2xl px-6"
                >
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Current Question */}
        <McqQuiz
          question={currentQuestion}
          onAnswer={handleAnswerQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          isSubmitting={actualSubmittingState}
          existingAnswer={existingAnswer}
        />

        {/* Bottom Navigation */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="shadow-lg rounded-2xl border-0">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>

                <div className="flex gap-4">
                  <AnimatePresence>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Button
                          onClick={handleNext}
                          disabled={!existingAnswer || actualSubmittingState}
                          className="rounded-2xl px-6 gap-2"
                        >
                          Next Question <ChevronRight className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Button
                          onClick={handleFinish}
                          disabled={!allQuestionsAnswered || actualSubmittingState || hasSubmitted}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-2xl px-6 gap-2 shadow-lg"
                        >
                          <Trophy className="w-4 h-4" />
                          {actualSubmittingState ? "Submitting..." : "Finish Quiz"}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
