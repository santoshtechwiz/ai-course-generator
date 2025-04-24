"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { QuizResultBase } from "../../components/QuizResultBase"
import { useQuizResult } from "@/hooks/useQuizResult"
import { quizService } from "@/lib/QuizService"
import { getPerformanceLevel, getAnswerClassName } from "@/utils/quiz-utils"

interface QuizResultsOpenEndedProps {
  quizId: string
  slug: string
  title: string
  answers: { answer: string; timeSpent: number; similarity?: number; isCorrect?: boolean }[]
  questions: { id: string; question: string; answer: string }[]
  totalQuestions: number
  startTime: number
  score: number
  onRestart: () => void
  onSignIn: () => void
}

export default function QuizResultsOpenEnded({
  quizId,
  slug,
  title,
  answers: initialAnswers,
  questions,
  totalQuestions,
  startTime,
  score: initialScore,
  onRestart,
  onSignIn,
}: QuizResultsOpenEndedProps) {
  // State
  const [answers, setAnswers] = useState<
    { answer: string; timeSpent: number; similarity: number; isCorrect: boolean }[]
  >([])
  const [score, setScore] = useState(initialScore || 0)
  const [isRecovering, setIsRecovering] = useState(false)
  const [totalTime, setTotalTime] = useState<number>(0)

  // Hooks
  const { data: session, status } = useSession()
  const router = useRouter()
  const isLoggedIn = status === "authenticated"

  // Use the quiz result hook
  const { isLoading, isSaving, error, saveResult, correctAnswers } = useQuizResult({
    quizId,
    slug,
    answers,
    totalTime,
    score,
    quizType: "openended",
    totalQuestions,
    startTime,
  })

  // Calculate total time on mount
  useEffect(() => {
    const calculatedTotalTime = startTime ? (Date.now() - startTime) / 1000 : 0
    setTotalTime(calculatedTotalTime > 0 ? calculatedTotalTime : 300) // Default to 5 minutes if invalid
  }, [startTime])

  // Process and format answers
  useEffect(() => {
    if (initialAnswers && initialAnswers.length > 0) {
      // Format and process the answers
      const processedAnswers = initialAnswers.map((answer, index) => {
        // If similarity is already calculated, use it
        if (answer.similarity !== undefined) {
          return {
            ...answer,
            similarity: answer.similarity,
            isCorrect: answer.isCorrect !== undefined ? answer.isCorrect : answer.similarity > 70,
          }
        }

        // Otherwise calculate it
        const question = questions[index]
        const similarity = question ? quizService.calculateSimilarity(answer.answer || "", question.answer || "") : 0

        return {
          ...answer,
          similarity,
          isCorrect: similarity > 70,
        }
      })

      setAnswers(processedAnswers)

      // Recalculate score if needed
      if (initialScore === 0 || initialScore === undefined) {
        const totalSimilarity = processedAnswers.reduce((sum, a) => sum + a.similarity, 0)
        const calculatedScore = Math.round(totalSimilarity / processedAnswers.length)
        setScore(calculatedScore)
      }
    } else {
      // Create empty answers if none provided
      if (questions && questions.length > 0) {
        const emptyAnswers = questions.map(() => ({
          answer: "",
          timeSpent: 0,
          similarity: 0,
          isCorrect: false,
        }))
        setAnswers(emptyAnswers)
      }
    }
  }, [initialAnswers, questions, initialScore])

  // Auto-save results if user is logged in
  useEffect(() => {
    if (isLoggedIn && answers.length > 0 && !isSaving && !isLoading) {
      saveResult()
    }
  }, [isLoggedIn, answers, saveResult, isSaving, isLoading])

  // Handle navigation to dashboard
  const handleGoToDashboard = () => {
    router.push("/dashboard/openended")
  }

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
    const performance = getPerformanceLevel(score)

    return (
      <QuizResultBase
        quizId={quizId}
        title={title || "Quiz"}
        score={score || 0}
        totalQuestions={safeTotalQuestions}
        totalTime={totalTime}
        slug={slug}
        quizType="openended"
        correctAnswers={correctAnswers}
        showAuthModal={false}
        onRestart={onRestart}
        isSaving={isSaving}
        isLoading={isLoading}
      >
        <div className="max-w-4xl mx-auto p-4">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                Quiz Results
                {isSaving && <span className="text-sm text-muted-foreground">(Saving...)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <p className="text-3xl font-bold mb-2">{score}%</p>
                <Progress value={score} className="w-full h-2" indicatorClassName={performance.bgColor} />
                <p className="mt-2 text-sm text-muted-foreground">{performance.message}</p>
              </div>

              {/* No answers warning */}
              {answers.length === 0 && (
                <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-amber-800 font-medium">No answers found to display.</p>
                  <p className="text-sm text-amber-700">This may happen if you signed out and back in.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.push(`/dashboard/openended/${slug}`)}
                  >
                    Return to Quiz
                  </Button>
                </div>
              )}

              {/* Question results */}
              {answers.map((answer, index) => (
                <Card key={index} className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Question {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2">{questions[index]?.question || "Question not available"}</div>
                    <div className="grid gap-2 mb-4">
                      <div className="p-3 rounded-md border bg-muted/30">
                        <p className="font-medium">Your Answer:</p>
                        <p className="mt-1 whitespace-pre-wrap">{answer.answer || "(No answer provided)"}</p>
                      </div>
                      <div className="p-3 rounded-md border bg-green-50 dark:bg-green-900/20">
                        <p className="font-medium">Model Answer:</p>
                        <p className="mt-1 whitespace-pre-wrap">{questions[index]?.answer || "Answer not available"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Similarity: </span>
                      <Progress
                        value={answer.similarity}
                        className="w-full h-2"
                        indicatorClassName={
                          answer.similarity > 80
                            ? "bg-green-500"
                            : answer.similarity > 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }
                      />
                      <span className={getAnswerClassName(answer.similarity)}>{answer.similarity}%</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Time spent: {Math.floor(answer.timeSpent / 60)}m {Math.round(answer.timeSpent % 60)}s
                    </p>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-center mt-6">
                <Button onClick={onRestart} disabled={isSaving}>
                  Restart Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </QuizResultBase>
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
