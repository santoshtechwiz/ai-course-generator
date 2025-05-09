"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, Brain, ArrowRight, Share2, Trophy } from "lucide-react"
import { formatQuizTime } from "@/lib/utils/quiz-performance"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { useAppDispatch } from "@/store"
import { resetQuiz } from "@/store/slices/quizSlice"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"
import { StatCard } from "@/components/ui/stat-card"
import { PerformanceChart } from "@/components/ui/performance-chart"
import { AnswerReviewItem } from "@/components/ui/answer-review-item"
import { QuizResultHeader } from "@/components/ui/quiz-result-header"

interface BlanksQuizResultProps {
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
      answer: string
      userAnswer: string
      correctAnswer: string
      isCorrect: boolean
      timeSpent: number
      similarity?: number
      hintsUsed?: boolean
      index: number
    }>
  }
  [key: string]: any
}

export default function BlanksQuizResult({ result, ...props }: BlanksQuizResultProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()

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
      answers: Array.isArray(result?.answers) ? result.answers.filter(Boolean) : [],
    }),
    [result],
  )

  // Process answers to add similarity scores if not already present
  const processedAnswers = useMemo(() => {
    return safeResult.answers.map((answer, idx) => {
      // Ensure correctAnswer is a string
      const correctAnswer = answer.correctAnswer || answer.answer || ""
      const userAnswer = answer.userAnswer || ""

      // Calculate similarity if not already present and we have both answers
      let similarity = answer.similarity
      if (similarity === undefined && userAnswer && correctAnswer) {
        similarity = getBestSimilarityScore(userAnswer, correctAnswer)
      }

      // Ensure similarity is at least 0
      similarity = typeof similarity === "number" ? Math.max(0, similarity) : 0

      return {
        ...answer,
        correctAnswer,
        similarity,
        index: answer.index || idx,
      }
    })
  }, [safeResult.answers])

  // Calculate additional stats
  const stats = useMemo(() => {
    const validAnswers = processedAnswers.filter((a) => a && typeof a === "object")
    const hintsUsedCount = validAnswers.filter((a) => a.hintsUsed).length
    const answersWithSimilarity = validAnswers.filter((a) => typeof a.similarity === "number")
    const fastestAnswer =
      validAnswers.length > 0
        ? validAnswers.reduce(
            (fastest, current) => (current.timeSpent < fastest.timeSpent ? current : fastest),
            validAnswers[0],
          )
        : null
    const slowestAnswer =
      validAnswers.length > 0
        ? validAnswers.reduce(
            (slowest, current) => (current.timeSpent > slowest.timeSpent ? current : slowest),
            validAnswers[0],
          )
        : null

    const averageSimilarity =
      answersWithSimilarity.length > 0
        ? Math.round(
            answersWithSimilarity.reduce((acc, a) => acc + (a.similarity || 0), 0) / answersWithSimilarity.length,
          )
        : 0

    const averageTimePerQuestion = Math.round(safeResult.totalTimeSpent / safeResult.totalQuestions)

    return {
      hintsUsedCount,
      hintsUsedPercentage:
        safeResult.totalQuestions > 0 ? Math.round((hintsUsedCount / safeResult.totalQuestions) * 100) : 0,
      averageSimilarity,
      fastestAnswer,
      slowestAnswer,
      averageTimePerQuestion,
    }
  }, [processedAnswers, safeResult.totalQuestions, safeResult.totalTimeSpent])

  // Performance metrics for chart
  const performanceMetrics = useMemo(
    () => [
      {
        label: "Overall Score",
        value: safeResult.score,
        color: "bg-primary",
      },
      {
        label: "Accuracy",
        value: Math.round((safeResult.correctAnswers / safeResult.totalQuestions) * 100),
        color: "bg-green-500",
        description: `${safeResult.correctAnswers} out of ${safeResult.totalQuestions} questions answered correctly`,
      },
      {
        label: "Answer Similarity",
        value: stats.averageSimilarity,
        color: "bg-blue-500",
        description: "Average similarity between your answers and correct answers",
      },
      ...(stats.hintsUsedCount > 0
        ? [
            {
              label: "Hints Used",
              value: stats.hintsUsedPercentage,
              color: "bg-amber-500",
              description: `Used hints on ${stats.hintsUsedCount} out of ${safeResult.totalQuestions} questions`,
            },
          ]
        : []),
    ],
    [
      safeResult.score,
      safeResult.correctAnswers,
      safeResult.totalQuestions,
      stats.averageSimilarity,
      stats.hintsUsedCount,
      stats.hintsUsedPercentage,
    ],
  )

  // Simplified handleShare function
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

  // Optimize the handleTryAgain function
  const handleTryAgain = useCallback(() => {
    if (isLoading) return // Prevent multiple clicks

    setIsLoading(true)

    // Reset the quiz state in Redux
    dispatch(resetQuiz())

    // Clear sessionStorage for this quiz
    try {
      sessionStorage.removeItem(`blanks_quiz_state_${safeResult.slug}`)
    } catch (err) {
      console.error("Error clearing sessionStorage:", err)
    }

    // Add a timestamp parameter to force a fresh load
    const timestamp = new Date().getTime()
    const url = `/dashboard/blanks/${safeResult.slug}?reset=true&t=${timestamp}`

    // Set a timeout to reset loading state if navigation takes too long
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    // Navigate to the quiz page with reset=true parameter to ensure it reloads
    router.push(url)

    return () => clearTimeout(timeoutId)
  }, [dispatch, router, safeResult.slug, isLoading])

  // Format question text to show the blank
  const formatQuestionText = useCallback((questionText: string) => {
    return questionText.replace(/\[\[(.*?)\]\]/g, (_, p1) => {
      return `<span class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">________</span>`
    })
  }, [])

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <QuizResultHeader
        score={safeResult.score}
        title="Fill in the Blanks Quiz Results"
        completedAt={safeResult.completedAt}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-8">
          <TabsTrigger value="summary" className="text-base py-3">
            Summary
          </TabsTrigger>
          <TabsTrigger value="details" className="text-base py-3">
            Answer Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-8 animate-in fade-in-50 duration-500">
          <motion.div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <StatCard
              icon={<Trophy className="h-8 w-8" />}
              label="Score"
              value={`${safeResult.score}%`}
              color="primary"
            />

            <StatCard
              icon={<CheckCircle className="h-8 w-8" />}
              label="Correct Answers"
              value={safeResult.correctAnswers}
              subValue={`of ${safeResult.totalQuestions}`}
              color="success"
              trend="up"
              trendValue={`${Math.round((safeResult.correctAnswers / safeResult.totalQuestions) * 100)}%`}
            />

            <StatCard
              icon={<XCircle className="h-8 w-8" />}
              label="Incorrect Answers"
              value={safeResult.totalQuestions - safeResult.correctAnswers}
              subValue={`of ${safeResult.totalQuestions}`}
              color="danger"
            />

            <StatCard
              icon={<Clock className="h-8 w-8" />}
              label="Time Spent"
              value={safeResult.formattedTimeSpent}
              subValue={`${stats.averageTimePerQuestion}s per question`}
              color="info"
            />
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Performance Overview</h3>
                <PerformanceChart metrics={performanceMetrics} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Time Analysis</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Fastest Answer</h4>
                    {stats.fastestAnswer ? (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">
                            Question {processedAnswers.indexOf(stats.fastestAnswer) + 1}
                          </span>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                            {formatQuizTime(stats.fastestAnswer.timeSpent)}
                          </span>
                        </div>
                        <p
                          className="text-xs text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: formatQuestionText(stats.fastestAnswer.question).substring(0, 100) + "...",
                          }}
                        ></p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No data available</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Slowest Answer</h4>
                    {stats.slowestAnswer ? (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">
                            Question {processedAnswers.indexOf(stats.slowestAnswer) + 1}
                          </span>
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                            {formatQuizTime(stats.slowestAnswer.timeSpent)}
                          </span>
                        </div>
                        <p
                          className="text-xs text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: formatQuestionText(stats.slowestAnswer.question).substring(0, 100) + "...",
                          }}
                        ></p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No data available</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Average Time</h4>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-3">
                        <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{formatQuizTime(stats.averageTimePerQuestion)}</p>
                        <p className="text-xs text-muted-foreground">per question</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
        </TabsContent>

        <TabsContent value="details" className="space-y-6 animate-in fade-in-50 duration-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Answer Review</h3>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
                <span className="text-muted-foreground">Correct</span>
              </div>
              <div className="flex items-center ml-3">
                <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
                <span className="text-muted-foreground">Incorrect</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {processedAnswers.length > 0 ? (
              processedAnswers.map((answer, index) => (
                <AnswerReviewItem
                  key={index}
                  index={answer.index || index}
                  question={answer.question}
                  userAnswer={answer.userAnswer || "No answer provided"}
                  correctAnswer={answer.correctAnswer || answer.answer || ""}
                  isCorrect={answer.isCorrect}
                  timeSpent={answer.timeSpent}
                  similarity={answer.similarity}
                  hintsUsed={answer.hintsUsed}
                  formatQuestionText={formatQuestionText}
                  delay={index * 0.05}
                  showSimilarityDetails={true}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No answer details available.</p>
              </div>
            )}
          </div>

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
        </TabsContent>
      </Tabs>
    </div>
  )
}
