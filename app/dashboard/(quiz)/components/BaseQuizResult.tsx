"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Target,
  Award,
  Eye,
  EyeOff,
  Sparkles,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
  Share2,
  RotateCcw,
  Home,
  Medal,
  Crown,
  Search,
  Grid,
  List,
  Save,
  Lock,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Confetti } from "@/components/ui/confetti"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { QuestionCard } from "./QuestionCard"
import { QuestionNavigation } from "./QuestionNavigation"
import type { BaseQuizResultProps, ProcessedAnswer } from "./quiz-result-types"
import { getPerformanceLevel } from "@/lib/utils/text-similarity"
import { useAuth } from "@/modules/auth"
import { toast } from "@/components/ui/use-toast"

// Performance level configurations with enhanced styling
const PERFORMANCE_LEVELS = {
  excellent: {
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    bgGradient:
      "from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-teal-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: Crown,
    emoji: "👑",
    title: "Outstanding!",
    message: "You've mastered this topic with exceptional performance!",
  },
  good: {
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    bgGradient:
      "from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20",
    border: "border-blue-200 dark:border-blue-800",
    icon: Trophy,
    emoji: "🏆",
    title: "Great Job!",
    message: "Solid performance! You're on the right track.",
  },
  average: {
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
    bgGradient:
      "from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20",
    border: "border-amber-200 dark:border-amber-800",
    icon: Medal,
    emoji: "🥉",
    title: "Good Effort!",
    message: "You're making progress. Keep practicing to improve!",
  },
  poor: {
    gradient: "from-rose-500 via-red-500 to-pink-500",
    bgGradient: "from-rose-50 via-red-50 to-pink-50 dark:from-rose-950/20 dark:via-red-950/20 dark:to-pink-950/20",
    border: "border-rose-200 dark:border-rose-800",
    icon: Target,
    emoji: "🎯",
    title: "Keep Learning!",
    message: "Every expert was once a beginner. You've got this!",
  },
}

