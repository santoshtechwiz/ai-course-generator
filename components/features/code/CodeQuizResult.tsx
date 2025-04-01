"use client"

import type React from "react"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { SignInPrompt } from "@/components/SignInPrompt"

import { useRouter } from "next/navigation"
import PageLoader from "@/components/ui/loader"
import { submitQuizData } from "@/lib/slug"

interface CodeQuizResultProps {
  correctCount: number
  totalQuestions: number
  onRestartQuiz: () => void
  isSubmitting: boolean
  savedResults: {
    slug: string
    quizId: number
    answers: Array<{
      answer: string
      timeSpent: number
      hintsUsed: boolean
    }>
    elapsedTime: number
    score: number
    type: string
  } | null
}

const CodeQuizResult: React.FC<CodeQuizResultProps> = ({
  correctCount,
  totalQuestions: initialTotalQuestions,
  onRestartQuiz,
  isSubmitting,
  savedResults,
}) => {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    const submitSavedResults = async () => {
      if (session && savedResults) {
        try {
          await submitQuizData(savedResults)
          // Clear saved results after successful submission
          localStorage.removeItem("quizResults")
        } catch (error) {
          console.error("Failed to submit saved quiz results:", error)
        }
      }
    }

    submitSavedResults()
  }, [session, savedResults])

  const handleRestartQuiz = () => {
    if (savedResults) {
      router.push(`/dashboard/code/${savedResults.slug}`)
    } else {
      onRestartQuiz()
    }
  }

  const formatTime = (seconds: number | undefined): string => {
    if (typeof seconds !== "number" || isNaN(seconds)) {
      return "N/A"
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  if (status === "loading" || isSubmitting) {
    return <PageLoader />
  }

  if (status === "unauthenticated") {
    return (
      <div>
        <SignInPrompt />
        <p>Your results have been saved. Sign in to see your results and track your progress!</p>
      </div>
    )
  }

  const totalQuestions = savedResults?.answers.length ?? initialTotalQuestions
  const percentage = savedResults?.score ?? Math.round((correctCount / totalQuestions) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {percentage >= 70 ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
            <p className="text-3xl font-bold">{percentage}%</p>
            <p className="text-xl">
              You got {correctCount} out of {totalQuestions} questions correct
            </p>
            <p className="text-lg">Total time: {formatTime(savedResults?.elapsedTime)}</p>
            <p className="text-lg text-gray-600">
              {percentage >= 70
                ? "Great job! You've mastered this quiz."
                : "Keep practicing! You'll improve with time."}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleRestartQuiz} className="w-full max-w-xs">
            Retake Quiz
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default CodeQuizResult

