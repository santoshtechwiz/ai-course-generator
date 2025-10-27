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
  PanelLeftOpen
} from "lucide-react"

import { RandomQuiz } from "@/app/dashboard/(quiz)/components/layouts/RandomQuiz"
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
    throw new Error("useQuizContext must be used within a QuizPlayInterface")
  }
  return context
}

interface QuizPlayInterfaceProps {
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
        isPaused ? "bg-muted text-muted-foreground" : "bg-[var(--color-accent)] text-[var(--color-bg)]",
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
              <div className="p-2 sm:p-2.5 rounded-lg bg-[var(--color-accent)] border-3 sm:border-4 border-border text-[var(--color-bg)] shadow-neo-sm sm:shadow-neo flex-shrink-0">
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
                    className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-black bg-[var(--color-accent)] text-[var(--color-bg)] border-2 sm:border-4 border-border shadow-neo-sm rounded-md sm:rounded-lg"
                  >
                    {quizTypeLabel[quizType] || "Quiz"}
                  </Badge>
                  {difficulty && <DifficultyBadge difficulty={difficulty} />}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-muted-foreground">
                    <span>Question</span>
                    <span className="tabular-nums font-mono font-black text-foreground">
                      {questionNumber || 0}
                    </span>
                    <span>of</span>
                    <span className="tabular-nums font-mono font-black text-foreground">
                      {totalQuestions || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Timer seconds={displaySeconds} isPaused={isPaused} />

            {!isFullscreen && (
              <Button
                variant="neutral"
                size="sm"
                onClick={onToggleSidebar}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                className={cn(
                  "hidden sm:flex min-h-[44px] min-w-[44px] p-3 border-4 border-border shadow-neo rounded-lg bg-card hover:bg-muted transition-all duration-200",
                  isSidebarTransitioning && "pointer-events-none opacity-50",
                  // Hide on desktop since sidebar is always visible
                  !isMobile && "lg:hidden"
                )}
                disabled={isSidebarTransitioning}
              >
                {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
              </Button>
            )}

            <Button
              variant="neutral"
              size="sm"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="min-h-[44px] min-w-[44px] p-3 border-4 border-border shadow-neo rounded-lg bg-card hover:bg-muted"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </Button>

            <Button
              variant="neutral"
              size="sm"
              onClick={onGoHome}
              aria-label="Return to quizzes dashboard"
              className="min-h-[44px] min-w-[44px] p-3 border-4 border-border shadow-neo rounded-lg bg-card hover:bg-muted"
            >
              <Home className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>

        {/* Progress bar */}
        {progress !== undefined && (
          <motion.div
            className="mt-3 sm:mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-muted-foreground mb-2">
              <span>Progress</span>
              <span className="tabular-nums font-mono font-black text-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 sm:h-3 border-2 border-border shadow-neo-sm overflow-hidden">
              <motion.div
                className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300 ease-out"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, delay: 0.5 }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}

export function QuizPlayInterface({
  children,
  quizSlug,
  quizType,
  quizId,
  isPublic,
  isFavorite,
  quizData,
  timeSpent,
}: QuizPlayInterfaceProps) {
  const pathname = usePathname()
  const { user: authUser } = useAuth()
  const { plan } = useUnifiedSubscription()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // State management
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile) // Always open on desktop
  const [isSidebarTransitioning, setIsSidebarTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [startTime] = useState(Date.now())

  const mainRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Local state for quiz data
  const [localIsPublic, setLocalIsPublic] = useState(isPublic)
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite)

  // Computed values
  const isOwner = authUser?.id === quizData?.userId
  const canResume = quizData?.currentQuestionIndex > 0
  const questionNumber = quizData?.currentQuestionIndex + 1 || 1
  const totalQuestions = quizData?.questions?.length || 0
  const progress = totalQuestions > 0 ? ((questionNumber - 1) / totalQuestions) * 100 : 0
  const title = quizData?.title || "Quiz"
  const difficulty = quizData?.difficulty

  // Timer effect
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused, startTime])

  // Sidebar toggle with transition (only for mobile)
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsSidebarTransitioning(true)
      setSidebarOpen(prev => !prev)
      setTimeout(() => setIsSidebarTransitioning(false), 300)
    }
  }, [isMobile])

  // Other handlers
  const toggleFocusMode = useCallback(() => setIsFocusMode(prev => !prev), [])
  const toggleFullscreen = useCallback(() => setIsFullscreen(prev => !prev), [])
  const togglePause = useCallback(() => setIsPaused(prev => !prev), [])
  const goHome = useCallback(() => window.location.href = "/dashboard/quizzes", [])

  // Event handlers
  const handleVisibilityChange = useCallback((isPublic: boolean) => {
    setLocalIsPublic(isPublic)
  }, [])

  const handleFavoriteChange = useCallback((isFavorite: boolean) => {
    setLocalIsFavorite(isFavorite)
  }, [])

  const handleDelete = useCallback(() => {
    window.location.href = "/dashboard/quizzes"
  }, [])

  // Context value
  const contextValue = useMemo(() => ({
    isFocusMode,
    toggleFocusMode,
    isFullscreen,
    setIsFullscreen,
    sidebarOpen,
    setSidebarOpen,
  }), [isFocusMode, isFullscreen, sidebarOpen])

  // Private quiz check
  if (!localIsPublic && !isOwner) {
    return (
      <motion.div
        className="min-h-[60vh] flex items-center justify-center p-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center space-y-4 max-w-md">
          <div className="p-4 rounded-lg bg-muted border-4 border-border shadow-neo">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground mb-2">Private Quiz</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            This quiz is private and can only be viewed by its owner.
          </p>
          {!authUser && <p className="text-sm text-muted-foreground mb-4">Please log in to access private quizzes.</p>}
          <Button
            onClick={goHome}
            className="mt-4 border-4 border-border shadow-neo bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent)]/90 font-black rounded-lg px-4 sm:px-6 py-2 sm:py-2.5"
            aria-label="Return to quizzes dashboard"
          >
            Return to Dashboard
          </Button>
        </div>
      </motion.div>
    )
  }

  const displaySeconds = Math.max(0, (timeSpent || 0) > 0 ? (timeSpent || 0) : elapsed)

  return (
    <QuizContext.Provider value={contextValue}>
      <div className={cn("min-h-screen bg-background relative overflow-x-hidden", isFullscreen && "overflow-hidden")}>
        {/* Top spacer for MainNavbar */}

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

        {/* Main content area with responsive layout */}
        <div className={cn(
          "mx-auto w-full transition-all duration-300",
          isFullscreen ? "px-2 sm:px-4 max-w-none py-3 sm:py-4" : "max-w-7xl px-3 sm:px-4 lg:px-8 py-3 sm:py-4",
          // Desktop: Two-column grid, Mobile: Single column
          !isFullscreen && !isMobile && "grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_400px] gap-4 lg:gap-6 xl:gap-8"
        )}>
          {/* Left column: Quiz content */}
          <div className="space-y-3 sm:space-y-4">
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
                      <div className="p-2 sm:p-2.5 rounded-lg bg-[var(--color-accent)] border-3 sm:border-4 border-border shadow-neo-sm flex-shrink-0">
                        <Play className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-bg)]" aria-hidden="true" />
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
                      className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-black w-full sm:w-auto border-4 border-border shadow-neo rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent)]/90"
                      aria-label="Resume quiz from current question"
                    >
                      Resume Quiz
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main quiz content */}
            <div ref={mainRef}>
              {children}
            </div>
          </div>

          {/* Right column: Sidebar content (desktop) or overlay (mobile) */}
          <AnimatePresence>
            {(sidebarOpen || (!isMobile && !isFullscreen)) && (
              <motion.div
                className={cn(
                  "space-y-4",
                  // Desktop: Always visible in grid
                  !isMobile && !isFullscreen && "block",
                  // Mobile: Overlay
                  isMobile && "fixed inset-0 z-40 lg:hidden"
                )}
                initial={isMobile ? { opacity: 0 } : { opacity: 1, x: 0 }}
                animate={isMobile ? { opacity: 1 } : { opacity: 1, x: 0 }}
                exit={isMobile ? { opacity: 0 } : { opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Mobile overlay backdrop */}
                {isMobile && (
                  <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                  />
                )}

                {/* Sidebar content */}
                <motion.div
                  className={cn(
                    "bg-card border-4 border-border shadow-neo rounded-lg overflow-hidden",
                    // Desktop: Normal positioning
                    !isMobile && "sticky top-4",
                    // Mobile: Slide in from right
                    isMobile && "absolute right-0 top-0 h-full w-full sm:w-5/6 max-w-sm"
                  )}
                  initial={isMobile ? { x: "100%" } : { x: 0 }}
                  animate={isMobile ? { x: 0 } : { x: 0 }}
                  exit={isMobile ? { x: "100%" } : { x: 20 }}
                  transition={isMobile ? { type: "spring", damping: 25, stiffness: 200 } : { duration: 0.2 }}
                  ref={sidebarRef}
                >
                  {/* Mobile sidebar header */}
                  {isMobile && (
                    <div className="flex items-center justify-between p-4 border-b-4 border-border min-h-[4rem]">
                      <h2 className="text-lg font-black text-foreground">More Quizzes</h2>
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
                  )}

                  {/* Sidebar content */}
                  <div
                    className={cn(
                      "overflow-y-auto p-4 space-y-4 scrollbar-hide",
                      isMobile ? "max-h-[calc(100vh-5rem)]" : "max-h-[calc(100vh-8rem)]"
                    )}
                  >
                    {/* Quiz Actions - Desktop only */}
                    {!isMobile && (
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
                    )}

                    {/* More Quizzes Section */}
                    <div className="space-y-3">
                      {!isMobile && (
                        <h3 className="text-sm font-black text-foreground border-b-2 border-border pb-2">
                          More Quizzes
                        </h3>
                      )}
                      <Suspense fallback={<QuizSkeleton />}>
                        <RandomQuiz autoRotate={!isMobile} />
                      </Suspense>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </QuizContext.Provider>
  )
}