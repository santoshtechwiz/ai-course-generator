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
  setQuizResults,
  resetSubmissionState,
  submitQuiz,
} from "@/store/slices/quiz-slice"
import { QuizLoader } from "@/components/ui/quiz-loader"
import type { BlankQuestion } from "./types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BlanksQuiz from "./BlanksQuiz"
import type { QuizType } from "@/types/quiz"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { motion } from "framer-motion"

interface BlanksQuizWrapperProps {
  slug: string
  quizData?: {
    title?: string
    questions?: BlankQuestion[]
  }
}

export default function BlanksQuizWrapper({ slug, quizData }: BlanksQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  // Track submission state locally to prevent multiple submissions
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxSubmitAttemptsRef = useRef<number>(0)

  // Redux selectors
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const currentQuestion = useSelector(selectCurrentQuestion)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)

  // Load quiz data on mount
  useEffect(() => {
    if (quizStatus === "idle") {
      const quizPayload = quizData?.questions?.length
        ? {
            slug,
            data: {
              slug,
              title: quizData.title || "Blanks Quiz",
              questions: quizData.questions,
              type: "blanks" as QuizType,
            },
            type: "blanks" as QuizType,
          }
        : { slug, type: "blanks" as QuizType }

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
        router.push(`/dashboard/blanks/${safeSlug}/results`)
      }, 10000) // 10 seconds timeout

      return () => clearTimeout(safetyTimeout)
    }
  }, [isSubmitting, router, slug])

  // Handle quiz completion - only when explicitly triggered
  useEffect(() => {
    if (!isCompleted || hasSubmitted || !isAuthenticated) return

    // Show completion toast with celebration
    toast.success("🎉 Quiz completed! Calculating your results...", {
      duration: 2000,
    })

    // Navigate to results page with safety timeout
    const safeSlug = typeof slug === "string" ? slug : String(slug)
    setHasSubmitted(true)

    // Add a small delay for better UX
    submissionTimeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/blanks/${safeSlug}/results`)
    }, 1500)
  }, [isCompleted, router, slug, hasSubmitted, isAuthenticated])

  // Answer handler - fixed to properly store answers
  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return

    // Store the answer in Redux with proper structure
    dispatch(
      saveAnswer({
        questionId: currentQuestion.id,
        answer: {
          questionId: currentQuestion.id,
          userAnswer: answer,
          text: answer, // Add text field for consistency
          type: "blanks",
          isCorrect: answer.trim().toLowerCase() === (currentQuestion.answer || "").trim().toLowerCase(),
          timestamp: Date.now(),
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

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))
    }
  }

  // Complete the quiz - improved with better error handling and safety checks
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
              quizType: "blanks",
            }),
          )
        } catch (e) {
          console.error("Failed to backup answers:", e)
        }
      }

      // Generate results for all questions (including unanswered ones)
      const questionResults = questions.map((question) => {
        const qid = String(question.id)
        const answer = answers[qid]
        const userAnswer = answer?.userAnswer || answer?.text || ""
        const correctAnswer = question.answer || ""
        const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()

        return {
          questionId: qid,
          question: question.question || question.text,
          correctAnswer,
          userAnswer,
          isCorrect,
          type: "blanks",
        }
      })

      const correctCount = questionResults.filter((q) => q.isCorrect).length
      const percentage = Math.round((correctCount / questions.length) * 100)

      const results = {
        quizId: slug,
        slug: slug,
        title: quizTitle || "Blanks Quiz",
        quizType: "blanks",
        score: correctCount,
        maxScore: questions.length,
        percentage,
        completedAt: new Date().toISOString(),
        questionResults,
        questions: questionResults,
      }

      // Set results first
      dispatch(setQuizResults(results))

      // Then submit the quiz
      dispatch(submitQuiz())
        .unwrap()
        .then(() => {
          setHasSubmitted(true)
          const safeSlug = typeof slug === "string" ? slug : String(slug)

          // Navigate to results page after a short delay
          submissionTimeoutRef.current = setTimeout(() => {
            router.push(`/dashboard/blanks/${safeSlug}/results`)
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
              router.push(`/dashboard/blanks/${safeSlug}/results`)
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
  const actualSubmittingState = isSubmitting || quizStatus === "submitting"

  // Loading state
  if (quizStatus === "loading") {
    return <QuizLoader message="Loading quiz data" subMessage="Preparing your blank questions" />
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

  // Current answer from Redux
  const currentAnswer = answers[currentQuestion.id]
  const existingAnswer = currentAnswer?.userAnswer || currentAnswer?.text || ""

  // Navigation state
  const canGoNext = currentQuestionIndex < questions.length - 1
  const canGoPrevious = currentQuestionIndex > 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

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

  // Show current question
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-background to-muted/20"
    >
      <BlanksQuiz
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        existingAnswer={existingAnswer}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSubmit={handleFinish}
        isSubmitting={actualSubmittingState}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        isLastQuestion={isLastQuestion}
      />
    </motion.div>
  )
}
