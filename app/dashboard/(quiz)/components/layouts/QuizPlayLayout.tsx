"use client"

import type React from "react"

import { useAuth, useMediaQuery } from "@/hooks"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useState, useRef, useMemo, useCallback, memo } from "react"
import { useSelector } from "react-redux"
import { selectQuizUserId } from "@/store/slices/quiz"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RandomQuiz } from "./RandomQuiz"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import MeteorShower from "@/components/ui/meteor-shower"
import ScrollProgressBar from "@/components/ui/txt-gradient-scroll"

import {
  Trophy,
  Target,
  BookOpen,
  Code2,
  Focus,
  FileText,
  CreditCard,
  Play,
  Menu,
  X,
  Clock,
  CheckCircle,
  HelpCircle,
  Zap,
  Lightbulb,
  Home,
  Settings,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
} from "lucide-react"
import { QuizActions } from "../QuizActions"

export const dynamic = "force-dynamic"

interface QuizPlayLayoutProps {
  children: React.ReactNode
  quizSlug?: string
  quizType?: "mcq" | "code" | "blanks" | "quiz" | "openended" | "flashcard" | "others"
  quizId?: string
  isPublic?: boolean
  isFavorite?: boolean
  userId?: string
  ownerId?: string
  quizData?: any
  randomQuizStats?: {
    totalQuizzes?: number
    averageRating?: number
    totalAttempts?: number
  }
  timeSpent?: number
}

const quizTypeConfig = {
  mcq: {
    icon: Target,
    label: "Multiple Choice",
    color: "text-blue-700 dark:text-blue-300",
    bgColor:
      "bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:from-blue-950/60 dark:via-blue-900/40 dark:to-indigo-950/60",
    badgeColor: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-0",
    accentColor: "bg-gradient-to-r from-blue-500 to-blue-600",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30",
    primaryGradient: "from-blue-500 to-blue-600",
    lightBg: "from-blue-50/80 to-indigo-50/80",
    darkBg: "from-blue-950/80 to-indigo-950/80",
  },
  code: {
    icon: Code2,
    label: "Code Quiz",
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor:
      "bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-100 dark:from-emerald-950/60 dark:via-emerald-900/40 dark:to-teal-950/60",
    badgeColor: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 border-0",
    accentColor: "bg-gradient-to-r from-emerald-500 to-teal-600",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30",
    primaryGradient: "from-emerald-500 to-teal-600",
    lightBg: "from-emerald-50/80 to-teal-50/80",
    darkBg: "from-emerald-950/80 to-teal-950/80",
  },
  blanks: {
    icon: Focus,
    label: "Fill Blanks",
    color: "text-cyan-700 dark:text-cyan-300",
    bgColor:
      "bg-gradient-to-br from-cyan-50 via-cyan-100 to-sky-100 dark:from-cyan-950/60 dark:via-cyan-900/40 dark:to-sky-950/60",
    badgeColor: "bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/25 border-0",
    accentColor: "bg-gradient-to-r from-cyan-500 to-sky-600",
    iconBg: "bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/30",
    primaryGradient: "from-cyan-500 to-sky-600",
    lightBg: "from-cyan-50/80 to-sky-50/80",
    darkBg: "from-cyan-950/80 to-sky-950/80",
  },
  openended: {
    icon: FileText,
    label: "Open Ended",
    color: "text-violet-700 dark:text-violet-300",
    bgColor:
      "bg-gradient-to-br from-violet-50 via-violet-100 to-purple-100 dark:from-violet-950/60 dark:via-violet-900/40 dark:to-purple-950/60",
    badgeColor: "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 border-0",
    accentColor: "bg-gradient-to-r from-violet-500 to-purple-600",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30",
    primaryGradient: "from-violet-500 to-purple-600",
    lightBg: "from-violet-50/80 to-purple-50/80",
    darkBg: "from-violet-950/80 to-purple-950/80",
  },
  flashcard: {
    icon: CreditCard,
    label: "Flashcards",
    color: "text-orange-700 dark:text-orange-300",
    bgColor:
      "bg-gradient-to-br from-orange-50 via-orange-100 to-amber-100 dark:from-orange-950/60 dark:via-orange-900/40 dark:to-amber-950/60",
    badgeColor: "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25 border-0",
    accentColor: "bg-gradient-to-r from-orange-500 to-amber-600",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30",
    primaryGradient: "from-orange-500 to-amber-600",
    lightBg: "from-orange-50/80 to-amber-50/80",
    darkBg: "from-orange-950/80 to-amber-950/80",
  },
  quiz: {
    icon: BookOpen,
    label: "General Quiz",
    color: "text-indigo-700 dark:text-indigo-300",
    bgColor:
      "bg-gradient-to-br from-indigo-50 via-indigo-100 to-blue-100 dark:from-indigo-950/60 dark:via-indigo-900/40 dark:to-blue-950/60",
    badgeColor: "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25 border-0",
    accentColor: "bg-gradient-to-r from-indigo-500 to-blue-600",
    iconBg: "bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30",
    primaryGradient: "from-indigo-500 to-blue-600",
    lightBg: "from-indigo-50/80 to-blue-50/80",
    darkBg: "from-indigo-950/80 to-blue-950/80",
  },
  others: {
    icon: Play,
    label: "Mixed Quiz",
    color: "text-slate-700 dark:text-slate-300",
    bgColor:
      "bg-gradient-to-br from-slate-50 via-slate-100 to-gray-100 dark:from-slate-950/60 dark:via-slate-900/40 dark:to-gray-950/60",
    badgeColor: "bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-500/25 border-0",
    accentColor: "bg-gradient-to-r from-slate-500 to-gray-600",
    iconBg: "bg-gradient-to-br from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-500/30",
    primaryGradient: "from-slate-500 to-gray-600",
    lightBg: "from-slate-50/80 to-gray-50/80",
    darkBg: "from-slate-950/80 to-gray-950/80",
  },
}

