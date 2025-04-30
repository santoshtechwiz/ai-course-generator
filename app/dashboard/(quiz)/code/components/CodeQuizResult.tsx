"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, XCircle, Clock, Award, LogIn, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { formatQuizTime } from "@/lib/utils"
import { useQuiz } from "@/app/context/QuizContext"
import { useSession } from "next-auth/react"
import { quizService } from "@/lib/quiz-service"
import { useAuth } from "@/providers/unified-auth-provider"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/tailwindUtils"
import { CodeQuizResultProps } from "@/app/types/code-quiz-types"


export default function CodeQuizResult({
  title,
  onRestart,
  quizId,
  questions,
  answers,
  score,
  isGuestMode,
}: CodeQuizResultProps) {
  const { state, handleAuthenticationRequired } = useQuiz()
  const { data: session } = useSession()
  const { isAuthenticated, user } = useAuth()
  const [showAnimation, setShowAnimation] = useState(true)

  // Enhanced authentication check
  const userIsAuthenticated = !!(isAuthenticated || user || session?.user)

  // Use isGuestMode prop if provided, otherwise determine from authentication state
  const isGuest = isGuestMode !== undefined ? isGuestMode : !userIsAuthenticated

  // Use props if provided, otherwise fall back to state
  const quizQuestions = questions || state.questions || []
  const quizAnswers = answers || state.answers || []
  const quizId_ = quizId || state.quizId

  // Calculate statistics
  const totalQuestions = quizQuestions.length
  const correctAnswers = quizAnswers.filter((a) => a?.isCorrect).length
  const incorrectAnswers = quizAnswers.filter((a) => a && a.isCorrect === false).length
  const unansweredQuestions = totalQuestions - correctAnswers - incorrectAnswers

  // Calculate score percentage correctly
  const scorePercentage =
    score !== undefined ? score : totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

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
  const hasSavedRef = useRef(false)

  useEffect(() => {
    if (userIsAuthenticated && quizId_ && !hasSavedRef.current) {
      hasSavedRef.current = true

      // Use a small timeout to ensure we don't block rendering
      setTimeout(() => {
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
      }, 100)
    } else if (!userIsAuthenticated && quizId_) {
      // For guest users, save as guest result but don't show results
      quizService.saveGuestResult({
        quizId: quizId_,
        slug: state.slug,
        type: "code",
        score: scorePercentage,
        answers: quizAnswers.filter((a) => a !== null),
        totalTime: totalTime,
        totalQuestions: totalQuestions,
        completedAt: new Date().toISOString(),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIsAuthenticated, quizId_, state.slug, quizAnswers, scorePercentage, totalTime, totalQuestions])

  // Handle sign in button click
  const handleSignIn = () => {
    console.log("User clicked Sign In, initiating authentication flow")

    // Create the redirect URL
    const redirectUrl = `/dashboard/code/${state.slug}?fromAuth=true`

    // Save current quiz state before redirecting
    quizService.savePendingQuizData()

    // Save auth redirect info
    quizService.saveAuthRedirect(redirectUrl)

    // Call the authentication handler
    handleAuthenticationRequired()
  }

  return (
    <div className="space-y-8 w-full max-w-3xl mx-auto">
      {isGuest && (
        <div className="mb-4 p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-300">Guest Mode</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                You're viewing results as a guest. Your progress won't be saved when you leave this page.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white border-none"
                  onClick={handleSignIn}
                >
                  <LogIn className="h-3.5 w-3.5 mr-1.5" />
                  Sign in to save results
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  onClick={() => {
                    toast({
                      title: "Guest Mode Information",
                      description:
                        "In guest mode, you can view your results but they won't be saved to your account or be available after you leave this page.",
                      variant: "default",
                    })
                  }}
                >
                  <Info className="h-3.5 w-3.5 mr-1.5" />
                  Learn more
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                              {answer?.answer ? (
                                <code className="bg-muted p-1 rounded text-xs">
                                  {answer.answer.length > 100 ? answer.answer.substring(0, 100) + "..." : answer.answer}
                                </code>
                              ) : (
                                "No answer provided"
                              )}
                            </span>
                          </div>

                          {!isCorrect && (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Correct answer:</span>
                              <span className="text-green-600">
                                <code className="bg-muted p-1 rounded text-xs">
                                  {question?.answer || question?.correctAnswer || "Answer not available"}
                                </code>
                              </span>
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
