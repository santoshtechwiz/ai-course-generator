"use client"

import type React from "react"

import { useMediaQuery } from "@/hooks"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useState, useRef, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { CheckCircle, Clock, Home, Maximize, Minimize, Menu, X } from "lucide-react"
import { QuizActions } from "../QuizActions"

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 150)
    return () => clearTimeout(t)
  }, [])

  const title = quizData?.title || "Untitled Quiz"
  const difficulty = quizData?.difficulty || "medium"
  const totalQuestions = Math.max(1, quizData?.questions?.length || 1)
  const questionNumber = Math.max(
    1,
    Math.min(quizData?.currentQuestionIndex !== undefined ? quizData.currentQuestionIndex + 1 : 1, totalQuestions),
  )

  const toggleSidebar = useCallback(() => setSidebarOpen((s) => !s), [])
  const toggleFullscreen = useCallback(() => setIsFullscreen((s) => !s), [])
  const goHome = useCallback(() => (window.location.href = "/dashboard/quizzes"), [])

  const header = useMemo(() => {
    return (
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b">
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
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isMobile && <Timer seconds={timeSpent} />}
              <Button variant="ghost" size="icon" aria-label="Home" onClick={goHome}>
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={toggleSidebar} aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}>
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {isMobile && (
            <div className="mt-2">
              <Timer seconds={timeSpent} />
            </div>
          )}
        </div>
      </header>
    )
  }, [title, quizType, difficulty, isMobile, questionNumber, totalQuestions, timeSpent, isFullscreen, sidebarOpen])

  const progress = useMemo(() => Math.min(100, Math.max(0, Math.round((questionNumber / totalQuestions) * 100))), [questionNumber, totalQuestions])

  if (!isLoaded) return null

  return (
    <div className={`min-h-screen ${isFullscreen ? "overflow-hidden" : ""}`}>
      {header}
      <main className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4 lg:px-6 py-3">
        <div className="flex gap-3 lg:gap-4">
          <section ref={mainRef} className={`flex-1 rounded-xl border bg-card shadow-sm ${isFullscreen ? "p-3 sm:p-4 lg:p-5" : "p-3 sm:p-4"}`}>
            {/* Progress (compact) */}
            {!isFullscreen && (
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

          {/* Sidebar: Random/Actions */}
          {!isFullscreen && (
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="rounded-xl border bg-card p-3">
                <Suspense fallback={<QuizSkeleton />}>
                  <QuizActions quizId={quizId || quizSlug} quizSlug={quizSlug} quizType={quizType} title={title} isPublic={isPublic} isFavorite={isFavorite} className="w-full" />
                </Suspense>
              </div>
            </aside>
          )}
        </div>
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
            <div className="overflow-y-auto max-h-[calc(100vh-5rem)]">
              <Suspense fallback={<QuizSkeleton />}>
                <QuizActions quizId={quizId || quizSlug} quizSlug={quizSlug} quizType={quizType} title={title} isPublic={isPublic} isFavorite={isFavorite} className="w-full" />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
