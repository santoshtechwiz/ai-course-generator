"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Share2,
  Timer,
  Zap,
  AlertTriangle,
  Code,
  FileCode,
} from "lucide-react"
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
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"

// Local storage key prefix for quiz state
const QUIZ_STATE_STORAGE_KEY = "quiz_state_"

interface CodeQuizResultProps {
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
      selectedOption?: string
      answer?: string
      correctOption?: string
      correctAnswer?: string
      isCorrect: boolean
      timeSpent: number
      codeSnippet?: string
      language?: string
    }>
  }
  [key: string]: any
}

export default function CodeQuizResult({ result, ...props }: CodeQuizResultProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedResult, setHasLoadedResult] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const windowSize = useWindowSize()

  // Ensure we have a valid result object with default values for tests
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

  // Check localStorage for saved result on mount
  useEffect(() => {
    if (!hasLoadedResult && (!result || Object.keys(result).length === 0)) {
      try {
        // Try to get saved result from localStorage
        const slug = result?.slug || window.location.pathname.split("/").pop()
        if (slug) {
          const savedStateString = localStorage.getItem(`${QUIZ_STATE_STORAGE_KEY}${slug}`)
          if (savedStateString) {
            const savedState = JSON.parse(savedStateString)
            if (savedState && savedState.score) {
              console.log("Loaded result from localStorage:", savedState)
              // We don't directly update the result prop, but we can use it for debugging
            }
          }
        }
      } catch (err) {
        console.error("Error loading result from localStorage:", err)
      }
      setHasLoadedResult(true)
    }
  }, [result, hasLoadedResult])

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

    // Calculate code complexity (based on average code length)
    const avgCodeLength =
      answers.reduce((sum, answer) => {
        return sum + (answer.codeSnippet?.length || 0)
      }, 0) / Math.max(1, answers.length)

    // Normalize code complexity to a 0-100 scale
    const codeComplexity = Math.min(100, Math.max(0, Math.round((avgCodeLength / 500) * 100)))

    return {
      performanceLevel,
      accuracy,
      avgTimePerQuestion,
      fastestAnswer,
      slowestAnswer,
      codeComplexity,
      chartData: [
        { name: "Score", value: safeResult.score },
        { name: "Accuracy", value: accuracy },
        { name: "Code Quality", value: Math.min(100, safeResult.score + 10) }, // Estimate based on score
        { name: "Time Efficiency", value: Math.min(100, Math.max(0, 100 - avgTimePerQuestion / 15)) },
      ],
    }
  }, [safeResult])

  // Get feedback message based on score
  const feedbackMessage = useMemo(() => {
    const score = safeResult.score
    if (score >= 90) return "Outstanding! Your coding skills are exceptional!"
    if (score >= 80) return "Excellent work! You have strong coding abilities."
    if (score >= 70) return "Good job! Your code solutions demonstrate solid understanding."
    if (score >= 60) return "Not bad! With more practice, you'll improve your coding skills."
    return "Keep practicing! Review the solutions and try again to improve your coding skills."
  }, [safeResult.score])

  // Handle try again
  const handleTryAgain = useCallback(() => {
    if (isLoading) return // Prevent multiple clicks

    setIsLoading(true)

    // Reset the quiz state in Redux
    dispatch(resetQuiz())

    // Clear localStorage for this quiz
    try {
      localStorage.removeItem(`${QUIZ_STATE_STORAGE_KEY}${safeResult.slug}`)
    } catch (err) {
      console.error("Error clearing localStorage:", err)
    }

    // Add a timestamp parameter to force a fresh load
    const timestamp = new Date().getTime()
    const url = `/dashboard/code/${safeResult.slug}?reset=true&t=${timestamp}`

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
          title: "My Coding Quiz Results",
          text: `I scored ${safeResult.score}% on the ${safeResult.slug} coding quiz!`,
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

      const exportFileDefaultName = `${safeResult.slug}-coding-quiz-results.json`

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
        title="Code Quiz Results"
        completedAt={safeResult.completedAt}
        score={safeResult.score}
        feedbackMessage={feedbackMessage}
        icon={<FileCode className="h-5 w-5 text-primary" />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="details">Code Solutions</TabsTrigger>
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
              description={`${safeResult.correctAnswers}/${safeResult.totalQuestions} solutions`}
              trend={performanceMetrics.accuracy >= 70 ? "up" : "down"}
            />

            <StatCard
              title="Avg. Time per Solution"
              value={formatQuizTime(performanceMetrics.avgTimePerQuestion)}
              icon={<Clock className="h-4 w-4" />}
              description="Coding speed"
              trend={performanceMetrics.avgTimePerQuestion < 120 ? "up" : "down"}
            />

            <StatCard
              title="Code Complexity"
              value={`${performanceMetrics.codeComplexity}%`}
              icon={<Code className="h-4 w-4" />}
              description="Based on solution length"
              trend={performanceMetrics.codeComplexity > 30 && performanceMetrics.codeComplexity < 80 ? "up" : "down"}
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
                <ResultCard title="Fastest Solution" icon={<Zap className="h-4 w-4 text-yellow-500" />}>
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
                <ResultCard title="Slowest Solution" icon={<Timer className="h-4 w-4 text-red-500" />}>
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
              <h3 className="text-lg font-medium">Code Solutions</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="inline-flex items-center mr-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div> Correct
                </span>
                <span className="inline-flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div> Incorrect
                </span>
              </div>
            </div>

            {safeResult.answers.length > 0 ? (
              safeResult.answers.map(
                (answer, index) =>
                  answer && (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className={`border rounded-lg overflow-hidden ${
                        answer.isCorrect
                          ? "border-green-200 dark:border-green-900"
                          : "border-red-200 dark:border-red-900"
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

                          <div className="w-full">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-base">Question {index + 1}</h4>
                              <span className="text-xs text-muted-foreground">
                                Time: {formatQuizTime(answer.timeSpent)}
                              </span>
                            </div>

                            <p className="mt-1 text-sm">{answer.question}</p>

                            <div className="mt-3">
                              <p className="text-sm font-medium mb-2">Your solution:</p>
                              <div className="relative">
                                <SyntaxHighlighter
                                  language={answer.language || "javascript"}
                                  style={vscDarkPlus}
                                  customStyle={{
                                    margin: 0,
                                    padding: "1rem",
                                    fontSize: "0.85rem",
                                    borderRadius: "0.375rem",
                                  }}
                                >
                                  {answer.codeSnippet || answer.answer || "// No solution provided"}
                                </SyntaxHighlighter>
                                <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-gray-800 text-gray-200">
                                  {answer.language || "javascript"}
                                </div>
                              </div>
                            </div>

                            {!answer.isCorrect && answer.correctAnswer && (
                              <div className="mt-4">
                                <p className="text-sm font-medium mb-2">Correct solution:</p>
                                <div className="relative">
                                  <SyntaxHighlighter
                                    language={answer.language || "javascript"}
                                    style={vscDarkPlus}
                                    customStyle={{
                                      margin: 0,
                                      padding: "1rem",
                                      fontSize: "0.85rem",
                                      borderRadius: "0.375rem",
                                    }}
                                  >
                                    {answer.correctAnswer}
                                  </SyntaxHighlighter>
                                  <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-gray-800 text-gray-200">
                                    {answer.language || "javascript"}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Code comparison insights */}
                            {!answer.isCorrect && answer.correctAnswer && (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-900">
                                <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                                  Solution Insights
                                </h5>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                  {answer.codeSnippet && answer.codeSnippet.length > answer.correctAnswer.length * 1.5
                                    ? "Your solution could be more concise. Consider refactoring for brevity."
                                    : answer.codeSnippet &&
                                        answer.codeSnippet.length < answer.correctAnswer.length * 0.5
                                      ? "Your solution is very concise, but may be missing important functionality."
                                      : "Your approach was close! Review the correct solution to understand the differences."}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ),
              )
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No solution details available.</p>
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
