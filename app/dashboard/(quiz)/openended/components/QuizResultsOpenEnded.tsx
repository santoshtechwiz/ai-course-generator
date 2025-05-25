"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2, RefreshCw, Download, Award, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

import { useAppDispatch, useAppSelector } from "@/store"
import { resetQuiz, selectQuestions, selectAnswers } from "@/store/slices/quizSlice"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"

interface QuizResultsOpenEndedProps {
  result: {
    quizId: string
    slug: string
    answers: any[]
    questions: any[]
    totalQuestions: number
    completedAt: string
    title: string
  }
}

export default function QuizResultsOpenEnded({ result }: QuizResultsOpenEndedProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Get data from Redux store
  const questions = useAppSelector(selectQuestions)
  const answers = useAppSelector(selectAnswers)

  const [isRestarting, setIsRestarting] = useState(false)
  const [activeTab, setActiveTab] = useState("summary")

  // Calculate similarity scores using Redux data
  const calculateAnswerScores = useCallback(() => {
    return Object.entries(answers).map(([questionId, answer]) => {
      try {
        const question = questions.find((q) => q.id === questionId)
        if (!question) return { questionId, similarity: 0, answer }

        const answerText = (answer as any).text || ""
        const modelAnswer = (question as any).modelAnswer || ""
        const similarity = getBestSimilarityScore(answerText, modelAnswer)

        return { questionId, similarity, answer, question }
      } catch {
        return { questionId, similarity: 0, answer }
      }
    })
  }, [answers, questions])

  const stats = useMemo(() => {
    try {
      const answerScores = calculateAnswerScores()
      const totalAnswers = answerScores.length
      const totalQuestions = questions.length

      // Calculate average score
      const averageScore =
        totalAnswers > 0 ? Math.round(answerScores.reduce((sum, ans) => sum + ans.similarity, 0) / totalAnswers) : 0

      const completionRate = Math.round((totalAnswers / Math.max(1, totalQuestions)) * 100)

      // Count questions by score ranges
      const scoreRanges = {
        excellent: answerScores.filter((a) => a.similarity >= 80).length,
        good: answerScores.filter((a) => a.similarity >= 60 && a.similarity < 80).length,
        fair: answerScores.filter((a) => a.similarity >= 40 && a.similarity < 60).length,
        poor: answerScores.filter((a) => a.similarity < 40).length,
        unanswered: totalQuestions - totalAnswers,
      }

      return {
        totalTime: 0, // Not tracking time in Redux currently
        averageTime: 0,
        completionRate,
        averageScore,
        answerScores,
        totalAnswers,
        totalQuestions,
        scoreRanges,
      }
    } catch (err) {
      console.error("Error calculating stats", err)
      return {
        totalTime: 0,
        averageTime: 0,
        completionRate: 0,
        averageScore: 0,
        answerScores: [],
        totalAnswers: 0,
        totalQuestions: 0,
        scoreRanges: { excellent: 0, good: 0, fair: 0, poor: 0, unanswered: 0 },
      }
    }
  }, [calculateAnswerScores, questions.length])

  const handleRestart = useCallback(() => {
    setIsRestarting(true)
    dispatch(resetQuiz())
    router.replace(`/dashboard/openended/${result.slug}`)
  }, [result.slug, router, dispatch])

  const handleSaveResults = useCallback(() => {
    const summaryText = `
Quiz Results: ${result.title || "Open Ended Quiz"}
Date: ${new Date(result.completedAt).toLocaleString()}
Score: ${stats.averageScore}%
Completion: ${stats.completionRate}%

Questions and Answers:
${stats.answerScores
  .map(
    (qa, i) => `
Question ${i + 1}: ${qa.question?.text || "Unknown question"}
Your Answer: ${(qa.answer as any)?.text || "No answer"}
Similarity Score: ${qa.similarity}%
`,
  )
  .join("\n")}
    `.trim()

    const blob = new Blob([summaryText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quiz-results-${result.slug || "openended"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [result, stats])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    if (score >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  const getSimilarityBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-500">Excellent ({score}%)</Badge>
    } else if (score >= 60) {
      return <Badge className="bg-yellow-500">Good ({score}%)</Badge>
    } else if (score >= 40) {
      return <Badge className="bg-orange-500">Fair ({score}%)</Badge>
    } else {
      return <Badge className="bg-red-500">Poor ({score}%)</Badge>
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quiz Results</h1>
          <p className="text-muted-foreground">
            {result.title || "Open Ended Quiz"} • Completed {new Date(result.completedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveResults} title="Save results">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Save Results</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleRestart} disabled={isRestarting} title="Try again">
            <RefreshCw className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">{isRestarting ? "Restarting..." : "Try Again"}</span>
          </Button>
        </div>
      </div>

      {/* Score overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="col-span-1">
          <CardContent className="p-4 flex items-center gap-4">
            <div
              className={`rounded-full w-16 h-16 flex items-center justify-center text-white text-xl font-bold ${getScoreColor(stats.averageScore)}`}
            >
              {stats.averageScore}%
            </div>
            <div>
              <h3 className="font-medium">Average Score</h3>
              <p className="text-sm text-muted-foreground">Based on similarity to reference answers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-primary h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Completion Rate</p>
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{stats.completionRate}%</span>
                    <span className="text-xs text-muted-foreground">
                      {stats.totalAnswers}/{stats.totalQuestions} questions
                    </span>
                  </div>
                  <Progress value={stats.completionRate} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="text-primary h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Performance</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <span className="text-xs text-muted-foreground">Excellent</span>
                    <p className="font-mono text-sm">{stats.scoreRanges.excellent}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Good</span>
                    <p className="font-mono text-sm">{stats.scoreRanges.good}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for viewing different aspects */}
      <Tabs defaultValue="summary" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full grid grid-cols-2 h-auto p-1 gap-1">
          <TabsTrigger value="summary" className="flex items-center gap-2 py-2">
            <BarChart3 className="h-4 w-4" />
            <span>Summary</span>
          </TabsTrigger>
          <TabsTrigger value="answers" className="flex items-center gap-2 py-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Your Answers</span>
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Overview of your performance in this quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Excellent</p>
                    <div className="flex gap-1 items-baseline">
                      <p className="text-2xl font-bold">{stats.scoreRanges.excellent}</p>
                      <span className="text-xs">answers</span>
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Good</p>
                    <div className="flex gap-1 items-baseline">
                      <p className="text-2xl font-bold">{stats.scoreRanges.good}</p>
                      <span className="text-xs">answers</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Fair</p>
                    <div className="flex gap-1 items-baseline">
                      <p className="text-2xl font-bold">{stats.scoreRanges.fair}</p>
                      <span className="text-xs">answers</span>
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Needs Work</p>
                    <div className="flex gap-1 items-baseline">
                      <p className="text-2xl font-bold">{stats.scoreRanges.poor}</p>
                      <span className="text-xs">answers</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Answers Tab */}
        <TabsContent value="answers">
          <Card>
            <CardHeader>
              <CardTitle>Your Answers</CardTitle>
              <CardDescription>{stats.totalAnswers} answers submitted</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.answerScores.map((qa, index) => (
                <div key={qa.questionId} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Question {index + 1}</h3>
                    {getSimilarityBadge(qa.similarity)}
                  </div>
                  <p className="text-muted-foreground mb-2">{qa.question?.text || "Question text not available"}</p>

                  <div className="bg-muted p-3 rounded-md mt-2">
                    <p className="text-sm font-medium mb-1">Your Answer:</p>
                    <p className="text-sm">{(qa.answer as any)?.text || "No answer provided"}</p>
                  </div>

                  {/* Show reference answer */}
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                      View reference answer
                    </summary>
                    <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
                      <p className="text-sm">{(qa.question as any)?.modelAnswer || "Reference answer not available"}</p>
                    </div>
                  </details>
                </div>
              ))}

              {stats.answerScores.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No answers found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <Button onClick={() => router.push("/dashboard/quizzes")}>Return to Quizzes</Button>
        <Button onClick={handleRestart} disabled={isRestarting} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          {isRestarting ? "Restarting..." : "Try Again"}
        </Button>
      </div>
    </motion.div>
  )
}
