"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2, XCircle, Clock, BarChart3, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { submitQuizResults } from "@/store/slices/quizSlice"
import { useAppDispatch, useAppSelector } from "@/store"

interface BlankQuizResultsProps {
  answers?: any[]
  questions?: any[]
  onRestart?: () => void
  quizId?: string
  title?: string
  slug?: string
  onComplete?: (score: number) => void
}

export default function BlankQuizResults({
  answers: propAnswers,
  questions: propQuestions,
  onRestart,
  quizId: propQuizId,
  title: propTitle,
  slug: propSlug,
  onComplete,
}: BlankQuizResultsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()

  // Get state from Redux
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  const quizState = useAppSelector((state) => state.quiz)

  // Use props if provided, otherwise use Redux state
  const answers = useMemo(() => propAnswers || quizState.answers, [propAnswers, quizState.answers])
  const questions = useMemo(() => propQuestions || quizState.questions, [propQuestions, quizState.questions])
  const quizId = propQuizId || quizState.quizId
  const title = propTitle || quizState.title
  const slug = propSlug || quizState.slug

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultsSaved, setResultsSaved] = useState(false)

  // Memoize calculated values to prevent recalculation on re-renders
  const stats = useMemo(() => {
    const totalQuestions = questions.length || 0
    const correctAnswers = answers.filter((a) => a && a.isCorrect).length || 0
    const incorrectAnswers = totalQuestions - correctAnswers
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    const totalTimeSpent = answers.reduce((total, answer) => total + (answer?.timeSpent || 0), 0)
    const averageTimePerQuestion = totalQuestions > 0 ? Math.round(totalTimeSpent / totalQuestions) : 0

    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      score,
      totalTimeSpent,
      averageTimePerQuestion,
    }
  }, [answers, questions.length])

  // Format time function
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }, [])

  // Save results if authenticated
  useEffect(() => {
    if (isAuthenticated && !resultsSaved && !quizState.resultsSaved && !isSubmitting && answers.length > 0) {
      handleSaveResults()
    }
  }, [isAuthenticated, resultsSaved, quizState.resultsSaved, answers.length])

  // Handle save results
  const handleSaveResults = useCallback(async () => {
    if (isSubmitting || resultsSaved || quizState.resultsSaved || !isAuthenticated) return

    setIsSubmitting(true)

    try {
      await dispatch(
        submitQuizResults({
          quizId,
          slug,
          quizType: "blanks",
          answers,
          score: stats.score,
          totalTime: stats.totalTimeSpent,
          totalQuestions: stats.totalQuestions,
        }),
      ).unwrap()

      setResultsSaved(true)

      toast({
        title: "Results saved",
        description: "Your quiz results have been saved successfully.",
      })

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(stats.score)
      }
    } catch (error) {
      console.error("Failed to save results:", error)
      toast({
        title: "Error saving results",
        description: "There was a problem saving your results. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [
    isSubmitting,
    resultsSaved,
    quizState.resultsSaved,
    isAuthenticated,
    dispatch,
    quizId,
    slug,
    answers,
    stats,
    toast,
    onComplete,
  ])

  // Handle restart
  const handleRestart = useCallback(() => {
    if (onRestart) {
      onRestart()
    }
  }, [onRestart])

  // If no answers or questions, show a message
  if (!answers.length || !questions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Results Available</CardTitle>
          <CardDescription>There are no quiz results to display.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Try taking the quiz again or return to the dashboard.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title || "Quiz Results"}</CardTitle>
          <CardDescription>You completed the fill-in-the-blanks quiz with a score of {stats.score}%</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Score visualization */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Score: {stats.score}%</span>
                <span>
                  {stats.correctAnswers} of {stats.totalQuestions} correct
                </span>
              </div>
              <Progress value={stats.score} className="h-3" />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Card className="bg-muted/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Correct</p>
                    <p className="text-2xl font-bold">{stats.correctAnswers}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Incorrect</p>
                    <p className="text-2xl font-bold">{stats.incorrectAnswers}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total Time</p>
                    <p className="text-2xl font-bold">{formatTime(stats.totalTimeSpent)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Avg. Time/Question</p>
                    <p className="text-2xl font-bold">{formatTime(stats.averageTimePerQuestion)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Answer review - using virtualized list for better performance with many questions */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Answer Review</h3>
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const answer = answers[index]
                  const isCorrect = answer?.isCorrect

                  return (
                    <motion.div
                      key={question?.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 1) }} // Cap delay for better performance with many items
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                        )}
                        <div className="space-y-2 w-full">
                          <p className="font-medium">Question {index + 1}</p>
                          <p className="text-sm text-muted-foreground">
                            {question.question.replace(/\[\[(.*?)\]\]/g, "____")}
                          </p>

                          <div className="grid grid-cols-1 gap-2 mt-2">
                            <div className="text-sm">
                              <span className="font-medium">Your answer: </span>
                              <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                                {answer?.answer || "No answer provided"}
                              </span>
                            </div>

                            {!isCorrect && (
                              <div className="text-sm">
                                <span className="font-medium">Correct answer: </span>
                                <span className="text-green-600">
                                  {question.question.match(/\[\[(.*?)\]\]/)?.[1] || question.answer}
                                </span>
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground mt-1">
                              Time spent: {formatTime(answer?.timeSpent || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
          <Button onClick={handleRestart} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart Quiz
          </Button>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              onClick={() => router.push("/dashboard/quizzes")}
              variant="secondary"
              className="flex-1 sm:flex-initial"
            >
              Browse Quizzes
            </Button>

            <Button onClick={() => router.push("/dashboard/blanks")} className="flex-1 sm:flex-initial">
              Create New Quiz
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
