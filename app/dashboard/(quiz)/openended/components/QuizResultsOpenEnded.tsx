"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2, Clock, RefreshCw, Share2, MessageSquare, Zap, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { submitQuizResults } from "@/store/slices/quizSlice"
import { useAppDispatch, useAppSelector } from "@/store"
import { CircularProgress } from "@/components/ui/circular-progress"
import { StatCard } from "@/components/ui/stat-card"
import { ResultCard } from "@/components/ui/result-card"
import { QuizResultHeader } from "@/components/ui/quiz-result-header"
import { PerformanceChart } from "@/components/ui/performance-chart"
import { useWindowSize } from "@/hooks/use-window-size"
// Add the import for getBestSimilarityScore at the top of the file
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"

interface QuizResultsOpenEndedProps {
  result?: {
    quizId?: string
    slug?: string
    title?: string
    answers?: any[]
    questions?: any[]
    totalQuestions?: number
    startTime?: number
    score?: number
    totalTimeSpent?: number
    completedAt?: string
  }
  onRestart?: () => void
  onSignIn?: () => void
  [key: string]: any
}

export default function QuizResultsOpenEnded({ result, onRestart, onSignIn, ...props }: QuizResultsOpenEndedProps) {
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const windowSize = useWindowSize()

  // Get state from Redux
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  const quizState = useAppSelector((state) => state.quiz)

  // Use props if provided, otherwise use Redux state
  const answers = useMemo(() => result?.answers || quizState.answers || [], [result?.answers, quizState.answers])
  const questions = useMemo(
    () => result?.questions || quizState.questions || [],
    [result?.questions, quizState.questions],
  )
  const quizId = result?.quizId || quizState.quizId
  const title = result?.title || quizState.title
  const slug = result?.slug || quizState.slug
  const totalQuestions = result?.totalQuestions || questions.length
  const score = result?.score || quizState.score || 100 // Open-ended quizzes typically don't have a score
  const startTime = result?.startTime || quizState.startTime
  const totalTimeSpent = result?.totalTimeSpent || 0
  const completedAt = result?.completedAt || quizState.completedAt || new Date().toISOString()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("summary")
  const [isRestarting, setIsRestarting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Show confetti for high completion rates
  useEffect(() => {
    if (answers.length >= totalQuestions * 0.8) {
      const timer = setTimeout(() => {
        setShowConfetti(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [answers.length, totalQuestions])

  // Calculate performance metrics
  const stats = useMemo(() => {
    // Ensure we have valid answers array
    const validAnswers = Array.isArray(answers) ? answers.filter(Boolean) : []

    // Calculate total time spent from answers or use provided totalTimeSpent
    const calculatedTotalTimeSpent =
      totalTimeSpent || validAnswers.reduce((total, answer) => total + (answer?.timeSpent || 0), 0)

    // Calculate average time per question
    const averageTimePerQuestion =
      validAnswers.length > 0 ? Math.round(calculatedTotalTimeSpent / validAnswers.length) : 0

    // Calculate total elapsed time
    const endTime = Date.now()
    const totalElapsedTime = startTime ? Math.floor((endTime - startTime) / 1000) : calculatedTotalTimeSpent

    // Find fastest and slowest answers
    let fastestAnswer = { timeSpent: Number.POSITIVE_INFINITY, index: -1 }
    let slowestAnswer = { timeSpent: -1, index: -1 }
    let longestAnswer = { length: -1, index: -1 }
    let shortestAnswer = { length: Number.POSITIVE_INFINITY, index: -1 }

    validAnswers.forEach((answer, index) => {
      const answerLength = answer?.answer?.length || 0

      if (answer.timeSpent < fastestAnswer.timeSpent) {
        fastestAnswer = { timeSpent: answer.timeSpent, index }
      }
      if (answer.timeSpent > slowestAnswer.timeSpent) {
        slowestAnswer = { timeSpent: answer.timeSpent, index }
      }
      if (answerLength > longestAnswer.length) {
        longestAnswer = { length: answerLength, index }
      }
      if (answerLength < shortestAnswer.length && answerLength > 0) {
        shortestAnswer = { length: answerLength, index }
      }
    })

    // Calculate completion percentage
    const completionPercentage = Math.round((validAnswers.length / totalQuestions) * 100)

    // Calculate average answer length
    const avgAnswerLength =
      validAnswers.reduce((sum, answer) => sum + (answer?.answer?.length || 0), 0) / Math.max(1, validAnswers.length)

    return {
      totalTimeSpent: calculatedTotalTimeSpent,
      averageTimePerQuestion,
      totalElapsedTime,
      answeredQuestions: validAnswers.length,
      completionPercentage,
      fastestAnswer,
      slowestAnswer,
      longestAnswer,
      shortestAnswer,
      avgAnswerLength,
      chartData: [
        { name: "Completion", value: completionPercentage },
        { name: "Detail Level", value: Math.min(100, Math.max(0, avgAnswerLength / 10)) },
        { name: "Time Efficiency", value: Math.min(100, Math.max(0, 100 - averageTimePerQuestion / 20)) },
      ],
    }
  }, [answers, startTime, totalTimeSpent, totalQuestions])

  // Process answers to add similarity scores if not already present
  const processedAnswers = useMemo(() => {
    return answers.map((answer, index) => {
      if (answer && !answer.similarity && answer.answer && questions[index]?.answer) {
        // Import and use the text similarity function
        const similarity = getBestSimilarityScore(answer.answer, questions[index].answer)
        return { ...answer, similarity }
      }
      return answer
    })
  }, [answers, questions])

  // Format time function
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }, [])

  // Get feedback message based on completion
  const feedbackMessage = useMemo(() => {
    const completion = stats.completionPercentage
    if (completion >= 90) return "Excellent work! You've completed almost all questions with thoughtful responses."
    if (completion >= 80) return "Great job! Your responses show good understanding of the material."
    if (completion >= 70) return "Good work! You've provided answers to most of the questions."
    if (completion >= 50) return "You've completed half of the quiz. Try to answer more questions next time."
    return "You've made a start. Continue practicing and try to answer more questions next time."
  }, [stats.completionPercentage])

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
          answers: processedAnswers,
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
    processedAnswers,
    stats,
    totalQuestions,
    toast,
  ])

  // Handle restart
  const handleRestart = useCallback(() => {
    if (isRestarting) return // Prevent multiple clicks

    setIsRestarting(true)

    if (onRestart) {
      onRestart()

      // Reset the restarting state after a delay
      setTimeout(() => {
        setIsRestarting(false)
      }, 3000)
    } else {
      // Add a timestamp parameter to force a fresh load
      const timestamp = new Date().getTime()
      const url = `/dashboard/openended/${slug}?reset=true&t=${timestamp}`

      // Set a timeout to reset loading state if navigation takes too long
      const timeoutId = setTimeout(() => {
        setIsRestarting(false)
      }, 3000)

      // Navigate to the quiz page with reset parameters
      router.push(url)

      return () => clearTimeout(timeoutId)
    }
  }, [onRestart, router, slug, isRestarting])

  // Handle sign in
  const handleSignIn = useCallback(() => {
    if (onSignIn) {
      onSignIn()
    }
  }, [onSignIn])

  // Handle export
  const handleExport = useCallback(() => {
    try {
      const exportData = {
        title,
        slug,
        completedAt,
        totalQuestions,
        answeredQuestions: stats.answeredQuestions,
        totalTimeSpent: stats.totalTimeSpent,
        answers: processedAnswers.map((answer, index) => ({
          question: questions[index]?.question || `Question ${index + 1}`,
          answer: answer?.answer || "",
          timeSpent: answer?.timeSpent || 0,
          similarity: answer?.similarity,
        })),
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

      const exportFileDefaultName = `${slug || "openended"}-quiz-results.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()

      toast({
        title: "Results exported",
        description: "Your results have been downloaded as a JSON file.",
      })
    } catch (error) {
      console.error("Error exporting results:", error)
      toast({
        title: "Export failed",
        description: "There was a problem exporting your results.",
        variant: "destructive",
      })
    }
  }, [title, slug, completedAt, totalQuestions, stats, questions, toast, processedAnswers])

  // Handle share
  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Open-Ended Quiz Results",
          text: `I completed ${stats.answeredQuestions} of ${totalQuestions} questions on the ${title || slug} quiz!`,
          url: window.location.href,
        })
        toast({
          title: "Shared successfully!",
          description: "Your results have been shared.",
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied!",
          description: "Share your results with friends",
        })
      } else {
        console.warn("Sharing is not supported in this browser.")
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }, [stats.answeredQuestions, totalQuestions, title, slug, toast])

  // Update the answer review section to show correct answers and similarity scores
  const answerReview = useMemo(() => {
    return questions.map((question, index) => {
      const answer = processedAnswers[index]
      if (!answer) return null

      return (
        <motion.div
          key={question?.id || `question-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.05, 1) }}
          className={`border rounded-lg overflow-hidden ${
            answer.answer ? "border-green-200 dark:border-green-900" : "border-gray-200 dark:border-gray-800"
          }`}
          data-testid={`answer-item-${index}`}
        >
          <div className={`h-1 ${answer.answer ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`}></div>
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  answer.answer
                    ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {answer.answer ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>

              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-base">Question {index + 1}</h4>
                  <span className="text-xs text-muted-foreground">Time: {formatTime(answer?.timeSpent || 0)}</span>
                </div>

                <p className="text-sm text-muted-foreground">{question.question}</p>

                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Your response:</p>
                    <div
                      className={`p-3 rounded-md text-sm ${
                        answer.answer
                          ? "bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900"
                          : "bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800"
                      }`}
                    >
                      {answer?.answer || "No response provided"}
                    </div>
                  </div>

                  {question.answer && (
                    <div>
                      <p className="text-sm font-medium mb-2">Expected answer:</p>
                      <div className="p-3 rounded-md text-sm bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900">
                        {question.answer}
                      </div>
                    </div>
                  )}

                  {answer?.similarity !== undefined && (
                    <div className="mt-2 flex items-center">
                      <span className="text-xs font-medium mr-2">Similarity score:</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          answer.similarity >= 80
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : answer.similarity >= 50
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        }`}
                      >
                        {Math.round(answer.similarity)}%
                      </span>
                      <span className="text-xs ml-2 text-muted-foreground">(based on Levenshtein distance)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )
    })
  }, [questions, processedAnswers, formatTime])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  // If no answers or questions, show a message
  if (!processedAnswers.length || !questions.length) {
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
    <motion.div
      className="space-y-6"
      data-testid="quiz-results-openended"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Show confetti for high completion rates */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0" id="confetti-canvas"></div>
        </div>
      )}

      <QuizResultHeader
        title={title || "Open-Ended Quiz Results"}
        completedAt={completedAt}
        score={stats.completionPercentage}
        feedbackMessage={feedbackMessage}
        icon={<MessageSquare className="h-5 w-5 text-primary" />}
        scoreLabel="Completion"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary" data-testid="summary-tab">
            Summary
          </TabsTrigger>
          <TabsTrigger value="answers" data-testid="answers-tab">
            Your Answers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="pt-6 space-y-6" data-testid="summary-content">
          {/* Completion Overview */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-40 h-40 flex-shrink-0">
              <CircularProgress
                value={stats.completionPercentage}
                size={160}
                strokeWidth={12}
                label={`${stats.completionPercentage}%`}
                sublabel="Completion"
              />
            </div>

            <div className="flex-1 space-y-4">
              <h3 className="text-lg font-medium">Completion Summary</h3>
              <p className="text-muted-foreground">{feedbackMessage}</p>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {stats.answeredQuestions} of {totalQuestions} questions
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300">
                  {formatTime(stats.totalTimeSpent)} total time
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-300">
                  {Math.round(stats.avgAnswerLength)} chars/answer
                </span>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Questions Answered"
              value={`${stats.answeredQuestions}/${totalQuestions}`}
              icon={<CheckCircle2 className="h-4 w-4" />}
              description="Completion rate"
              trend={stats.answeredQuestions >= totalQuestions * 0.7 ? "up" : "down"}
            />

            <StatCard
              title="Avg. Time per Question"
              value={formatTime(stats.averageTimePerQuestion)}
              icon={<Clock className="h-4 w-4" />}
              description="Response time"
              trend={stats.averageTimePerQuestion < 60 ? "up" : "down"}
            />

            <StatCard
              title="Avg. Response Length"
              value={`${Math.round(stats.avgAnswerLength)} chars`}
              icon={<MessageSquare className="h-4 w-4" />}
              description="Detail level"
              trend={stats.avgAnswerLength > 50 ? "up" : "down"}
            />
          </motion.div>

          {/* Performance Chart */}
          <motion.div variants={itemVariants} className="mt-6">
            <ResultCard title="Performance Metrics">
              <div className="h-64">
                <PerformanceChart data={stats.chartData} />
              </div>
            </ResultCard>
          </motion.div>

          {/* Response Analysis */}
          {processedAnswers.length > 0 && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.fastestAnswer.index >= 0 && (
                <ResultCard title="Fastest Response" icon={<Zap className="h-4 w-4 text-yellow-500" />}>
                  <div className="space-y-2">
                    <p className="font-medium">Question {stats.fastestAnswer.index + 1}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {questions[stats.fastestAnswer.index]?.question}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Time: {formatTime(stats.fastestAnswer.timeSpent)}</span>
                      <span className="text-xs text-muted-foreground">
                        {processedAnswers[stats.fastestAnswer.index]?.answer?.length || 0} characters
                      </span>
                    </div>
                  </div>
                </ResultCard>
              )}

              {stats.longestAnswer.index >= 0 && (
                <ResultCard title="Most Detailed Response" icon={<MessageSquare className="h-4 w-4 text-blue-500" />}>
                  <div className="space-y-2">
                    <p className="font-medium">Question {stats.longestAnswer.index + 1}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {questions[stats.longestAnswer.index]?.question}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Length: {stats.longestAnswer.length} characters</span>
                      <span className="text-xs text-muted-foreground">
                        Time: {formatTime(processedAnswers[stats.longestAnswer.index]?.timeSpent || 0)}
                      </span>
                    </div>
                  </div>
                </ResultCard>
              )}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="answers" className="space-y-4 pt-6" data-testid="answers-content">
          {/* Answer review */}
          {answerReview}
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap justify-between gap-4 pt-4">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/quizzes")}
            className="flex-1 sm:flex-initial"
          >
            Return to Quizzes
          </Button>
          <Button onClick={handleRestart} disabled={isRestarting} className="flex-1 sm:flex-initial">
            {isRestarting ? (
              <>
                <span className="animate-spin mr-2">⟳</span> Restarting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Restart Quiz
              </>
            )}
          </Button>

          {!isAuthenticated && (
            <Button onClick={handleSignIn} variant="secondary" className="flex-1 sm:flex-initial">
              Sign In to Save
            </Button>
          )}
        </div>

        {(navigator.share || navigator.clipboard) && (
          <Button variant="ghost" size="sm" onClick={handleShare} className="flex items-center gap-1">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        )}
      </div>
    </motion.div>
  )
}
