"use client"

import { useAuth, useMediaQuery } from "@/hooks"
import { usePathname } from "next/navigation"
import { buildQuizUrl, cn } from "@/lib/utils"
import { Suspense, useEffect, useState, useRef, useMemo, useCallback, memo } from "react"
import { useSelector } from "react-redux"
import { selectQuizUserId } from "@/store/slices/quiz"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { QuizActions } from "../QuizActions"
import { RandomQuiz } from "./RandomQuiz"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { TagsDisplay } from "@/components/quiz/TagsDisplay"
import { QuizType } from "@/app/types/quiz-types"
import Footer from "@/components/shared/Footer"

import {
  ChevronLeft,
  ChevronRight,
  Timer,
  Trophy,
  Target,
  BookOpen,
  Code2,
  Focus,
  FileText,
  CreditCard,
  Play,
  Star,
  Menu,
  X,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  HelpCircle,
  Zap,
  Sparkles,
  Brain,
  Lightbulb,
} from "lucide-react"

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
    bgColor: "bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:from-blue-950/60 dark:via-blue-900/40 dark:to-indigo-950/60",
    badgeColor: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-0",
    accentColor: "bg-gradient-to-r from-blue-500 to-blue-600",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
  },
  code: { 
    icon: Code2, 
    label: "Code Quiz", 
    color: "text-emerald-700 dark:text-emerald-300", 
    bgColor: "bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-100 dark:from-emerald-950/60 dark:via-emerald-900/40 dark:to-teal-950/60",
    badgeColor: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 border-0",
    accentColor: "bg-gradient-to-r from-emerald-500 to-teal-600",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
  },
  blanks: { 
    icon: Focus, 
    label: "Fill Blanks", 
    color: "text-cyan-700 dark:text-cyan-300", 
    bgColor: "bg-gradient-to-br from-cyan-50 via-cyan-100 to-sky-100 dark:from-cyan-950/60 dark:via-cyan-900/40 dark:to-sky-950/60",
    badgeColor: "bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/25 border-0",
    accentColor: "bg-gradient-to-r from-cyan-500 to-sky-600",
    iconBg: "bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/30"
  },
  openended: { 
    icon: FileText, 
    label: "Open Ended", 
    color: "text-violet-700 dark:text-violet-300", 
    bgColor: "bg-gradient-to-br from-violet-50 via-violet-100 to-purple-100 dark:from-violet-950/60 dark:via-violet-900/40 dark:to-purple-950/60",
    badgeColor: "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 border-0",
    accentColor: "bg-gradient-to-r from-violet-500 to-purple-600",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30"
  },
  flashcard: { 
    icon: CreditCard, 
    label: "Flashcards", 
    color: "text-orange-700 dark:text-orange-300", 
    bgColor: "bg-gradient-to-br from-orange-50 via-orange-100 to-amber-100 dark:from-orange-950/60 dark:via-orange-900/40 dark:to-amber-950/60",
    badgeColor: "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25 border-0",
    accentColor: "bg-gradient-to-r from-orange-500 to-amber-600",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30"
  },
  quiz: { 
    icon: BookOpen, 
    label: "General Quiz", 
    color: "text-indigo-700 dark:text-indigo-300", 
    bgColor: "bg-gradient-to-br from-indigo-50 via-indigo-100 to-blue-100 dark:from-indigo-950/60 dark:via-indigo-900/40 dark:to-blue-950/60",
    badgeColor: "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25 border-0",
    accentColor: "bg-gradient-to-r from-indigo-500 to-blue-600",
    iconBg: "bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30"
  },
  others: { 
    icon: Play, 
    label: "Mixed Quiz", 
    color: "text-slate-700 dark:text-slate-300", 
    bgColor: "bg-gradient-to-br from-slate-50 via-slate-100 to-gray-100 dark:from-slate-950/60 dark:via-slate-900/40 dark:to-gray-950/60",
    badgeColor: "bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-500/25 border-0",
    accentColor: "bg-gradient-to-r from-slate-500 to-gray-600",
    iconBg: "bg-gradient-to-br from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-500/30"
  },
};

const QuizSkeleton = () => (
  <div className="w-full p-6 space-y-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl animate-pulse">
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
      <Skeleton className="h-5 w-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
    </div>
    <Skeleton className="h-3 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
    <Skeleton className="h-40 w-full rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
      <Skeleton className="h-8 w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
    </div>
  </div>
)

