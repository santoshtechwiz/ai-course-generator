"use client"

import type React from "react"
import { useMediaQuery } from "@/hooks"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useState, useRef, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { 
  CheckCircle, 
  Clock, 
  Home, 
  Maximize, 
  Minimize, 
  X, 
  Target, 
  Play, 
  Pause,
  RotateCcw,
  BookOpen,
  Award,
  Zap,
  Eye,
  EyeOff,
  Edit3,
  MessageSquare,
  Brain,
  Lock
} from "lucide-react"

import { RandomQuiz } from "./RandomQuiz"
import { useRelatedQuizzes } from "@/hooks/useRelatedQuizzes"
import { motion, AnimatePresence } from "framer-motion"
import RecommendedSection from "@/components/shared/RecommendedSection"
import { cn } from "@/lib/utils"
import { useAuth } from "@/modules/auth"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import { QuizActions } from "@/components/quiz/QuizActions"

// Removed force-dynamic; let Next.js infer rendering strategy

interface QuizPlayLayoutProps {
  children: React.ReactNode
  quizSlug?: string
  quizType?: "mcq" | "code" | "blanks" | "quiz" | "openended" | "flashcard" | "others"
  quizId?: string
  isPublic?: boolean
  isFavorite?: boolean
  quizData?: any
  timeSpent?: number
}

const quizTypeLabel: Record<string, string> = {
  mcq: "Multiple Choice",
  code: "Code Quiz",
  blanks: "Fill Blanks",
  openended: "Open Ended",
  flashcard: "Flashcards",
  quiz: "Quiz",
  others: "Mixed Quiz",
}

const quizTypeIcons: Record<string, React.ComponentType<any>> = {
  mcq: Target,
  code: BookOpen,
  blanks: Edit3,
  openended: MessageSquare,
  flashcard: Brain,
  quiz: Award,
  others: Zap,
}

const QuizSkeleton = () => (
  <motion.div 
    className="w-full p-6 space-y-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 to-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-700/50"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex justify-between items-center">
      <Skeleton className="h-7 w-48 rounded-lg" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
    <Skeleton className="h-5 w-full rounded-lg" />
    <Skeleton className="h-5 w-3/4 rounded-lg" />
    <Skeleton className="h-64 w-full rounded-xl" />
    <div className="flex gap-3">
      <Skeleton className="h-12 flex-1 rounded-xl" />
      <Skeleton className="h-12 w-32 rounded-xl" />
    </div>
  </motion.div>
)

const Timer = ({ seconds, isPaused }: { seconds: number; isPaused?: boolean }) => {
  const formatTime = (s: number) => {
    if (!s || s < 0) return "0:00"
    if (s < 60) return `0:${s.toString().padStart(2, "0")}`
    const m = Math.floor(s / 60)
    const rem = s % 60
    return `${m}:${rem.toString().padStart(2, "0")}`
  }

  return (
    <motion.div 
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
        isPaused 
          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" 
          : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50"
      )}
      whileHover={{ scale: 1.05 }}
      layout
    >
      <motion.div
        animate={isPaused ? { rotate: 0 } : { rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Clock className="h-4 w-4" />
      </motion.div>
      <span className="tabular-nums font-mono">{formatTime(seconds)}</span>
      {isPaused && <Pause className="h-3 w-3" />}
    </motion.div>
  )
}

