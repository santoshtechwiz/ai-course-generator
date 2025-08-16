"use client"

import type React from "react"

import { useMediaQuery, useResponsive } from "@/hooks"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useState, useRef, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { CheckCircle, Clock, Home, Maximize, Minimize, Menu, X, Target } from "lucide-react"
import { QuizActions } from "../QuizActions"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RandomQuiz } from "./RandomQuiz"
import { useRelatedQuizzes } from "@/hooks/useRelatedQuizzes"
import Confetti from "react-confetti"
import { motion } from "framer-motion"
import { Sparkles, Wand2 } from "lucide-react"
import RecommendedSection from "@/components/shared/RecommendedSection"

export const dynamic = "force-dynamic"

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

const QuizSkeleton = () => (
  <div className="w-full p-4 space-y-3">
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-6 w-20" />
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
)

const Timer = ({ seconds }: { seconds: number }) => {
  const formatTime = (s: number) => {
    if (!s || s < 0) return "0.00s"
    if (s < 60) return `${s.toFixed(2)}s`
    const m = Math.floor(s / 60)
    const rem = s % 60
    return `${m}:${rem.toFixed(2).padStart(5, "0")}`
  }
  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted text-xs">
      <Clock className="h-3.5 w-3.5" />
      <span className="tabular-nums">{formatTime(seconds)}</span>
    </div>
  )
}

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
  // window size is accessed directly when rendering confetti to avoid SSR issues
  const { quizzes: relatedQuizzes } = useRelatedQuizzes({ quizType, difficulty: quizData?.difficulty, exclude: quizSlug, limit: 6, tags: Array.isArray(quizData?.tags) ? quizData?.tags : undefined })
  const [showConfetti, setShowConfetti] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  // Auto-increment timer when not provided
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    setIsLoaded(true)
    const interval = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Engagement modal: show once per slug
  useEffect(() => {
    if (!quizSlug) return
    const key = `ai_quiz_engagement_${quizSlug}`
    const seen = typeof window !== 'undefined' ? localStorage.getItem(key) : '1'
    if (!seen) {
      const t = setTimeout(() => setShowEngage(true), 1500)
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
  const goHome = useCallback(() => (window.location.href = "/dashboard/quizzes"), [])

  const header = useMemo(() => {
    const displaySeconds = timeSpent > 0 ? timeSpent : elapsed
    return (
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b ai-glass dark:ai-glass-dark">
        <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4 lg:px-6 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-semibold truncate">{title}</h1>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <Badge variant="secondary">{quizTypeLabel[quizType] || "Quiz"}</Badge>
                <DifficultyBadge difficulty={difficulty} />
                {!isMobile && (
                  <span className="text-muted-foreground">
                    {questionNumber}/{totalQuestions}
                  </span>
                )}
                {isFocusMode && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    <Target className="h-3 w-3" /> Focus mode
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isMobile && <Timer seconds={displaySeconds} />}
              <Button variant="ghost" size="icon" aria-label="Home" onClick={goHome}>
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={toggleSidebar} aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}>
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {isMobile && (
            <div className="mt-2">
              <Timer seconds={displaySeconds} />
            </div>
          )}
        </div>
      </header>
    )
  }, [title, quizType, difficulty, isMobile, questionNumber, totalQuestions, timeSpent, elapsed, isFullscreen, sidebarOpen, isFocusMode])

  const progress = useMemo(() => Math.min(100, Math.max(0, Math.round((questionNumber / totalQuestions) * 100))), [questionNumber, totalQuestions])
  useEffect(() => {
    if (progress === 100) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 1500)
      return () => clearTimeout(t)
    }
  }, [progress])

  // Resume CTA visibility: show when progress exists and not at start
  const canResume = questionNumber > 1

  if (!isLoaded) return null

  const displaySeconds = timeSpent > 0 ? timeSpent : elapsed

  return (
    <div className={`min-h-screen relative ${isFullscreen ? "overflow-hidden" : ""}`}>
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={180} gravity={0.25} />
      )}
      {header}
      <main className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4 lg:px-6 py-3">
        {canResume && !isFullscreen && (
          <div className="mb-3 flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Continue where you left off?</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Question {questionNumber} of {totalQuestions}</span>
              <Button size="sm" variant="secondary" onClick={() => mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Resume</Button>
            </div>
          </div>
        )}
        <div className="flex gap-3 lg:gap-4">
          <section ref={mainRef} className={`flex-1 rounded-xl border bg-card shadow-sm ${isFullscreen ? "p-3 sm:p-4 lg:p-5" : "p-3 sm:p-4"}`}>
            {/* Progress (compact) hidden in focus mode */}
            {!isFullscreen && !isFocusMode && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Progress</span>
                  <span className="text-xs font-semibold text-primary">{progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="w-full">{children}</div>
          </section>

          {/* Sidebar: Quiz actions + Random Quiz */}
          {sidebarOpen && !isFullscreen && (
            <aside className="hidden lg:block w-80 shrink-0">
              <div className="rounded-xl border bg-card p-3 space-y-3">
                <Suspense fallback={<QuizSkeleton />}>
                  <QuizActions quizId={quizId || quizSlug} quizSlug={quizSlug} quizType={quizType} title={title} isPublic={isPublic} isFavorite={isFavorite} className="w-full" />
                </Suspense>
                <Suspense fallback={<QuizSkeleton />}>
                  <RandomQuiz autoRotate={true} />
                </Suspense>
              </div>
            </aside>
          )}
        </div>
        {/* Related quizzes carousel */}
        {!isFullscreen && relatedQuizzes.length > 0 && (
          <RecommendedSection title="You might also like">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedQuizzes.slice(0, 3).map((rq) => (
                <a
                  key={rq.id}
                  href={`/dashboard/${rq.quizType}/${rq.slug}`}
                  className="group rounded-lg border bg-background/40 p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label={`Open ${rq.title}`}
                >
                  <div className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{rq.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{rq.quizType}</Badge>
                    <span>{rq.questionCount} qns</span>
                    {rq.estimatedTime ? <span>{rq.estimatedTime}m</span> : null}
                  </div>
                </a>
              ))}
            </div>
          </RecommendedSection>
        )}
      </main>

      {/* Mobile Sidebar */}
      {sidebarOpen && !isFullscreen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-5/6 max-w-sm bg-card border-l p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Quiz Hub</h2>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-5rem)] space-y-3">
              <Suspense fallback={<QuizSkeleton />}>
                <QuizActions quizId={quizId || quizSlug} quizSlug={quizSlug} quizType={quizType} title={title} isPublic={isPublic} isFavorite={isFavorite} className="w-full" />
              </Suspense>
              <Suspense fallback={<QuizSkeleton />}>
                <RandomQuiz autoRotate={true} />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Non-blocking Engagement modal rendered after main to avoid empty content on dismiss */}
      <Dialog open={showEngage} onOpenChange={(open) => {
        setShowEngage(open)
        if (!open && quizSlug) localStorage.setItem(`ai_quiz_engagement_${quizSlug}`, "1")
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <motion.span
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 text-primary"
              >
                <Sparkles className="h-5 w-5" />
              </motion.span>
              Level up your learning
            </DialogTitle>
            <DialogDescription>
              This AI-powered quiz adapts to you with smart hints, instant feedback, and a tailored path to mastery.
              Create your own in seconds to practice exactly what matters.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 text-sm">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-accent/20 border border-border/50"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-white">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Create a custom quiz for free</p>
                <p className="text-muted-foreground">Engage your audience, grow your skills, and track progress—no setup required.</p>
              </div>
            </motion.div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-md border bg-card p-2">Adaptive hints</motion.div>
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-md border bg-card p-2">Instant feedback</motion.div>
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-md border bg-card p-2">Shareable results</motion.div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-3">
            <Button variant="secondary" onClick={() => setShowEngage(false)}>Not now</Button>
            <Button asChild className="btn-gradient">
              <a href="/dashboard/mcq" className="gap-2"><Sparkles className="h-4 w-4" /> Create a quiz</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
