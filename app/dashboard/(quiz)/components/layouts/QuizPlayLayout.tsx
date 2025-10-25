"use client"

import type React from "react"
import { useMediaQuery } from "@/hooks"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useState, useRef, useMemo, useCallback, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { BreadcrumbNavigation } from "@/components/navigation/BreadcrumbNavigation"
import {
  Clock,
  Home,
  Maximize,
  Minimize,
  X,
  Target,
  Play,
  Pause,
  BookOpen,
  Award,
  Zap,
  Edit3,
  MessageSquare,
  Brain,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

import { RandomQuiz } from "./RandomQuiz"
import { useRelatedQuizzes } from "@/hooks/useRelatedQuizzes"
import { motion, AnimatePresence } from "framer-motion"
import RecommendedSection from "@/components/shared/RecommendedSection"
import { cn } from "@/lib/utils"

import { useAuth } from "@/modules/auth"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import { QuizActions } from "@/components/quiz/QuizActions"

interface QuizContextType {
  isFocusMode: boolean
  toggleFocusMode: () => void
  isFullscreen: boolean
  setIsFullscreen: (value: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (value: boolean) => void
}

const QuizContext = createContext<QuizContextType | undefined>(undefined)

export const useQuizContext = () => {
  const context = useContext(QuizContext)
  if (context === undefined) {
    throw new Error("useQuizContext must be used within a QuizPlayLayout")
  }
  return context
}

interface QuizPlayLayoutProps {
  children: React.ReactNode
  quizSlug?: string
  quizType?: "mcq" | "code" | "blanks" | "quiz" | "openended" | "flashcard" | "ordering" | "others"
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
  ordering: "Ordering Quiz",
  quiz: "Quiz",
  others: "Mixed Quiz",
}

const quizTypeIcons: Record<string, React.ComponentType<any>> = {
  mcq: Target,
  code: BookOpen,
  blanks: Edit3,
  openended: MessageSquare,
  flashcard: Brain,
  ordering: Zap,
  quiz: Award,
  others: Zap,
}

const QuizSkeleton = () => (
  <motion.div
    className="w-full p-3 sm:p-4 space-y-2 sm:space-y-3 bg-card border-4 border-border rounded-lg shadow-neo"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    role="status"
    aria-label="Loading quiz content"
  >
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 sm:h-6 w-32 sm:w-40 rounded-lg bg-muted" />
      <Skeleton className="h-4 sm:h-5 w-16 sm:w-20 rounded-lg bg-muted" />
    </div>
    <Skeleton className="h-3 sm:h-4 w-full rounded-lg bg-muted" />
    <Skeleton className="h-3 sm:h-4 w-3/4 rounded-lg bg-muted" />
    <Skeleton className="h-40 sm:h-48 w-full rounded-lg bg-muted" />
    <div className="flex gap-2">
      <Skeleton className="h-9 sm:h-10 flex-1 rounded-lg bg-muted" />
      <Skeleton className="h-9 sm:h-10 w-24 sm:w-28 rounded-lg bg-muted" />
    </div>
  </motion.div>
)

const Timer = ({ seconds, isPaused }: { seconds: number; isPaused?: boolean }) => {
  const formatTime = (s: number) => {
    const safeSeconds = Math.max(0, Math.floor(s || 0))
    if (safeSeconds === 0) return "0:00"
    if (safeSeconds < 60) return `0:${safeSeconds.toString().padStart(2, "0")}`
    const m = Math.floor(safeSeconds / 60)
    const rem = safeSeconds % 60
    return `${m}:${rem.toString().padStart(2, "0")}`
  }

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-black transition-all duration-100 border-3 sm:border-4 border-border shadow-neo-sm",
        isPaused ? "bg-muted text-muted-foreground" : "bg-accent text-white",
      )}
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ duration: 0.1 }}
      layout
      aria-live="polite"
      aria-label={`Timer: ${formatTime(seconds)}, ${isPaused ? "paused" : "running"}`}
    >
      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
      <span className="tabular-nums font-mono font-black text-xs sm:text-sm">{formatTime(seconds)}</span>
      {isPaused && <Pause className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden="true" />}
    </motion.div>
  )
}

