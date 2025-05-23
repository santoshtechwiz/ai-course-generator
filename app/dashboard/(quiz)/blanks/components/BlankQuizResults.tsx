"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle,
  XCircle,
  Clock,
  Share2,
  RefreshCw,
  Download,
  Award,
  BarChart3,
  CheckCircle2,
  Target,
  TrendingUp,
  Star,
  Lightbulb,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks"
import { formatQuizTime } from "@/lib/utils/quiz-utils"
import { useAppDispatch } from "@/store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { QuizResultProps } from "@/app/types/quiz-types"
import { resetQuiz } from "@/app/store/slices/textQuizSlice"

export default function BlankQuizResults({ result }: QuizResultProps) {
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState("summary")
  const [isRestarting, setIsRestarting] = useState(false)

  // Transform incoming data to match expected format
  const formattedResult = useMemo(
    () => ({
      ...result,
      answers: result.answers.map((answer) => ({
        ...answer,
        userAnswer: answer.answer,
        correctAnswer: answer.correctAnswer || answer.answer || "",
        isCorrect: answer.isCorrect || false,
        timeSpent: answer.timeSpent || 0,
        hintsUsed: answer.hintsUsed || false,
        similarity: answer.similarity || 0,
      })),
    }),
    [result],
  )

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
      questions: Array.isArray(formattedResult?.questions) ? formattedResult.questions : [],
      title: formattedResult?.title || "Fill in the Blanks Quiz",
    }),
    [formattedResult],
  )

  // Create question-answer mapping for display
  const questionsWithAnswers = useMemo(() => {
    try {
      const allQuestionsWithAnswers =
        safeResult.questions?.map((question, index) => {
          const matchingAnswer = safeResult.answers.find((a) => a.questionId === question.id)

          return {
            question,
            answer: matchingAnswer || null,
            isAnswered: !!matchingAnswer,
            isCorrect: matchingAnswer?.isCorrect || false,
          }
        }) || []

      return allQuestionsWithAnswers
    } catch (err) {
      console.error("Error creating question-answer mapping:", err)
      return []
    }
  }, [safeResult.questions, safeResult.answers])

  // Calculate additional stats
  const stats = useMemo(() => {
    const validAnswers = safeResult.answers.filter((a) => a && typeof a === "object")
    const hintsUsedCount = validAnswers.filter((a) => a.hintsUsed).length
    const correctAnswers = validAnswers.filter((a) => a.isCorrect).length

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

    const totalTime = validAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0)
    const averageTimePerQuestion = validAnswers.length > 0 ? Math.round(totalTime / validAnswers.length) : 0

    const accuracy = safeResult.totalQuestions > 0 ? Math.round((correctAnswers / safeResult.totalQuestions) * 100) : 0

    const scoreRanges = {
      correct: correctAnswers,
      incorrect: validAnswers.length - correctAnswers,
      unanswered: safeResult.totalQuestions - validAnswers.length,
      hintsUsed: hintsUsedCount,
    }

    return {
      hintsUsedCount,
      hintsUsedPercentage:
        safeResult.totalQuestions > 0 ? Math.round((hintsUsedCount / safeResult.totalQuestions) * 100) : 0,
      accuracy,
      fastestAnswer,
      slowestAnswer,
      totalTime,
      averageTimePerQuestion,
      scoreRanges,
    }
  }, [safeResult.answers, safeResult.totalQuestions])

  const handleTryAgain = useCallback(() => {
    if (isRestarting) return

    setIsRestarting(true)
    dispatch(resetQuiz())

    const timestamp = new Date().getTime()
    const url = `/dashboard/blanks/${safeResult.slug}?reset=true&t=${timestamp}`

    setTimeout(() => {
      router.replace(url)
    }, 200)
  }, [dispatch, router, safeResult.slug, isRestarting])

  const handleSaveResults = useCallback(() => {
    const summaryText = `
Fill in the Blanks Quiz Results: ${safeResult.title}
Date: ${new Date(safeResult.completedAt).toLocaleString()}
Score: ${safeResult.correctAnswers}/${safeResult.totalQuestions} (${Math.round((safeResult.correctAnswers / Math.max(1, safeResult.totalQuestions)) * 100)}%)
Time: ${formatQuizTime(stats.totalTime)}

Questions and Answers:
${questionsWithAnswers
  .map(
    (qa, i) => `
Question ${i + 1}: ${qa.question.question.replace(/\[\[(.*?)\]\]/g, "________")}
${
  qa.isAnswered
    ? `Your Answer: ${qa.answer?.answer}
Correct Answer: ${qa.answer?.correctAnswer}
Result: ${qa.isCorrect ? "Correct ✓" : "Incorrect ✗"}`
    : "Not answered"
}
`,
  )
  .join("\n")}
    `.trim()

    const blob = new Blob([summaryText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quiz-results-${safeResult.slug || "blanks"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [safeResult, stats.totalTime, questionsWithAnswers])

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Quiz Results",
          text: `I scored ${Math.round((safeResult.correctAnswers / Math.max(1, safeResult.totalQuestions)) * 100)}% on the ${safeResult.slug} quiz!`,
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
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }, [safeResult, toast])

  const formatQuestionText = useCallback((questionText: string) => {
    return questionText.replace(/\[\[(.*?)\]\]/g, (_, p1) => {
      return `<span class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">________</span>`
    })
  }, [])

  const getResultBadge = (isCorrect: boolean) => {
    return isCorrect ? <Badge className="bg-green-500">Correct</Badge> : <Badge className="bg-red-500">Incorrect</Badge>
  }

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { label: "Excellent", color: "text-green-600", icon: Star }
    if (accuracy >= 80) return { label: "Great", color: "text-blue-600", icon: TrendingUp }
    if (accuracy >= 70) return { label: "Good", color: "text-yellow-600", icon: Target }
    return { label: "Keep Practicing", color: "text-orange-600", icon: Lightbulb }
  }

  const performance = getPerformanceLevel(stats.accuracy)
  const PerformanceIcon = performance.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 rounded-2xl p-8 border"
      >
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 justify-center lg:justify-start mb-2"
            >
              <PerformanceIcon className={`h-6 w-6 ${performance.color}`} />
              <span className={`text-lg font-semibold ${performance.color}`}>{performance.label}</span>
            </motion.div>
            <h1 className="text-3xl font-bold mb-2">Quiz Completed!</h1>
            <p className="text-muted-foreground text-lg">
              {safeResult.title} • {new Date(safeResult.completedAt).toLocaleDateString()}
            </p>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="relative"
          >
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-3xl font-bold ${
                stats.accuracy >= 80
                  ? "bg-gradient-to-br from-green-500 to-green-600"
                  : stats.accuracy >= 60
                    ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                    : stats.accuracy >= 40
                      ? "bg-gradient-to-br from-orange-500 to-orange-600"
                      : "bg-gradient-to-br from-red-500 to-red-600"
              }`}
            >
              {stats.accuracy}%
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute -top-2 -right-2 bg-background border-4 border-background rounded-full p-2"
            >
              <Award className="h-6 w-6 text-primary" />
            </motion.div>
          </motion.div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center lg:justify-start mt-6">
          <Button variant="outline" size="sm" onClick={handleSaveResults} className="gap-2">
            <Download className="h-4 w-4" />
            Save Results
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleTryAgain} disabled={isRestarting} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRestarting ? "animate-spin" : ""}`} />
            {isRestarting ? "Restarting..." : "Try Again"}
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold">{stats.accuracy}%</p>
                  <p className="text-xs text-muted-foreground">
                    {safeResult.correctAnswers} of {safeResult.totalQuestions} correct
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="text-2xl font-bold">
                    {Math.round((safeResult.answers.length / Math.max(1, safeResult.totalQuestions)) * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {safeResult.answers.length}/{safeResult.totalQuestions} questions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Spent</p>
                  <p className="text-2xl font-bold">{formatQuizTime(stats.totalTime)}</p>
                  <p className="text-xs text-muted-foreground">
                    Avg: {formatQuizTime(stats.averageTimePerQuestion)}/question
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Results Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Tabs defaultValue="summary" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              All Questions
            </TabsTrigger>
            <TabsTrigger value="correct" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Correct
            </TabsTrigger>
            <TabsTrigger value="incorrect" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Review
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Summary Tab */}
              <TabsContent value="summary" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                    <CardDescription>Overview of your performance in this quiz</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Correct</p>
                        <p className="text-3xl font-bold text-green-600">{stats.scoreRanges.correct}</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Incorrect</p>
                        <p className="text-3xl font-bold text-red-600">{stats.scoreRanges.incorrect}</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Hints Used</p>
                        <p className="text-3xl font-bold text-amber-600">{stats.scoreRanges.hintsUsed}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Unanswered</p>
                        <p className="text-3xl font-bold text-slate-600">{stats.scoreRanges.unanswered}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Questions Tab */}
              <TabsContent value="questions" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Questions</CardTitle>
                    <CardDescription>Review all {safeResult.totalQuestions} questions from this quiz</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {questionsWithAnswers.map((qa, index) => (
                      <motion.div
                        key={qa.question.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-4 bg-card"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">Question {index + 1}</h3>
                          {qa.isAnswered ? (
                            getResultBadge(qa.isCorrect)
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Not answered
                            </Badge>
                          )}
                        </div>
                        <p
                          className="text-muted-foreground mb-3"
                          dangerouslySetInnerHTML={{ __html: formatQuestionText(qa.question.question) }}
                        ></p>

                        {qa.isAnswered ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Your Answer:</span>
                              <div className="bg-muted p-3 rounded-md mt-1">
                                <p className="text-sm">{qa.answer?.answer || "No answer provided"}</p>
                              </div>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Correct Answer:</span>
                              <div
                                className={`p-3 rounded-md mt-1 ${qa.isCorrect ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
                              >
                                <p className="text-sm">{qa.answer?.correctAnswer || qa.question.answer}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-muted/50 p-3 rounded-md border border-dashed">
                            <p className="text-sm italic text-muted-foreground">
                              You didn't provide an answer for this question
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Correct answer: <span className="font-medium">{qa.question.answer}</span>
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Correct Tab */}
              <TabsContent value="correct" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Correct Answers
                    </CardTitle>
                    <CardDescription>
                      {stats.scoreRanges.correct} of {safeResult.totalQuestions} questions answered correctly
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {questionsWithAnswers
                      .filter((qa) => qa.isAnswered && qa.isCorrect)
                      .map((qa, index) => (
                        <motion.div
                          key={qa.question.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-l-4 border-green-500 pl-4 py-2"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">
                              Question {questionsWithAnswers.findIndex((q) => q.question.id === qa.question.id) + 1}
                            </h3>
                            <Badge className="bg-green-500">Correct</Badge>
                          </div>
                          <p
                            className="text-muted-foreground mb-2"
                            dangerouslySetInnerHTML={{ __html: formatQuestionText(qa.question.question) }}
                          ></p>
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                            <p className="text-sm font-medium">Your Answer: {qa.answer?.answer}</p>
                          </div>
                        </motion.div>
                      ))}

                    {questionsWithAnswers.filter((qa) => qa.isAnswered && qa.isCorrect).length === 0 && (
                      <div className="text-center py-10 text-muted-foreground">
                        <XCircle className="mx-auto h-12 w-12 mb-4 text-red-500" />
                        <p className="text-lg font-medium mb-2">No correct answers yet</p>
                        <p>Keep practicing to improve your performance!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Incorrect Tab */}
              <TabsContent value="incorrect" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      Review Needed
                    </CardTitle>
                    <CardDescription>
                      {stats.scoreRanges.incorrect + stats.scoreRanges.unanswered} questions need review
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {questionsWithAnswers
                      .filter((qa) => !qa.isCorrect)
                      .map((qa, index) => (
                        <motion.div
                          key={qa.question.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-l-4 border-red-500 pl-4 py-2"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">
                              Question {questionsWithAnswers.findIndex((q) => q.question.id === qa.question.id) + 1}
                            </h3>
                            {qa.isAnswered ? (
                              <Badge className="bg-red-500">Incorrect</Badge>
                            ) : (
                              <Badge variant="outline">Not answered</Badge>
                            )}
                          </div>
                          <p
                            className="text-muted-foreground mb-3"
                            dangerouslySetInnerHTML={{ __html: formatQuestionText(qa.question.question) }}
                          ></p>

                          {qa.isAnswered ? (
                            <div className="space-y-3">
                              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                                <p className="text-sm">
                                  <span className="font-medium">Your Answer:</span> {qa.answer?.answer}
                                </p>
                              </div>
                              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                                <p className="text-sm">
                                  <span className="font-medium">Correct Answer:</span>{" "}
                                  {qa.answer?.correctAnswer || qa.question.answer}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="bg-muted/50 p-3 rounded-md border border-dashed">
                                <p className="text-sm italic text-muted-foreground">You didn't answer this question</p>
                              </div>
                              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                                <p className="text-sm">
                                  <span className="font-medium">Correct Answer:</span> {qa.question.answer}
                                </p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}

                    {questionsWithAnswers.filter((qa) => !qa.isCorrect).length === 0 && (
                      <div className="text-center py-10 text-green-600">
                        <CheckCircle2 className="mx-auto h-12 w-12 mb-4" />
                        <p className="text-lg font-medium mb-2">Perfect Score!</p>
                        <p>You answered all questions correctly!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t"
      >
        <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")} className="gap-2">
          <BarChart3 className="h-4 w-4" />
          View All Quizzes
        </Button>
        <Button onClick={handleTryAgain} disabled={isRestarting} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isRestarting ? "animate-spin" : ""}`} />
          {isRestarting ? "Restarting..." : "Try Again"}
        </Button>
      </motion.div>
    </motion.div>
  )
}
