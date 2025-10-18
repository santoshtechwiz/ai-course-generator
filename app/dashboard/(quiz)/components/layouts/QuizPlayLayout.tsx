"use client"

import type React from "react"
import { useMediaQuery } from "@/hooks"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useState, useRef, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { BreadcrumbNavigation, LearningDashboardLink } from "@/components/navigation/BreadcrumbNavigation"
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
    className="w-full p-6 space-y-4 bg-gradient-to-br from-muted to-card rounded-2xl border border-border"
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
    // Ensure s is a valid number and not negative
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
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
        isPaused
          ? "bg-warning/10 text-warning border border-warning/30"
          : "bg-accent/10 text-accent border border-accent/20"
      )}
      whileHover={{ scale: 1.02 }}
      layout
    >
      <Clock className="h-4 w-4" />
      <span className="tabular-nums font-mono">{formatTime(seconds)}</span>
      {isPaused && <Pause className="h-3 w-3" />}
    </motion.div>
  )
}

const ProgressBar = ({ progress, questionNumber, totalQuestions }: { progress: number; questionNumber: number; totalQuestions: number }) => (
  <motion.div
    className="mb-6 p-4 rounded-lg bg-card border border-border"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full">
          <Target className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-accent">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
          <CheckCircle className="w-4 h-4 text-success" />
          <span className="text-sm font-medium text-muted-foreground">
            {progress}% Complete
          </span>
        </div>
      </div>
    </div>

    <div className="relative">
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>Progress</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <div className="relative h-3 bg-muted border border-border rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
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
 
  const { user: authUser, } = useAuth()
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
    if (!subscription?.expirationDate) return false
    return new Date(subscription.expirationDate) < new Date()
  }, [subscription?.expirationDate])

  // Auto-increment timer when not provided
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    setIsLoaded(true)
    // Only start local timer if no timeSpent prop is provided
    if (timeSpent > 0) return
    
    const interval = setInterval(() => {
      if (!isPaused) {
        setElapsed((e) => Math.max(0, e + 1))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isPaused, timeSpent])

  // Engagement modal: show once per slug
  useEffect(() => {
    if (!quizSlug) return
    const key = `ai_quiz_engagement_${quizSlug}`
    const seen = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    if (seen === null) {
      const t = setTimeout(() => setShowEngage(true), 2000)
      return () => clearTimeout(t)
    }
  }, [quizSlug])

  const title = quizData?.title || "Untitled Quiz"
  const difficulty = quizData?.difficulty || "medium"
  // Ensure totalQuestions is always at least 1 to prevent division by zero
  const totalQuestions = Math.max(1, Array.isArray(quizData?.questions) ? quizData.questions.length : 1)
  // Ensure questionNumber is within valid bounds [1, totalQuestions]
  const questionNumber = Math.max(
    1,
    Math.min(
      quizData?.currentQuestionIndex !== undefined && typeof quizData.currentQuestionIndex === 'number' 
        ? quizData.currentQuestionIndex + 1 
        : 1, 
      totalQuestions
    )
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
        className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm"
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
                <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg">
                  <QuizTypeIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate mb-0.5">
                    {title}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {quizTypeLabel[quizType] || "Quiz"}
                    </Badge>
                    <DifficultyBadge difficulty={difficulty} />
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-muted-foreground font-medium">
                      {/* Question counter removed for cleaner layout */}
                    </Badge>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {progress}% Complete
                    </Badge>
                  </div>
                  <Timer seconds={displaySeconds} isPaused={isPaused} />
                </div>
                {isFocusMode && (
                  <div className="flex items-center gap-1 text-sm text-primary bg-primary/10 px-3 py-1 rounded-lg">
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
                  className="hover:bg-muted transition-colors"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetQuiz}
                  className="hover:bg-muted transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 border-l border-border pl-3">
                <Button variant="ghost" size="sm" onClick={goHome} className="hover:bg-muted transition-colors min-h-[44px] min-w-[44px] p-3">
                  <Home className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="hover:bg-muted transition-colors min-h-[44px] min-w-[44px] p-3">
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleSidebar}
                  className="hover:bg-muted transition-colors"
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
                  <Badge variant="outline" className="text-muted-foreground font-medium">
                    {/* Question counter removed for cleaner layout */}
                  </Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {progress}%
                  </Badge>
                </div>
                <Timer seconds={displaySeconds} isPaused={isPaused} />
              </div>
              
              <div className="flex items-center justify-between py-1.5 px-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={togglePause} className="min-h-[44px] min-w-[44px] p-3 hover:bg-background/50">
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetQuiz} className="min-h-[44px] min-w-[44px] p-3 hover:bg-background/50">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                {isFocusMode && (
                  <div className="flex items-center gap-1 text-sm text-secondary">
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

  // Handle responsive sidebar behavior - only on mount and when switching between mobile/desktop
  const prevIsMobileRef = useRef<boolean | null>(null)
  useEffect(() => {
    // Skip on initial mount
    if (prevIsMobileRef.current === null) {
      prevIsMobileRef.current = isMobile
      return
    }
    
    // Only act when transitioning between mobile and desktop
    if (prevIsMobileRef.current !== isMobile) {
      if (isMobile && sidebarOpen) {
        setSidebarOpen(false)
      }
      prevIsMobileRef.current = isMobile
    }
  }, [isMobile])

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <motion.div
          className="text-center p-8 bg-card rounded-2xl shadow-xl border border-border max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Lock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Private Quiz
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            This quiz is private and can only be viewed by its owner.
          </p>
          {!authUser && (
            <p className="text-sm text-muted-foreground mb-4">
              Please log in to access private quizzes.
            </p>
          )}
        </motion.div>
      </div>
    )
  }

  if (!isLoaded) return null

  // Ensure displaySeconds is always a valid positive number
  const displaySeconds = Math.max(0, timeSpent > 0 ? timeSpent : elapsed)

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-background to-muted relative selection:bg-primary/10", 
      isFullscreen && "overflow-hidden"
    )}>
      {header}
      
      <main className={cn(
        "mx-auto w-full py-6 transition-all duration-300 space-y-6",
        isFullscreen 
          ? "px-2 sm:px-4 max-w-none" 
          : "max-w-screen-2xl px-4 sm:px-6 lg:px-8"
      )}>
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
              className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 shadow-lg"
            >
              <div className="absolute inset-0 bg-grid-primary/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
              <div className="relative p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 shadow-sm">
                    <Play className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">Continue where you left off</p>
                    <p className="text-muted-foreground mt-0.5">{/* Question counter removed for cleaner layout */}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 text-base px-6"
                >
                  Resume Quiz
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn(
          "transition-all duration-300",
          sidebarOpen && !isFullscreen
            ? "grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px] gap-4 sm:gap-5 md:gap-6"
            : "flex"
        )}>
          {/* Main Content */}
          <motion.section 
            ref={mainRef}
            className={cn(
              "w-full rounded-3xl border border-border bg-card/95 backdrop-blur-xl shadow-xl transition-all duration-300",
              isFullscreen 
                ? "p-2 sm:p-4 lg:p-6 min-h-[calc(100vh-8rem)]" 
                : "p-3 sm:p-4 md:p-5 lg:p-6"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-full h-full font-mono text-[15px] [font-feature-settings:'ss02']">{children}</div>
          </motion.section>

          {/* Enhanced Sidebar - Responsive */}
          <AnimatePresence>
            {sidebarOpen && !isFullscreen && (
              <motion.aside
                className="hidden lg:block w-full max-w-[380px]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="space-y-6">
                  <motion.div 
                    className="rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-6 shadow-xl"
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
                    className="rounded-3xl border-3 border-border bg-card/80 backdrop-blur-xl p-6 shadow-[6px_6px_0px_0px_hsl(var(--border))]"
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
              className="mt-8 w-full"
            >
              <RecommendedSection title="Continue Learning">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                  {relatedQuizzes.slice(0, 3).map((rq, index) => (
                    <motion.a
                      key={rq.id}
                      href={`/dashboard/${rq.quizType}/${rq.slug}`}
                      className="group rounded-2xl border-3 border-border bg-card/60 backdrop-blur-xl p-5 shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2 rounded-xl bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        {/* isFavorite removed (not on RelatedQuizItem) */}
                      </div>
                      
                      <h3 className="font-black text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2">
                        {rq.title}
                      </h3>
                      
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                        <Badge variant="secondary" className="text-xs font-bold border-2">
                          {rq.quizType?.toUpperCase()}
                        </Badge>
                        <span className="font-bold">{rq.questionCount} questions</span>
                        {/* estimatedTime removed (not on RelatedQuizItem) */}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-primary font-black">
                          Start Quiz
                        </span>
                        <Play className="w-4 h-4 text-primary group-hover:text-primary/80 transition-colors" />
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
              className="absolute right-0 top-0 h-full w-full sm:w-5/6 max-w-sm bg-card border-l border-border shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex items-center justify-between p-6 border-b border-border min-h-[4rem]">
                <h2 className="text-lg font-semibold text-foreground">Quiz Panel</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSidebarOpen(false)}
                  className="hover:bg-muted min-h-[44px] min-w-[44px] p-3"
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