const QuizHeader = ({
  title,
  quizType,
  difficulty,
  questionNumber,
  totalQuestions,
  displaySeconds,
  isPaused,
  isFullscreen,
  sidebarOpen,
  isMobile,
  isSidebarTransitioning,
  onTogglePause,
  onGoHome,
  onToggleFullscreen,
  onToggleSidebar,
  progress,
}: any) => {
  const QuizTypeIcon = quizTypeIcons[quizType] || Award

  return (
    <motion.header
      className="border-b-4 border-border bg-card shadow-neo"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div
        className={cn(
          "mx-auto w-full py-3 sm:py-4 transition-all duration-300",
          isFullscreen ? "max-w-none px-3 sm:px-4" : "max-w-7xl px-3 sm:px-4 lg:px-8",
        )}
      >
        {/* Main header row */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-0">
          <motion.div
            className="min-w-0 flex-1 flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-lg bg-accent border-3 sm:border-4 border-border text-white shadow-neo-sm sm:shadow-neo flex-shrink-0">
                <QuizTypeIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h1
                  className="text-sm sm:text-base lg:text-lg font-black text-foreground truncate mb-0.5 sm:mb-1"
                  title={title}
                >
                  {title}
                </h1>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Badge
                    variant="neutral"
                    className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-black bg-accent text-white border-2 sm:border-4 border-border shadow-neo-sm rounded-md sm:rounded-lg"
                  >
                    {quizTypeLabel[quizType] || "Quiz"}
                  </Badge>
                  <DifficultyBadge difficulty={difficulty} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Desktop controls */}
          <motion.div
            className="hidden sm:flex items-center gap-1.5 sm:gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-card rounded-lg border-4 border-border shadow-neo">
              <Badge
                variant="neutral"
                className="px-2 py-1 text-xs font-black bg-accent text-white border-4 border-border shadow-neo-sm rounded-md"
              >
                {progress}%
              </Badge>
              <Timer seconds={displaySeconds} isPaused={isPaused} />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="neutral"
                size="sm"
                onClick={onTogglePause}
                className="hover:bg-muted transition-all duration-100 border-4 sm:border-6 border-border shadow-neo-sm h-9 w-9 sm:h-11 sm:w-11 p-0 rounded-lg bg-card"
                aria-label={isPaused ? "Resume quiz" : "Pause quiz"}
              >
                {isPaused ? (
                  <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </Button>

              <Button
                variant="neutral"
                size="sm"
                onClick={onGoHome}
                className="hover:bg-muted transition-all duration-100 border-4 sm:border-6 border-border shadow-neo-sm h-9 w-9 sm:h-11 sm:w-11 p-0 rounded-lg bg-card"
                aria-label="Go to dashboard"
              >
                <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>

              <Button
                variant="neutral"
                size="sm"
                onClick={onToggleFullscreen}
                className="hover:bg-muted transition-all duration-100 border-4 sm:border-6 border-border shadow-neo-sm h-9 w-9 sm:h-11 sm:w-11 p-0 rounded-lg bg-card"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <Maximize className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </Button>

              <Button
                variant="neutral"
                size="sm"
                onClick={onToggleSidebar}
                disabled={isSidebarTransitioning}
                className="hover:bg-muted transition-all duration-100 border-4 sm:border-6 border-border shadow-neo-sm h-9 w-9 sm:h-11 sm:w-11 p-0 rounded-lg bg-card"
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <PanelLeftOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Mobile progress bar */}
        {isMobile && (
          <motion.div
            className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 bg-card rounded-lg border-4 sm:border-6 border-border shadow-neo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Badge
              variant="neutral"
              className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-black bg-accent text-white border-4 sm:border-6 border-border shadow-neo-sm rounded-md"
            >
              {progress}%
            </Badge>
            <Timer seconds={displaySeconds} isPaused={isPaused} />
            <Button
              variant="neutral"
              size="sm"
              onClick={onTogglePause}
              className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-muted border-4 sm:border-6 border-border shadow-neo-sm transition-all duration-100 rounded-lg bg-card"
              aria-label={isPaused ? "Resume quiz" : "Pause quiz"}
            >
              {isPaused ? (
                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}

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
  const isMobile = useMediaQuery("(max-width: 767px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")
  const pathname = usePathname()
  const [isLoaded, setIsLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [showEngage, setShowEngage] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSidebarTransitioning, setIsSidebarTransitioning] = useState(false)

  const [localIsPublic, setLocalIsPublic] = useState(isPublic)
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite)

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
    tags: Array.isArray(quizData?.tags) ? quizData?.tags : undefined,
  })
  const [showConfetti, setShowConfetti] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const { user: authUser } = useAuth()
  const { subscription } = useUnifiedSubscription()

  const isOwner = useMemo((): boolean => {
    const sessionUserId = authUser?.id
    const quizUserId = quizData?.userId
    const owner = Boolean(sessionUserId && quizUserId && String(sessionUserId) === String(quizUserId))
    return owner
  }, [authUser?.id, quizData?.userId])

  const isSubscribed = useMemo(() => {
    return subscription?.isSubscribed === true
  }, [subscription?.isSubscribed])

  const subscriptionExpired = useMemo(() => {
    if (!subscription?.expirationDate) return false
    return new Date(subscription.expirationDate) < new Date()
  }, [subscription?.expirationDate])

  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    setIsLoaded(true)
    if (timeSpent > 0) return

    const interval = setInterval(() => {
      if (!isPaused) {
        setElapsed((e) => Math.max(0, e + 1))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isPaused, timeSpent])

  useEffect(() => {
    if (!quizSlug) return
    const key = `ai_quiz_engagement_${quizSlug}`
    const seen = typeof window !== "undefined" ? localStorage.getItem(key) : null
    if (seen === null) {
      const t = setTimeout(() => setShowEngage(true), 2000)
      return () => clearTimeout(t)
    }
  }, [quizSlug])

  const title = quizData?.title || "Untitled Quiz"
  const difficulty = quizData?.difficulty || "medium"
  const totalQuestions = Math.max(1, Array.isArray(quizData?.questions) ? quizData.questions.length : 1)
  const questionNumber = Math.max(
    1,
    Math.min(
      quizData?.currentQuestionIndex !== undefined && typeof quizData.currentQuestionIndex === "number"
        ? quizData.currentQuestionIndex + 1
        : 1,
      totalQuestions,
    ),
  )

  const toggleSidebar = useCallback(() => {
    setIsSidebarTransitioning(true)
    setSidebarOpen((s) => !s)
    setTimeout(() => setIsSidebarTransitioning(false), 300)
  }, [])

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((f) => !f)
  }, [])

  const toggleFullscreen = useCallback(() => setIsFullscreen((s) => !s), [])
  const togglePause = useCallback(() => setIsPaused((p) => !p), [])
  const goHome = useCallback(() => (window.location.href = "/dashboard/quizzes"), [])
  const resetQuiz = useCallback(() => {
    setElapsed(0)
  }, [])

  const handleVisibilityChange = useCallback((newIsPublic: boolean) => {
    setLocalIsPublic(newIsPublic)
  }, [])

  const handleFavoriteChange = useCallback((newIsFavorite: boolean) => {
    setLocalIsFavorite(newIsFavorite)
  }, [])

  const handleDelete = useCallback(() => {
    window.location.href = "/dashboard/quizzes"
  }, [])

  const progress = useMemo(
    () => Math.min(100, Math.max(0, Math.round((questionNumber / totalQuestions) * 100))),
    [questionNumber, totalQuestions],
  )

  const hideSidebarActions = useMemo(() => {
    if (!pathname) return false
    const p = pathname.toLowerCase()
    return p.includes("/results") || p.includes("/review") || p.includes("/result")
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile &&
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        mainRef.current &&
        !mainRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobile, sidebarOpen])

  useEffect(() => {
    if (progress === 100) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(t)
    }
  }, [progress])

  const canResume = questionNumber > 1

  const prevIsMobileRef = useRef<boolean | null>(null)
  useEffect(() => {
    if (prevIsMobileRef.current === null) {
      prevIsMobileRef.current = isMobile
      setSidebarOpen(!isMobile)
      return
    }

    if (prevIsMobileRef.current !== isMobile) {
      setSidebarOpen(!isMobile)
      prevIsMobileRef.current = isMobile
    }
  }, [isMobile])

  const canViewQuiz = useMemo(() => {
    if (isPublic) return true
    return isOwner
  }, [isPublic, isOwner])

  if (!canViewQuiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          className="text-center p-6 sm:p-8 bg-card rounded-lg shadow-neo border-4 border-border max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Lock
            className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto mb-4 text-muted-foreground"
            aria-hidden="true"
          />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground mb-2">Private Quiz</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            This quiz is private and can only be viewed by its owner.
          </p>
          {!authUser && <p className="text-sm text-muted-foreground mb-4">Please log in to access private quizzes.</p>}
          <Button
            onClick={goHome}
            className="mt-4 border-4 border-border shadow-neo bg-accent text-white hover:bg-accentHover font-black rounded-lg px-4 sm:px-6 py-2 sm:py-2.5"
            aria-label="Return to quizzes dashboard"
          >
            Return to Dashboard
          </Button>
        </motion.div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-4 border-accent mx-auto"></div>
          <p className="text-muted-foreground font-black text-sm sm:text-base">Loading quiz...</p>
        </div>
      </div>
    )
  }

  const displaySeconds = Math.max(0, timeSpent > 0 ? timeSpent : elapsed)

  return (
    <div className={cn("min-h-screen bg-background relative overflow-x-hidden", isFullscreen && "overflow-hidden")}>
      {/* Top spacer for MainNavbar */}
      <div className="h-16" aria-hidden="true" />

      {/* Quiz header */}
      <QuizHeader
        title={title}
        quizType={quizType}
        difficulty={difficulty}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        displaySeconds={displaySeconds}
        isPaused={isPaused}
        isFullscreen={isFullscreen}
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
        isSidebarTransitioning={isSidebarTransitioning}
        onTogglePause={togglePause}
        onGoHome={goHome}
        onToggleFullscreen={toggleFullscreen}
        onToggleSidebar={toggleSidebar}
        progress={progress}
      />

      {/* Mobile sidebar toggle button */}
      {isMobile && !isFullscreen && !isFocusMode && (
        <div className="fixed bottom-4 right-4 z-50 lg:hidden">
          <Button
            variant="neutral"
            size="sm"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="h-12 w-12 p-0 border-4 border-border shadow-neo rounded-lg bg-card hover:bg-muted"
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </Button>
        </div>
      )}

      <main
        className={cn(
          "mx-auto w-full transition-all duration-300 space-y-3 sm:space-y-4",
          isFullscreen ? "px-2 sm:px-4 max-w-none py-3 sm:py-4" : "max-w-7xl px-3 sm:px-4 lg:px-8 py-3 sm:py-4",
        )}
      >
        {/* Breadcrumb Navigation */}
        {!isFullscreen && <BreadcrumbNavigation />}

        {/* Resume CTA */}
        <AnimatePresence>
          {canResume && !isFullscreen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden rounded-lg border-4 border-border bg-card shadow-neo"
            >
              <div className="relative p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-2.5 rounded-lg bg-accent border-3 sm:border-4 border-border shadow-neo-sm flex-shrink-0">
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-black text-foreground text-sm sm:text-base">Continue where you left off</p>
                    <p className="text-muted-foreground mt-0.5 font-bold text-xs sm:text-sm">
                      Question {questionNumber} of {totalQuestions}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-black w-full sm:w-auto border-4 border-border shadow-neo rounded-lg bg-accent text-white hover:bg-accentHover"
                  aria-label="Resume quiz from current question"
                >
                  Resume Quiz
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content grid */}
        <div
          className={cn(
            "transition-all duration-300",
            sidebarOpen && !isFocusMode && !isFullscreen && !isMobile
              ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-3 sm:gap-4 lg:gap-6"
              : "flex",
          )}
        >
          {/* Main Content */}
          <motion.section
            ref={mainRef}
            className={cn(
              "w-full rounded-lg border-4 border-border bg-card shadow-neo transition-all duration-300",
              isFullscreen ? "p-3 sm:p-4 lg:p-6 min-h-[calc(100vh-8rem)]" : "p-4 sm:p-6 lg:p-8",
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            aria-label="Quiz content"
          >
            <div className="w-full h-full">
              <QuizContext.Provider
                value={{
                  isFocusMode,
                  toggleFocusMode: () => setIsFocusMode((f) => !f),
                  isFullscreen,
                  setIsFullscreen,
                  sidebarOpen,
                  setSidebarOpen,
                }}
              >
                {children}
              </QuizContext.Provider>
            </div>
          </motion.section>

          {/* Desktop Sidebar */}
          <AnimatePresence>
            {sidebarOpen && !isFocusMode && !isFullscreen && !isMobile && (
              <motion.aside
                ref={sidebarRef}
                className="hidden lg:block w-full max-w-[320px]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                aria-label="Quiz sidebar with actions and recommendations"
              >
                <div className="space-y-4">
                  <motion.div
                    className="rounded-lg p-4 bg-card border-4 border-border shadow-neo"
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
                          userId={quizData?.userId}
                          onVisibilityChange={handleVisibilityChange}
                          onFavoriteChange={handleFavoriteChange}
                          onDelete={handleDelete}
                          className="w-full"
                        />
                      </Suspense>
                    )}
                  </motion.div>

                  <motion.div
                    className="rounded-lg p-4 bg-card border-4 border-border shadow-neo"
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

        {/* Related Quizzes Section */}
        <AnimatePresence>
          {!isFullscreen && relatedQuizzes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8 w-full"
              aria-label="Recommended quizzes"
            >
              <RecommendedSection title="Continue Learning">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedQuizzes.slice(0, 3).map((rq, index) => {
                    const getDifficultyInfo = (count: number) => {
                      if (count <= 5)
                        return { label: "Beginner", color: "bg-green-100 text-green-800 border-green-800" }
                      if (count <= 15)
                        return { label: "Intermediate", color: "bg-blue-100 text-blue-800 border-blue-800" }
                      return { label: "Advanced", color: "bg-red-100 text-red-800 border-red-800" }
                    }
                    const difficulty = getDifficultyInfo(rq.questionCount)

                    return (
                      <motion.a
                        key={rq.id}
                        href={`/dashboard/${rq.quizType}/${rq.slug}`}
                        className="group rounded-xl border-4 border-border hover:border-border bg-card p-4 shadow-neo hover:shadow-neo-lg hover:-translate-y-1 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 overflow-hidden relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        aria-label={`Try ${rq.title} quiz`}
                      >
                        {/* Accent bar */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-primary" />

                        <div className="flex items-start justify-between mb-3 mt-1">
                          <div className="p-2 rounded-lg bg-primary/20 text-primary border-4 border-border shadow-neo-sm">
                            <BookOpen className="w-4 h-4" aria-hidden="true" />
                          </div>
                          <Badge
                            variant="neutral"
                            className={cn("text-xs font-black border-4 border-border shadow-neo-sm", difficulty.color)}
                          >
                            {difficulty.label}
                          </Badge>
                        </div>

                        <h3 className="font-black text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2 text-sm">
                          {rq.title}
                        </h3>

                        <p className="text-xs text-muted-foreground line-clamp-1 mb-3 font-bold">
                          {rq.difficulty || "Quiz"}
                        </p>

                        <div className="flex items-center gap-2 text-xs mb-3">
                          <Badge
                            variant="neutral"
                            className="text-xs font-black border-4 border-border bg-primary/15 text-primary shadow-neo-sm"
                          >
                            {rq.quizType?.toUpperCase()}
                          </Badge>
                          <span className="font-black text-foreground">{rq.questionCount}</span>
                          <span className="text-muted-foreground font-bold">questions</span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t-4 border-border">
                          <span className="text-sm text-green-600 font-black group-hover:text-green-700 transition-colors">
                            Start →
                          </span>
                          <Play
                            className="w-4 h-4 text-green-600 group-hover:scale-125 transition-transform"
                            aria-hidden="true"
                          />
                        </div>
                      </motion.a>
                    )
                  })}
                </div>
              </RecommendedSection>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Sidebar Modal */}
      <AnimatePresence>
        {sidebarOpen && !isFocusMode && !isFullscreen && isMobile && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile quiz sidebar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60"
              onClick={() => setSidebarOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden="true"
            />
            <motion.div
              className="absolute right-0 top-0 h-full w-full sm:w-5/6 max-w-sm bg-card border-l-4 border-border shadow-neo"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              ref={sidebarRef}
            >
              <div className="flex items-center justify-between p-4 border-b-4 border-border min-h-[4rem]">
                <h2 className="text-lg font-black text-foreground">Quiz Panel</h2>
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="hover:bg-muted min-h-[44px] min-w-[44px] p-3 border-4 border-border shadow-neo rounded-lg bg-card"
                  aria-label="Close sidebar"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="overflow-y-auto max-h-[calc(100vh-5rem)] p-4 space-y-4">
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
                    userId={quizData?.userId}
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
