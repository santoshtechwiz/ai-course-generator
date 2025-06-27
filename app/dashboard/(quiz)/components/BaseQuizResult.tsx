"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Target, Award } from "lucide-react"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Confetti } from "@/components/ui/confetti"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { PerformanceSummary } from "./PerformanceSummary"
import { QuestionCard } from "./QuestionCard"
import { QuestionNavigation } from "./QuestionNavigation"
import { ReviewControls } from "./ReviewControls"
import type { BaseQuizResultProps, ProcessedAnswer } from "./quiz-result-types"
import { getPerformanceLevel } from "@/lib/utils/text-similarity"

/**
 * BaseQuizResult - Enhanced base component for quiz results with inline review
 */
export function BaseQuizResult<T extends BaseQuizResultProps>({
  result,
  onRetake,
  processAnswers,
  renderInsightsTab,
}: T & {
  processAnswers: (result: T["result"]) => ProcessedAnswer[]
  renderInsightsTab: (performance: any, stats: any) => React.ReactNode
}) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showAllQuestions, setShowAllQuestions] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("review")
  const [showInlineReview, setShowInlineReview] = useState(false)
  const hasShownConfettiRef = useRef(false)

  // Format dates for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  }

  // Process and validate data
  const processedAnswers = useMemo(() => processAnswers(result), [processAnswers, result])

  const title = result?.title || "Quiz Results"
  const score = typeof result?.score === "number" ? result.score : 0
  const maxScore = typeof result?.maxScore === "number" ? result.maxScore : processedAnswers.length
  const percentage =
    typeof result?.percentage === "number" ? result.percentage : Math.round((score / Math.max(maxScore, 1)) * 100)

  const performance = useMemo(() => getPerformanceLevel(percentage), [percentage])

  // Filter questions based on current filter and search
  const filteredQuestions = useMemo(() => {
    let filtered = processedAnswers
    // Apply filter
    if (filterType === "correct") {
      filtered = filtered.filter((q) => q.isCorrect)
    } else if (filterType === "incorrect") {
      filtered = filtered.filter((q) => !q.isCorrect)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (q) =>
          q.question.toLowerCase().includes(query) ||
          q.userAnswer.toLowerCase().includes(query) ||
          q.correctAnswer.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [processedAnswers, filterType, searchQuery])

  // Statistics
  const stats = useMemo(() => {
    const correct =
      typeof result?.score === "number" ? result.score : processedAnswers.filter((q) => q.isCorrect).length
    const total = typeof result?.maxScore === "number" ? result.maxScore : processedAnswers.length
    const incorrect = total - correct
    const totalTime = processedAnswers.reduce((sum, q) => sum + (q.timeSpent || 0), 0)
    const avgTime = totalTime / Math.max(total, 1) || 0

    return {
      correct,
      incorrect,
      total,
      totalTime,
      avgTime,
      accuracy:
        typeof result?.percentage === "number" ? result.percentage : Math.round((correct / Math.max(total, 1)) * 100),
    }
  }, [result?.score, result?.maxScore, result?.percentage, processedAnswers])

  // Effects
  useEffect(() => {
    if (result && !hasShownConfettiRef.current && percentage >= 70) {
      hasShownConfettiRef.current = true
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [result, percentage])

  // Event handlers
  const handleRetry = useCallback(() => {
    if (onRetake) {
      onRetake()
    } else {
      const path = window.location.pathname
      const quizType = path.includes("/code/") ? "code" : "mcq"
      router.push(`/dashboard/${quizType}/${result.slug || ""}`)
    }
  }, [onRetake, router, result.slug])

  const handleGoHome = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${title} - Results`,
        text: `I scored ${percentage}% (${performance.level}) on the ${title} quiz! ${performance.emoji}`,
        url: window.location.href,
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
      }
    } catch (error) {
      console.warn("Share failed:", error)
    }
  }

  const navigateQuestion = (direction: "prev" | "next") => {
    if (direction === "prev" && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else if (direction === "next" && currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  // Inline review component
  const InlineReviewCard = () => {
    if (!showInlineReview || filteredQuestions.length === 0) return null

    const incorrectQuestions = filteredQuestions.filter((q) => !q.isCorrect)

    if (incorrectQuestions.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 mb-6"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🎉</div>
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">Perfect Score!</h3>
            <p className="text-green-600 dark:text-green-400">You got all questions correct. Great job!</p>
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300">Quick Review</h3>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {incorrectQuestions.length} question{incorrectQuestions.length !== 1 ? "s" : ""} to review
            </p>
          </div>
          <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
            {incorrectQuestions.length} incorrect
          </Badge>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {incorrectQuestions.slice(0, 3).map((question, index) => (
            <div
              key={question.questionId}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-700"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{question.question}</div>
              <div className="text-xs text-red-600 dark:text-red-400">Your answer: {question.userAnswer}</div>
              <div className="text-xs text-green-600 dark:text-green-400">Correct: {question.correctAnswer}</div>
            </div>
          ))}
          {incorrectQuestions.length > 3 && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("review")}
                className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600"
              >
                View all {incorrectQuestions.length} questions
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // Single question view
  const renderSingleQuestionView = () => {
    if (filteredQuestions.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No questions match your current filter.</p>
        </div>
      )
    }
    const currentQuestion = filteredQuestions[currentQuestionIndex]
    return (
      <div className="space-y-6">
        <QuestionNavigation
          currentIndex={currentQuestionIndex}
          total={filteredQuestions.length}
          onPrev={() => navigateQuestion("prev")}
          onNext={() => navigateQuestion("next")}
        />
        <QuestionCard question={currentQuestion} index={0} />
      </div>
    )
  }

  return (
    <>
      <motion.div
        className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Performance Summary */}
        <PerformanceSummary
          title={title}
          performance={performance}
          percentage={percentage}
          stats={stats}
          result={result}
          formatDate={formatDate}
          onRetry={handleRetry}
          onGoHome={handleGoHome}
          onShare={handleShare}
        />

        {/* Inline Review Card */}
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant={showInlineReview ? "default" : "outline"}
            onClick={() => setShowInlineReview(!showInlineReview)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            {showInlineReview ? "Hide" : "Show"} Quick Review
          </Button>
          {stats.incorrect > 0 && (
            <Badge variant="destructive" className="text-xs">
              {stats.incorrect} to review
            </Badge>
          )}
        </div>

        <InlineReviewCard />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="review" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Detailed Review
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Performance Insights
            </TabsTrigger>
          </TabsList>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-6">
            <ReviewControls
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              setFilterType={setFilterType}
              showAllQuestions={showAllQuestions}
              setShowAllQuestions={setShowAllQuestions}
            />

            <motion.div
              className="rounded-2xl shadow-lg border border-border/50 bg-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <CardHeader className="p-6 bg-muted/30 border-b border-border/50 rounded-t-2xl">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <Target className="w-6 h-6 text-primary" />
                  Answer Review ({filteredQuestions.length} Questions)
                </CardTitle>
                <p className="text-muted-foreground">Review your answers and learn from mistakes</p>
              </CardHeader>

              <CardContent className="p-6">
                {showAllQuestions ? (
                  <div className="space-y-4">
                    {filteredQuestions.map((question, index) => (
                      <QuestionCard key={question.questionId} question={question} index={index} />
                    ))}
                  </div>
                ) : (
                  renderSingleQuestionView()
                )}
              </CardContent>
            </motion.div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {renderInsightsTab(performance, stats)}
          </TabsContent>
        </Tabs>
      </motion.div>

      {showConfetti && <Confetti isActive />}
    </>
  )
}
