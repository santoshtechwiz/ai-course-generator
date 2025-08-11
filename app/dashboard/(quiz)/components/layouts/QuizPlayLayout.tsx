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

// Enhanced Timer component with sound effects and notifications
const TimerDisplay = memo(({ initialTime = 0 }: { initialTime?: number }) => {
  const [timeSpent, setTimeSpent] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(initialTime === 0)
  const [soundEnabled, setSoundEnabled] = useState(false)
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

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev)
  }, [])

  const resetTimer = useCallback(() => {
    setTimeSpent(0)
    setIsRunning(false)
  }, [])

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
      className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500/15 to-purple-500/15 dark:from-blue-400/25 dark:to-purple-400/25 backdrop-blur-xl rounded-2xl text-sm font-bold border border-blue-200/60 dark:border-blue-400/40 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 group"
      role="timer"
      aria-label={`Time elapsed: ${formatTime(displayTime)}`}
    >
      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
        <Clock className="h-4 w-4 text-white animate-pulse" />
      </div>
      <span className="tabular-nums bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg">
        {formatTime(displayTime)}
      </span>

      {initialTime === 0 && (
        <div className="flex items-center gap-1 ml-2">
          <Button variant="ghost" size="sm" onClick={toggleTimer} className="h-6 w-6 p-0 hover:bg-white/20 rounded-lg">
            {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={resetTimer} className="h-6 w-6 p-0 hover:bg-white/20 rounded-lg">
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-6 w-6 p-0 hover:bg-white/20 rounded-lg"
          >
            {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          </Button>
        </div>
      )}
    </div>
  )
})

TimerDisplay.displayName = "TimerDisplay"

// Enhanced Progress component with more visual feedback
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
      <div className="space-y-4 p-4 bg-gradient-to-r from-white/70 to-white/50 dark:from-gray-800/70 dark:to-gray-800/50 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
                Question {current} of {total}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{total - current} remaining</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                {percentage}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Complete</p>
          </div>
        </div>

        <div className="relative">
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/50 relative overflow-hidden"
              style={{ width: `${animatedPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
                style={{ animationDelay: "0.5s" }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-medium">
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Started
          </div>
          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 justify-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            In Progress
          </div>
          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 justify-end">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            Complete
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

  // Enhanced header component
  const HeaderComponent = useMemo(
    () => (
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/30 bg-gradient-to-r ${config.lightBg} dark:${config.darkBg} transition-all duration-500 shadow-xl`}
        role="banner"
      >
        <div className="max-w-screen-2xl mx-auto px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Quiz Info Section */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div
                className={`p-3 rounded-2xl ${config.iconBg} transition-all duration-300 hover:scale-110 hover:rotate-3 shadow-lg`}
              >
                <Icon className="h-6 w-6 animate-pulse" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-xl lg:text-2xl truncate leading-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-2">
                  {quizTitle}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    className={`text-xs px-4 py-2 font-bold ${config.badgeColor} transition-all duration-300 hover:scale-105 rounded-xl`}
                  >
                    {config.label}
                  </Badge>
                  <DifficultyBadge difficulty={difficulty} />
                  {!isMobile && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl text-sm font-semibold border border-white/40 dark:border-gray-700/40 shadow-lg">
                      <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                        <HelpCircle className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                        {questionNumber}/{totalQuestions}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls Section */}
            <div className="flex items-center gap-4">
              {!isMobile && (
                <div className="flex items-center gap-4">
                  <TimerDisplay initialTime={timeSpent} />
                  <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500/15 to-orange-500/15 dark:from-yellow-400/25 dark:to-orange-400/25 backdrop-blur-xl rounded-xl text-sm font-bold border border-yellow-200/60 dark:border-yellow-400/40 shadow-xl shadow-yellow-500/20">
                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl">
                      <Trophy className="h-4 w-4 text-white" />
                    </div>
                    <span className="tabular-nums bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent text-lg">
                      {progressPercentage}%
                    </span>
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
                className="shrink-0 h-10 w-10 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl border-white/30 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 rounded-xl group"
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? (
                  <X className="h-4 w-4 group-hover:text-red-500 transition-colors" />
                ) : (
                  <Menu className="h-4 w-4 group-hover:text-blue-500 transition-colors" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Stats */}
          {isMobile && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20 dark:border-gray-700/30">
              <TimerDisplay initialTime={timeSpent} />
              <div className="flex items-center gap-2 px-3 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl text-sm font-semibold border border-white/40 dark:border-gray-700/40 shadow-lg">
                <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                  <HelpCircle className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                  {questionNumber} of {totalQuestions}
                </span>
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
              quizSlug={quizSlug}
              quizData={quizData || {}}
              initialIsPublic={isPublic}
              initialIsFavorite={isFavorite}
              isOwner={isOwner}
              className="w-full"
            />
          </div>
          <RandomQuiz showStats={false} autoRotate={true} />
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
    <div
      className={`min-h-screen flex flex-col bg-gradient-to-br ${config.lightBg} dark:${config.darkBg} transition-all duration-500 ${isFullscreen ? "overflow-hidden" : ""} relative`}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(120,119,198,0.1)_360deg)]" />
      </div>

      {/* Header */}
      {!isFullscreen && HeaderComponent}

      {/* Main Content */}
      <main className="flex-1 flex max-w-screen-2xl mx-auto w-full p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="flex w-full gap-6 lg:gap-8">
          {/* Question Area */}
          <div
            ref={mainContentRef}
            className={`flex-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-gray-700/30 shadow-2xl shadow-black/20 transition-all duration-500 ${
              isFullscreen ? "p-8 lg:p-12" : "p-6 lg:p-10"
            } overflow-auto relative`}
            role="main"
            aria-label="Quiz content"
          >
            {/* Content wrapper with enhanced styling */}
            <div className="relative">
              {/* Progress Section */}
              <div className="mb-8">
                <ProgressIndicator current={questionNumber} total={totalQuestions} percentage={progressPercentage} />
              </div>

              {/* Main quiz content */}
              <div className="relative">{children}</div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-400/10 to-purple-500/10 rounded-full blur-xl" />
            <div className="absolute bottom-6 left-6 w-20 h-20 bg-gradient-to-r from-green-400/10 to-blue-500/10 rounded-full blur-xl" />
          </div>

          {/* Desktop Sidebar */}
          {sidebarOpen && !isFullscreen && (
            <aside
              className={`hidden lg:block shrink-0 space-y-6 transition-all duration-500 ${
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
  )
}