/**
 * World-class BaseQuizResult component with modern design and dark mode support
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
  const { user, subscription, isAuthenticated } = useAuth()
  // Properly check for active subscription status
  const hasActiveSubscription = subscription?.status !== null;
  const [showConfetti, setShowConfetti] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showAllQuestions, setShowAllQuestions] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [showInlineReview, setShowInlineReview] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [isSaving, setIsSaving] = useState(false)
  const hasShownConfettiRef = useRef(false)
  
  // Use the same variable for consistency
  const isSubscribed = hasActiveSubscription;

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

  // Get performance level configuration
  const performanceConfig = useMemo(() => {
    if (percentage >= 90) return PERFORMANCE_LEVELS.excellent
    if (percentage >= 75) return PERFORMANCE_LEVELS.good
    if (percentage >= 60) return PERFORMANCE_LEVELS.average
    return PERFORMANCE_LEVELS.poor
  }, [percentage])

  // Filter questions based on current filter and search
  const filteredQuestions = useMemo(() => {
    let filtered = processedAnswers

    if (filterType === "correct") {
      filtered = filtered.filter((q) => q.isCorrect)
    } else if (filterType === "incorrect") {
      filtered = filtered.filter((q) => !q.isCorrect)
    }

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

  // Enhanced statistics
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
      timePerQuestion: avgTime,
      completionRate: Math.round((correct / Math.max(total, 1)) * 100),
    }
  }, [result?.score, result?.maxScore, result?.percentage, processedAnswers])

  // Effects
  useEffect(() => {
    if (result && !hasShownConfettiRef.current && percentage >= 70) {
      hasShownConfettiRef.current = true
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 4000)
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
  
  // Function to save quiz results to database (premium feature)
  const handleSaveResult = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your quiz results.",
        variant: "destructive",
      })
      return
    }
    
    if (!isSubscribed) {
      toast({
        title: "Premium Feature",
        description: "Saving quiz results requires an active subscription.",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsSaving(true)
      
      // Get the quiz type from the URL
      const path = window.location.pathname
      const quizType = 
        path.includes("/code/") ? "code" : 
        path.includes("/mcq/") ? "mcq" : 
        path.includes("/openended/") ? "openended" : 
        path.includes("/blanks/") ? "blanks" : "mcq"
      
      // Get quiz slug from result or URL
      const quizSlug = result.slug || path.split('/').pop()
      
      if (!quizSlug) {
        throw new Error("Could not determine quiz identifier")
      }
      
      // Make sure processedAnswers is an array and prepare it for API submission
      const answersToSubmit = Array.isArray(processedAnswers) && processedAnswers.length > 0 
        ? processedAnswers 
        : [{
            questionId: "1",
            timeSpent: stats.totalTime || 0,
            isCorrect: percentage > 50,
            answer: "Auto-generated answer"
          }];
      
      // Call the API to save the quiz result using the existing submit endpoint
      const response = await fetch(`/api/quizzes/${quizType}/${quizSlug}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Always use the slug as the quiz identifier
          quizId: quizSlug,
          score: percentage,
          answers: answersToSubmit,
          totalTime: stats.totalTime || 0,
          type: quizType,
          completedAt: result.completedAt || new Date().toISOString(),
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error Response:", errorData);
        throw new Error(errorData.error || "Failed to save result")
      }
      
      // If we get here, the request was successful
      const responseData = await response.json();
      console.log("Quiz saved successfully:", responseData);
      
      toast({
        title: "Results Saved!",
        description: "Your quiz results have been saved to your profile.",
      })
    } catch (error) {
      console.error("Error saving quiz result:", error)
      
      // Get more specific error message if possible
      let errorMessage = "Could not save quiz results. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${title} - Results`,
        text: `I scored ${percentage}% (${performance}) on the ${title} quiz! ${performanceConfig.emoji}`,
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

  // Enhanced Performance Overview Component
  const PerformanceOverview = () => {
    const PerformanceIcon = performanceConfig.icon

    return (
      <div className="space-y-6">
        {/* Hero Performance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "relative overflow-hidden rounded-2xl p-8 text-center",
            performanceConfig.bgGradient,
            performanceConfig.border,
            "border-2 shadow-xl",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5" />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative z-10"
          >
            <div className="flex justify-center mb-4">
              <div className={cn("p-4 rounded-full bg-gradient-to-r shadow-lg", performanceConfig.gradient)}>
                <PerformanceIcon className="h-8 w-8 text-white" />
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 className="text-3xl font-bold mb-2">{performanceConfig.title}</h2>
              <p className="text-lg text-muted-foreground mb-6">{performanceConfig.message}</p>

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {percentage}%
                  </div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground">
                    {stats.correct}/{stats.total}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
              </div>

              <Progress value={percentage} className="h-3 mb-4" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: CheckCircle2,
              label: "Correct Answers",
              value: stats.correct,
              color: "text-green-600 dark:text-green-400",
              bg: "bg-green-50 dark:bg-green-950/20",
            },
            {
              icon: XCircle,
              label: "Incorrect Answers",
              value: stats.incorrect,
              color: "text-red-600 dark:text-red-400",
              bg: "bg-red-50 dark:bg-red-950/20",
            },
            {
              icon: Clock,
              label: "Avg. Time",
              value: `${Math.round(stats.avgTime)}s`,
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-50 dark:bg-blue-950/20",
            },
            {
              icon: TrendingUp,
              label: "Accuracy",
              value: `${stats.accuracy}%`,
              color: "text-purple-600 dark:text-purple-400",
              bg: "bg-purple-50 dark:bg-purple-950/20",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", stat.bg)}>
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleRetry} size="lg" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </Button>
          {user ? (
            hasActiveSubscription ? (
              <Button 
                onClick={handleSaveResult} 
                disabled={isSaving} 
                variant="outline" 
                size="lg" 
                className="flex items-center gap-2 bg-transparent"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Result
              </Button>
            ) : (
              <Button 
                onClick={() => toast({
                  title: "Premium Feature",
                  description: "You need an active subscription to save quiz results.",
                  variant: "destructive"
                })} 
                variant="outline" 
                size="lg" 
                className="flex items-center gap-2 bg-transparent"
              >
                <Lock className="h-4 w-4" />
                Save Result (Premium)
              </Button>
            )
          ) : null}
          <Button onClick={handleShare} variant="outline" size="lg" className="flex items-center gap-2 bg-transparent">
            <Share2 className="h-4 w-4" />
            Share Results
          </Button>
          <Button onClick={handleGoHome} variant="outline" size="lg" className="flex items-center gap-2 bg-transparent">
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Enhanced Quick Review Component
  const QuickReviewCard = () => {
    if (!showInlineReview || filteredQuestions.length === 0) return null

    const incorrectQuestions = filteredQuestions.filter((q) => !q.isCorrect)

    if (incorrectQuestions.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 mb-6"
        >
          <div className="text-center">
            <motion.div
              className="text-4xl mb-3"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              🎉
            </motion.div>
            <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">Perfect Score!</h3>
            <p className="text-green-600 dark:text-green-400">
              You got all questions correct. Outstanding performance! 🌟
            </p>
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Quick Review
            </h3>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {incorrectQuestions.length} question{incorrectQuestions.length !== 1 ? "s" : ""} to master
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600"
          >
            {incorrectQuestions.length} to review
          </Badge>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {incorrectQuestions.slice(0, 3).map((question, index) => (
            <motion.div
              key={question.questionId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-700 hover:shadow-md transition-shadow"
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                {question.question}
              </div>
              <div className="space-y-1">
                <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Your answer: {question.userAnswer}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Correct: {question.correctAnswer}
                </div>
              </div>
            </motion.div>
          ))}
          {incorrectQuestions.length > 3 && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("review")}
                className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                View all {incorrectQuestions.length} questions →
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // Enhanced Review Controls
  const EnhancedReviewControls = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={showInlineReview ? "default" : "outline"}
            onClick={() => setShowInlineReview(!showInlineReview)}
            size="sm"
            className="flex items-center gap-2"
          >
            {showInlineReview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showInlineReview ? "Hide" : "Show"} Quick Review
          </Button>
          {stats.incorrect > 0 && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              {stats.incorrect} to review
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter questions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Questions</SelectItem>
            <SelectItem value="correct">Correct Only</SelectItem>
            <SelectItem value="incorrect">Incorrect Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  // Single question view
  const renderSingleQuestionView = () => {
    if (filteredQuestions.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">No questions found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
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
        <QuestionCard question={currentQuestion} index={currentQuestionIndex} />
      </div>
    )
  }

  return (
    <>
      <motion.div
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-muted-foreground">
              Quiz completed on {formatDate(result?.completedAt || new Date().toISOString())}
            </p>
          </motion.div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-muted/50">
              <TabsTrigger value="overview" className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4" />
                Review
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4" />
                Insights
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <PerformanceOverview />
            </TabsContent>

            {/* Review Tab */}
            <TabsContent value="review" className="space-y-6">
              <EnhancedReviewControls />
              <QuickReviewCard />

              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
                  <CardTitle className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-primary" />
                    Answer Review
                    <Badge variant="secondary" className="ml-2">
                      {filteredQuestions.length} Questions
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {showAllQuestions ? (
                    <div className={cn(viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-6")}>
                      <AnimatePresence>
                        {filteredQuestions.map((question, index) => (
                          <motion.div
                            key={question.questionId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <QuestionCard question={question} index={index} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    renderSingleQuestionView()
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              {renderInsightsTab(performance, stats)}
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>

      {showConfetti && <Confetti isActive />}
    </>
  )
}
