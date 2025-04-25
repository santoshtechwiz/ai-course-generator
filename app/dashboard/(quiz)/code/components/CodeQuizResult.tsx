"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Clock, RotateCw, Loader2, FileText, ArrowLeft } from "lucide-react"
import { useQuiz } from "@/app/context/QuizContext"
import { useRouter } from "next/navigation"

interface CodeQuizResultProps {
  title: string
  onRestart: () => void
}

export default function CodeQuizResult({ title, onRestart }: CodeQuizResultProps) {
  const { state } = useQuiz()
  const { answers, score, isLoading } = state
  const router = useRouter()
  const isRedirecting = state.animationState === "redirecting"

  // Format time - memoized to avoid recalculation
  const formatTime = useMemo(
    () =>
      (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`
      },
    [],
  )

  // Calculate stats - memoized to avoid recalculation on each render
  const { totalQuestions, correctAnswers, totalTime, performanceColor, performanceMessage } = useMemo(() => {
    const totalQuestions = answers.length
    const correctAnswers = answers.filter((a) => a && a.isCorrect).length
    const totalTime = answers.reduce((total, a) => total + (a ? a.timeSpent : 0), 0)

    // Get performance level
    let performanceColor = ""
    let performanceMessage = ""

    if (score >= 80) {
      performanceColor = "text-green-500 bg-green-50 dark:bg-green-900/20"
      performanceMessage = "Excellent! Your code solutions are outstanding."
    } else if (score >= 60) {
      performanceColor = "text-amber-500 bg-amber-50 dark:bg-amber-900/20"
      performanceMessage = "Good job! You have a solid understanding of coding concepts."
    } else {
      performanceColor = "text-red-500 bg-red-50 dark:bg-red-900/20"
      performanceMessage = "Keep practicing! Your coding skills will improve with more practice."
    }

    return {
      totalQuestions,
      correctAnswers,
      totalTime,
      performanceColor,
      performanceMessage,
    }
  }, [answers, score])

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 flex flex-col justify-center items-center min-h-[300px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-muted-foreground">Loading results...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: isRedirecting ? 0 : 1,
        y: isRedirecting ? -20 : 0,
      }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
          <CardTitle className="text-2xl">{title} - Results</CardTitle>
          <CardDescription>
            You scored {score}% ({correctAnswers} out of {totalQuestions} correct)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Performance summary */}
          <div className={`p-4 rounded-lg ${performanceColor} text-center`} role="status" aria-live="polite">
            <p className="font-medium">{performanceMessage}</p>
          </div>

          {/* Score visualization */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Score</span>
              <span className="font-medium">{score}%</span>
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Progress
                value={score}
                className="h-2"
                indicatorClassName={score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"}
                aria-label={`Score: ${score}%`}
              />
            </motion.div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="bg-muted rounded-lg p-4 flex items-center space-x-3"
            >
              <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
              <div>
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="font-medium">{correctAnswers}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="bg-muted rounded-lg p-4 flex items-center space-x-3"
            >
              <XCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              <div>
                <p className="text-sm text-muted-foreground">Incorrect</p>
                <p className="font-medium">{totalQuestions - correctAnswers}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="bg-muted rounded-lg p-4 flex items-center space-x-3"
            >
              <Clock className="h-5 w-5 text-blue-500" aria-hidden="true" />
              <div>
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="font-medium">{formatTime(totalTime)}</p>
              </div>
            </motion.div>
          </div>

          {/* Answer breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
              Answer Breakdown
            </h3>
            <div className="space-y-3">
              {answers.map((answer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                  className={`flex flex-col space-y-3 p-3 rounded-lg border ${
                    answer?.isCorrect
                      ? "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/30"
                      : "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`flex-shrink-0 rounded-full p-1 ${
                        answer?.isCorrect
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                      aria-hidden="true"
                    >
                      {answer?.isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </div>
                    <div className="ml-3 flex-grow">
                      <p className="text-sm font-medium">Question {index + 1}</p>
                    </div>
                  </div>

                  {/* Add question content display */}
                  <div className="text-sm ml-8 mt-1 text-muted-foreground">
                    <p className="mb-2 font-medium">Question:</p>
                    <p className="bg-muted/50 p-2 rounded-md mb-2">
                      {state.quizData?.questions?.[index]?.question || "Question not available"}
                    </p>
                    <p className="mb-1 font-medium">Your answer:</p>
                    <p className={answer?.isCorrect ? "text-green-600" : "text-red-600"}>
                      {answer?.answer || "No answer"}
                    </p>
                    <p className="mt-2 mb-1 font-medium">Correct answer:</p>
                    <p className="text-green-600">
                      {state.quizData?.questions?.[index]?.answer || "Answer not available"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-8">
                    <span>Time: {formatTime(answer?.timeSpent || 0)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 border-t p-6">
          <Button
            onClick={() => router.push("/dashboard/code/")}
            variant="outline"
            className="w-full sm:w-auto transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Create New Quiz
          </Button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            onClick={onRestart}
            className="w-full sm:w-auto transition-all"
          >
            <RotateCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Restart Quiz
          </motion.button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