// Enhanced Timer component with vibrant colors
const TimerDisplay = memo(({ initialTime = 0 }: { initialTime?: number }) => {
  const [timeSpent, setTimeSpent] = useState(initialTime)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (initialTime === 0) {
      intervalRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [initialTime])

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
      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/20 dark:to-purple-400/20 backdrop-blur-xl rounded-xl text-sm font-semibold border border-blue-200/50 dark:border-blue-400/30 shadow-lg shadow-blue-500/10"
      role="timer"
      aria-label={`Time elapsed: ${formatTime(displayTime)}`}
    >
      <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
        <Clock className="h-3.5 w-3.5 text-white" />
      </div>
      <span className="tabular-nums bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        {formatTime(displayTime)}
      </span>
    </div>
  )
})

TimerDisplay.displayName = "TimerDisplay"

// Enhanced Progress component with vibrant gradients
const ProgressIndicator = memo(({ current, total, percentage }: { current: number, total: number, percentage: number }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
            <CheckCircle className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
            Question {current} of {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            {percentage}%
          </span>
        </div>
      </div>
      
      <div className="relative">
        <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out shadow-lg shadow-blue-500/30"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
      </div>
      
      <div className="flex justify-between text-xs font-medium">
        <span className="text-green-600 dark:text-green-400">Started</span>
        <span className="text-orange-600 dark:text-orange-400">{total - current} remaining</span>
        <span className="text-purple-600 dark:text-purple-400">Complete</span>
      </div>
    </div>
  )
})

