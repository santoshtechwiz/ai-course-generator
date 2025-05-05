"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2, Clock, BarChart3, RefreshCw, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { submitQuizResults } from "@/store/slices/quizSlice"
import { useAppDispatch, useAppSelector } from "@/store"

interface QuizResultsOpenEndedProps {
  quizId?: string
  slug?: string
  title?: string
  answers?: any[]
  questions?: any[]
  totalQuestions?: number
  startTime?: number
  score?: number
  onRestart?: () => void
  onSignIn?: () => void
}

export default function QuizResultsOpenEnded({
  quizId: propQuizId,
  slug: propSlug,
  title: propTitle,
  answers: propAnswers,
  questions: propQuestions,
  totalQuestions: propTotalQuestions,
  startTime: propStartTime,
  score: propScore,
  onRestart,
  onSignIn,
}: QuizResultsOpenEndedProps) {
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
  const totalQuestions = propTotalQuestions || questions.length
  const score = propScore || quizState.score
  const startTime = propStartTime || quizState.startTime

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("summary")

  // Memoize calculated values to prevent recalculation on re-renders
  const stats = useMemo(() => {
    const totalTimeSpent = answers.reduce((total, answer) => total + (answer?.timeSpent || 0), 0)
    const averageTimePerQuestion = answers.length > 0 ? Math.round(totalTimeSpent / answers.length) : 0
    const endTime = Date.now()
    const totalElapsedTime = Math.floor((endTime - startTime) / 1000)

    return {
      totalTimeSpent,
      averageTimePerQuestion,
      totalElapsedTime,
      answeredQuestions: answers.length,
    }
  }, [answers, startTime])

  // Format time function
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }, [])

  // Save results if authenticated
  useEffect(() => {
    if (isAuthenticated && !quizState.resultsSaved && !isSubmitting && answers.length > 0) {
      handleSaveResults()
    }
  }, [isAuthenticated, quizState.resultsSaved, answers.length])

  // Handle save results
  const handleSaveResults = useCallback(async () => {
    if (isSubmitting || quizState.resultsSaved || !isAuthenticated) return

    setIsSubmitting(true)

    try {
      await dispatch(
        submitQuizResults({
          quizId,
          slug,
          quizType: "openended",
          answers,
          score: 100, // Open-ended quizzes don't have a specific score
          totalTime: stats.totalTimeSpent,
          totalQuestions,
        }),
      ).unwrap()

      toast({
        title: "Results saved",
        description: "Your quiz results have been saved successfully.",
      })
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
    quizState.resultsSaved,
    isAuthenticated,
    dispatch,
    quizId,
    slug,
    answers,
    stats,
    totalQuestions,
    toast,
  ])

  // Handle restart
  const handleRestart = useCallback(() => {
    if (onRestart) {
      onRestart()
    }
  }, [onRestart])

  // Handle sign in
  const handleSignIn = useCallback(() => {
    if (onSignIn) {
      onSignIn()
    }
  }, [onSignIn])

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
          <CardDescription>You completed the open-ended quiz with {stats.answeredQuestions} responses</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="answers">Your Answers</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6 pt-4">
              {/* Completion visualization */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completion</span>
                  <span>
                    {stats.answeredQuestions} of {totalQuestions} questions answered
                  </span>
                </div>
                <Progress value={(stats.answeredQuestions / totalQuestions) * 100} className="h-3" />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card className="bg-muted/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Questions Answered</p>
                      <p className="text-2xl font-bold">{stats.answeredQuestions}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Total Questions</p>
                      <p className="text-2xl font-bold">{totalQuestions}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Total Time</p>
                      <p className="text-2xl font-bold">{formatTime(stats.totalElapsedTime)}</p>
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
            </TabsContent>

            <TabsContent value="answers" className="space-y-4 pt-4">
              {/* Answer review - using virtualized list for better performance with many questions */}
              {questions.map((question, index) => {
                const answer = answers[index]
                if (!answer) return null

                return (
                  <motion.div
                    key={question?.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 1) }} // Cap delay for better performance with many items
                    className="border rounded-lg p-4"
                  >
                    <div className="space-y-2 w-full">
                      <p className="font-medium">Question {index + 1}</p>
                      <p className="text-sm text-muted-foreground">{question.question}</p>

                      <div className="grid grid-cols-1 gap-2 mt-2">
                        <div className="text-sm">
                          <span className="font-medium">Your response: </span>
                          <span className="text-foreground">{answer?.answer || "No response provided"}</span>
                        </div>

                        <div className="text-xs text-muted-foreground mt-1">
                          Time spent: {formatTime(answer?.timeSpent || 0)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
          <Button onClick={handleRestart} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart Quiz
          </Button>

          <div className="flex gap-3 w-full sm:w-auto">
            {!isAuthenticated && (
              <Button onClick={handleSignIn} variant="secondary" className="flex-1 sm:flex-initial">
                Sign In to Save
              </Button>
            )}

            <Button
              onClick={() => router.push("/dashboard/quizzes")}
              variant="secondary"
              className="flex-1 sm:flex-initial"
            >
              Browse Quizzes
            </Button>

            <Button onClick={() => router.push("/dashboard/openended")} className="flex-1 sm:flex-initial">
              Create New Quiz
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
