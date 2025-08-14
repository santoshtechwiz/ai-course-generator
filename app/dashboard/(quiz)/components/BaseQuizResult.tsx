"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Target, Award, Eye, EyeOff, Sparkles, Trophy, Clock, CheckCircle2, XCircle, TrendingUp, BarChart3, Share2, RotateCcw, Home, Medal, Crown, Search, Grid, List, Save, Lock, Loader2, Zap, Star, Brain, Flame } from 'lucide-react'
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
import CertificateGenerator from "@/app/dashboard/course/[slug]/components/CertificateGenerator"
import { PDFDownloadLink } from "@react-pdf/renderer"

// Enhanced performance level configurations with modern styling
const PERFORMANCE_LEVELS = {
  excellent: {
    gradient: "from-emerald-400 via-green-400 to-teal-400",
    bgGradient: "from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30",
    border: "border-emerald-300 dark:border-emerald-700",
    icon: Crown,
    emoji: "🏆",
    title: "Outstanding Performance!",
    message: "You've mastered this topic with exceptional skill!",
    celebration: "🎉✨🌟",
  },
  good: {
    gradient: "from-blue-400 via-indigo-400 to-purple-400",
    bgGradient: "from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30",
    border: "border-blue-300 dark:border-blue-700",
    icon: Trophy,
    emoji: "🎯",
    title: "Great Achievement!",
    message: "Excellent work! You're on the right track.",
    celebration: "🎊🎈",
  },
  average: {
    gradient: "from-amber-400 via-orange-400 to-yellow-400",
    bgGradient: "from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30",
    border: "border-amber-300 dark:border-amber-700",
    icon: Medal,
    emoji: "⚡",
    title: "Good Progress!",
    message: "You're improving! Keep up the momentum.",
    celebration: "💪📚",
  },
  poor: {
    gradient: "from-rose-400 via-red-400 to-pink-400",
    bgGradient: "from-rose-50 via-red-50 to-pink-50 dark:from-rose-950/30 dark:via-red-950/30 dark:to-pink-950/30",
    border: "border-rose-300 dark:border-rose-700",
    icon: Target,
    emoji: "🎯",
    title: "Keep Learning!",
    message: "Every expert was once a beginner. You've got this!",
    celebration: "🌱💡",
  },
}

