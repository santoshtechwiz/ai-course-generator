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
  RotateCcw,
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

import { RandomQuiz } from "./RandomQuiz"
import { useRelatedQuizzes } from "@/hooks/useRelatedQuizzes"
import { motion, AnimatePresence } from "framer-motion"
import RecommendedSection from "@/components/shared/RecommendedSection"
import { cn } from "@/lib/utils"
import neo from '@/components/neo/tokens'

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
    throw new Error('useQuizContext must be used within a QuizPlayLayout')
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
    className="w-full p-4 space-y-3 bg-white border-4 border-black rounded-lg shadow-[4px_4px_0_#000]"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    role="status"
    aria-label="Loading quiz content"
  >
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-40 rounded-lg bg-gray-200" />
      <Skeleton className="h-5 w-20 rounded-lg bg-gray-200" />
    </div>
    <Skeleton className="h-4 w-full rounded-lg bg-gray-200" />
    <Skeleton className="h-4 w-3/4 rounded-lg bg-gray-200" />
    <Skeleton className="h-48 w-full rounded-lg bg-gray-200" />
    <div className="flex gap-2">
      <Skeleton className="h-10 flex-1 rounded-lg bg-gray-200" />
      <Skeleton className="h-10 w-28 rounded-lg bg-gray-200" />
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
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all duration-100 border-4 border-black shadow-[2px_2px_0_#000]",
        isPaused
          ? "bg-gray-100 text-gray-600"
          : "bg-[#FF006B] text-white"
      )}
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ duration: 0.1 }}
      layout
      aria-live="polite"
      aria-label={`Timer: ${formatTime(seconds)}, ${isPaused ? 'paused' : 'running'}`}
    >
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="tabular-nums font-mono font-black">{formatTime(seconds)}</span>
      {isPaused && <Pause className="h-3 w-3" aria-hidden="true" />}
    </motion.div>
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
  const pathname = usePathname()
  const [isLoaded, setIsLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile) // Close by default on mobile
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [showEngage, setShowEngage] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSidebarTransitioning, setIsSidebarTransitioning] = useState(false)
  
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
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Session and subscription management
  const { user: authUser } = useAuth()
  const { subscription } = useUnifiedSubscription()

  // Determine ownership and subscription status
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
    setIsSidebarTransitioning(true)
    setSidebarOpen((s) => !s)
    // Reset transitioning state after animation
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
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && 
          sidebarOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node) &&
          mainRef.current &&
          !mainRef.current.contains(event.target as Node)) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, sidebarOpen])

  const header = useMemo(() => {
    const displaySeconds = timeSpent > 0 ? timeSpent : elapsed
    return (
      <motion.header 
        className="border-b-4 border-black bg-white shadow-[4px_4px_0_#000]"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className={cn(
          "mx-auto w-full py-4 transition-all duration-300",
          isFullscreen 
            ? "max-w-none px-4" 
            : "max-w-7xl px-4 sm:px-6 lg:px-8"
        )}>
          <div className="flex items-center justify-between gap-3">
            <motion.div 
              className="min-w-0 flex-1 flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-lg bg-[#FF006B] border-4 border-black text-white shadow-[4px_4px_0_#000] flex-shrink-0">
                  <QuizTypeIcon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-black text-black truncate mb-1" title={title}>
                    {title}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="neutral" 
                      className="px-3 py-1 text-xs font-black bg-[#FF006B] text-white border-4 border-black shadow-[2px_2px_0_#000] rounded-lg"
                    >
                      {quizTypeLabel[quizType] || "Quiz"}
                    </Badge>
                    <DifficultyBadge difficulty={difficulty} />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Compact progress and timer for desktop */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-white rounded-lg border-4 border-black shadow-[4px_4px_0_#000]">
                <Badge 
                  variant="neutral" 
                  className="px-2 py-1 text-xs font-black bg-[#FF006B] text-white border-4 border-black shadow-[2px_2px_0_#000] rounded-md"
                >
                  {progress}%
                </Badge>
                <Timer seconds={displaySeconds} isPaused={isPaused} />
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="neutral" 
                  size="sm" 
                  onClick={togglePause}
                  className="hidden sm:flex hover:bg-gray-100 transition-all duration-100 border-4 border-black shadow-[3px_3px_0_#000] h-11 w-11 p-0 rounded-lg bg-white"
                  aria-label={isPaused ? "Resume quiz" : "Pause quiz"}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                
                <Button 
                  variant="neutral" 
                  size="sm" 
                  onClick={goHome} 
                  className="hover:bg-gray-100 transition-all duration-100 border-4 border-black shadow-[3px_3px_0_#000] h-11 w-11 p-0 rounded-lg bg-white"
                  aria-label="Go to dashboard"
                >
                  <Home className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="neutral" 
                  size="sm" 
                  onClick={toggleFullscreen} 
                  className="hover:bg-gray-100 transition-all duration-100 border-4 border-black shadow-[3px_3px_0_#000] h-11 w-11 p-0 rounded-lg bg-white"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
                
                <Button 
                  variant="neutral" 
                  size="sm" 
                  onClick={toggleSidebar}
                  disabled={isSidebarTransitioning}
                  className="hover:bg-gray-100 transition-all duration-100 border-4 border-black shadow-[3px_3px_0_#000] h-11 w-11 p-0 rounded-lg bg-white"
                  aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                  aria-expanded={sidebarOpen}
                >
                  {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Mobile progress bar */}
          {isMobile && (
            <motion.div 
              className="mt-3 flex items-center justify-between gap-3 p-3 bg-white rounded-lg border-4 border-black shadow-[4px_4px_0_#000]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Badge 
                variant="neutral" 
                className="px-3 py-1 text-xs font-black bg-[#FF006B] text-white border-4 border-black shadow-[2px_2px_0_#000] rounded-md"
              >
                {progress}%
              </Badge>
              <Timer seconds={displaySeconds} isPaused={isPaused} />
              <Button 
                variant="neutral" 
                size="sm" 
                onClick={togglePause} 
                className="h-10 w-10 p-0 hover:bg-gray-100 border-4 border-black shadow-[3px_3px_0_#000] transition-all duration-100 rounded-lg bg-white"
                aria-label={isPaused ? "Resume quiz" : "Pause quiz"}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.header>
    )
  }, [title, quizType, difficulty, isMobile, questionNumber, totalQuestions, timeSpent, elapsed, isFullscreen, sidebarOpen, isFocusMode, isPaused, QuizTypeIcon, isSidebarTransitioning, toggleSidebar, togglePause, goHome, toggleFullscreen, resetQuiz, progress])

  useEffect(() => {
    if (progress === 100) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(t)
    }
  }, [progress])

  const canResume = questionNumber > 1

  // Handle responsive sidebar behavior
  const prevIsMobileRef = useRef<boolean | null>(null)
  useEffect(() => {
    // Skip on initial mount
    if (prevIsMobileRef.current === null) {
      prevIsMobileRef.current = isMobile
      setSidebarOpen(!isMobile) // Close on mobile, open on desktop
      return
    }
    
    // Update sidebar state when switching between mobile/desktop
    if (prevIsMobileRef.current !== isMobile) {
      setSidebarOpen(!isMobile)
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
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF0] p-4">
        <motion.div
          className="text-center p-8 bg-white rounded-lg shadow-[4px_4px_0_#000] border-4 border-black max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Lock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-600" aria-hidden="true" />
          <h1 className="text-xl sm:text-2xl font-black text-black mb-2">
            Private Quiz
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            This quiz is private and can only be viewed by its owner.
          </p>
          {!authUser && (
            <p className="text-sm text-gray-600 mb-4">
              Please log in to access private quizzes.
            </p>
          )}
          <Button 
            onClick={goHome}
            className="mt-4 border-4 border-black shadow-[4px_4px_0_#000] bg-[#FF006B] text-white hover:bg-[#E6005F] font-black rounded-lg px-6 py-2.5"
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
      <div className="min-h-screen bg-[#FFFCF0] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#FF006B] mx-auto"></div>
          <p className="text-gray-600 font-black">Loading quiz...</p>
        </div>
      </div>
    )
  }

  // Ensure displaySeconds is always a valid positive number
  const displaySeconds = Math.max(0, timeSpent > 0 ? timeSpent : elapsed)

  return (
    <div className={cn(
      "min-h-screen bg-[#FFFCF0] relative", 
      isFullscreen && "overflow-hidden"
    )}>
      {/* Top spacer to prevent content from sliding under MainNavbar (h-16 = 64px) */}
      <div className="h-16" aria-hidden="true" />
      
      {/* Quiz header - NOT sticky, just a regular header */}
      {header}
      
      {/* Mobile toggle for sidebar - positioned below quiz header */}
      {isMobile && !isFullscreen && !isFocusMode && (
        <div className="fixed bottom-4 right-4 z-50 lg:hidden">
          <Button
            variant="neutral"
            size="sm"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="h-12 w-12 p-0 border-4 border-black shadow-[6px_6px_0_#000] rounded-lg bg-white hover:bg-gray-100"
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </Button>
        </div>
      )}
      
      <main className={cn(
        "mx-auto w-full transition-all duration-300 space-y-4",
        isFullscreen 
          ? "px-2 sm:px-4 max-w-none py-4" 
          : "max-w-7xl px-4 sm:px-6 lg:px-8 py-4"
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
              className="relative overflow-hidden rounded-lg border-4 border-black bg-white shadow-[4px_4px_0_#000]"
            >
              <div className="relative p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-[#FF006B] border-4 border-black shadow-[2px_2px_0_#000] flex-shrink-0">
                    <Play className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-black text-black text-base">Continue where you left off</p>
                    <p className="text-gray-600 mt-0.5 font-bold text-sm">Question {questionNumber} of {totalQuestions}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="px-5 py-2.5 text-sm font-black w-full sm:w-auto border-4 border-black shadow-[4px_4px_0_#000] rounded-lg bg-[#FF006B] text-white hover:bg-[#E6005F]"
                  aria-label="Resume quiz from current question"
                >
                  Resume Quiz
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn(
          "transition-all duration-300",
          sidebarOpen && !isFocusMode && !isFullscreen
            ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 lg:gap-6"
            : "flex"
        )}>
          {/* Main Content */}
          <motion.section 
            ref={mainRef}
            className={cn(
              "w-full rounded-lg border-4 border-black bg-white shadow-[4px_4px_0_#000] transition-all duration-300",
              isFullscreen 
                ? "p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-8rem)]" 
                : "p-6 sm:p-8 lg:p-10"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            aria-label="Quiz content"
          >
            <div className="w-full h-full">
              <QuizContext.Provider value={{
                isFocusMode,
                toggleFocusMode: () => setIsFocusMode(f => !f),
                isFullscreen,
                setIsFullscreen,
                sidebarOpen,
                setSidebarOpen
              }}>
                {children}
              </QuizContext.Provider>
            </div>
          </motion.section>

          {/* Enhanced Sidebar - Responsive */}
          <AnimatePresence>
            {sidebarOpen && !isFocusMode && !isFullscreen && (
              <motion.aside
                ref={sidebarRef}
                className="hidden lg:block w-full max-w-[300px]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                aria-label="Quiz sidebar with actions and recommendations"
              >
                <div className="space-y-4">
                  <motion.div 
                    className="rounded-lg p-4 bg-white border-4 border-black shadow-[4px_4px_0_#000]"
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
                    className="rounded-lg p-4 bg-white border-4 border-black shadow-[4px_4px_0_#000]"
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
              aria-label="Recommended quizzes"
            >
              <RecommendedSection title="Continue Learning">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedQuizzes.slice(0, 3).map((rq, index) => {
                    // Calculate difficulty based on question count
                    const getDifficultyInfo = (count: number) => {
                      if (count <= 5) return { label: "Beginner", color: "bg-green-100 text-green-800 border-green-800" }
                      if (count <= 15) return { label: "Intermediate", color: "bg-blue-100 text-blue-800 border-blue-800" }
                      return { label: "Advanced", color: "bg-red-100 text-red-800 border-red-800" }
                    }
                    const difficulty = getDifficultyInfo(rq.questionCount)
                    
                    return (
                      <motion.a
                        key={rq.id}
                        href={`/dashboard/${rq.quizType}/${rq.slug}`}
                        className="group rounded-xl border-4 border-[var(--border)] hover:border-[var(--border)] bg-[var(--card)] p-4 shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] hover:-translate-y-1 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]/40 overflow-hidden relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        aria-label={`Try ${rq.title} quiz`}
                      >
                        {/* Accent bar on top */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-[var(--color-primary)]" />
                        
                        <div className="flex items-start justify-between mb-3 mt-1">
                          <div className="p-2 rounded-lg bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-4 border-[var(--border)] shadow-[2px_2px_0_#000]">
                            <BookOpen className="w-4 h-4" aria-hidden="true" />
                          </div>
                          <Badge variant="neutral" className={cn(neo.badge, `text-xs font-black border-4 border-[var(--border)] shadow-[2px_2px_0_#000] ${difficulty.color}`)}>
                            {difficulty.label}
                          </Badge>
                        </div>
                        
                        <h3 className="font-black text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors mb-2 text-sm">
                          {rq.title}
                        </h3>
                        
                        <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mb-3 font-bold">
                          {rq.difficulty || "Quiz"}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs mb-3">
                          <Badge variant="neutral" className={cn(neo.badge, "text-xs font-black border-4 border-[var(--border)] bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-[2px_2px_0_#000]") }>
                            {rq.quizType?.toUpperCase()}
                          </Badge>
                          <span className="font-black text-[var(--foreground)]">{rq.questionCount}</span>
                          <span className="text-[var(--muted-foreground)] font-bold">questions</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t-4 border-[var(--border)]">
                          <span className="text-sm text-green-600 font-black group-hover:text-green-700 transition-colors">
                            Start →
                          </span>
                          <Play className="w-4 h-4 text-green-600 group-hover:scale-125 transition-transform" aria-hidden="true" />
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

      {/* Enhanced Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && !isFocusMode && !isFullscreen && (
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
              className="absolute right-0 top-0 h-full w-full sm:w-5/6 max-w-sm bg-white border-l-4 border-black shadow-[8px_0_0_#000]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              ref={sidebarRef}
            >
              <div className="flex items-center justify-between p-4 border-b-4 border-black min-h-[4rem]">
                <h2 className="text-lg font-black text-black">Quiz Panel</h2>
                <Button 
                  variant="neutral" 
                  size="sm" 
                  onClick={() => setSidebarOpen(false)}
                  className="hover:bg-gray-100 min-h-[44px] min-w-[44px] p-3 border-4 border-black shadow-[4px_4px_0_#000] rounded-lg bg-white"
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