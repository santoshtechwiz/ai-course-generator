"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { QuizResultDisplay } from "../../components/QuizResultDisplay"
import { useQuizResult } from "@/app/dashboard/(quiz)/hooks/useQuizResult"
import { calculateScore } from "@/app/dashboard/(quiz)/utils/quiz-utils"

interface McqQuizResultProps {
  quizId: number
  slug: string
  title: string
  answers: { answer: string; timeSpent: number; isCorrect: boolean }[]
  totalQuestions: number
  startTime: number
  score: number
  onRestart: () => void
  onSignIn: () => void
  questions?: { id: number; question: string; options: string[]; answer: string }[]
}

export default function McqQuizResult({
  quizId,
  slug,
  title,
  answers: initialAnswersProp,
  totalQuestions,
  startTime,
  score: initialScore,
  onRestart,
  onSignIn,
  questions = [],
}: McqQuizResultProps) {
  // State
  const [answers, setAnswers] = useState<{ answer: string; timeSpent: number; isCorrect: boolean }[]>(
    initialAnswersProp || [],
  )
  const [score, setScore] = useState(initialScore || 0)
  const [isRecovering, setIsRecovering] = useState(false)
  const [totalTime, setTotalTime] = useState<number>(0)

  // Hooks
  const { data: session, status } = useSession()
  const router = useRouter()
  const isLoggedIn = status === "authenticated"

  // Use the quiz result hook
  const { isLoading, isSaving, error, correctAnswers } = useQuizResult({
    quizId: String(quizId),
    slug,
    answers,
    totalTime,
    score,
    quizType: "mcq",
    totalQuestions,
    startTime,
  })

  // Calculate total time on mount
  useEffect(() => {
    const calculatedTotalTime = startTime ? (Date.now() - startTime) / 1000 : 0
    setTotalTime(calculatedTotalTime > 0 ? calculatedTotalTime : 300) // Default to 5 minutes if invalid
  }, [startTime])

  // Process and validate answers
  useEffect(() => {
    if (initialAnswersProp && initialAnswersProp.length > 0) {
      setAnswers(initialAnswersProp)

      // Recalculate score if needed
      if (initialScore === 0 || initialScore === undefined) {
        const calculatedScore = calculateScore(initialAnswersProp, "mcq")
        setScore(calculatedScore)
      }
    } else {
      // Create empty answers if none provided
      if (questions && questions.length > 0) {
        const emptyAnswers = questions.map(() => ({
          answer: "",
          timeSpent: 0,
          isCorrect: false,
        }))
        setAnswers(emptyAnswers)
      }
    }
  }, [initialAnswersProp, questions, initialScore])

  // Handle navigation to dashboard
  const handleGoToDashboard = useCallback(() => {
    router.push("/dashboard/mcq")
  }, [router])

  // Render content based on authentication status
  const renderContent = () => {
    // Show loading state while recovering answers
    if (isRecovering) {
      return (
        <div className="w-full max-w-3xl mx-auto p-4 text-center">
          <div className="flex flex-col items-center justify-center p-8 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p>Recovering your quiz results...</p>
          </div>
        </div>
      )
    }

    if (!isLoggedIn) {
      return (
        <div className="w-full max-w-3xl mx-auto p-4 text-center">
          <Alert>
            <AlertTitle className="text-xl">Sign in to view your results</AlertTitle>
            <AlertDescription className="mt-4">
              <p className="mb-4">Your quiz has been completed! Sign in to view your results and save your progress.</p>
              <Button onClick={onSignIn} className="mr-2">
                Sign In
              </Button>
              <Button variant="outline" onClick={handleGoToDashboard}>
                Return to Dashboard
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Safety check for answers array
    const safeAnswers = answers || []
    const safeTotalQuestions = totalQuestions || safeAnswers.length || 1

    return (
      <>
        <QuizResultDisplay
          quizId={String(quizId)}
          title={title || "Quiz"}
          score={score || 0}
          totalQuestions={safeTotalQuestions}
          totalTime={totalTime}
          correctAnswers={correctAnswers}
          type="mcq"
          slug={slug}
          answers={safeAnswers}
          onRestart={onRestart}
          showAuthModal={false}
          startTime={startTime}
        />

        {error && (
          <Alert variant="destructive" className="mt-4 max-w-4xl mx-auto">
            <AlertTitle>Error saving results</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSaving && (
          <div className="mt-4 text-center">
            <p className="text-muted-foreground">Saving your results...</p>
          </div>
        )}
      </>
    )
  }

  // Always return a motion.div wrapper to ensure consistent hook execution
  return (
    <motion.div
      key={isLoggedIn ? "results" : "auth-prompt"}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {renderContent()}
    </motion.div>
  )
}
