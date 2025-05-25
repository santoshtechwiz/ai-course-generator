"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
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
  Code,
  Target,
  Award,
  TrendingUp,
  Star,
  Lightbulb,
  Terminal,
} from "lucide-react"
import { QuizSubmissionLoading } from "../../components"
import { toast } from "sonner"
import { QuizResult, QuizQuestionResult } from "@/app/types/quiz-types"

interface CodeQuizResultProps {
  result: QuizResult & {
    questions: QuizQuestionResult[]
  }
  onRetake?: () => void
}

export default function CodeQuizResult({ result, onRetake }: CodeQuizResultProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("summary")

  // Ensure result is valid and has the required properties
  if (
    !result ||
    typeof result.score !== "number" ||
    typeof result.maxScore !== "number" ||
    !Array.isArray(result.questions)
  ) {
    return (
      <div className="text-center py-12" data-testid="results-error">
        <h2 className="text-2xl font-bold mb-4">Results Not Available</h2>
        <p className="mb-6">We couldn't load your quiz results.</p>
        <Button onClick={() => router.push("/dashboard/quizzes")}>Return to Quizzes</Button>
      </div>
    )
  }

  const slug = result.slug || ""
  const title = result.title || "Code Quiz"
  const scorePercentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Quiz Results",
          text: `I scored ${scorePercentage}% on the ${title} coding quiz!`,
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
  }, [scorePercentage, title])

  const handleSaveResults = useCallback(() => {
    // Implementation goes here
    toast.info("Save functionality coming soon")
  }, [])

  const handleRetake = useCallback(() => {
    if (onRetake) {
      onRetake()
    } else {
      router.push(`/dashboard/code/${slug}`)
    }
  }, [onRetake, router, slug])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <QuizSubmissionLoading quizType="code" />
  }

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { label: "Outstanding", color: "text-green-600", icon: Star }
    if (percentage >= 80) return { label: "Excellent", color: "text-blue-600", icon: TrendingUp }
    if (percentage >= 70) return { label: "Good", color: "text-yellow-600", icon: Target }
    return { label: "Keep Practicing", color: "text-orange-600", icon: Lightbulb }
  }

  const performance = getPerformanceLevel(scorePercentage)
  const PerformanceIcon = performance.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
      data-testid="code-quiz-result"
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
            <h1 className="text-3xl font-bold mb-2">Coding Challenge Completed!</h1>
            <p className="text-muted-foreground text-lg">
              {title} • {result.completedAt && new Date(result.completedAt).toLocaleDateString()}
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
              <Code className="h-6 w-6 text-primary" />
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
            onClick={handleRetake}
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
                  <Terminal className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold" data-testid="score-percentage">
                    {scorePercentage}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.score} of {result.maxScore} correct
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
                  <p className="text-2xl font-bold">{result.score}</p>
                  <p className="text-xs text-muted-foreground">out of {result.maxScore}</p>
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
              <Code className="h-4 w-4" />
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
                        <p className="text-3xl font-bold text-green-600">{result.score}</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Incorrect</p>
                        <p className="text-3xl font-bold text-red-600">{result.maxScore - result.score}</p>
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
                      Correct Solutions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.isArray(result.questions) &&
                      result.questions
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
                                <p className="font-medium">Q: {q.question || "Unknown question"}</p>
                                <p className="text-sm mt-2 text-green-700 font-medium">
                                  Your answer: {typeof q.userAnswer === "string" ? q.userAnswer : "No answer provided"}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                    {Array.isArray(result.questions) && result.questions.filter((q) => q.isCorrect).length === 0 && (
                      <div className="text-center py-10 text-muted-foreground">
                        <X className="mx-auto h-12 w-12 mb-4 text-red-500" />
                        <p className="text-lg font-medium mb-2">No correct answers</p>
                        <p>Keep practicing to improve your coding skills!</p>
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
                    {Array.isArray(result.questions) &&
                      result.questions
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
                                <p className="font-medium">Q: {q.question || "Unknown question"}</p>
                                <div className="text-sm mt-2 space-y-1">
                                  <p className="text-red-600 font-medium">
                                    Your answer:{" "}
                                    {typeof q.userAnswer === "string" ? q.userAnswer : "No answer provided"}
                                  </p>
                                  <p className="text-green-700 font-medium">
                                    Correct answer: {typeof q.correctAnswer === "string" ? q.correctAnswer : "Unknown"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                    {Array.isArray(result.questions) && result.questions.filter((q) => !q.isCorrect).length === 0 && (
                      <div className="text-center py-10 text-green-600">
                        <Check className="mx-auto h-12 w-12 mb-4" />
                        <p className="text-lg font-medium mb-2">Perfect Score!</p>
                        <p>You solved all coding challenges correctly!</p>
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
          onClick={() => router.push("/dashboard/quizzes")}
          variant="outline"
          className="flex items-center gap-2"
          data-testid="return-dashboard-button"
        >
          <Home className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Button>
        <Button
          onClick={handleRetake}
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
