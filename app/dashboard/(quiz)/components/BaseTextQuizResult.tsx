"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Share2,
  RefreshCw,
  Home,
  TrendingUp,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BookOpen,
  BarChart3,
} from "lucide-react"

import { Confetti } from "@/components/ui/confetti"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NoResults } from "@/components/ui/no-results"
import { BestGuess } from "@/components/ui/best-guess"

import { useDispatch } from "react-redux"
import { useAuth } from "@/modules/auth"
import CertificateGenerator from "@/app/dashboard/course/[slug]/components/CertificateGenerator"

import { toast } from "@/components/ui/use-toast"

import {
  getPerformanceLevel,
  getSimilarityLabel,
  calculateAnswerSimilarity,
  getSimilarityFeedback,
} from "@/lib/utils/text-similarity"
import { cn } from "@/lib/utils"
import { resetQuiz } from "@/store/slices/quiz"

interface QuestionResult {
  questionId: string | number
  id?: string | number
  userAnswer?: string
  correctAnswer?: string
  isCorrect?: boolean
  similarity?: number
  question?: string
  text?: string
  answer?: string
  keywords?: string[]
  similarityLabel?: string
}

interface QuizResultBase {
  title?: string
  maxScore?: number
  userScore?: number
  score?: number
  percentage?: number
  completedAt?: string
  totalTime?: number
  slug?: string
  quizId?: string
  questionResults?: QuestionResult[]
  questions?: Array<any>
  answers?: Array<any>
}

interface QuizResultsProps {
  result?: QuizResultBase
  onRetake?: () => void
  slug: string
  quizType: "open-ended" | "blanks"
}

interface PerformanceInfo {
  level: string
  emoji: string
  color: string
  bgColor: string
  borderColor: string
  message: string
}

