"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Clock, Award, ArrowRight, Share2, Timer, Zap, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch } from "@/store"
import { resetQuiz } from "@/store/slices/quizSlice"
import { calculatePerformanceLevel, formatQuizTime } from "@/lib/utils/quiz-performance"
import { CircularProgress } from "@/components/ui/circular-progress"
import { StatCard } from "@/components/ui/stat-card"
import { ResultCard } from "@/components/ui/result-card"
import { QuizResultHeader } from "@/components/ui/quiz-result-header"
import { PerformanceChart } from "@/components/ui/performance-chart"
import { useWindowSize } from "@/hooks/use-window-size"

interface McqQuizResultProps {
  result: {
    quizId: string
    slug: string
    score: number
    totalQuestions: number
    correctAnswers: number
    totalTimeSpent: number
    formattedTimeSpent?: string
    completedAt: string
    answers: Array<{
      questionId: string | number
      question: string
      selectedOption: string
      correctOption: string
      isCorrect: boolean
      timeSpent: number
      options?: string[]
    }>
  }
  [key: string]: any
}

export default function McqQuizResult({ result, ...props }: McqQuizResultProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [isLoading, setIsLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const windowSize = useWindowSize()

  // Ensure we have a valid result object with default values
  const safeResult = useMemo(
    () => ({
      quizId: result?.quizId || "",
      slug: result?.slug || "",
      score: typeof result?.score === "number" ? result.score : 0,
      totalQuestions: result?.totalQuestions || 0,
      correctAnswers: result?.correctAnswers || 0,
      totalTimeSpent: result?.totalTimeSpent || 0,
      formattedTimeSpent: result?.formattedTimeSpent || formatQuizTime(result?.totalTimeSpent || 0),
      completedAt: result?.completedAt || new Date().toISOString(),
      answers: Array.isArray(result?.answers) ? result.answers : [],
    }),
    [result],
  )

  // Show confetti for high scores
  useEffect(() => {
    if (safeResult.score >= 80) {
      const timer = setTimeout(() => {
        setShowConfetti(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [safeResult.score])

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    const answers = safeResult.answers || []

    // Find fastest and slowest answers
    let fastestAnswer = { timeSpent: Number.POSITIVE_INFINITY, index: -1 }
    let slowestAnswer = { timeSpent: -1, index: -1 }

    answers.forEach((answer, index) => {
      if (answer.timeSpent < fastestAnswer.timeSpent) {
        fastestAnswer = { timeSpent: answer.timeSpent, index }
      }
      if (answer.timeSpent > slowestAnswer.timeSpent) {
        slowestAnswer = { timeSpent: answer.timeSpent, index }
      }
    })

    // Calculate average time per question
    const avgTimePerQuestion = answers.length > 0 ? Math.round(safeResult.totalTimeSpent / answers.length) : 0

    // Calculate performance level
    const performanceLevel = calculatePerformanceLevel(safeResult.score)

    // Calculate accuracy
    const accuracy = Math.round((safeResult.correctAnswers / (safeResult.totalQuestions || 1)) * 100)

    return {
      performanceLevel,
      accuracy,
      avgTimePerQuestion,
      fastestAnswer,
      slowestAnswer,
      chartData: [
        { name: "Score", value: safeResult.score },
        { name: "Accuracy", value: accuracy },
        { name: "Time Efficiency", value: Math.min(100, Math.max(0, 100 - avgTimePerQuestion / 10)) },
      ],
    }
  }, [safeResult])

  // Get feedback message based on score
  const feedbackMessage = useMemo(() => {
    const score = safeResult.score
    if (score >= 90) return "Excellent work! You've mastered this topic!"
    if (score >= 80) return "Great job! You have a strong understanding of the material."
    if (score >= 70) return "Good work! You're on the right track."
    if (score >= 60) return "Not bad! With a bit more study, you'll improve your score."
    return "Keep practicing! Review the material and try again."
  }, [safeResult.score])

  // Handle try again
  const handleTryAgain = useCallback(() => {
    if (isLoading) return // Prevent multiple clicks

    setIsLoading(true)

    // Reset the quiz state in Redux
    dispatch(resetQuiz())

    // Add a timestamp parameter to force a fresh load
    const timestamp = new Date().getTime()
    const url = `/dashboard/mcq/${safeResult.slug}?reset=true&t=${timestamp}`

    // Set a timeout to reset loading state if navigation takes too long
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    // Navigate to the quiz page with reset=true parameter to ensure it reloads
    router.push(url)

    return () => clearTimeout(timeoutId)
  }, [dispatch, router, safeResult.slug, isLoading])

  // Handle share
  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Quiz Results",
          text: `I scored ${safeResult.score}% on the ${safeResult.slug} quiz!`,
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
  }, [safeResult.score, safeResult.slug, toast])

  // Handle export
  const handleExport = useCallback(() => {
    try {
      const dataStr = JSON.stringify(safeResult, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

      const exportFileDefaultName = `${safeResult.slug}-quiz-results.json`

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
  }, [safeResult, toast])

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

  return (
    <motion.div
      data-testid="quiz-results"
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Show confetti for high scores */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0" id="confetti-canvas"></div>
        </div>
      )}

      <QuizResultHeader
        title="MCQ Quiz Results"
        completedAt={safeResult.completedAt}
        score={safeResult.score}
        feedbackMessage={feedbackMessage}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="details">Question Details</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="pt-6 space-y-6">
          {/* Score Overview */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-40 h-40 flex-shrink-0">
              <CircularProgress
                value={safeResult.score}
                size={160}
                strokeWidth={12}
                label={`${safeResult.score}%`}
                sublabel="Score"
              />
            </div>

            <div className="flex-1 space-y-4">
              <h3 className="text-lg font-medium">Performance Summary</h3>
              <p className="text-muted-foreground">{feedbackMessage}</p>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {performanceMetrics.performanceLevel}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300">
                  {safeResult.correctAnswers} correct
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300">
                  {safeResult.totalQuestions - safeResult.correctAnswers} incorrect
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300">
                  {safeResult.formattedTimeSpent} total time
                </span>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Accuracy"
              value={`${performanceMetrics.accuracy}%`}
              icon={<CheckCircle className="h-4 w-4" />}
              description={`${safeResult.correctAnswers}/${safeResult.totalQuestions} questions`}
              trend={performanceMetrics.accuracy >= 70 ? "up" : "down"}
            />

            <StatCard
              title="Avg. Time per Question"
              value={formatQuizTime(performanceMetrics.avgTimePerQuestion)}
              icon={<Clock className="h-4 w-4" />}
              description="Time efficiency"
              trend={performanceMetrics.avgTimePerQuestion < 30 ? "up" : "down"}
            />

            <StatCard
              title="Completion"
              value={`${safeResult.totalQuestions}/${safeResult.totalQuestions}`}
              icon={<Award className="h-4 w-4" />}
              description="All questions answered"
              trend="up"
            />
          </motion.div>

          {/* Performance Chart */}
          <motion.div variants={itemVariants} className="mt-6">
            <ResultCard title="Performance Metrics">
              <div className="h-64">
                <PerformanceChart data={performanceMetrics.chartData} />
              </div>
            </ResultCard>
          </motion.div>

          {/* Time Analysis */}
          {safeResult.answers.length > 0 && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performanceMetrics.fastestAnswer.index >= 0 && (
                <ResultCard title="Fastest Answer" icon={<Zap className="h-4 w-4 text-yellow-500" />}>
                  <div className="space-y-2">
                    <p className="font-medium">Question {performanceMetrics.fastestAnswer.index + 1}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {safeResult.answers[performanceMetrics.fastestAnswer.index]?.question}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Time: {formatQuizTime(performanceMetrics.fastestAnswer.timeSpent)}
                      </span>
                      {safeResult.answers[performanceMetrics.fastestAnswer.index]?.isCorrect ? (
                        <span className="inline-flex items-center text-xs font-medium text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-red-600">
                          <XCircle className="h-3 w-3 mr-1" /> Incorrect
                        </span>
                      )}
                    </div>
                  </div>
                </ResultCard>
              )}

              {performanceMetrics.slowestAnswer.index >= 0 && (
                <ResultCard title="Slowest Answer" icon={<Timer className="h-4 w-4 text-red-500" />}>
                  <div className="space-y-2">
                    <p className="font-medium">Question {performanceMetrics.slowestAnswer.index + 1}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {safeResult.answers[performanceMetrics.slowestAnswer.index]?.question}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Time: {formatQuizTime(performanceMetrics.slowestAnswer.timeSpent)}
                      </span>
                      {safeResult.answers[performanceMetrics.slowestAnswer.index]?.isCorrect ? (
                        <span className="inline-flex items-center text-xs font-medium text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-red-600">
                          <XCircle className="h-3 w-3 mr-1" /> Incorrect
                        </span>
                      )}
                    </div>
                  </div>
                </ResultCard>
              )}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="details" className="pt-6">
          <motion.div variants={containerVariants} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Question Review</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="inline-flex items-center mr-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div> Correct
                </span>
                <span className="inline-flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div> Incorrect
                </span>
              </div>
            </div>

            {safeResult.answers && safeResult.answers.length > 0 ? (
              safeResult.answers.map((answer, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className={`border rounded-lg overflow-hidden ${
                    answer.isCorrect ? "border-green-200 dark:border-green-900" : "border-red-200 dark:border-red-900"
                  }`}
                >
                  <div className={`h-1 ${answer.isCorrect ? "bg-green-500" : "bg-red-500"}`}></div>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          answer.isCorrect
                            ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                        }`}
                      >
                        {answer.isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-base">Question {index + 1}</h4>
                          <span className="text-xs text-muted-foreground">
                            Time: {formatQuizTime(answer.timeSpent)}
                          </span>
                        </div>

                        <p className="mt-1 text-sm">{answer.question}</p>

                        <div className="mt-3 space-y-2">
                          {answer.options &&
                            answer.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`p-2 rounded-md text-sm ${
                                  option === answer.selectedOption && option === answer.correctOption
                                    ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                                    : option === answer.selectedOption
                                      ? "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
                                      : option === answer.correctOption
                                        ? "bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900"
                                        : "bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800"
                                }`}
                              >
                                <div className="flex items-start">
                                  <div className="mr-2">
                                    {option === answer.selectedOption && option === answer.correctOption ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : option === answer.selectedOption ? (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    ) : option === answer.correctOption ? (
                                      <CheckCircle className="h-4 w-4 text-green-600 opacity-70" />
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"></div>
                                    )}
                                  </div>
                                  <span>{option}</span>
                                </div>
                              </div>
                            ))}

                          {!answer.options && (
                            <>
                              <div className="flex items-start">
                                <div className="mr-2 mt-0.5">
                                  {answer.isCorrect ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm">
                                    Your answer:{" "}
                                    <span
                                      className={
                                        answer.isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"
                                      }
                                    >
                                      {answer.selectedOption}
                                    </span>
                                  </p>
                                  {!answer.isCorrect && (
                                    <p className="text-sm mt-1">
                                      Correct answer:{" "}
                                      <span className="text-green-600 font-medium">{answer.correctOption}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No answer details available.</p>
              </div>
            )}
          </motion.div>
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
          <Button onClick={handleTryAgain} disabled={isLoading} className="flex-1 sm:flex-initial">
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span> Loading...
              </>
            ) : (
              <>
                Try Again <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
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
