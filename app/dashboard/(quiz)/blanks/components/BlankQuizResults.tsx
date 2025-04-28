"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, XCircle, RotateCcw, Loader2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { QuizAnswer } from "@/lib/quiz-service"
import { useQuiz } from "@/app/context/QuizContext"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { formatQuizTime } from "@/lib/utils"
import { CheckCircle, Clock, Award } from "lucide-react"
import { useAuth } from "@/providers/unified-auth-provider"
import { quizService } from "@/lib/quiz-service"


interface BlankQuizResultsProps {
  answers?: QuizAnswer[]
  questions?: any[]
  onRestart?: () => void
  quizId?: string
  title?: string
  slug?: string
  onComplete?: (score: number) => void
  onRetryLoading?: () => Promise<void>
}

export default function BlankQuizResults({
  answers,
  questions,
  onRestart,
  quizId,
  title,
  slug,
  onComplete,
  onRetryLoading,
}: BlankQuizResultsProps) {
  const { state, restartQuiz, handleAuthenticationRequired } = useQuiz()
  const [isRetrying, setIsRetrying] = useState(false)
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()

  // State management
  const [resultState, setResultState] = useState<"checking" | "saving" | "ready" | "error">("checking")
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const authCheckComplete = useRef(false)
  const resultsSaved = useRef(false)

  // Use props if provided, otherwise fall back to state
  const quizAnswers = answers || state.answers
  const quizQuestions = questions || state.quizData?.questions || []
  const quizId_ = quizId || state.quizId
  const quizTitle = title || state.title
  const quizSlug = slug || state.slug

  // Calculate score
  const score =
    quizAnswers.length > 0
      ? Math.round(quizAnswers.reduce((sum, answer) => sum + (answer.similarity || 0), 0) / quizAnswers.length)
      : 0

  const handleRestart = onRestart || restartQuiz

  // Enhanced authentication check that runs only once
  useEffect(() => {
    if (authCheckComplete.current) return

    if (isAuthenticated || !!user) {
      setShowAuthPrompt(false)
      setResultState("saving") // Directly transition to saving state if authenticated
    } else {
      setShowAuthPrompt(true)
    }

    authCheckComplete.current = true
  }, [isAuthenticated, user])

  // Save results to server if authenticated
  useEffect(() => {
    // Only proceed if authenticated and not already saved
    if ((!isAuthenticated && !user) || resultsSaved.current || resultState !== "saving") return

    const saveResults = async () => {
      try {
        console.log("Saving quiz results to server")

        await quizService.saveCompleteQuizResult({
          quizId: quizId_,
          slug: quizSlug,
          type: "blanks",
          score: score,
          answers: quizAnswers.filter((a) => a !== null),
          totalTime: quizAnswers.reduce((acc, curr) => acc + (curr?.timeSpent || 0), 0),
          totalQuestions: quizQuestions.length,
        })

        console.log("Results saved successfully")
        resultsSaved.current = true
        setResultState("ready")

        // Clear storage after successful save
        quizService.clearQuizState(quizId_, "blanks")
      } catch (error) {
        console.error("Error saving results:", error)
        setSaveError(error instanceof Error ? error.message : "Failed to save results")
        setResultState("error")
      }
    }

    saveResults()
  }, [isAuthenticated, user, quizId_, quizSlug, quizAnswers, quizQuestions.length, resultState, score])

  // Call onComplete if provided
  useEffect(() => {
    if (onComplete && quizAnswers.length > 0 && resultState === "ready") {
      onComplete(score)
    }
  }, [onComplete, quizAnswers.length, score, resultState])

  const handleRetryLoading = async () => {
    if (!onRetryLoading) return

    setIsRetrying(true)
    try {
      await onRetryLoading()
    } finally {
      setIsRetrying(false)
    }
  }

  // Calculate statistics
  const totalQuestions = quizQuestions.length
  const correctAnswers = quizAnswers.filter((a) => (a.similarity || 0) > 80).length
  const incorrectAnswers = quizAnswers.filter((a) => (a.similarity || 0) <= 80).length
  const totalTime = quizAnswers.reduce((acc, curr) => acc + (curr?.timeSpent || 0), 0)

  // If still checking auth or loading auth data
  if (resultState === "checking" || authLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-card rounded-lg shadow-sm border"
      >
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <h3 className="text-xl font-semibold mb-2">Checking authentication status</h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          Please wait while we verify your account status...
        </p>
        <div className="w-full max-w-md h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse" style={{ width: "60%" }}></div>
        </div>
      </motion.div>
    )
  }

  // If saving results
  if (resultState === "saving") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-card rounded-lg shadow-sm border"
      >
        <div className="relative mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2">Saving your results</h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          We're saving your quiz results to your account...
        </p>
        <div className="w-full max-w-md h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse" style={{ width: "80%" }}></div>
        </div>
      </motion.div>
    )
  }

  // If error saving results
  if (resultState === "error") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-card rounded-lg shadow-sm border"
      >
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Saving Results</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {saveError || "There was a problem saving your quiz results. Your progress may not be recorded."}
        </p>
        <div className="flex gap-3">
          <Button onClick={() => setResultState("ready")} variant="default">
            View Results Anyway
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </motion.div>
    )
  }

  // If not authenticated, show auth prompt
  if (showAuthPrompt && !isAuthenticated && !user) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <GuestPrompt
          quizId={quizId_ || "unknown"}
          forceShow={true}
          onContinueAsGuest={() => setShowAuthPrompt(false)}
          onSignInClick={handleAuthenticationRequired}
        />
      </motion.div>
    )
  }

  // No answers found state
  if (!quizAnswers.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Quiz Results</CardTitle>
          <CardDescription>
            No answers found. This may happen if you signed out and back in, or if there was an issue loading your
            answers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <XCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No answers available</p>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              We couldn't find your quiz answers. You can try reloading your results or start a new quiz.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRetryLoading} className="w-full sm:w-auto" disabled={isRetrying || !onRetryLoading}>
            {isRetrying ? (
              <>
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                Retrying...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Loading Results
              </>
            )}
          </Button>
          <Button onClick={handleRestart} variant="outline" className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Start New Quiz
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Finally, show results if everything is ready
  return (
    <div className="space-y-8 w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">{quizTitle || "Fill in the Blanks"} Results</CardTitle>
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
              <div className="text-4xl font-bold mb-2">{score}%</div>
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
              transition={{ delay: 0.3, scale: 0.9 }}
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
                <div className="text-sm font-medium">Performance</div>
                <div className="text-lg font-bold">
                  {score >= 90
                    ? "Excellent"
                    : score >= 75
                      ? "Good"
                      : score >= 60
                        ? "Satisfactory"
                        : "Needs Improvement"}
                </div>
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
              <span className={score >= 75 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-500"}>
                {score}%
              </span>
            </div>
            <Progress
              value={score}
              className={score >= 75 ? "bg-green-200" : score >= 60 ? "bg-yellow-200" : "bg-red-200"}
              indicatorClassName={score >= 75 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}
            />
          </div>

          <Separator />

          {/* Question Review */}
          {quizQuestions.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Question Review</h3>
              {quizQuestions.map((question, index) => {
                const answer = quizAnswers[index]
                const similarity = answer?.similarity || 0
                const isCorrect = similarity > 80

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
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-2 flex-1">
                        <p className="font-medium">
                          {index + 1}.{" "}
                          {question?.question?.replace(/\[\[(.*?)\]\]/g, "____") || "Question not available"}
                        </p>

                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Your answer:</span>
                            <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                              {answer?.answer || "No answer provided"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Correct answer:</span>
                            <span className="text-green-600">
                              {question?.question?.match(/\[\[(.*?)\]\]/)?.[1] || "Answer not available"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatQuizTime(answer?.timeSpent || 0)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-semibold">Match:</span>
                            <span>{Math.round(similarity)}%</span>
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
          <Button variant="outline" onClick={handleRestart} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restart Quiz
          </Button>
          <Button onClick={() => (window.location.href = "/dashboard")} className="gap-2">
            View All Quizzes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
