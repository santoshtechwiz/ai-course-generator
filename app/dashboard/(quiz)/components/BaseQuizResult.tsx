"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Target, Award, Eye, EyeOff, Sparkles, Trophy, Clock, CheckCircle2, XCircle, TrendingUp, BarChart3, Share2, RotateCcw, Home, Medal, Crown, Search, Grid, List, Save, Lock, Loader2, Zap, Star, Brain, Flame, ChevronLeft, ChevronRight, HelpCircle, BookOpen } from 'lucide-react'
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
import SignInPrompt from "@/app/auth/signin/components/SignInPrompt"
import type { QuizType } from "@/app/types/quiz-types"

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
  const [viewMode, setViewMode] = useState<"grid" | "list" | "flashcard">("list")
  const [flashcardFlipped, setFlashcardFlipped] = useState(false)
  const [flashcardIndex, setFlashcardIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [celebrationPhase, setCelebrationPhase] = useState(0)
  const hasShownConfettiRef = useRef(false)
  
  const isSubscribed = hasActiveSubscription

  // Determine quiz type from current path
  const getQuizType = useCallback((): QuizType => {
    if (typeof window === 'undefined') return 'mcq'
    
    const path = window.location.pathname
    if (path.includes('/code/')) return 'code'
    if (path.includes('/mcq/')) return 'mcq'
    if (path.includes('/openended/')) return 'openended'
    if (path.includes('/blanks/')) return 'blanks'
    if (path.includes('/flashcard/')) return 'flashcard'
    return 'mcq'
  }, [])

  // Handle sign in for results
  const handleSignIn = useCallback(() => {
    const currentPath = window.location.pathname
    window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`
  }, [])

  // Handle retake quiz
  const handleRetake = useCallback(() => {
    if (onRetake) {
      onRetake()
    } else {
      const quizType = getQuizType()
      router.push(`/dashboard/${quizType}/${result.slug || ""}`)
    }
  }, [onRetake, router, result.slug, getQuizType])

  // Utility functions for performance levels and formatting
  const getCurrentLevel = () => {
    // Normalize a percentage value from result data or derive from processed answers
    const perc = typeof result?.percentage === "number"
      ? result.percentage
      : (typeof result?.score === "number" && typeof result?.maxScore === "number" && result.maxScore > 0
        ? Math.round((result.score / Math.max(result.maxScore, 1)) * 100)
        : (processedAnswers && processedAnswers.length > 0
          ? Math.round((processedAnswers.filter((q) => q.isCorrect).length / Math.max(processedAnswers.length, 1)) * 100)
          : 0
        )
      )

    if (perc >= 90) return { ...PERFORMANCE_LEVELS.excellent, icon: Crown }
    if (perc >= 75) return { ...PERFORMANCE_LEVELS.good, icon: Trophy }
    if (perc >= 60) return { ...PERFORMANCE_LEVELS.average, icon: Medal }
    return { ...PERFORMANCE_LEVELS.poor, icon: Target }
  }

  const formatScore = (score: number) => Math.round(score)
  
  const formatTime = (ms: number) => {
    if (!ms) return '0s'
    if (ms < 1000) return `${ms}ms`
    const seconds = Math.round(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  // Current level reference for consistent styling
  const CurrentLevel = getCurrentLevel()

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

  // Certificate variables
  const safeTitle = (title || "Quiz").trim()
  const certificateFile = `${safeTitle.replace(/[^a-z0-9]+/gi, "_")}_Certificate.pdf`

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
    // Determine total questions
    const total = typeof result?.maxScore === "number" ? result.maxScore : processedAnswers.length

    // Determine correct answers robustly. result.score may be either a raw correct count or a percentage.
    let correct: number
    if (typeof result?.score === "number" && typeof result?.maxScore === "number") {
      // If score is <= maxScore, treat it as raw count; otherwise interpret as percentage
      correct = result.score <= result.maxScore ? result.score : Math.round((percentage / 100) * total)
    } else if (typeof result?.score === "number" && total > 0) {
      // No explicit maxScore: if score looks like a count (<= total) use it, else treat as percentage
      correct = result.score <= total ? result.score : Math.round((percentage / 100) * total)
    } else if (typeof result?.percentage === "number") {
      correct = Math.round((result.percentage / 100) * total)
    } else {
      correct = processedAnswers.filter((q) => q.isCorrect).length
    }
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
      accuracy: percentage,
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

  // Keyboard navigation for flashcard mode
  useEffect(() => {
    if (viewMode !== "flashcard") return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in inputs
      const target = e.target as HTMLElement
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          setFlashcardIndex(Math.max(0, flashcardIndex - 1))
          setFlashcardFlipped(false)
          break
        case "ArrowRight":
          e.preventDefault()
          setFlashcardIndex(Math.min(filteredQuestions.length - 1, flashcardIndex + 1))
          setFlashcardFlipped(false)
          break
        case " ":
        case "Enter":
          e.preventDefault()
          setFlashcardFlipped(!flashcardFlipped)
          break
        case "Escape":
          setFlashcardFlipped(false)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [viewMode, flashcardIndex, flashcardFlipped, filteredQuestions.length])

  // Reset flashcard state when view mode changes
  useEffect(() => {
    if (viewMode !== "flashcard") {
      setFlashcardIndex(0)
      setFlashcardFlipped(false)
    }
  }, [viewMode])

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
        {/* Redesigned Hero Section - Full Width Celebration */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "relative overflow-hidden rounded-3xl p-8 md:p-12 lg:p-16 mb-8",
            "bg-gradient-to-br shadow-2xl border",
            performanceConfig.bgGradient,
            performanceConfig.border
          )}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                initial={{
                  x: Math.random() * 100 + "%",
                  y: "100%",
                  opacity: 0
                }}
                animate={{
                  y: "-10%",
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                style={{
                  left: `${Math.random() * 100}%`
                }}
              />
            ))}

            {/* Gradient orbs */}
            <motion.div
              className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute -bottom-20 -left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.4, 0.2, 0.4]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </div>

          <div className="relative z-10 text-center">
            {/* Celebration Animation */}
            <AnimatePresence>
              {celebrationPhase > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, y: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="mb-6"
                >
                  <div className="text-6xl md:text-7xl lg:text-8xl mb-4 animate-bounce">
                    {performanceConfig.celebration}
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto max-w-xs"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Performance Icon with Enhanced Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
              className="flex justify-center mb-8"
            >
              <div className={cn(
                "relative p-8 rounded-full bg-gradient-to-r shadow-2xl ring-4",
                performanceConfig.gradient,
                "ring-white/30 backdrop-blur-sm"
              )}>
                {/* Pulsing ring effect */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-white/50"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <PerformanceIcon className="relative h-16 w-16 md:h-20 md:w-20 text-white drop-shadow-lg" />
              </div>
            </motion.div>

            {/* Title with Dramatic Typography */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-6"
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent leading-tight">
                {performanceConfig.title}
              </h2>
              <p className="text-xl md:text-2xl text-white/90 font-medium max-w-3xl mx-auto leading-relaxed">
                {performanceConfig.message}
              </p>
            </motion.div>

            {/* Score Display - Redesigned */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
              className="mb-8"
            >
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
                {/* Main Score */}
                <div className="text-center">
                  <motion.div
                    className="relative mb-4"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-8xl md:text-9xl lg:text-[10rem] font-black bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent leading-none">
                      {percentage}
                    </div>
                    <div className="absolute -top-2 -right-2 text-4xl md:text-5xl text-yellow-300 animate-pulse">
                      %
                    </div>
                    {/* Score glow effect */}
                    <motion.div
                      className="absolute inset-0 text-8xl md:text-9xl lg:text-[10rem] font-black bg-gradient-to-r from-yellow-300/20 to-orange-300/20 bg-clip-text text-transparent blur-sm"
                      animate={{
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {percentage}%
                    </motion.div>
                  </motion.div>
                  <div className="text-lg md:text-xl text-white/80 font-semibold uppercase tracking-wider">
                    Your Score
                  </div>
                </div>

                {/* Divider */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="hidden lg:block w-px h-24 bg-gradient-to-b from-transparent via-white/50 to-transparent"
                />

                {/* Questions Correct */}
                <div className="text-center">
                  <motion.div
                    className="mb-4"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none">
                      {stats.correct}
                    </div>
                    <div className="text-2xl md:text-3xl lg:text-4xl text-white/70 font-semibold">
                      / {stats.total}
                    </div>
                  </motion.div>
                  <div className="text-lg md:text-xl text-white/80 font-semibold uppercase tracking-wider">
                    Correct
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Progress Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="max-w-lg mx-auto"
            >
              <div className="relative mb-6">
                <div className="h-6 bg-white/20 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                  <motion.div
                    className={cn(
                      "h-full bg-gradient-to-r rounded-full shadow-lg",
                      performanceConfig.gradient
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 1.1, duration: 2, ease: "easeOut" }}
                  >
                    {/* Animated shine effect */}
                    <motion.div
                      className="h-full w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                      animate={{
                        x: ["-100%", "400%"]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1.5
                      }}
                    />
                  </motion.div>
                </div>
                {/* Progress markers */}
                <div className="flex justify-between mt-3 px-2">
                  {[0, 25, 50, 75, 100].map((marker) => (
                    <div key={marker} className="flex flex-col items-center">
                      <div className={cn(
                        "w-1 h-1 rounded-full mb-1",
                        percentage >= marker ? "bg-white" : "bg-white/30"
                      )} />
                      <span className="text-xs text-white/70 font-medium">{marker}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Redesigned Stats Grid - Glassmorphism Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            {
              icon: CheckCircle2,
              label: "Correct",
              value: stats.correct,
              color: "emerald",
              description: "Questions answered correctly",
              bgGradient: "from-emerald-500/10 via-emerald-400/5 to-transparent",
              borderColor: "border-emerald-200/50 dark:border-emerald-800/50",
              glowColor: "shadow-emerald-500/20",
            },
            {
              icon: XCircle,
              label: "Incorrect",
              value: stats.incorrect,
              color: "red",
              description: "Questions to review",
              bgGradient: "from-red-500/10 via-red-400/5 to-transparent",
              borderColor: "border-red-200/50 dark:border-red-800/50",
              glowColor: "shadow-red-500/20",
            },
            {
              icon: Clock,
              label: "Avg. Time",
              value: `${(stats.avgTime ?? 0).toFixed(2)}s`,
              color: "blue",
              description: "Per question",
              bgGradient: "from-blue-500/10 via-blue-400/5 to-transparent",
              borderColor: "border-blue-200/50 dark:border-blue-800/50",
              glowColor: "shadow-blue-500/20",
            },
            {
              icon: Flame,
              label: "Best Streak",
              value: stats.longestStreak,
              color: "orange",
              description: "Consecutive correct",
              bgGradient: "from-orange-500/10 via-orange-400/5 to-transparent",
              borderColor: "border-orange-200/50 dark:border-orange-800/50",
              glowColor: "shadow-orange-500/20",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.2 + (0.1 * index),
                duration: 0.6,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{
                scale: 1.05,
                y: -8,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="group relative"
            >
              {/* Glassmorphism Card */}
              <Card className={cn(
                "relative h-full overflow-hidden border backdrop-blur-xl",
                "bg-gradient-to-br shadow-xl transition-all duration-500",
                stat.bgGradient,
                stat.borderColor,
                stat.glowColor,
                "hover:shadow-2xl hover:border-opacity-100",
                "dark:bg-gray-900/40 dark:backdrop-blur-2xl"
              )}>
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-30">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10"
                    animate={{
                      background: [
                        "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                        "radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                        "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                      ],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>

                {/* Floating particles */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white/40 rounded-full"
                    initial={{
                      x: Math.random() * 100 + "%",
                      y: Math.random() * 100 + "%",
                      opacity: 0
                    }}
                    animate={{
                      opacity: [0, 0.6, 0],
                      scale: [0.5, 1.2, 0.5]
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      delay: Math.random() * 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}

                <CardContent className="relative p-6 text-center z-10">
                  {/* Icon with enhanced animation */}
                  <motion.div
                    className={cn(
                      "relative w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center",
                      "bg-gradient-to-br shadow-lg backdrop-blur-sm",
                      stat.color === "emerald" && "bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400",
                      stat.color === "red" && "bg-red-500/20 text-red-600 dark:bg-red-500/30 dark:text-red-400",
                      stat.color === "blue" && "bg-blue-500/20 text-blue-600 dark:bg-blue-500/30 dark:text-blue-400",
                      stat.color === "orange" && "bg-orange-500/20 text-orange-600 dark:bg-orange-500/30 dark:text-orange-400",
                    )}
                    whileHover={{
                      scale: 1.1,
                      rotate: [0, -5, 5, 0],
                      transition: { duration: 0.3 }
                    }}
                  >
                    {/* Pulsing ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border border-white/30"
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.2
                      }}
                    />
                    <stat.icon className="relative h-7 w-7 drop-shadow-sm" />
                  </motion.div>

                  {/* Value with dramatic typography */}
                  <motion.div
                    className="mb-2"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-none mb-1">
                      {stat.value}
                    </div>
                    {/* Subtle glow effect */}
                    <motion.div
                      className="absolute inset-0 text-3xl md:text-4xl font-black text-white/20 blur-sm -z-10"
                      animate={{
                        opacity: [0.2, 0.4, 0.2]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {stat.value}
                    </motion.div>
                  </motion.div>

                  {/* Label and description */}
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                      {stat.label}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-tight">
                      {stat.description}
                    </div>
                  </div>

                  {/* Hover indicator */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: stat.color === "emerald" ? "linear-gradient(to right, #10b981, #34d399)" :
                                 stat.color === "red" ? "linear-gradient(to right, #ef4444, #f87171)" :
                                 stat.color === "blue" ? "linear-gradient(to right, #3b82f6, #60a5fa)" :
                                 "linear-gradient(to right, #f97316, #fb923c)"
                    }}
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
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

  // Flashcard Review Component
  const FlashcardReview = () => {
    if (filteredQuestions.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">No questions found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )
    }

    const currentCard = filteredQuestions[flashcardIndex]

    return (
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFlashcardIndex(Math.max(0, flashcardIndex - 1))}
            disabled={flashcardIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              {flashcardIndex + 1} of {filteredQuestions.length}
            </div>
            <div className="w-32 h-2 bg-muted rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((flashcardIndex + 1) / filteredQuestions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setFlashcardIndex(Math.min(filteredQuestions.length - 1, flashcardIndex + 1))}
            disabled={flashcardIndex === filteredQuestions.length - 1}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Flashcard */}
        <div className="flex justify-center">
          <motion.div
            className="w-full max-w-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key={flashcardIndex}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="relative w-full aspect-[3/2] cursor-pointer"
              onClick={() => setFlashcardFlipped(!flashcardFlipped)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ perspective: "1000px" }}
            >
              <motion.div
                className="absolute inset-0 w-full h-full"
                initial={false}
                animate={{ rotateY: flashcardFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 300, damping: 30 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front of card */}
                <Card className={cn(
                  "absolute inset-0 w-full h-full backface-hidden",
                  "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
                  "border-2 border-blue-200 dark:border-blue-800",
                  "flex flex-col items-center justify-center p-8 text-center"
                )}>
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                      <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Badge variant={currentCard.isCorrect ? "default" : "destructive"} className="mb-4">
                      {currentCard.isCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4 leading-relaxed">
                    {currentCard.question}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    Click to reveal answer
                  </div>
                </Card>

                {/* Back of card */}
                <Card className={cn(
                  "absolute inset-0 w-full h-full backface-hidden rotate-y-180",
                  "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30",
                  "border-2 border-emerald-200 dark:border-emerald-800",
                  "flex flex-col items-center justify-center p-8 text-center"
                )}>
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <Badge variant={currentCard.isCorrect ? "default" : "destructive"} className="mb-4">
                      {currentCard.isCorrect ? "Correct Answer" : "Your Answer"}
                    </Badge>
                  </div>
                  <div className="text-lg font-semibold text-foreground mb-4 leading-relaxed">
                    {currentCard.isCorrect ? currentCard.correctAnswer : currentCard.userAnswer}
                  </div>
                  {!currentCard.isCorrect && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                        Correct Answer:
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {currentCard.correctAnswer}
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mt-4">
                    Click to flip back
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-center text-sm text-muted-foreground">
          Use arrow keys to navigate • Click card to flip
        </div>
      </div>
    )
  }

  // Redesigned Review Controls - Modern Interface
  const EnhancedReviewControls = () => (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between p-6 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 rounded-2xl border backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <motion.div
            className="p-3 bg-primary/10 rounded-xl"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Target className="w-6 h-6 text-primary" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Question Review</h3>
            <p className="text-muted-foreground text-sm">
              Review your answers and learn from mistakes
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.correct}</div>
            <div className="text-xs text-muted-foreground">Correct</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.incorrect}</div>
            <div className="text-xs text-muted-foreground">To Review</div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* View Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">View Mode</label>
          <div className="grid grid-cols-3 gap-1 bg-muted/50 p-1 rounded-lg">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2 h-9 text-xs"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="flex items-center gap-2 h-9 text-xs"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={viewMode === "flashcard" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("flashcard")}
              className="flex items-center gap-2 h-9 text-xs"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Filter</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  All Questions
                </div>
              </SelectItem>
              <SelectItem value="correct">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Correct Only
                </div>
              </SelectItem>
              <SelectItem value="incorrect">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  Incorrect Only
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-3">
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2"
          >
            <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {stats.incorrect} to review
            </Badge>
          </motion.div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing {filteredQuestions.length} of {processedAnswers.length} questions</span>
        </div>
      </div>
    </motion.div>
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
      {/* Show sign-in prompt if user is not authenticated */}
      {!isAuthenticated ? (
        <SignInPrompt
          onSignIn={handleSignIn}
          onRetake={handleRetake}
          quizType={getQuizType()}
          previewData={{
            percentage: percentage,
            score: score,
            maxScore: maxScore,
            correctAnswers: stats.correct,
            totalQuestions: stats.total,
          }}
        />
      ) : (
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
                <div className="relative overflow-hidden rounded-lg border bg-gradient-to-b from-muted/30 to-muted p-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Performance Stats */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className={`rounded-lg border ${getCurrentLevel().border} p-2`}>
                          <CurrentLevel.icon className="h-4 w-4" />
                        </div>
                        <h3 className="text-lg font-semibold">{getCurrentLevel().title}</h3>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <p>{getCurrentLevel().message}</p>
                        <p className="font-medium">Score: {formatScore(percentage)}%</p>
                      </div>
                    </div>

                    {/* Accuracy Chart */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Accuracy</h4>
                      <div className="flex items-center gap-4">
                        <div className="w-full space-y-1">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div 
                              className={`h-full transition-all bg-gradient-to-r ${getCurrentLevel().gradient}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{stats.correct} of {stats.total} correct</p>
                        </div>
                      </div>
                    </div>

                    {/* Time Stats */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Time Performance</h4>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Average: {formatTime(stats.avgTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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
                    {viewMode === "flashcard" ? (
                      <FlashcardReview />
                    ) : showAllQuestions ? (
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
      )}

      {showConfetti && <Confetti isActive />}
    </>
  )
}
