"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ArrowRight, Share2 } from "lucide-react"
import { formatQuizTime } from "@/lib/utils/quiz-performance"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { useAppDispatch } from "@/store"
import { resetQuiz } from "@/store/slices/quizSlice"
import { Badge } from "@/components/ui/badge"
import { SimilarityBadge } from "@/components/ui/similarity-badge"
import { QuizResultsSummary } from "@/components/ui/quiz-results-summary"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"

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
    return safeResult.answers.map((answer) => {
      if (answer.similarity === undefined && answer.userAnswer && answer.correctAnswer) {
        // Calculate similarity using the edit distance algorithm
        const similarity = getBestSimilarityScore(answer.userAnswer, answer.correctAnswer)
        return { ...answer, similarity }
      }
      return answer
    })
  }, [safeResult.answers])

  // Calculate additional stats
  const stats = useMemo(() => {
    const validAnswers = processedAnswers.filter((a) => a && typeof a === "object")
    const hintsUsedCount = validAnswers.filter((a) => a.hintsUsed).length
    const answersWithSimilarity = validAnswers.filter((a) => typeof a.similarity === "number")

    const averageSimilarity =
      answersWithSimilarity.length > 0
        ? Math.round(
            answersWithSimilarity.reduce((acc, a) => acc + (a.similarity || 0), 0) / answersWithSimilarity.length,
          )
        : 0

    return {
      hintsUsedCount,
      hintsUsedPercentage:
        safeResult.totalQuestions > 0 ? Math.round((hintsUsedCount / safeResult.totalQuestions) * 100) : 0,
      averageSimilarity,
    }
  }, [processedAnswers, safeResult.totalQuestions])

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

  // Memoized animation variants
  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    }),
    [],
  )

  const itemVariants = useMemo(
    () => ({
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 },
    }),
    [],
  )

  // Format question text to show the blank
  const formatQuestionText = useCallback((questionText: string) => {
    return questionText.replace(/\[\[(.*?)\]\]/g, (_, p1) => {
      return `<span class="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">________</span>`
    })
  }, [])

  return (
    <motion.div
      data-testid="quiz-results"
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="w-full print:shadow-none">
        <CardHeader className="text-center">
          <motion.div variants={itemVariants}>
            <CardTitle className="text-2xl">Fill in the Blanks Quiz Results</CardTitle>
            <CardDescription>Completed on {new Date(safeResult.completedAt).toLocaleDateString()}</CardDescription>
          </motion.div>
        </CardHeader>

        {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEBUG_MODE === "true" && (
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-md mx-6 mb-4">
            <h3 className="text-sm text-slate-700">Result Debug</h3>
            <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60 mt-2">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Answer Details</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="pt-4">
            <CardContent>
              <QuizResultsSummary
                score={safeResult.score}
                correctAnswers={safeResult.correctAnswers}
                totalQuestions={safeResult.totalQuestions}
                totalTimeSpent={safeResult.totalTimeSpent}
                formattedTimeSpent={safeResult.formattedTimeSpent || formatQuizTime(safeResult.totalTimeSpent)}
                averageSimilarity={stats.averageSimilarity}
                hintsUsed={stats.hintsUsedCount}
                quizType="blanks"
              />
            </CardContent>
          </TabsContent>

          <TabsContent value="details">
            <CardContent>
              <motion.div variants={containerVariants} className="mt-6 space-y-4">
                <h3 className="text-lg font-medium">Answer Review</h3>
                {processedAnswers.length > 0 ? (
                  processedAnswers.map(
                    (answer, index) =>
                      answer && (
                        <motion.div key={index} variants={itemVariants}>
                          <Card
                            className={`border-l-4 ${answer.isCorrect ? "border-l-green-500" : "border-l-red-500"} ${answer.isCorrect ? "bg-green-50/50 dark:bg-green-950/20" : "bg-red-50/50 dark:bg-red-950/20"}`}
                          >
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-2">
                                {answer.isCorrect ? (
                                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="w-full">
                                  <p className="font-medium">Question {index + 1}</p>
                                  <p
                                    className="text-sm mt-1"
                                    dangerouslySetInnerHTML={{ __html: formatQuestionText(answer.question) }}
                                  ></p>
                                  <div className="mt-3">
                                    <p className="text-sm">
                                      Your answer:{" "}
                                      <span
                                        className={
                                          answer.isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"
                                        }
                                      >
                                        {answer.userAnswer || "No answer provided"}
                                      </span>
                                      {answer.similarity !== undefined && (
                                        <span className="ml-2">
                                          <SimilarityBadge similarity={answer.similarity} />
                                        </span>
                                      )}
                                      {answer.hintsUsed && (
                                        <Badge
                                          variant="outline"
                                          className="ml-2 text-xs bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                                        >
                                          Hint used
                                        </Badge>
                                      )}
                                    </p>
                                  </div>
                                  {!answer.isCorrect && (
                                    <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded-md dark:bg-green-950/30 dark:border-green-900">
                                      <p className="text-sm">
                                        Correct answer:{" "}
                                        <span className="text-green-600 font-medium">{answer.correctAnswer}</span>
                                      </p>
                                    </div>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-3">
                                    Time spent: {formatQuizTime(answer.timeSpent)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ),
                  )
                ) : (
                  <p className="text-muted-foreground">No answer details available.</p>
                )}
              </motion.div>
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex flex-wrap justify-between gap-4 pt-6">
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
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
          <Button variant="outline" size="icon" onClick={handleShare} title="Share Results">
            <Share2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