ProgressIndicator.displayName = "ProgressIndicator"

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
  const quizOwnerId = useSelector(selectQuizUserId)
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Quiz metadata with better defaults
  const quizTitle = quizData?.title || "Untitled Quiz"
  const quizSubtitle = quizData?.subtitle || ""
  const difficulty = quizData?.difficulty || "medium"
  const totalQuestions = Math.max(1, quizData?.questions?.length || 1)
  const questionNumber = Math.max(
    1,
    Math.min(quizData?.currentQuestionIndex !== undefined ? quizData.currentQuestionIndex + 1 : 1, totalQuestions)
  )
  
  // Auth and ownership
  const authUser = useAuth().user
  userId = authUser?.id || ""
  const isOwner = quizOwnerId === userId

  // Enhanced callbacks with better performance
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case 'Escape':
          if (sidebarOpen && isMobile) {
            closeSidebar()
          }
          break
        case 's':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            toggleSidebar()
          }
          break
        case 'f':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            toggleFullscreen()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen, isMobile, closeSidebar, toggleSidebar, toggleFullscreen])

  // Responsive sidebar behavior
  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  // Loading state with better timing
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 150)
    return () => clearTimeout(timer)
  }, [])

  // Enhanced focus management
  useEffect(() => {
    if (mainContentRef.current && isLoaded) {
      const timer = setTimeout(() => {
        const firstFocusable = mainContentRef.current?.querySelector(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement | null
        if (firstFocusable) {
          firstFocusable.focus()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [questionNumber, isLoaded])

  // Derived values with better memoization
  const config = useMemo(() => quizTypeConfig[quizType] || quizTypeConfig.quiz, [quizType])
  const Icon = config.icon
  const progressPercentage = useMemo(() => 
    Math.min(100, Math.max(0, Math.round((questionNumber / totalQuestions) * 100))), 
    [questionNumber, totalQuestions]
  )

  // Enhanced header component with vibrant colors
  const HeaderComponent = useMemo(() => (
    <header 
      className={`sticky top-0 z-50 backdrop-blur-2xl border-b border-white/20 dark:border-gray-700/30 ${config.bgColor} transition-all duration-500 shadow-xl shadow-black/5`}
      role="banner"
    >
      <div className="max-w-screen-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Quiz Info Section */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className={`p-3 rounded-2xl ${config.iconBg} transition-all duration-300 hover:scale-110 hover:rotate-3`}>
              <Icon className="h-6 w-6" />
            </div>
            
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-xl truncate leading-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-1">
                {quizTitle}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`text-xs px-3 py-1.5 font-bold ${config.badgeColor} transition-all duration-300 hover:scale-105`}>
                  {config.label}
                </Badge>
                <DifficultyBadge difficulty={difficulty} />
                {!isMobile && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl text-sm font-semibold border border-white/30 dark:border-gray-700/30 shadow-lg">
                    <div className="p-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                      <HelpCircle className="h-3 w-3 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {questionNumber}/{totalQuestions}
                    </span>
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
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 dark:from-yellow-400/20 dark:to-orange-400/20 backdrop-blur-xl rounded-xl text-sm font-semibold border border-yellow-200/50 dark:border-yellow-400/30 shadow-lg shadow-yellow-500/10">
                  <div className="p-1 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
                    <Trophy className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="tabular-nums bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    {progressPercentage}%
                  </span>
                </div>
              </div>
            )}

            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleSidebar}
              className="shrink-0 h-10 w-10 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl border-white/30 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 rounded-xl"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Enhanced Progress Section */}
        <div className="mt-5">
          <ProgressIndicator 
            current={questionNumber} 
            total={totalQuestions} 
            percentage={progressPercentage} 
          />
        </div>

        {/* Mobile Stats */}
        {isMobile && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20 dark:border-gray-700/30">
            <TimerDisplay initialTime={timeSpent} />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl text-sm font-semibold border border-white/30 dark:border-gray-700/30 shadow-lg">
              <div className="p-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                <HelpCircle className="h-3 w-3 text-white" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {questionNumber} of {totalQuestions}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  ), [quizTitle, config, Icon, difficulty, questionNumber, totalQuestions, progressPercentage, timeSpent, sidebarOpen, toggleSidebar, isMobile])

  // Enhanced sidebar component with vibrant colors
  const SidebarComponent = useMemo(() => (
    <div className="space-y-4">
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-2xl shadow-black/10">
        <h3 className="font-bold text-base mb-4 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl">
            <Star className="h-4 w-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Quiz Actions
          </span>
        </h3>
        <QuizActions
          quizSlug={quizSlug}
          quizData={quizData}
          initialIsFavorite={isFavorite}
          initialIsPublic={isPublic}
          isOwner={isOwner}
        />
      </div>
    </div>
  ), [quizSlug, quizData, isFavorite, isPublic, isOwner])

  const RandomQuizComponent = useMemo(() => (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-2xl shadow-black/10">
      <h3 className="font-bold text-base mb-4 flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
          Discover More
        </span>
      </h3>
      <Suspense fallback={<QuizSkeleton />}>
        <RandomQuiz showStats={true} autoRotate={true} />
      </Suspense>
    </div>
  ), [])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto rounded-full"></div>
            <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
              <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Loading your quiz experience...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 transition-all duration-500 ${isFullscreen ? 'overflow-hidden' : ''}`}>
      {/* Header */}
      {!isFullscreen && HeaderComponent}

      {/* Main Content */}
      <main className="flex-1 flex max-w-screen-2xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="flex w-full gap-6 lg:gap-8">
          {/* Question Area */}
          <div 
            ref={mainContentRef}
            className={`flex-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl shadow-black/10 transition-all duration-500 ${
              isFullscreen ? 'p-10' : 'p-8 lg:p-10'
            } overflow-auto`}
            role="main"
            aria-label="Quiz content"
          >
            {/* Fullscreen toggle */}
            {!isMobile && (
              <div className="flex justify-end mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-700/30 transition-all duration-300 hover:scale-105"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <div className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      <span className="text-xs">Exit</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span className="text-xs">Focus</span>
                    </div>
                  )}
                </Button>
              </div>
            )}
            
            {children}
          </div>

          {/* Desktop Sidebar */}
          {sidebarOpen && !isFullscreen && (
            <aside className={`hidden lg:block shrink-0 space-y-6 transition-all duration-500 ${
              isTablet ? 'w-72' : 'w-80'
            }`}>
              {SidebarComponent}
              {RandomQuizComponent}
            </aside>
          )}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && isMobile && !isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-500" 
          onClick={closeSidebar}
          role="dialog"
          aria-modal="true"
          aria-label="Quiz sidebar"
        >
          <div 
            className="absolute right-0 top-0 h-full w-5/6 max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-l border-white/20 dark:border-gray-700/30 p-6 shadow-2xl transform transition-all duration-500"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Lightbulb className="h-4 w-4 text-white" />
                </div>
                Quiz Menu
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={closeSidebar}
                className="h-10 w-10 p-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-700/30 transition-all duration-300 hover:scale-105"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)]">
              {SidebarComponent}
              {RandomQuizComponent}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {!isFullscreen && <Footer />}
    </div>
  )
}