// Enhanced Loading Skeleton with animations
const QuizSkeleton = () => (
  <div className="w-full p-6 space-y-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-700/30 shadow-2xl">
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-36 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 via-gray-600 to-gray-700 animate-pulse" />
      <Skeleton className="h-6 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 via-gray-600 to-gray-700 animate-pulse" />
    </div>
    <Skeleton className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 via-gray-600 to-gray-700 animate-pulse" />
    <div className="space-y-3">
      <Skeleton className="h-48 w-full rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 via-gray-600 to-gray-700 animate-pulse" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-24 rounded-xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 via-gray-600 to-gray-700 animate-pulse" />
        <Skeleton className="h-10 w-28 rounded-xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 via-gray-600 to-gray-700 animate-pulse" />
      </div>
    </div>
  </div>
)

// Simplified Timer component
const TimerDisplay = memo(({ initialTime = 0 }: { initialTime?: number }) => {
  const [timeSpent, setTimeSpent] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(initialTime === 0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && initialTime === 0) {
      intervalRef.current = setInterval(() => {
        setTimeSpent((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [initialTime, isRunning])

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  const displayTime = initialTime > 0 ? initialTime : timeSpent

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/20 text-sm font-medium"
      role="timer"
      aria-label={`Time elapsed: ${formatTime(displayTime)}`}
    >
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="tabular-nums text-foreground">
        {formatTime(displayTime)}
      </span>
    </div>
  )
})

TimerDisplay.displayName = "TimerDisplay"

// Simplified Progress component
const ProgressIndicator = memo(
  ({ current, total, percentage }: { current: number; total: number; percentage: number }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0)

    useEffect(() => {
      const timer = setTimeout(() => {
        setAnimatedPercentage(percentage)
      }, 300)
      return () => clearTimeout(timer)
    }, [percentage])

    return (
      <div className="w-full p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">
              Question {current} of {total}
            </span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-primary">
              {percentage}%
            </span>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>

        {/* Simplified progress bar */}
        <div className="relative">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${animatedPercentage}%` }}
            />
          </div>
        </div>
      </div>
    )
  },
)

ProgressIndicator.displayName = "ProgressIndicator"

// Enhanced Quick Actions component
const QuickActions = memo(
  ({
    onHome,
    onSettings,
    onFullscreen,
    isFullscreen,
  }: {
    onHome: () => void
    onSettings: () => void
    onFullscreen: () => void
    isFullscreen: boolean
  }) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onHome}
        className="h-10 w-10 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg border border-white/30 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 rounded-xl group"
        aria-label="Go to home"
      >
        <Home className="h-4 w-4 group-hover:text-blue-600" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSettings}
        className="h-10 w-10 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg border border-white/30 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 rounded-xl group"
        aria-label="Settings"
      >
        <Settings className="h-4 w-4 group-hover:text-purple-600" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onFullscreen}
        className="h-10 w-10 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg border border-white/30 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 rounded-xl group"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <Minimize className="h-4 w-4 group-hover:text-red-600" />
        ) : (
          <Maximize className="h-4 w-4 group-hover:text-green-600" />
        )}
      </Button>
    </div>
  ),
)

QuickActions.displayName = "QuickActions"

export default function QuizPlayLayout({
  children,
  quizSlug = "",
  quizType = "quiz",
  quizId,
  isPublic = false,
  isFavorite = false,
  userId = "",
  quizData = null,
  randomQuizStats = {},
  timeSpent = 0,
}: QuizPlayLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")
  const pathname = usePathname()
  const [isLoaded, setIsLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const quizOwnerId = useSelector(selectQuizUserId)
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Quiz metadata with better defaults
  const quizTitle = quizData?.title || "Untitled Quiz"
  const quizSubtitle = quizData?.subtitle || ""
  const difficulty = quizData?.difficulty || "medium"
  const totalQuestions = Math.max(1, quizData?.questions?.length || 1)
  const questionNumber = Math.max(
    1,
    Math.min(quizData?.currentQuestionIndex !== undefined ? quizData.currentQuestionIndex + 1 : 1, totalQuestions),
  )

  // Auth and ownership
  const authUser = useAuth().user
  userId = authUser?.id || ""
  const isOwner = quizOwnerId === userId

  // Enhanced callbacks
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  const handleHome = useCallback(() => {
    window.location.href = "/dashboard"
  }, [])

  const handleSettings = useCallback(() => {
    setShowSettings((prev) => !prev)
  }, [])

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case "Escape":
          if (isFullscreen) {
            setIsFullscreen(false)
          } else if (sidebarOpen && isMobile) {
            closeSidebar()
          }
          break
        case "s":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            toggleSidebar()
          }
          break
        case "f":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            toggleFullscreen()
          }
          break
        case "h":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            handleHome()
          }
          break
        case ",":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            handleSettings()
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [sidebarOpen, isMobile, isFullscreen, closeSidebar, toggleSidebar, toggleFullscreen, handleHome, handleSettings])

  // Responsive sidebar behavior
  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  // Loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 200)
    return () => clearTimeout(timer)
  }, [])

  // Focus management
  useEffect(() => {
    if (mainContentRef.current && isLoaded) {
      const timer = setTimeout(() => {
        const firstFocusable = mainContentRef.current?.querySelector(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) as HTMLElement | null
        if (firstFocusable) {
          firstFocusable.focus()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [questionNumber, isLoaded])

  // Derived values
  const config = useMemo(() => quizTypeConfig[quizType] || quizTypeConfig.quiz, [quizType])
  const Icon = config.icon
  const progressPercentage = useMemo(
    () => Math.min(100, Math.max(0, Math.round((questionNumber / totalQuestions) * 100))),
    [questionNumber, totalQuestions],
  )

  // Enhanced header component with vibrant styling
  const HeaderComponent = useMemo(
    () => (
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl border-b border-white/30 dark:border-gray-700/30 bg-gradient-to-r from-white/90 via-white/95 to-white/90 dark:from-gray-900/90 dark:via-gray-900/95 dark:to-gray-900/90 supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70 transition-all duration-300 shadow-lg shadow-black/5`}
        role="banner"
      >
        <div className="max-w-screen-2xl mx-auto px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Quiz Info Section */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`p-2.5 rounded-xl bg-gradient-to-r ${config.primaryGradient} shadow-lg shadow-primary/25`}>
                <Icon className="h-5 w-5 text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-lg lg:text-xl truncate leading-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  {quizTitle}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    {config.label}
                  </Badge>
                  <DifficultyBadge difficulty={difficulty} />
                  {!isMobile && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>{questionNumber}/{totalQuestions}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls Section */}
            <div className="flex items-center gap-3">
              {!isMobile && (
                <div className="flex items-center gap-3">
                  <TimerDisplay initialTime={timeSpent} />
                  <div className="text-sm font-medium text-primary">
                    {progressPercentage}%
                  </div>
                </div>
              )}

              <QuickActions
                onHome={handleHome}
                onSettings={handleSettings}
                onFullscreen={toggleFullscreen}
                isFullscreen={isFullscreen}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="shrink-0 h-9 w-9 p-0"
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Stats */}
          {isMobile && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <TimerDisplay initialTime={timeSpent} />
              <div className="text-sm text-muted-foreground">
                Question {questionNumber} of {totalQuestions}
              </div>
              <div className="text-sm font-medium text-primary">
                {progressPercentage}%
              </div>
            </div>
          )}
        </div>
      </header>
    ),
    [
      quizTitle,
      config,
      Icon,
      difficulty,
      questionNumber,
      totalQuestions,
      progressPercentage,
      timeSpent,
      sidebarOpen,
      toggleSidebar,
      isMobile,
      handleHome,
      handleSettings,
      toggleFullscreen,
      isFullscreen,
    ],
  )

  // Enhanced RandomQuiz component
  const RandomQuizComponent = useMemo(
    () => (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-gray-700/30 p-6 shadow-2xl shadow-black/10">
        <Suspense fallback={<QuizSkeleton />}>
          <div className="w-full mb-6">
            <QuizActions
              quizId={quizId || quizSlug}
              quizSlug={quizSlug}
              quizType={quizType}
              title={quizTitle}
              isPublic={isPublic}
              isFavorite={isFavorite}
              className="w-full"
            />
          </div>
          <RandomQuiz  autoRotate={true} />
        </Suspense>
      </div>
    ),
    [quizSlug, quizData, isPublic, isFavorite, isOwner],
  )

  if (!isLoaded) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${config.lightBg} dark:${config.darkBg} relative overflow-hidden`}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full opacity-20 animate-pulse" />
          <div
            className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-32 left-1/3 w-40 h-40 bg-gradient-to-r from-pink-400 to-orange-500 rounded-full opacity-20 animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="text-center space-y-8 z-10">
          <div className="relative">
            <div
              className={`animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r ${config.primaryGradient} mx-auto rounded-full shadow-2xl`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-pulse" />
            </div>
            <div className="absolute inset-6 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-inner">
              <Icon
                className={`h-8 w-8 bg-gradient-to-r ${config.primaryGradient} bg-clip-text text-transparent animate-bounce`}
              />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Loading Your Quiz Experience
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Preparing an engaging learning session...</p>
            <div className="flex justify-center gap-2 mt-6">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <MeteorShower>
      <div className="relative min-h-screen">
        <ScrollProgressBar type="circle" position="top-right" />
        <div
          className={`min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-gray-900 dark:to-indigo-950/30 transition-all duration-500 ${isFullscreen ? "overflow-hidden" : ""} relative`}
        >
          {/* Enhanced background patterns */}
          {!isFullscreen && (
            <div className="absolute inset-0 opacity-40 dark:opacity-20">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-100/20 via-transparent to-cyan-100/20 dark:from-violet-900/10 dark:to-cyan-900/10" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.05),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.03),transparent_50%)]" />
            </div>
          )}

          {/* Header */}
          {!isFullscreen && HeaderComponent}

          {/* Main Content */}
          <main className="flex-1 flex max-w-screen-2xl mx-auto w-full p-3 sm:p-4 lg:p-6 relative z-10">
            <div className="flex w-full gap-4 lg:gap-6">
              {/* Question Area - Simplified with better focus */}
              <div
                ref={mainContentRef}
                className={`flex-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-xl transition-all duration-500 ${
                  isFullscreen ? "p-6 lg:p-8" : "p-4 lg:p-6"
                } overflow-auto relative`}
                role="main"
                aria-label="Quiz content"
              >
                {/* Simplified content wrapper */}
                <div className="w-full">
                  {/* Progress Section - only show when not in fullscreen */}
                  {!isFullscreen && (
                    <div className="mb-6">
                      <ProgressIndicator current={questionNumber} total={totalQuestions} percentage={progressPercentage} />
                    </div>
                  )}

                  {/* Main quiz content with consistent spacing */}
                  <div className="w-full">{children}</div>
                </div>
              </div>

              {/* Desktop Sidebar - Hidden in focus mode */}
              {sidebarOpen && !isFullscreen && (
                <aside
                  className={`hidden lg:block shrink-0 space-y-4 transition-all duration-500 ${
                    isTablet ? "w-72" : "w-80"
                  } animate-in slide-in-from-right-full`}
                >
                  {RandomQuizComponent}
                </aside>
              )}
            </div>
          </main>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && isMobile && !isFullscreen && (
            <div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden transition-all duration-500 animate-in fade-in"
              onClick={closeSidebar}
              role="dialog"
              aria-modal="true"
              aria-label="Quiz sidebar"
            >
              <div
                className="absolute right-0 top-0 h-full w-5/6 max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-l border-white/30 dark:border-gray-700/30 p-6 shadow-2xl transform transition-all duration-500 animate-in slide-in-from-right-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-3">
                    <div className={`p-2 bg-gradient-to-r ${config.primaryGradient} rounded-xl shadow-lg`}>
                      <Lightbulb className="h-4 w-4 text-white" />
                    </div>
                    Quiz Hub
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeSidebar}
                    className="h-10 w-10 p-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl border border-white/40 dark:border-gray-700/40 transition-all duration-300 hover:scale-105 group"
                    aria-label="Close sidebar"
                  >
                    <X className="h-4 w-4 group-hover:text-red-500 transition-colors" />
                  </Button>
                </div>

                <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {RandomQuizComponent}
                </div>
              </div>
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          {!isMobile && (
            <div className="fixed bottom-4 left-4 z-40 opacity-60 hover:opacity-100 transition-opacity duration-300">
              <div className="bg-black/80 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-xl">
                Press Ctrl+S to toggle sidebar • Ctrl+F for fullscreen
              </div>
            </div>
          )}
        </div>
      </div>
    </MeteorShower>
  )
}