export function BaseQuizResults({ result, onRetake, slug, quizType }: QuizResultsProps) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const hasShownConfettiRef = useRef(false)
  const dispatch = useDispatch()

  // Enhanced results calculation
  const enhancedResults = useMemo(() => {
    if (!result?.questionResults) return []

    return result.questionResults.map((q) => {
      const questionId = String(q.questionId || q.id || "")
      const actualAnswer = result.answers?.find((a: any) => String(a.questionId || a.id || "") === questionId)
      const questionData = result.questions?.find(
        (quest: any) => String(quest.id || quest.questionId || "") === questionId,
      )

      const questionText =
        q.question || q.text || questionData?.question || questionData?.text || `Question ${questionId}`
      const userAnswer =
        actualAnswer?.userAnswer || actualAnswer?.text || actualAnswer?.answer || q.userAnswer || q.answer || ""
      const correctAnswer = q.correctAnswer || questionData?.correctAnswer || questionData?.answer || ""

      const simResult =
        typeof q.similarity === "number"
          ? q.similarity
          : calculateAnswerSimilarity(userAnswer, correctAnswer).similarity

      const sim = typeof simResult === "number" && !isNaN(simResult) ? simResult : 0
      const similarityLabel = q.similarityLabel || getSimilarityLabel(sim)
      const isCorrect =
        typeof actualAnswer?.isCorrect === "boolean"
          ? actualAnswer.isCorrect
          : typeof q.isCorrect === "boolean"
            ? q.isCorrect
            : sim >= 0.7

      return {
        ...q,
        questionId,
        question: questionText,
        userAnswer,
        correctAnswer,
        similarity: sim,
        similarityLabel,
        isCorrect,
        _originalData: {
          questionResult: q,
          answerData: actualAnswer,
          questionData: questionData,
        },
      }
    })
  }, [result])

  // Score calculation
  const { correctCount, totalQuestions, percentage } = useMemo(() => {
    const correct = enhancedResults.filter((q) => q.isCorrect).length
    const total = enhancedResults.length || 1
    let finalPercentage = result?.percentage

    if (finalPercentage === undefined || finalPercentage === null) {
      if (result?.score !== undefined && result?.maxScore && result.maxScore > 0) {
        finalPercentage = Math.round((result.score / result.maxScore) * 100)
      } else {
        finalPercentage = Math.round((correct / total) * 100)
      }
    }

    return {
      correctCount: correct,
      totalQuestions: total,
      percentage: Math.max(0, Math.min(finalPercentage, 100)),
    }
  }, [enhancedResults, result])

  // getPerformanceLevel returns a simple level string; map it to a richer object used by the UI
  const perfLevel = useMemo(() => getPerformanceLevel(percentage), [percentage])

  const mapPerformance = (level: "excellent" | "good" | "average" | "poor"): PerformanceInfo => {
    switch (level) {
      case 'excellent':
        return { level: 'Excellent', emoji: '🏆', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', message: 'Excellent performance! You mastered this topic.' }
      case 'good':
        return { level: 'Good', emoji: '🎖️', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', message: 'Good work! You have a solid understanding.' }
      case 'average':
        return { level: 'Average', emoji: '✨', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', message: 'Average performance. Consider reviewing the material.' }
      default:
        return { level: 'Needs Improvement', emoji: '🔧', color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', message: 'Keep practicing! Review the concepts and try again.' }
    }
  }

  const performance: PerformanceInfo = useMemo(() => mapPerformance(perfLevel), [perfLevel])

  // Statistics
  const stats = useMemo(() => {
    const avgSimilarity = enhancedResults.reduce((sum, q) => sum + (q.similarity || 0), 0) / enhancedResults.length
    const perfectMatches = enhancedResults.filter((q) => (q.similarity || 0) >= 0.95).length
    const closeMatches = enhancedResults.filter((q) => (q.similarity || 0) >= 0.7 && (q.similarity || 0) < 0.95).length
    const partialMatches = enhancedResults.filter((q) => (q.similarity || 0) >= 0.4 && (q.similarity || 0) < 0.7).length

    return {
      avgSimilarity,
      perfectMatches,
      closeMatches,
      partialMatches,
      totalQuestions: enhancedResults.length,
    }
  }, [enhancedResults])

  // Confetti effect
  useEffect(() => {
    if (result?.completedAt && !hasShownConfettiRef.current && percentage >= 70) {
      hasShownConfettiRef.current = true
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [result, percentage])

  // Handlers
  const handleRetake = useCallback(() => {
    if (onRetake) return onRetake()
    dispatch(resetQuiz())
    router.push(`/dashboard/${quizType}/${result?.slug || slug}`)
  }, [onRetake, dispatch, router, result?.slug, slug, quizType])

  const handleViewAllQuizzes = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  // Auth & save state for action bar
  const { user, subscription, isAuthenticated } = useAuth()
  const hasActiveSubscription = subscription?.status !== null
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveResult = async () => {
    if (!isAuthenticated) {
      toast({ title: "Sign In Required", description: "Please sign in to save your results.", variant: "destructive" })
      return
    }

    if (!hasActiveSubscription) {
      toast({ title: "Upgrade Required", description: "Save results is available for Premium users.", variant: "destructive" })
      return
    }

    try {
      setIsSaving(true)

      const path = window.location.pathname
      let qType = "openended"
      if (path.includes("/blanks/")) qType = "blanks"

      const quizSlug = result?.slug || path.split('/').pop()

      const answersToSubmit = Array.isArray(enhancedResults) && enhancedResults.length > 0 ? enhancedResults : []

      const resp = await fetch(`/api/quizzes/${qType}/${quizSlug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quizSlug, score: percentage, answers: answersToSubmit, totalTime: result?.totalTime || 0, type: qType, completedAt: result?.completedAt || new Date().toISOString() })
      })

      if (!resp.ok) {
        const errorData = await resp.json()
        throw new Error(errorData?.error || "Failed to save result")
      }

      toast({ title: "Results Saved", description: "Your quiz results have been saved." })
    } catch (err) {
      console.error(err)
      toast({ title: "Save Failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = useCallback(async () => {
    try {
      const shareData = {
        title: `${result?.title || "Quiz"} - Results`,
        text: `I scored ${percentage}% (${performance.level}) on the ${result?.title || "Quiz"} ${quizType} quiz! ${performance.emoji}`,
        url: window.location.href,
      }

      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
      }
    } catch (error) {
      console.error("Sharing failed:", error)
    }
  }, [result, percentage, performance, quizType])

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  // Error states
  if (!result) {
    return (
      <NoResults
        variant="quiz"
        title="Unable to Load Results"
        description="We couldn't load your quiz results. The session may have expired or some data might be missing."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake,
          icon: <RefreshCw className="h-4 w-4" />,
        }}
        secondaryAction={{
          label: "Browse Quizzes",
          onClick: handleViewAllQuizzes,
          variant: "outline",
          icon: <Home className="h-4 w-4" />,
        }}
      />
    )
  }

  if (!Array.isArray(result.questionResults)) {
    return (
      <NoResults
        variant="quiz"
        title="Invalid Results"
        description="No valid question results found."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake,
          icon: <RefreshCw className="h-4 w-4" />,
        }}
      />
    )
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Header */}
          <QuizHeader
            title={result.title || `${quizType === "open-ended" ? "Open-Ended" : "Fill in the Blanks"} Quiz Results`}
            completedAt={result.completedAt}
            performance={performance}
            quizType={quizType}
          />

            {/* Score Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ScoreOverview
                  percentage={percentage}
                  correctCount={correctCount}
                  totalQuestions={totalQuestions}
                  performance={performance}
                  stats={stats}
                />
              </div>
             
            </div>

            {/* Question Review */}
            <QuestionReview
              results={enhancedResults}
              quizType={quizType}
              expandedQuestions={expandedQuestions}
              onToggleExpansion={toggleQuestionExpansion}
            />
          </motion.div>
        </div>

        {showConfetti && <Confetti isActive={showConfetti} />}
      </TooltipProvider>
  )
}

// Enhanced Header Component
function QuizHeader({
  title,
  completedAt,
  performance,
  quizType,
}: {
  title: string
  completedAt?: string
  performance: PerformanceInfo
  quizType: "open-ended" | "blanks"
}) {
  const getPerformanceGradient = (qt?: string) => {
    // Special pink gradient for blanks quizzes to match screenshot
    if (qt === 'blanks') return 'from-pink-50 via-pink-100 to-pink-50'
    switch (performance.level) {
      case "Excellent":
        return "from-emerald-500/20 via-green-500/20 to-teal-500/20"
      case "Good":
        return "from-blue-500/20 via-indigo-500/20 to-purple-500/20"
      case "Average":
        return "from-amber-500/20 via-orange-500/20 to-yellow-500/20"
      default:
        return "from-rose-500/20 via-red-500/20 to-pink-500/20"
    }
  }

  const getPerformanceBorder = (qt?: string) => {
    if (qt === 'blanks') return 'border-pink-200 dark:border-pink-800'
    switch (performance.level) {
      case "Excellent":
        return "border-emerald-200 dark:border-emerald-800"
      case "Good":
        return "border-blue-200 dark:border-blue-800"
      case "Average":
        return "border-amber-200 dark:border-amber-800"
      default:
        return "border-rose-200 dark:border-rose-800"
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <Card className={cn("relative overflow-hidden border-2 shadow-xl rounded-2xl", getPerformanceBorder())}>
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", getPerformanceGradient(quizType))} />

        <CardHeader className="relative z-10 text-center py-8">
          <div className="flex items-center justify-center mb-6">
            <motion.div
              className="p-4 rounded-2xl bg-background/80 backdrop-blur-sm shadow-lg border"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Trophy className="w-8 h-8 text-primary" />
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <CardTitle className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {title}
            </CardTitle>

            <div className="flex items-center justify-center gap-3 mb-4">
              <Badge
                variant="secondary"
                className={cn(
                  "text-sm px-3 py-1 font-semibold",
                  quizType === 'blanks' ? 'bg-violet-600 text-white border-transparent' : ''
                )}
              >
                {quizType === "open-ended" ? "Open-Ended" : "Fill in the Blanks"}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-sm px-3 py-1 font-semibold",
                  performance.color,
                  performance.bgColor,
                  performance.borderColor,
                )}
              >
                <motion.span
                  className="mr-2"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                >
                  {performance.emoji}
                </motion.span>
                {performance.level}
              </Badge>
            </div>

            {completedAt && (
              <p className="text-muted-foreground">
                Completed on {new Date(completedAt).toLocaleDateString()} at{" "}
                {new Date(completedAt).toLocaleTimeString()}
              </p>
            )}
          </motion.div>
        </CardHeader>
      </Card>
    </motion.div>
  )
}

// Enhanced Score Overview
function ScoreOverview({
  percentage,
  correctCount,
  totalQuestions,
  performance,
  stats,
}: {
  percentage: number
  correctCount: number
  totalQuestions: number
  performance: PerformanceInfo
  stats: any
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
          <Card className="shadow-xl border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Performance Overview</CardTitle>
                <p className="text-muted-foreground">Your quiz performance breakdown</p>
              </div>
            </div>

            <motion.div
              className="text-right"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <div className="text-4xl font-bold text-primary">{percentage}%</div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </motion.div>
          </div>
        </CardHeader>

          <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">
                {correctCount}/{totalQuestions} correct
              </span>
            </div>
            <div className="relative">
              <Progress value={percentage} className="h-3" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                  repeatDelay: 1,
                }}
                style={{ opacity: percentage > 0 ? 1 : 0 }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={CheckCircle2} label="Correct" value={correctCount} color="green" delay={0.2} />
            <StatCard icon={XCircle} label="Incorrect" value={totalQuestions - correctCount} color="red" delay={0.3} />
          </div>

          {/* Performance Message */}
          <motion.div
            className={cn("p-4 rounded-xl border-2", performance.bgColor, performance.borderColor)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <motion.span
                className="text-2xl"
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2 }}
              >
                {performance.emoji}
              </motion.span>
              <p className={cn("font-semibold", performance.color)}>{performance.message}</p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Similarity Insights Component
function SimilarityInsights({ stats }: { stats: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Text Similarity Analysis</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Similarity</span>
              <Badge variant="outline" className="font-mono">
                {Math.round(stats.avgSimilarity * 100)}%
              </Badge>
            </div>

            <Progress value={stats.avgSimilarity * 100} className="h-2" />
          </div>

          <Separator />

          <div className="space-y-2">
            <SimilarityBreakdown
              label="Perfect Matches"
              count={stats.perfectMatches}
              total={stats.totalQuestions}
              color="emerald"
              icon="🎯"
            />
            <SimilarityBreakdown
              label="Close Matches"
              count={stats.closeMatches}
              total={stats.totalQuestions}
              color="blue"
              icon="✅"
            />
            <SimilarityBreakdown
              label="Partial Matches"
              count={stats.partialMatches}
              total={stats.totalQuestions}
              color="amber"
              icon="⚡"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function SimilarityBreakdown({
  label,
  count,
  total,
  color,
  icon,
}: {
  label: string
  count: number
  total: number
  color: string
  icon: string
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">{count}</span>
        <Badge variant="secondary" className="text-xs">
          {Math.round(percentage)}%
        </Badge>
      </div>
    </div>
  )
}


// Enhanced Question Review
function QuestionReview({
  results,
  quizType,
  expandedQuestions,
  onToggleExpansion,
}: {
  results: QuestionResult[]
  quizType: "open-ended" | "blanks"
  expandedQuestions: Set<string>
  onToggleExpansion: (id: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <Card className="shadow-xl border-2">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Answer Review</CardTitle>
                <p className="text-muted-foreground">Detailed analysis of your {results.length} answers</p>
              </div>
            </div>

            <Badge variant="secondary" className="text-sm">
              {results.filter((r) => r.isCorrect).length}/{results.length} Correct
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y">
            <AnimatePresence>
              {results.map((question, index) => (
                <QuestionItem
                  key={question.questionId}
                  question={question}
                  index={index}
                  quizType={quizType}
                  isExpanded={expandedQuestions.has(String(question.questionId))}
                  onToggleExpansion={() => onToggleExpansion(String(question.questionId))}
                />
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Enhanced Question Item
function QuestionItem({
  question,
  index,
  quizType,
  isExpanded,
  onToggleExpansion,
}: {
  question: QuestionResult
  index: number
  quizType: "open-ended" | "blanks"
  isExpanded: boolean
  onToggleExpansion: () => void
}) {
  const similarityPercentage = Math.round((question.similarity || 0) * 100)

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return "text-emerald-600 dark:text-emerald-400"
    if (similarity >= 0.7) return "text-blue-600 dark:text-blue-400"
    if (similarity >= 0.5) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  const getSimilarityBg = (similarity: number) => {
    if (similarity >= 0.9) return "bg-emerald-50 dark:bg-emerald-950/20"
    if (similarity >= 0.7) return "bg-blue-50 dark:bg-blue-950/20"
    if (similarity >= 0.5) return "bg-amber-50 dark:bg-amber-950/20"
    return "bg-red-50 dark:bg-red-950/20"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="p-6 hover:bg-muted/30 transition-colors"
    >
      <div className="space-y-4">
        {/* Question Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                question.isCorrect
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300",
              )}
            >
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-2 leading-relaxed">{question.question}</h3>

              {/* Quick Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {question.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <Badge variant={question.isCorrect ? "default" : "destructive"} className="text-xs">
                    {question.isCorrect ? "Correct" : "Incorrect"}
                  </Badge>

                  <div className="ml-2">
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                      {similarityPercentage}% match
                    </span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Your answer:</span> {question.userAnswer || "No answer provided"}
                </div>
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onToggleExpansion} className="shrink-0">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Expanded Content */}
        <Collapsible open={isExpanded}>
          <CollapsibleContent className="space-y-4">
            <Separator />

            {/* Detailed Analysis */}
            <div className="space-y-4">
              <BestGuess
                userAnswer={question.userAnswer || ""}
                correctAnswer={question.correctAnswer || ""}
                similarity={question.similarity || 0}
                explanation={getSimilarityFeedback(question.similarity || 0)}
                showDetailedInfo={true}
              />

              {/* Similarity Visualization */}
              <div className={cn("p-4 rounded-lg border", getSimilarityBg(question.similarity || 0))}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium text-sm">Similarity Analysis</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {similarityPercentage}%
                  </Badge>
                </div>

                <Progress value={similarityPercentage} className="h-2 mb-2 bg-purple-50">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded" style={{ width: `${similarityPercentage}%` }} />
                </Progress>

                <p className={cn("text-xs", getSimilarityColor(question.similarity || 0))}>
                  {getSimilarityFeedback(question.similarity || 0)}
                </p>
              </div>

              {/* Learning Tip */}
              {!question.isCorrect && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Learning Tip:</strong> Review the correct answer and try to understand the key concepts.
                    Focus on the main ideas and terminology used.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </motion.div>
  )
}

// Utility Components
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: any
  label: string
  value: number
  color: "green" | "red"
  delay: number
}) {
  const colorClasses = {
    green: {
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-600 dark:text-emerald-400",
      icon: "text-emerald-500",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-600 dark:text-red-400",
      icon: "text-red-500",
    },
  }

  return (
    <motion.div
      className={cn("p-4 rounded-xl border-2 text-center", colorClasses[color].bg, colorClasses[color].border)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.05, y: -2 }}
    >
      <div className="flex items-center justify-center mb-2">
        <Icon className={cn("w-5 h-5", colorClasses[color].icon)} />
      </div>
      <div className={cn("text-2xl font-bold", colorClasses[color].text)}>{value}</div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
    </motion.div>
  )
}