/**
 * Enhanced BaseQuizResult component with world-class UX and responsive design
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
  const hasActiveSubscription = subscription?.status !== null
  const [showConfetti, setShowConfetti] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showAllQuestions, setShowAllQuestions] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [showInlineReview, setShowInlineReview] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [isSaving, setIsSaving] = useState(false)
  const [celebrationPhase, setCelebrationPhase] = useState(0)
  const hasShownConfettiRef = useRef(false)
  
  const isSubscribed = hasActiveSubscription

  // Enhanced date formatting
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(date)
  }

  // Process and validate data with enhanced error handling
  const processedAnswers = useMemo(() => {
    try {
      return processAnswers(result)
    } catch (error) {
      console.error("Error processing answers:", error)
      return []
    }
  }, [processAnswers, result])

  const title = result?.title || "Quiz Results"
  const score = typeof result?.score === "number" ? result.score : 0
  const maxScore = typeof result?.maxScore === "number" ? result.maxScore : processedAnswers.length
  const percentage = typeof result?.percentage === "number" ? result.percentage : Math.round((score / Math.max(maxScore, 1)) * 100)

  const performance = useMemo(() => getPerformanceLevel(percentage), [percentage])

  // Get enhanced performance level configuration
  const performanceConfig = useMemo(() => {
    if (percentage >= 90) return PERFORMANCE_LEVELS.excellent
    if (percentage >= 75) return PERFORMANCE_LEVELS.good
    if (percentage >= 60) return PERFORMANCE_LEVELS.average
    return PERFORMANCE_LEVELS.poor
  }, [percentage])

  // Enhanced filter questions with better search
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

  // Enhanced statistics with more insights
  const stats = useMemo(() => {
    const correct = typeof result?.score === "number" ? result.score : processedAnswers.filter((q) => q.isCorrect).length
    const total = typeof result?.maxScore === "number" ? result.maxScore : processedAnswers.length
    const incorrect = total - correct
    const totalTime = processedAnswers.reduce((sum, q) => sum + (q.timeSpent || 0), 0)
    const avgTime = totalTime / Math.max(total, 1) || 0

    // Calculate streak and difficulty insights
    let longestStreak = 0
    let currentStreak = 0
    processedAnswers.forEach((q) => {
      if (q.isCorrect) {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })

    return {
      correct,
      incorrect,
      total,
      totalTime,
      avgTime,
      accuracy: typeof result?.percentage === "number" ? result.percentage : Math.round((correct / Math.max(total, 1)) * 100),
      timePerQuestion: avgTime,
      completionRate: Math.round((correct / Math.max(total, 1)) * 100),
      longestStreak,
      improvementAreas: processedAnswers.filter((q) => !q.isCorrect).length,
    }
  }, [result?.score, result?.maxScore, result?.percentage, processedAnswers])

  // Enhanced celebration effects
  useEffect(() => {
    if (result && !hasShownConfettiRef.current && percentage >= 70) {
      hasShownConfettiRef.current = true
      setShowConfetti(true)
      
      // Multi-phase celebration
      const celebrations = [
        () => setCelebrationPhase(1),
        () => setCelebrationPhase(2),
        () => setCelebrationPhase(0),
      ]
      
      celebrations.forEach((celebration, index) => {
        setTimeout(celebration, index * 1500)
      })
      
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [result, percentage])

  // Event handlers with enhanced UX
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
  
  // Enhanced save functionality with better feedback
  const handleSaveResult = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to save your amazing results!",
        variant: "destructive",
      })
      return
    }
    
    if (!isSubscribed) {
      toast({
        title: "Upgrade to Premium",
        description: "Save unlimited quiz results with our Premium plan!",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsSaving(true)
      
      const path = window.location.pathname
      let quizType = "mcq" // default
      
      if (path.includes("/code/")) {
        quizType = "code"
      } else if (path.includes("/mcq/")) {
        quizType = "mcq"
      } else if (path.includes("/openended/")) {
        quizType = "openended"
      } else if (path.includes("/blanks/")) {
        quizType = "blanks"
      }
      
      const quizSlug = result.slug || path.split('/').pop()
      
      if (!quizSlug) {
        throw new Error("Could not determine quiz identifier")
      }
      
      const answersToSubmit = Array.isArray(processedAnswers) && processedAnswers.length > 0 
        ? processedAnswers 
        : [{
            questionId: "1",
            timeSpent: stats.totalTime || 0,
            isCorrect: percentage > 50,
            answer: "Auto-generated answer"
          }]
      
      const response = await fetch(`/api/quizzes/${quizType}/${quizSlug}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
        throw new Error(errorData.error || "Failed to save result")
      }
      
      const responseData = await response.json()
      
      toast({
        title: "🎉 Results Saved Successfully!",
        description: "Your quiz results are now safely stored in your profile.",
      })
    } catch (error) {
      console.error("Error saving quiz result:", error)
      
      let errorMessage = "Could not save quiz results. Please try again."
      if (error instanceof Error) {
        errorMessage = error.message
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
        title: `${title} - Quiz Results`,
        text: `I just scored ${percentage}% on "${title}"! ${performanceConfig.emoji} ${performanceConfig.celebration}`,
        url: window.location.href,
      }
      
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        toast({
          title: "Link Copied!",
          description: "Share your amazing results with friends!",
        })
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

    const safeTitle = (title || "Quiz").trim()
    const certificateFile = `${safeTitle.replace(/[^a-z0-9]+/gi, "_")}_Certificate.pdf`

    return (
      <div className="space-y-8">
        {/* Hero Performance Card with enhanced animations */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn(
            "relative overflow-hidden rounded-3xl p-8 md:p-12 text-center",
            performanceConfig.bgGradient,
            performanceConfig.border,
            "border-2 shadow-2xl backdrop-blur-sm",
          )}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10" />
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="relative z-10">
            {/* Celebration animation */}
            <AnimatePresence>
              {celebrationPhase > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-4xl"
                >
                  {performanceConfig.celebration}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Performance icon with enhanced animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="flex justify-center mb-6"
            >
              <div className={cn(
                "p-6 rounded-full bg-gradient-to-r shadow-2xl",
                performanceConfig.gradient,
                "ring-4 ring-white/20"
              )}>
                <PerformanceIcon className="h-12 w-12 md:h-16 md:w-16 text-white" />
              </div>
            </motion.div>

            {/* Title and message with staggered animation */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                {performanceConfig.title}
              </h2>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                {performanceConfig.message}
              </p>

              {/* Score display with enhanced styling */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 150 }}
                  className="text-center"
                >
                  <div className="text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-2">
                    {percentage}%
                  </div>
                  <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">Your Score</div>
                </motion.div>
                
                <div className="hidden sm:block w-px h-20 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 150 }}
                  className="text-center"
                >
                                    <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                    {stats.correct}<span className="text-2xl md:text-3xl text-gray-500"> / {stats.total}</span>
                  </div>
                  <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">Questions Correct</div>
                </motion.div>
              </div>

              {/* Enhanced progress bar */}
              <div className="max-w-md mx-auto mb-8">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                  className="origin-left"
                >
                  <Progress value={percentage} className="h-4 rounded-full shadow-inner" />
                </motion.div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Stats Grid with better responsive design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            {
              icon: CheckCircle2,
              label: "Correct",
              value: stats.correct,
              color: "emerald",
              description: "Questions answered correctly",
            },
            {
              icon: XCircle,
              label: "Incorrect",
              value: stats.incorrect,
              color: "red",
              description: "Questions to review",
            },
                          {
                icon: Clock,
                label: "Avg. Time",
                value: `${(stats.avgTime ?? 0).toFixed(2)}s`,
                color: "blue",
                description: "Per question",
              },
            {
              icon: Flame,
              label: "Best Streak",
              value: stats.longestStreak,
              color: "orange",
              description: "Consecutive correct",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="group"
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <CardContent className="p-6 text-center">
                  <div className={cn(
                    "w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                    stat.color === "emerald" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                    stat.color === "red" && "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
                    stat.color === "blue" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                    stat.color === "orange" && "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                  )}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {stat.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.description}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Action Buttons with better mobile layout */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={handleRetry} 
            size="lg" 
            className="w-full sm:w-auto min-w-[200px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Retake Quiz
          </Button>
          <PDFDownloadLink
            document={<CertificateGenerator courseName={safeTitle} userName={user?.name || "Student"} />}
            fileName={certificateFile}
          >
            {({ loading }) => (
              <Button 
                size="lg"
                disabled={loading}
                className="w-full sm:w-auto min-w-[220px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Award className="h-5 w-5 mr-2" />
                {loading ? "Preparing..." : "Download Certificate"}
              </Button>
            )}
          </PDFDownloadLink>
          
          {user && (
            <Button 
              onClick={handleSaveResult} 
              disabled={isSaving} 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto min-w-[200px] h-12 text-base font-semibold bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : hasActiveSubscription ? (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Result
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Save (Premium)
                </>
              )}
            </Button>
          )}
          
          <Button 
            onClick={handleShare} 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto min-w-[200px] h-12 text-base font-semibold bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share Results
          </Button>
          
          <Button 
            onClick={handleGoHome} 
            variant="ghost" 
            size="lg" 
            className="w-full sm:w-auto min-w-[200px] h-12 text-base font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
          >
            <Home className="h-5 w-5 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Enhanced Quick Review Component with better mobile experience
  const QuickReviewCard = () => {
    if (!showInlineReview || filteredQuestions.length === 0) return null

    const incorrectQuestions = filteredQuestions.filter((q) => !q.isCorrect)

    if (incorrectQuestions.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 mb-6"
        >
          <div className="text-center">
            <motion.div
              className="text-6xl mb-4"
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: 2 }}
            >
              🎉
            </motion.div>
            <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">Perfect Score!</h3>
            <p className="text-green-600 dark:text-green-400 text-lg">
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
        className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6" />
              Quick Review
            </h3>
            <p className="text-amber-600 dark:text-amber-400">
              {incorrectQuestions.length} question{incorrectQuestions.length !== 1 ? "s" : ""} to master
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600 text-sm px-3 py-1"
          >
            {incorrectQuestions.length} to review
          </Badge>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {incorrectQuestions.slice(0, 3).map((question, index) => (
            <motion.div
              key={question.questionId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-amber-200 dark:border-amber-700 hover:shadow-md transition-all duration-300"
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 leading-relaxed">
                {question.question}
              </div>
              <div className="space-y-2">
                <div className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  <div>
                    <span className="font-medium">Your answer:</span>
                    <div className="mt-1 text-sm">{question.userAnswer}</div>
                  </div>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  <div>
                    <span className="font-medium">Correct answer:</span>
                    <div className="mt-1 text-sm">{question.correctAnswer}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {incorrectQuestions.length > 3 && (
            <div className="text-center pt-4">
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

  // Enhanced Review Controls with better mobile UX
  const EnhancedReviewControls = () => (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </Button>
          <Button 
            variant={viewMode === "grid" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setViewMode("grid")}
            className="flex items-center gap-1"
          >
            <Grid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
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
            className="pl-10 h-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48 h-10">
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
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Enhanced Header with better mobile layout */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Quiz completed on {formatDate(result?.completedAt || new Date().toISOString())}
            </p>
          </motion.div>

          {/* Enhanced Tabs with better mobile experience */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-muted/50 rounded-xl p-1">
              <TabsTrigger value="overview" className="flex items-center gap-2 text-sm font-medium rounded-lg">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2 text-sm font-medium rounded-lg">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Review</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 text-sm font-medium rounded-lg">
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Insights</span>
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

              <Card className="overflow-hidden shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Target className="w-6 h-6 text-primary" />
                    Answer Review
                    <Badge variant="secondary" className="ml-2">
                      {filteredQuestions.length} Questions
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {showAllQuestions ? (
                    <div className={cn(
                      "gap-6",
                      viewMode === "grid" 
                        ? "grid grid-cols-1 lg:grid-cols-2" 
                        : "space-y-6"
                    )}>
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
