"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, XCircle, Clock, BarChart3, RefreshCw, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn, formatQuizTime } from "@/lib/utils"
import { useQuiz } from "@/app/context/QuizContext"
import { useSession } from "next-auth/react"
import { quizService } from "@/lib/quiz-service"

interface CodeQuizResultProps {
  title: string
  onRestart: () => void
  quizId?: string
  questions?: any[]
  answers?: Array<{
    answer: string
    timeSpent: number
    isCorrect: boolean
  } | null>
  score?: number
}

export default function CodeQuizResult({ title, onRestart, quizId, questions, answers, score }: CodeQuizResultProps) {
  const { state } = useQuiz()
  const { data: session } = useSession()
  const [showAnimation, setShowAnimation] = useState(true)

  // Use props if provided, otherwise fall back to state
  const quizQuestions = questions || state.questions || []
  const quizAnswers = answers || state.answers || []
  const quizId_ = quizId || state.quizId

  // Calculate statistics
  const totalQuestions = quizQuestions.length
  const correctAnswers = quizAnswers.filter((a) => a?.isCorrect).length
  const incorrectAnswers = quizAnswers.filter((a) => a && !a.isCorrect).length
  const scorePercentage = score !== undefined ? score : Math.round((correctAnswers / totalQuestions) * 100) || 0
  const totalTime = quizAnswers.reduce((acc, curr) => acc + (curr?.timeSpent || 0), 0)
  const averageTime = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0

  // Determine performance level
  let performanceLevel = "Needs Improvement"
  let performanceColor = "text-red-500"

  if (scorePercentage >= 90) {
    performanceLevel = "Excellent"
    performanceColor = "text-green-500"
  } else if (scorePercentage >= 75) {
    performanceLevel = "Good"
    performanceColor = "text-blue-500"
  } else if (scorePercentage >= 60) {
    performanceLevel = "Satisfactory"
    performanceColor = "text-yellow-500"
  }

  // Disable animation after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Save results to server if authenticated
  useEffect(() => {
    if (session?.user && quizId_) {
      // Save to server if authenticated
      quizService.saveCompleteQuizResult({
        quizId: quizId_,
        slug: state.slug,
        type: "code",
        score: scorePercentage,
        answers: quizAnswers.filter((a) => a !== null),
        totalTime: totalTime,
        totalQuestions: totalQuestions,
      })

      // Clear all storage after saving to database
      quizService.clearAllStorage()
    }
  }, [session, quizId_, state.slug, quizAnswers, scorePercentage, totalTime, totalQuestions])

  return (
    <div className="space-y-8 w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">{title} Results</CardTitle>
          <CardDescription>You've completed the quiz. Here's how you did.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Overview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg"
            >
              <div className="text-4xl font-bold mb-2">{scorePercentage}%</div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </motion.div>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg"
            >
              <div className="text-4xl font-bold mb-2 text-green-500">{correctAnswers}</div>
              <div className="text-sm text-muted-foreground">Correct Answers</div>
            </motion.div>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg"
            >
              <div className="text-4xl font-bold mb-2 text-red-500">{incorrectAnswers}</div>
              <div className="text-sm text-muted-foreground">Incorrect Answers</div>
            </motion.div>
          </motion.div>

          {/* Performance Level */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-primary" />
              <div>
                <div className="text-sm font-medium">Performance Level</div>
                <div className={cn("text-lg font-bold", performanceColor)}>{performanceLevel}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-primary" />
              <div>
                <div className="text-sm font-medium">Total Time</div>
                <div className="text-lg font-bold">{formatQuizTime(totalTime)}</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Score: {correctAnswers}/{totalQuestions}
              </span>
              <span
                className={cn(
                  scorePercentage >= 75 ? "text-green-500" : scorePercentage >= 60 ? "text-yellow-500" : "text-red-500",
                )}
              >
                {scorePercentage}%
              </span>
            </div>
            <Progress
              value={scorePercentage}
              className={cn(
                "h-2",
                scorePercentage >= 75 ? "bg-green-200" : scorePercentage >= 60 ? "bg-yellow-200" : "bg-red-200",
              )}
              indicatorClassName={cn(
                scorePercentage >= 75 ? "bg-green-500" : scorePercentage >= 60 ? "bg-yellow-500" : "bg-red-500",
              )}
            />
          </div>

          <Separator />

          {/* Question Review */}
          {quizQuestions.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Question Review</h3>
              {quizQuestions.map((question, index) => {
                const answer = quizAnswers[index]
                const isCorrect = answer?.isCorrect

                return (
                  <motion.div
                    key={question?.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-2 flex-1">
                        <p className="font-medium">
                          {index + 1}. {question?.question || "Question not available"}
                        </p>

                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Your answer:</span>
                            <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                              {answer?.answer || "No answer provided"}
                            </span>
                          </div>

                          {!isCorrect && (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Correct answer:</span>
                              <span className="text-green-600">{question?.answer || "Answer not available"}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatQuizTime(answer?.timeSpent || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-6 flex-wrap gap-4">
          <Button variant="outline" onClick={onRestart} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Restart Quiz
          </Button>
          <Button className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View Detailed Analysis
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
