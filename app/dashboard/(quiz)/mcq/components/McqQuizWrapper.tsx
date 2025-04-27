"use client"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { memo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

import McqQuiz from "./McqQuiz"
import McqQuizResult from "./McqQuizResult"
import { useQuiz, QuizProvider } from "@/app/context/QuizContext"
import { GuestPrompt } from "../../components/GuestSignInPrompt"
import { quizService } from "@/lib/QuizService"
import type { Question } from "./types"

interface McqQuizContentProps {
  quizData: {
    id: string
    title: string
    slug: string
    isPublic: boolean
    isFavorite: boolean
    userId: string
    difficulty?: string
  }
  questions: Question[]
  slug: string
}

// Memoize the content component to prevent unnecessary re-renders
const McqQuizContent = memo(function McqQuizContent({ quizData, questions, slug }: McqQuizContentProps) {
  const { state, submitAnswer, completeQuiz, restartQuiz, isAuthenticated } = useQuiz()
  const router = useRouter()

  const { currentQuestionIndex, questionCount, isLoading, error, isCompleted, answers, isProcessingAuth } = state
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]

  // Handle answer submission
  const handleAnswer = (answer: string, timeSpent: number, isCorrect: boolean) => {
    submitAnswer(answer, timeSpent, isCorrect)

    // Check if this is the last question
    if (currentQuestionIndex >= questionCount - 1) {
      // Get all answers including the current one
      const updatedAnswers = [...answers]
      updatedAnswers[currentQuestionIndex] = { answer, timeSpent, isCorrect }

      // If not authenticated and this is the last question, show auth prompt
      if (!isAuthenticated && currentQuestionIndex === questionCount - 1) {
        // Check if we should show auth prompt based on URL
        const urlParams = new URLSearchParams(window.location.search)
        const isCompleted = urlParams.get("completed") === "true"

        if (!isCompleted) {
          setShowAuthPrompt(true)
        } else {
          // Complete the quiz without showing auth prompt
          setTimeout(() => {
            completeQuiz(updatedAnswers.filter((a) => a !== null))
          }, 1000)
        }
      } else {
        // Complete the quiz
        setTimeout(() => {
          completeQuiz(updatedAnswers.filter((a) => a !== null))
        }, 1000) // Slightly reduced delay for better UX
      }
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <AnimatePresence mode="wait">
        {isLoading || isProcessingAuth ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[200px] gap-3"
            aria-live="polite"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden="true"></div>
            <p className="text-sm text-muted-foreground">
              {isProcessingAuth ? "Processing your results..." : "Loading quiz data..."}
            </p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Error loading quiz</AlertTitle>
              <AlertDescription>
                {error || "We couldn't load the quiz data. Please try again later."}
                <div className="mt-4">
                  <Button onClick={() => router.push("/dashboard/mcq")}>Return to Quiz Creator</Button>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        ) : !questions || questions.length === 0 ? (
          <motion.div
            key="no-questions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No questions available for this quiz.</p>
                <p className="text-sm text-muted-foreground mb-6">
                  This could be because the quiz is still being generated or there was an error during creation.
                </p>
                <Button onClick={() => router.push("/dashboard/mcq")} className="mt-4">
                  Return to Quiz Creator
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : showAuthPrompt && !isAuthenticated && !isCompleted ? (
          <motion.div
            key="auth-prompt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <GuestPrompt quizId={quizData.id} />
          </motion.div>
        ) : isCompleted ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <McqQuizResult title={quizData?.title || "Quiz"} onRestart={restartQuiz} />
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <McqQuiz
              question={currentQuestion}
              onAnswer={handleAnswer}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questionCount}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

interface McqQuizWrapperProps {
  quizData: {
    id: string
    title: string
    slug: string
    isPublic: boolean
    isFavorite: boolean
    userId: string
    difficulty?: string
  }
  questions: Question[]
  slug: string
}

export default function McqQuizWrapper({ quizData, questions, slug }: McqQuizWrapperProps) {
  return (
    <QuizProvider
      quizData={{
        ...quizData,
        questions,
      }}
      slug={slug}
      onAuthRequired={(redirectUrl) => {
        // Save auth redirect info
        quizService.saveAuthRedirect(redirectUrl)

        // Save current quiz state before redirecting
        quizService.savePendingQuizData()

        // Add fromAuth parameter to the callback URL
        const callbackUrl = new URL(redirectUrl, window.location.origin)
        callbackUrl.searchParams.set("fromAuth", "true")

        // Redirect to sign in page
        if (typeof window !== "undefined") {
          window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl.toString())}`
        }
      }}
    >
      <McqQuizContent quizData={quizData} questions={questions} slug={slug} />
    </QuizProvider>
  )
}
