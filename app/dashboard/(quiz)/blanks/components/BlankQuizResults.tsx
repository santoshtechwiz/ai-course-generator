"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, Share2, ArrowRight, Brain } from "lucide-react"
import { useToast } from "@/hooks"
import { formatQuizTime } from "@/lib/utils/quiz-utils"
import { useAppDispatch } from "@/store"
import type { QuizResultProps } from "@/app/types/quiz-types"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"
import { resetQuizState } from "@/store/slices/quizSlice"

export default function BlanksQuizResults({ result }: QuizResultProps) {
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()

  // Transform incoming data to match expected format
  const formattedResult = useMemo(
    () => ({
      ...result,
      answers: result.answers.map((answer) => ({
        ...answer,
        userAnswer: answer.answer, // Map answer to userAnswer
        correctAnswer: answer.correctAnswer || answer.answer || "",
        isCorrect: answer.isCorrect || false,
        timeSpent: answer.timeSpent || 0,
        hintsUsed: answer.hintsUsed || false,
        similarity: answer.similarity || 0,
      })),
    }),
    [result],
  )

  const [activeTab, setActiveTab] = useState("summary")
  const [isLoading, setIsLoading] = useState(false)

  // Ensure we have a valid result object with default values for tests
  const safeResult = useMemo(
    () => ({
      quizId: formattedResult?.quizId || "",
      slug: formattedResult?.slug || "",
      score: typeof formattedResult?.score === "number" ? formattedResult.score : 0,
      totalQuestions: formattedResult?.totalQuestions || 0,
      correctAnswers: formattedResult?.correctAnswers || 0,
      totalTimeSpent: formattedResult?.totalTimeSpent || 0,
      formattedTimeSpent: formattedResult?.formattedTimeSpent || formatQuizTime(formattedResult?.totalTimeSpent || 0),
      completedAt: formattedResult?.completedAt || new Date().toISOString(),
      answers: Array.isArray(formattedResult?.answers) ? formattedResult.answers.filter(Boolean) : [],
    }),
    [formattedResult],
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
    dispatch(resetQuizState())

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
      <h2 className="text-2xl font-bold mb-6">Fill in the Blanks Quiz Results</h2>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <div className="flex-1 mb-4 sm:mb-0">
            <h3 className="text-lg font-semibold">
              Your Score: <span className="text-primary">{safeResult.score}%</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              {safeResult.correctAnswers} out of {safeResult.totalQuestions} questions answered correctly
            </p>
          </div>

          <div className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/quizzes")}
              className="mr-2"
            >
              Return to Quizzes
            </Button>
            <Button onClick={handleTryAgain} disabled={isLoading}>
              {isLoading ? "Loading..." : "Try Again"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-4 shadow-sm rounded-md">
            <h4 className="text-md font-medium mb-2">Performance Overview</h4>
            <div className="flex flex-col gap-2">
              {performanceMetrics.map((metric) => (
                <div key={metric.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className="font-semibold">{metric.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 shadow-sm rounded-md">
            <h4 className="text-md font-medium mb-2">Time Analysis</h4>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fastest Answer</span>
                <span className="font-semibold">
                  {stats.fastestAnswer
                    ? `${formatQuizTime(stats.fastestAnswer.timeSpent)} (Q${processedAnswers.indexOf(stats.fastestAnswer) + 1})`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Slowest Answer</span>
                <span className="font-semibold">
                  {stats.slowestAnswer
                    ? `${formatQuizTime(stats.slowestAnswer.timeSpent)} (Q${processedAnswers.indexOf(stats.slowestAnswer) + 1})`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average Time</span>
                <span className="font-semibold">
                  {formatQuizTime(stats.averageTimePerQuestion)} per question
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Answer Review</h3>

        <div className="space-y-4">
          {processedAnswers.length > 0 ? (
            processedAnswers.map((answer, index) => (
              <div
                key={index}
                className={`p-4 rounded-md border ${
                  answer.isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Question {answer.index + 1}
                  </span>
                  <span className="text-xs rounded-full px-2 py-0.5 font-mono" style={{ backgroundColor: answer.isCorrect ? "#d1fae5" : "#fee2e2" }}>
                    {answer.isCorrect ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <p
                  className="text-sm mb-2"
                  dangerouslySetInnerHTML={{
                    __html: formatQuestionText(answer.question),
                  }}
                ></p>
                <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                  <div className="flex-1 mb-2 sm:mb-0">
                    <span className="text-muted-foreground">Your Answer:</span>
                    <p className="font-semibold">{answer.userAnswer || "No answer provided"}</p>
                  </div>
                  <div className="flex-1">
                    <span className="text-muted-foreground">Correct Answer:</span>
                    <p className="font-semibold">{answer.correctAnswer || "No answer provided"}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                  <div className="flex-1 mb-2 sm:mb-0">
                    <span className="text-muted-foreground">Time Spent:</span>
                    <p className="font-semibold">{formatQuizTime(answer.timeSpent)}</p>
                  </div>
                  <div className="flex-1">
                    <span className="text-muted-foreground">Similarity:</span>
                    <p className="font-semibold">{answer.similarity}%</p>
                  </div>
                </div>
                {answer.hintsUsed && (
                  <div className="mt-2 text-sm text-amber-600">
                    <span className="font-medium">Hints Used:</span> {answer.hintsUsed}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No answer details available.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        {(navigator.share || navigator.clipboard) && (
          <Button variant="ghost" size="sm" onClick={handleShare} className="flex items-center gap-1">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        )}
      </div>
    </div>
  )
}
