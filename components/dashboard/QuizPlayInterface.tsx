"use client"

import type React from "react"
import { useMediaQuery } from "@/hooks"
import { usePathname, useRouter } from "next/navigation"
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
  ChevronRight,
  Grid3x3
} from "lucide-react"

import { RandomQuiz } from "@/app/dashboard/(quiz)/components/layouts/RandomQuiz"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

import { useAuth } from "@/modules/auth"
import { QuizActions } from "@/components/quiz/QuizActions"
import UnsubscribedQuizModal from "./UnsubscribedQuizModal"

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
  <div className="w-full p-4 space-y-3 bg-card border-3 border-border rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)]">
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-32 rounded-none bg-muted" />
      <Skeleton className="h-4 w-16 rounded-none bg-muted" />
    </div>
    <Skeleton className="h-3 w-full rounded-none bg-muted" />
    <Skeleton className="h-3 w-3/4 rounded-none bg-muted" />
    <Skeleton className="h-32 w-full rounded-none bg-muted" />
  </div>
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
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-black transition-all duration-200 border-3 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
        isPaused ? "bg-muted text-muted-foreground" : "bg-[var(--color-accent)] text-[var(--color-bg)]",
      )}
      aria-live="polite"
      aria-label={`Timer: ${formatTime(seconds)}, ${isPaused ? "paused" : "running"}`}
    >
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="tabular-nums font-mono font-black">{formatTime(seconds)}</span>
      {isPaused && <Pause className="h-3 w-3" aria-hidden="true" />}
    </div>
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
  onGoHome,
  onToggleFullscreen,
  progress,
}: any) => {
  const QuizTypeIcon = quizTypeIcons[quizType] || Award

  return (
    <header className="border-b-4 border-border bg-card shadow-[0_4px_0px_0px_rgba(0,0,0,0.8)]">
      <div
        className={cn(
          "mx-auto w-full py-3 transition-all duration-300",
          isFullscreen ? "max-w-none px-4" : "max-w-7xl px-4 lg:px-8",
        )}
      >
        {/* Main header row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1 flex items-center gap-2.5">
            <div className="p-2 rounded-none bg-[var(--color-accent)] border-3 border-border text-[var(--color-bg)] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] flex-shrink-0">
              <QuizTypeIcon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h1
                className="text-base lg:text-lg font-black text-foreground truncate mb-1"
                title={title}
              >
                {title}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="neutral"
                  className="px-2.5 py-0.5 text-xs font-black bg-[var(--color-accent)] text-[var(--color-bg)] border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] rounded-none"
                >
                  {quizTypeLabel[quizType] || "Quiz"}
                </Badge>
                {difficulty && <DifficultyBadge difficulty={difficulty} />}
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
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

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Timer seconds={displaySeconds} isPaused={isPaused} />

            <Button
              variant="neutral"
              size="sm"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="h-9 w-9 p-0 border-3 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] rounded-none bg-card hover:bg-muted transition-all"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>

            <Button
              variant="neutral"
              size="sm"
              onClick={onGoHome}
              aria-label="Return to quizzes dashboard"
              className="h-9 w-9 p-0 border-3 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] rounded-none bg-card hover:bg-muted transition-all"
            >
              <Home className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar - Show question count on mobile */}
        <div className="sm:hidden flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span className="tabular-nums font-mono font-black text-foreground">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress bar */}
        {progress !== undefined && (
          <div>
            <div className="hidden sm:flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
              <span>Progress</span>
              <span className="tabular-nums font-mono font-black text-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
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
  const router = useRouter()
  const { user: authUser } = useAuth()
  const { plan } = useAuth()
  const isMobile = useMediaQuery("(max-width: 1024px)")

  // State management
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [startTime] = useState(Date.now())
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  const mainRef = useRef<HTMLDivElement>(null)

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

  // Modal effect
  useEffect(() => {
    const shouldShowModal = 
      !authUser || 
      (plan) || 
      !plan

    const hasSeenModal = typeof window !== "undefined" ? sessionStorage.getItem("quizSubscriptionModalShown") : null
    
    if (shouldShowModal && !hasSeenModal && !isPublic) {
      setShowSubscriptionModal(true)
      if (typeof window !== "undefined") {
        sessionStorage.setItem("quizSubscriptionModalShown", "true")
      }
    }
  }, [authUser, plan, isPublic])

  // Handlers
  const toggleFocusMode = useCallback(() => setIsFocusMode(prev => !prev), [])
  const toggleFullscreen = useCallback(() => setIsFullscreen(prev => !prev), [])
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), [])
  const goHome = useCallback(() => window.location.href = "/dashboard/quizzes", [])

  const handleCloseSubscriptionModal = useCallback(() => {
    setShowSubscriptionModal(false)
  }, [])

  const handleCreateQuiz = useCallback(() => {
    setShowSubscriptionModal(false)
    router.push("/dashboard/quizzes/create")
  }, [router])

  const handleSubscribe = useCallback(() => {
    setShowSubscriptionModal(false)
    router.push("/pricing")
  }, [router])

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
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="p-4 rounded-none bg-muted border-4 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-foreground mb-2">Private Quiz</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This quiz is private and can only be viewed by its owner.
          </p>
          {!authUser && <p className="text-sm text-muted-foreground mb-4">Please log in to access private quizzes.</p>}
          <Button
            onClick={goHome}
            className="border-3 border-border shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent)]/90 font-black rounded-none px-6 py-2.5 transition-all"
            aria-label="Return to quizzes dashboard"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const displaySeconds = Math.max(0, (timeSpent || 0) > 0 ? (timeSpent || 0) : elapsed)

  return (
    <QuizContext.Provider value={contextValue}>
      {/* Subscription Modal */}
      <UnsubscribedQuizModal
        isOpen={showSubscriptionModal}
        onClose={handleCloseSubscriptionModal}
        onCreateQuiz={handleCreateQuiz}
        onSubscribe={handleSubscribe}
        variant="dismiss"
        quizTitle={title}
      />

      <div className={cn("min-h-screen bg-background", isFullscreen && "overflow-hidden")}>
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
          onGoHome={goHome}
          onToggleFullscreen={toggleFullscreen}
          progress={progress}
        />

        {/* Main content area */}
        <div className={cn(
          "mx-auto w-full transition-all duration-300",
          isFullscreen ? "px-4 max-w-none py-4" : "max-w-7xl px-4 lg:px-8 py-4",
          !isFullscreen && "lg:grid lg:grid-cols-[1fr_360px] lg:gap-6"
        )}>
          {/* Left column: Quiz content */}
          <div className="space-y-4">
            {/* Breadcrumb Navigation */}
            {!isFullscreen && <BreadcrumbNavigation />}

            {/* Resume CTA */}
            <AnimatePresence>
              {canResume && !isFullscreen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-none border-3 border-border bg-card shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)]"
                >
                  <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-none bg-[var(--color-accent)] border-3 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] flex-shrink-0">
                        <Play className="h-5 w-5 text-[var(--color-bg)]" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-black text-foreground text-sm">Continue where you left off</p>
                        <p className="text-muted-foreground mt-0.5 font-bold text-xs">
                          Question {questionNumber} of {totalQuestions}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className="px-5 py-2 text-xs font-black w-full sm:w-auto border-3 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] rounded-none bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent)]/90 transition-all"
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

          {/* Right column: Sidebar (desktop only) */}
          {!isFullscreen && (
            <div className="hidden lg:block space-y-4">
              <div className="sticky top-4 space-y-4">
                {/* Quiz Actions */}
                <div className="bg-card border-3 border-border shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] rounded-none p-4">
                  <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
                    <Grid3x3 className="w-4 h-4" />
                    Quiz Actions
                  </h3>
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
                </div>

                {/* More Quizzes Section */}
                <div className="bg-card border-3 border-border shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] rounded-none">
                  <div className="p-4 border-b-3 border-border">
                    <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      More Quizzes
                    </h3>
                  </div>
                  <div className="p-4">
                    <Suspense fallback={<QuizSkeleton />}>
                      <RandomQuiz autoRotate={true} maxQuizzes={3} showControls={false} />
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile floating action button */}
        {!isFullscreen && isMobile && (
          <div className="fixed bottom-6 right-6 z-50 lg:hidden">
            <Button
              variant="neutral"
              size="sm"
              onClick={toggleSidebar}
              aria-label="View more quizzes"
              className="h-14 w-14 rounded-full border-3 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent)]/90 transition-all"
            >
              <Grid3x3 className="w-6 h-6" />
            </Button>
          </div>
        )}

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && isMobile && (
            <motion.div
              className="fixed inset-0 z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />

              {/* Sidebar content */}
              <motion.div
                className="absolute right-0 top-0 h-full w-full sm:w-96 bg-card border-l-4 border-border shadow-2xl overflow-y-auto"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
              >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b-4 border-border bg-card">
                  <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                    <Grid3x3 className="w-5 h-5" />
                    Quiz Actions
                  </h2>
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                    className="h-9 w-9 p-0 border-3 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] rounded-none bg-muted hover:bg-muted/80"
                    aria-label="Close sidebar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Quiz Actions */}
                  <div className="bg-muted/30 border-3 border-border rounded-none p-4">
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
                  </div>

                  {/* More Quizzes */}
                  <div>
                    <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-2 px-1">
                      <Zap className="w-4 h-4" />
                      More Quizzes
                    </h3>
                    <Suspense fallback={<QuizSkeleton />}>
                      <RandomQuiz autoRotate={false} maxQuizzes={5} showControls={false} />
                    </Suspense>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </QuizContext.Provider>
  )
}