"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Check,
  X,
  RefreshCw,
  Home,
  Share2,
  Download,
  Trophy,
  Target,
  Award,
  TrendingUp,
  Star,
  Lightbulb,
} from "lucide-react"
import type { QuizResult } from "@/app/types/quiz-types"
import { toast } from "sonner"

interface McqQuizResultProps {
  result: QuizResult
}

interface NormalizedResult {
  slug: string
  title: string
  score: number
  maxScore: number
  percentage: number
  completedAt: string
  questions: Array<{
    id: string
    question: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    options?: string[]
  }>
}

export default function McqQuizResult({ result }: McqQuizResultProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("summary")

  // Extract any nested result array (handling the specific API response format)
  const processedResult = useMemo((): QuizResult => {
    if (result?.result && Array.isArray(result.result) && result.result.length > 0) {
      const firstResult = result.result[0]
      return {
        quizId: String(firstResult.quizId || ""),
        slug: firstResult.slug || firstResult.quizSlug || "",
        title: firstResult.quizTitle || "Quiz",
        score: typeof firstResult.score === "number" ? firstResult.score : 0,
        maxScore: firstResult.questions?.length || 0,
        percentage: typeof firstResult.accuracy === "number" ? firstResult.accuracy : 0,
        completedAt: firstResult.attemptedAt || new Date().toISOString(),
        questions: Array.isArray(firstResult.questions)
          ? firstResult.questions.map((q) => ({
              id: String(q.questionId || ""),
              question: q.question || "",
              userAnswer: q.userAnswer || "",
              correctAnswer: q.correctAnswer || "",
              isCorrect: !!q.isCorrect,
              options: Array.isArray(q.options) ? q.options : [],
            }))
          : [],
      }
    }
    return result
  }, [result])

  // Verify and normalize the result data to ensure all required fields are present
  const normalizedResult: NormalizedResult = {
    slug: processedResult?.slug || "",
    title: processedResult?.title || "MCQ Quiz",
    score: typeof processedResult?.score === "number" ? processedResult.score : 0,
    maxScore:
      typeof processedResult?.maxScore === "number"
        ? processedResult.maxScore
        : Array.isArray(processedResult?.questions)
          ? processedResult.questions.length
          : 13,
    percentage:
      typeof processedResult?.percentage === "number"
        ? processedResult.percentage
        : processedResult?.maxScore > 0
          ? Math.round((processedResult.score / processedResult.maxScore) * 100)
          : 0,
    completedAt: processedResult?.completedAt || new Date().toISOString(),
    questions: Array.isArray(processedResult?.questions)
      ? processedResult.questions.map((q) => ({
          id: q?.id || String(q?.questionId) || String(Math.random()).slice(2),
          question: q?.question || "Unknown question",
          userAnswer: q?.userAnswer || "",
          correctAnswer: q?.correctAnswer || "",
          isCorrect: Boolean(q?.isCorrect),
          options: Array.isArray(q?.options) ? q.options : [],
        }))
      : [],
  }

  // Clean up the slug to remove any query parameters
  const cleanSlug = normalizedResult.slug.split("?")[0]

  // Calculate score percentage safely
  const scorePercentage =
    normalizedResult.maxScore > 0 ? Math.round((normalizedResult.score / normalizedResult.maxScore) * 100) : 0

  // Check if we have valid question data
  const hasValidQuestions = normalizedResult.questions.length > 0

  const handleRetryQuiz = useCallback(() => {
    // Create a unique ID for this toast so we can dismiss it later
    const toastId = toast.loading("Loading quiz...", { id: "quiz-loading-toast" })
    
    // Dismiss any existing toasts to prevent stacking
    setTimeout(() => {
      toast.dismiss(toastId)
    }, 1500)
    
    const navSlug = cleanSlug || normalizedResult.slug.split("?")[0]
    router.push(`/dashboard/mcq/${navSlug}?reset=true`)
  }, [cleanSlug, normalizedResult.slug, router])

  const handleReturnToDashboard = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Quiz Results",
          text: `I scored ${scorePercentage}% on the ${normalizedResult.title} quiz!`,
          url: window.location.href,
        })
        toast.success("Shared successfully!")
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard!")
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }, [scorePercentage, normalizedResult.title])

  const handleSaveResults = useCallback(() => {
    const summaryText = `
MCQ Quiz Results: ${normalizedResult.title}
Date: ${new Date(normalizedResult.completedAt).toLocaleString()}
Score: ${normalizedResult.score}/${normalizedResult.maxScore} (${scorePercentage}%)

Questions and Answers:
${normalizedResult.questions
  .map(
    (q, i) => `
Question ${i + 1}: ${q.question}
Your Answer: ${q.userAnswer || "No answer provided"}
Correct Answer: ${q.correctAnswer}
Result: ${q.isCorrect ? "Correct ✓" : "Incorrect ✗"}
`,
  )
  .join("\n")}
    `.trim()

    const blob = new Blob([summaryText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quiz-results-${normalizedResult.slug || "mcq"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Results saved!")
  }, [
    scorePercentage,
    normalizedResult.slug,
    normalizedResult.title,
    normalizedResult.completedAt,
    normalizedResult.score,
    normalizedResult.maxScore,
    normalizedResult.questions,
  ])

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { label: "Outstanding", color: "text-green-600", icon: Star }
    if (percentage >= 80) return { label: "Excellent", color: "text-blue-600", icon: TrendingUp }
    if (percentage >= 70) return { label: "Good", color: "text-yellow-600", icon: Target }
    return { label: "Keep Practicing", color: "text-orange-600", icon: Lightbulb }
  }

  const performance = getPerformanceLevel(scorePercentage)
  const PerformanceIcon = performance.icon

  // Update UI to show when there are issues with the data
  if (!hasValidQuestions) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto p-6">
        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-md">
              <h2 className="font-semibold">Data Issue Detected</h2>
              <p>There appears to be a problem with your quiz results data.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 mt-6 border-t">
              <Button onClick={handleRetryQuiz} className="flex items-center gap-2 bg-primary">
                <RefreshCw className="w-4 h-4" />
                <span>Retry Quiz</span>
              </Button>
              <Button onClick={handleReturnToDashboard} variant="outline" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
      data-testid="mcq-quiz-result"
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
              {normalizedResult.title} •{" "}
              {new Date(normalizedResult.completedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
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
                scorePercentage >= 80
                  ? "bg-gradient-to-br from-green-500 to-green-600"
                  : scorePercentage >= 60
                    ? "bg-gradient-to-br from-blue-500 to-blue-600"
                    : scorePercentage >= 40
                      ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                      : "bg-gradient-to-br from-red-500 to-red-600"
              }`}
            >
              {scorePercentage}%
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute -top-2 -right-2 bg-background border-4 border-background rounded-full p-2"
            >
              <Trophy className="h-6 w-6 text-primary" />
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryQuiz}
            className="gap-2"
            data-testid="retry-quiz-button"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold" data-testid="score-percentage">
                    {scorePercentage}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {normalizedResult.score} of {normalizedResult.maxScore} correct
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
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Correct</p>
                  <p className="text-2xl font-bold">{normalizedResult.score}</p>
                  <p className="text-xs text-muted-foreground">out of {normalizedResult.maxScore}</p>
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
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rank</p>
                  <p className="text-2xl font-bold">{performance.label}</p>
                  <p className="text-xs text-muted-foreground">Performance level</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Results */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Tabs defaultValue="summary" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="correct" className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Correct
            </TabsTrigger>
            <TabsTrigger value="incorrect" className="flex items-center gap-2">
              <X className="h-4 w-4" />
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
              <TabsContent value="summary" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Correct</p>
                        <p className="text-3xl font-bold text-green-600">{normalizedResult.score}</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Incorrect</p>
                        <p className="text-3xl font-bold text-red-600">
                          {normalizedResult.maxScore - normalizedResult.score}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="correct" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      Correct Answers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {normalizedResult.questions
                      .filter((q) => q.isCorrect)
                      .map((q, i) => (
                        <motion.div
                          key={q.id || i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="border-l-4 border-green-500 pl-4 py-2"
                          data-testid={`question-result-${i}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 p-1 rounded-full bg-green-100">
                              <Check className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Q: {q.question}</p>
                              <p className="text-sm mt-2 text-green-700 font-medium">Your answer: {q.userAnswer}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                    {normalizedResult.questions.filter((q) => q.isCorrect).length === 0 && (
                      <div className="text-center py-10 text-muted-foreground">
                        <X className="mx-auto h-12 w-12 mb-4 text-red-500" />
                        <p className="text-lg font-medium mb-2">No correct answers</p>
                        <p>Keep practicing to improve your performance!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="incorrect" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <X className="h-5 w-5 text-red-600" />
                      Review Needed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {normalizedResult.questions
                      .filter((q) => !q.isCorrect)
                      .map((q, i) => (
                        <motion.div
                          key={q.id || i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="border-l-4 border-red-500 pl-4 py-2"
                          data-testid={`question-result-${i}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 p-1 rounded-full bg-red-100">
                              <X className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Q: {q.question}</p>
                              <div className="text-sm mt-2 space-y-1">
                                <p className="text-red-600 font-medium">
                                  Your answer: {q.userAnswer || "No answer provided"}
                                </p>
                                <p className="text-green-700 font-medium">
                                  Correct answer: {q.correctAnswer || "Unknown"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                    {normalizedResult.questions.filter((q) => !q.isCorrect).length === 0 && (
                      <div className="text-center py-10 text-green-600">
                        <Check className="mx-auto h-12 w-12 mb-4" />
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

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t"
      >
        <Button
          onClick={handleReturnToDashboard}
          variant="outline"
          className="flex items-center gap-2"
          data-testid="return-dashboard-button"
        >
          <Home className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Button>
        <Button
          onClick={handleRetryQuiz}
          className="flex items-center gap-2 bg-primary"
          data-testid="retry-quiz-button"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Quiz</span>
        </Button>
      </motion.div>
    </motion.div>
  )
}
