"use client"

import type React from "react"
import { useMediaQuery, useResponsive } from "@/hooks"
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
  Menu, 
  X, 
  Target, 
  Play, 
  Pause,
  RotateCcw,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Zap,
  Eye,
  EyeOff,
  Edit3,
  MessageSquare,
  Brain
} from "lucide-react"
import { QuizActions } from "../QuizActions"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RandomQuiz } from "./RandomQuiz"
import { useRelatedQuizzes } from "@/hooks/useRelatedQuizzes"
import Confetti from "react-confetti"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Wand2 } from "lucide-react"
import RecommendedSection from "@/components/shared/RecommendedSection"
import { cn } from "@/lib/utils"

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
    className="mb-6"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Question {questionNumber} of {totalQuestions}
        </span>
        <Badge variant="outline" className="text-xs font-medium">
          {progress}% Complete
        </Badge>
      </div>
      <motion.div 
        className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>{questionNumber - 1} completed</span>
      </motion.div>
    </div>
    <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <motion.div 
        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full relative overflow-hidden"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: [-100, 200] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  </motion.div>
)

export default function QuizPlayLayout({
  children,
  quizSlug = "",
  quizType = "quiz",
  quizId,
  isPublic = false,
  isFavorite = false,
  quizData = null,
  timeSpent = 0,
}: QuizPlayLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const pathname = usePathname()
  const [isLoaded, setIsLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [showEngage, setShowEngage] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const { quizzes: relatedQuizzes } = useRelatedQuizzes({ 
    quizType, 
    difficulty: quizData?.difficulty, 
    exclude: quizSlug, 
    limit: 6, 
    tags: Array.isArray(quizData?.tags) ? quizData?.tags : undefined 
  })
  const [showConfetti, setShowConfetti] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

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

  const QuizTypeIcon = quizTypeIcons[quizType] || Award

  const header = useMemo(() => {
    const displaySeconds = timeSpent > 0 ? timeSpent : elapsed
    return (
      <motion.header 
        className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <motion.div 
              className="min-w-0 flex-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <QuizTypeIcon className="w-5 h-5" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  {title}
                </h1>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50">
                  {quizTypeLabel[quizType] || "Quiz"}
                </Badge>
                <DifficultyBadge difficulty={difficulty} />
                {!isMobile && (
                  <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                    {questionNumber}/{totalQuestions}
                  </Badge>
                )}
                {isFocusMode && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full"
                  >
                    <Target className="h-3 w-3" /> Focus mode
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {!isMobile && <Timer seconds={displaySeconds} isPaused={isPaused} />}
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={togglePause}
                className="hidden sm:flex hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetQuiz}
                className="hidden sm:flex hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={goHome} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Home className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleSidebar}
                className={cn(
                  "transition-all duration-300 hover:scale-105",
                  sidebarOpen ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700" : ""
                )}
              >
                {sidebarOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="hidden sm:inline ml-2">
                  {sidebarOpen ? "Hide" : "Show"} Panel
                </span>
              </Button>
            </motion.div>
          </div>
          
          {isMobile && (
            <motion.div 
              className="mt-3 flex items-center justify-between"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Timer seconds={displaySeconds} isPaused={isPaused} />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={togglePause}>
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={resetQuiz}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>
    )
  }, [title, quizType, difficulty, isMobile, questionNumber, totalQuestions, timeSpent, elapsed, isFullscreen, sidebarOpen, isFocusMode, isPaused, QuizTypeIcon])

  const progress = useMemo(() => Math.min(100, Math.max(0, Math.round((questionNumber / totalQuestions) * 100))), [questionNumber, totalQuestions])
  
  useEffect(() => {
    if (progress === 100) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(t)
    }
  }, [progress])

  const canResume = questionNumber > 1

  if (!isLoaded) return null

  const displaySeconds = timeSpent > 0 ? timeSpent : elapsed

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative", isFullscreen && "overflow-hidden")}>
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti 
          width={window.innerWidth} 
          height={window.innerHeight} 
          recycle={false} 
          numberOfPieces={300} 
          gravity={0.3}
          colors={['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B']}
        />
      )}
      
      {header}
      
      <main className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Resume CTA */}
        <AnimatePresence>
          {canResume && !isFullscreen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-4 rounded-2xl border border-blue-200 dark:border-blue-700/50 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Continue where you left off</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Question {questionNumber} of {totalQuestions}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
              "flex-1 rounded-3xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl transition-all duration-300",
              isFullscreen ? "p-6 sm:p-8" : "p-6"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {!isFullscreen && !isFocusMode && (
              <ProgressBar 
                progress={progress} 
                questionNumber={questionNumber} 
                totalQuestions={totalQuestions} 
              />
            )}

            <div className="w-full">{children}</div>
          </motion.section>

          {/* Enhanced Sidebar */}
          <AnimatePresence>
            {sidebarOpen && !isFullscreen && (
              <motion.aside 
                className="hidden lg:block w-96 shrink-0"
                initial={{ opacity: 0, x: 20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 384 }}
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
                    <Suspense fallback={<QuizSkeleton />}>
                      <QuizActions 
                        quizId={quizId || quizSlug} 
                        quizSlug={quizSlug} 
                        quizType={quizType} 
                        title={title} 
                        isPublic={isPublic} 
                        isFavorite={isFavorite} 
                        className="w-full" 
                      />
                    </Suspense>
                  </motion.div>

                  <motion.div 
                    className="rounded-3xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 shadow-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Suspense fallback={<QuizSkeleton />}>
                      <RandomQuiz autoRotate={true} />
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
            className="fixed inset-0 z-50 lg:hidden" 
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
              className="absolute right-0 top-0 h-full w-5/6 max-w-sm bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quiz Panel</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSidebarOpen(false)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(100vh-5rem)] p-6 space-y-6">
                <Suspense fallback={<QuizSkeleton />}>
                  <QuizActions 
                    quizId={quizId || quizSlug} 
                    quizSlug={quizSlug} 
                    quizType={quizType} 
                    title={title} 
                    isPublic={isPublic} 
                    isFavorite={isFavorite} 
                    className="w-full" 
                  />
                </Suspense>
                
                <Suspense fallback={<QuizSkeleton />}>
                  <RandomQuiz autoRotate={true} />
                </Suspense>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Engagement Modal */}
      <Dialog open={showEngage} onOpenChange={(open) => {
        setShowEngage(open)
        if (!open && quizSlug) localStorage.setItem(`ai_quiz_engagement_${quizSlug}`, "1")
      }}>
        <DialogContent className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <motion.div
                  className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 text-white"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Sparkles className="h-6 w-6" />
                </motion.div>
                Level up your learning with AI
              </DialogTitle>
              <DialogDescription className="text-base">
                This AI-powered quiz adapts to your learning style with smart hints, instant feedback, and a personalized path to mastery.
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200/50 dark:border-purple-700/50"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                    <Wand2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Create custom quizzes instantly</h3>
                    <p className="text-gray-600 dark:text-gray-400">AI-powered quiz generation tailored to your needs</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { icon: Target, label: "Adaptive Learning" },
                    { icon: TrendingUp, label: "Progress Tracking" },
                    { icon: Users, label: "Collaborative" }
                  ].map((feature, i) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50"
                    >
                      <feature.icon className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {feature.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
            
            <DialogFooter className="gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowEngage(false)}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Maybe later
              </Button>
              <Button 
                asChild 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <a href="/dashboard/mcq" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> 
                  Create AI Quiz
                </a>
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  )
}