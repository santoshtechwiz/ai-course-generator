"use client"

import { useEffect, useState, useRef } from "react"
import { useQuiz } from "@/app/context/QuizContext"
import { useSession } from "next-auth/react"
import { quizService } from "@/lib/quiz-service"
import type { Question } from "./types"
import { motion } from "framer-motion"
import { CheckCircle2, XCircle, Clock, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { formatQuizTime } from "@/lib/utils"
import { useAuth } from "@/providers/unified-auth-provider"
import { GuestSignInPrompt } from "../../components/GuestSignInPrompt"
import { cn } from "@/lib/tailwindUtils"

interface McqQuizResultProps {
  title?: string
  onRestart?: () => void
  quizId?: string
  questions?: Question[]
  answers?: Array<{
    answer: string
    timeSpent: number
    isCorrect: boolean
  } | null>
  score?: number
}

export default function McqQuizResult({ title, onRestart, quizId, questions, answers, score }: McqQuizResultProps) {
  const { state, restartQuiz, handleAuthenticationRequired } = useQuiz()
  const { data: session } = useSession()
  const { isAuthenticated, user } = useAuth()
  const [showAuthPrompt, setShowAuthPrompt] = useState(false) // Start with auth prompt hidden
  const [isReturningFromAuth, setIsReturningFromAuth] = useState(false)
  const forceShowResultsRef = useRef(false)
  const hasSavedRef = useRef(false) // Move useRef here

  // Use props if provided, otherwise fall back to state
  const quizQuestions = questions || state.quizData?.questions || []
  const quizAnswers = answers || state.answers
  const quizId_ = quizId || state.quizId
  const quizTitle = title || state.title
  const handleRestart = onRestart || restartQuiz

  // Calculate statistics
  const totalQuestions = quizQuestions.length
  const correctAnswers = quizAnswers.filter((a) => a?.isCorrect).length
  const incorrectAnswers = quizAnswers.filter((a) => a && !a.isCorrect).length
  const scorePercentage = score !== undefined ? score : state.score
  const totalTime = quizAnswers.reduce((acc, curr) => acc + (curr?.timeSpent || 0), 0)
  const averageTime = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0

  // Enhanced authentication check
  const userIsAuthenticated = isAuthenticated || !!user || !!session?.user

  // Add this function to clean up URL parameters
  const cleanupUrlParameters = () => {
    if (typeof window !== "undefined" && window.history && window.history.replaceState) {
      const url = new URL(window.location.href)
      url.searchParams.delete("fromAuth")
      url.searchParams.delete("completed")
      url.searchParams.delete("authTimestamp")
      window.history.replaceState({}, document.title, url.toString())
    }
  }

  // Add this effect to detect if user is returning from authentication
  useEffect(() => {
    // Check URL parameters for signs of returning from auth
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth") === "true"
      const isCompleted = urlParams.get("completed") === "true"

      // Also check if quizService detects returning from auth
      const returningFromAuth = quizService.isReturningFromAuth() || fromAuth || isCompleted

      if (returningFromAuth) {
        // If returning from auth, always show results
        setIsReturningFromAuth(true)
        forceShowResultsRef.current = true
        // Clean up URL parameters
        cleanupUrlParameters()
      } else if (!userIsAuthenticated) {
        // If not returning from auth and not authenticated, show auth prompt after a short delay
        const timer = setTimeout(() => {
          setShowAuthPrompt(true)
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [userIsAuthenticated])

  // Save results to server if authenticated
  useEffect(() => {
    if (session?.user && quizId_ && !hasSavedRef.current) {
      hasSavedRef.current = true

      // Use a small timeout to ensure we don't block rendering
      setTimeout(() => {
        // Save to server if authenticated
        quizService.saveCompleteQuizResult({
          quizId: quizId_,
          slug: state.slug,
          type: "mcq",
          score: scorePercentage,
          answers: quizAnswers.filter((a) => a !== null),
          totalTime: totalTime,
          totalQuestions: totalQuestions,
        })

        // Clear all storage after saving to database
        quizService.clearAllStorage()
      }, 100)
    }
  }, [session, quizId_, state.slug, quizAnswers, scorePercentage, totalTime, totalQuestions])

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

  // If not authenticated, show auth prompt instead of results
  if (!userIsAuthenticated && showAuthPrompt && !forceShowResultsRef.current && !isReturningFromAuth) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <GuestSignInPrompt title="Authentication Required" />
      </motion.div>
    )
  }

  return (
    <div className="space-y-8 w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">{quizTitle} Results</CardTitle>
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
                <div className="text-sm font-medium">Average Time</div>
                <div className="text-lg font-bold">{formatQuizTime(averageTime)}</div>
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
        <CardFooter className="flex justify-center pt-6">
          <Button onClick={() => (window.location.href = "/dashboard")} variant="default">
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