const ProgressBar = ({ progress, questionNumber, totalQuestions }: { progress: number; questionNumber: number; totalQuestions: number }) => (
  <motion.div
    className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-white/60 to-gray-50/60 dark:from-gray-900/60 dark:to-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <motion.div
          className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white shadow-lg"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Target className="w-5 h-5" />
          </motion.div>
          <span className="text-sm font-bold">
            {/* Question counter removed for cleaner layout */}
          </span>
        </motion.div>
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {progress}% Complete
          </span>
        </motion.div>
      </div>
      <motion.div
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-full border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Award className="h-4 w-4 text-amber-500" />
        <span className="font-medium">{questionNumber - 1} completed</span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-500">{totalQuestions - questionNumber + 1} remaining</span>
      </motion.div>
    </div>

    <div className="relative">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
        <span>Start</span>
        <span className="font-medium">{progress}%</span>
        <span>Finish</span>
      </div>
      <div className="relative h-6 bg-gray-200/50 dark:bg-gray-700/50 border border-gray-300/50 dark:border-gray-600/50 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full relative overflow-hidden shadow-lg"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          {/* Enhanced shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full"
            animate={{ x: [-300, 300] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Pulse effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-400/50 rounded-full"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Progress indicator dot */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-blue-500"
          style={{ left: `calc(${progress}% - 8px)` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
        >
          <motion.div
            className="absolute inset-0 bg-blue-500 rounded-full"
            animate={{ scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>

    {/* Motivational message */}
    <motion.div
      className="mt-4 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <motion.p
        className="text-sm text-gray-600 dark:text-gray-400 font-medium"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {progress < 25 ? "🚀 Great start! Keep going!" :
         progress < 50 ? "💪 You're doing amazing!" :
         progress < 75 ? "🎯 Almost there!" :
         progress < 100 ? "🏁 Final push!" :
         "🎉 Congratulations! Quiz completed!"}
      </motion.p>
    </motion.div>
  </motion.div>
)

export default function QuizPlayLayout({
  children,
  quizSlug = "",
  quizType = "quiz",
  quizId = "",
  isPublic = false,
  isFavorite = false,
  quizData = null,
  timeSpent = 0,
}: QuizPlayLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 767px)") // Use standardized mobile breakpoint
  const pathname = usePathname()
  const [isLoaded, setIsLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Always closed by default on mobile
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [showEngage, setShowEngage] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  // Local state for quiz properties to enable immediate UI updates
  const [localIsPublic, setLocalIsPublic] = useState(isPublic)
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite)
  
  // Update local state when props change
  useEffect(() => {
    setLocalIsPublic(isPublic)
  }, [isPublic])
  
  useEffect(() => {
    setLocalIsFavorite(isFavorite)
  }, [isFavorite])
  
  const { quizzes: relatedQuizzes } = useRelatedQuizzes({ 
    quizType, 
    difficulty: quizData?.difficulty, 
    exclude: quizSlug, 
    limit: 6, 
    tags: Array.isArray(quizData?.tags) ? quizData?.tags : undefined 
  })
  const [showConfetti, setShowConfetti] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  // Session and subscription management
 
  const { user: authUser } = useAuth()
  const { subscription } = useUnifiedSubscription()

  // Determine ownership and subscription status
  const isOwner = useMemo((): boolean => {
    const sessionUserId = authUser?.id
    const quizUserId = quizData?.userId
    const owner = Boolean(sessionUserId && quizUserId && String(sessionUserId) === String(quizUserId))
    console.log('QuizPlayLayout ownership check:', {
      sessionUserId,
      quizUserId,
      sessionUserIdType: typeof sessionUserId,
      quizUserIdType: typeof quizUserId,
      isOwner: owner
    })
    return owner
  }, [authUser?.id, quizData?.userId])

  const isSubscribed = useMemo(() => {
    return subscription?.isSubscribed === true
  }, [subscription?.isSubscribed])

  const subscriptionExpired = useMemo(() => {
    if (!subscription?.expirationDate && !subscription?.currentPeriodEnd) return false
    const endDate = subscription.expirationDate || subscription.currentPeriodEnd
    return endDate ? new Date(endDate) < new Date() : false
  }, [subscription?.expirationDate, subscription?.currentPeriodEnd])

  // Auto-increment timer when not provided
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    setIsLoaded(true)
    const interval = setInterval(() => {
      if (!isPaused) {
        setElapsed((e) => e + 1)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isPaused])

  // Engagement modal: show once per slug
  useEffect(() => {
    if (!quizSlug) return
    const key = `ai_quiz_engagement_${quizSlug}`
    const seen = typeof window !== 'undefined' ? localStorage.getItem(key) : '1'
    if (!seen) {
      const t = setTimeout(() => setShowEngage(true), 2000)
      return () => clearTimeout(t)
    }
  }, [quizSlug])

  const title = quizData?.title || "Untitled Quiz"
  const difficulty = quizData?.difficulty || "medium"
  const totalQuestions = Math.max(1, quizData?.questions?.length || 1)
  const questionNumber = Math.max(
    1,
    Math.min(quizData?.currentQuestionIndex !== undefined ? quizData.currentQuestionIndex + 1 : 1, totalQuestions),
  )

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((s) => {
      const next = !s
      setIsFocusMode(!next ? false : true)
      return next
    })
  }, [])

  const toggleFullscreen = useCallback(() => setIsFullscreen((s) => !s), [])
  const togglePause = useCallback(() => setIsPaused((p) => !p), [])
  const goHome = useCallback(() => (window.location.href = "/dashboard/quizzes"), [])
  const resetQuiz = useCallback(() => {
    setElapsed(0)
    // Add your reset logic here
  }, [])

  // Quiz action callbacks for immediate UI updates
  const handleVisibilityChange = useCallback((newIsPublic: boolean) => {
    setLocalIsPublic(newIsPublic)
  }, [])

  const handleFavoriteChange = useCallback((newIsFavorite: boolean) => {
    setLocalIsFavorite(newIsFavorite)
  }, [])

  const handleDelete = useCallback(() => {
    // Navigate to quizzes page after successful deletion
    window.location.href = "/dashboard/quizzes"
  }, [])

  const QuizTypeIcon = quizTypeIcons[quizType] || Award
  const progress = useMemo(() => Math.min(100, Math.max(0, Math.round((questionNumber / totalQuestions) * 100))), [questionNumber, totalQuestions])
  // Hide heavy sidebar actions on result/review pages to avoid duplicate CTAs
  const hideSidebarActions = useMemo(() => {
    if (!pathname) return false
    const p = pathname.toLowerCase()
    return p.includes('/results') || p.includes('/review') || p.includes('/result')
  }, [pathname])
  
  const header = useMemo(() => {
    const displaySeconds = timeSpent > 0 ? timeSpent : elapsed
    return (
      <motion.header 
        className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className={cn(
          "mx-auto w-full py-3 sm:py-4 transition-all duration-300",
          isFullscreen 
            ? "max-w-none px-2 sm:px-4" 
            : "max-w-screen-2xl px-3 sm:px-4 lg:px-6"
        )}>
          <div className="flex items-center justify-between gap-4">
            <motion.div 
              className="min-w-0 flex-1 flex items-center gap-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                  <QuizTypeIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate mb-0.5">
                    {title}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50">
                      {quizTypeLabel[quizType] || "Quiz"}
                    </Badge>
                    <DifficultyBadge difficulty={difficulty} />
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-gray-600 dark:text-gray-400 font-medium">
                      {/* Question counter removed for cleaner layout */}
                    </Badge>
                    <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300">
                      {progress}% Complete
                    </Badge>
                  </div>
                  <Timer seconds={displaySeconds} isPaused={isPaused} />
                </div>
                {isFocusMode && (
                  <div className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-lg">
                    <Target className="h-4 w-4" /> Focus Mode
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="hidden sm:flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={togglePause}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetQuiz}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-3">
                <Button variant="ghost" size="sm" onClick={goHome} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px] p-3">
                  <Home className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px] p-3">
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleSidebar}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {sidebarOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          </div>

          {isMobile && (
            <motion.div 
              className="mt-3 space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-gray-600 dark:text-gray-400 font-medium">
                    {/* Question counter removed for cleaner layout */}
                  </Badge>
                  <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300">
                    {progress}%
                  </Badge>
                </div>
                <Timer seconds={displaySeconds} isPaused={isPaused} />
              </div>
              
              <div className="flex items-center justify-between py-1.5 px-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={togglePause} className="min-h-[44px] min-w-[44px] p-3 hover:bg-white/50 dark:hover:bg-gray-900/50">
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetQuiz} className="min-h-[44px] min-w-[44px] p-3 hover:bg-white/50 dark:hover:bg-gray-900/50">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                {isFocusMode && (
                  <div className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400">
                    <Target className="h-4 w-4" /> Focus
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>
    )
  }, [title, quizType, difficulty, isMobile, questionNumber, totalQuestions, timeSpent, elapsed, isFullscreen, sidebarOpen, isFocusMode, isPaused, QuizTypeIcon])

  useEffect(() => {
    if (progress === 100) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(t)
    }
  }, [progress])

  const canResume = questionNumber > 1

  // Handle responsive sidebar behavior
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      // Close sidebar on mobile to prevent auto-opening
      setSidebarOpen(false)
    } else if (!isMobile && !sidebarOpen) {
      // Optionally open sidebar on desktop if it was closed
      // setSidebarOpen(true) // Uncomment if you want to auto-open on desktop
    }
  }, [isMobile, sidebarOpen])

  // Check if quiz should be visible to current user
  const canViewQuiz = useMemo(() => {
    // Public quizzes are visible to everyone
    if (isPublic) return true
    
    // Private quizzes are only visible to the owner
    return isOwner
  }, [isPublic, isOwner])

  // If quiz is private and user can't view it, show access denied message
  if (!canViewQuiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Lock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Private Quiz
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
            This quiz is private and can only be viewed by its owner.
          </p>
          {!authUser && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Please log in to access private quizzes.
            </p>
          )}
        </motion.div>
      </div>
    )
  }

  if (!isLoaded) return null

  const displaySeconds = timeSpent > 0 ? timeSpent : elapsed

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative selection:bg-blue-100 dark:selection:bg-blue-900/40", 
      isFullscreen && "overflow-hidden"
    )}>
      {header}
      
      <main className={cn(
        "mx-auto w-full py-6 transition-all duration-300 space-y-6",
        isFullscreen 
          ? "px-2 sm:px-4 max-w-none" 
          : "max-w-screen-2xl px-4 sm:px-6 lg:px-8"
      )}>
        {/* Resume CTA */}
        <AnimatePresence>
          {canResume && !isFullscreen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden rounded-2xl border border-blue-200 dark:border-blue-700/50 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-lg"
            >
              <div className="absolute inset-0 bg-grid-blue-500/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
              <div className="relative p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/50 shadow-sm">
                    <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">Continue where you left off</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5">{/* Question counter removed for cleaner layout */}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-base px-6"
                >
                  Resume Quiz
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-6">
          {/* Main Content */}
          <motion.section 
            ref={mainRef}
            className={cn(
              "flex-1 rounded-3xl border border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-xl transition-all duration-300",
              isFullscreen 
                ? "p-2 sm:p-4 lg:p-6 min-h-[calc(100vh-8rem)]" 
                : "p-3 sm:p-4 lg:p-6"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-full h-full font-mono text-[15px] [font-feature-settings:'ss02']">{children}</div>
          </motion.section>

          {/* Enhanced Sidebar */}
          <AnimatePresence>
            {sidebarOpen && !isFullscreen && (
              <motion.aside
                className="hidden xl:block w-80 xl:w-96 shrink-0"
                initial={{ opacity: 0, x: 20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: isFullscreen ? 0 : 320 }}
                exit={{ opacity: 0, x: 20, width: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="space-y-6">
                  <motion.div 
                    className="rounded-3xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 shadow-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {!hideSidebarActions && (
                      <Suspense fallback={<QuizSkeleton />}>
                        <QuizActions 
                          quizId={quizId || ""}
                          quizSlug={quizSlug}
                          quizType={quizType}
                          title={quizData?.title || "Quiz"}
                          isPublic={localIsPublic}
                          isFavorite={localIsFavorite}
                          canEdit={isOwner}
                          canDelete={isOwner}
                          showPdfGeneration={true}
                          variant="compact"
                          userId={authUser?.id}
                          onVisibilityChange={handleVisibilityChange}
                          onFavoriteChange={handleFavoriteChange}
                          onDelete={handleDelete}
                          className="w-full" 
                        />
                      </Suspense>
                    )}
                  </motion.div>

                  <motion.div 
                    className="rounded-3xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 shadow-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Suspense fallback={<QuizSkeleton />}>
                      <RandomQuiz autoRotate={!isMobile} />
                    </Suspense>
                  </motion.div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Related Quizzes */}
        <AnimatePresence>
          {!isFullscreen && relatedQuizzes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8"
            >
              <RecommendedSection title="Continue Learning">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedQuizzes.slice(0, 3).map((rq, index) => (
                    <motion.a
                      key={rq.id}
                      href={`/dashboard/${rq.quizType}/${rq.slug}`}
                      className="group rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-6 hover:shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        {/* isFavorite removed (not on RelatedQuizItem) */}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2">
                        {rq.title}
                      </h3>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <Badge variant="secondary" className="text-xs">
                          {rq.quizType?.toUpperCase()}
                        </Badge>
                        <span>{rq.questionCount} questions</span>
                        {/* estimatedTime removed (not on RelatedQuizItem) */}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                          Start Quiz
                        </span>
                        <Play className="w-4 h-4 text-purple-500 group-hover:text-purple-600 transition-colors" />
                      </div>
                    </motion.a>
                  ))}
                </div>
              </RecommendedSection>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Enhanced Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && !isFullscreen && (
          <motion.div 
            className="fixed inset-0 z-50 xl:hidden" 
            role="dialog" 
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setSidebarOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div 
              className="absolute right-0 top-0 h-full w-full sm:w-5/6 max-w-sm bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 min-h-[4rem]">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quiz Panel</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSidebarOpen(false)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[44px] min-w-[44px] p-3"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(100vh-5rem)] p-6 space-y-6">
                <Suspense fallback={<QuizSkeleton />}>
                  <QuizActions 
                    quizId={quizId || ""}
                    quizSlug={quizSlug || ""}
                    quizType={quizType || "quiz"}
                    title={quizData?.title || "Quiz"}
                    isPublic={localIsPublic}
                    isFavorite={localIsFavorite}
                    canEdit={isOwner}
                    canDelete={isOwner}
                    showPdfGeneration={true}
                    variant="compact"
                    userId={authUser?.id}
                    onVisibilityChange={handleVisibilityChange}
                    onFavoriteChange={handleFavoriteChange}
                    onDelete={handleDelete}
                    className="w-full"
                  />
                </Suspense>
                
                <Suspense fallback={<QuizSkeleton />}>
                  <RandomQuiz autoRotate={!isMobile} />
                </Suspense>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

 
    </div>
  )
}