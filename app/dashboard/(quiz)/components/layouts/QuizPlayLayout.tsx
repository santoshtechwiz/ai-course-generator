"use client"

import { useAuth, useMediaQuery } from "@/hooks"
import React from "react"
import { Suspense, useEffect, useState } from "react"
import { JsonLD } from "@/lib/seo-manager-new"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  Maximize2,
  Minimize2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSelector } from "react-redux"
import { selectQuizUserId } from "@/store/slices/quiz"
import { QuizActions } from "../QuizActions"
import { RandomQuiz } from "./RandomQuiz"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { TagsDisplay } from "@/components/quiz/TagsDisplay"

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
  questionNumber?: number
  totalQuestions?: number
  quizTitle?: string
  quizSubtitle?: string
  difficulty?: "easy" | "medium" | "hard"
  timeSpent?: number
  animationKey?: string
}

const QuizSkeleton = () => (
  <Card className="w-full">
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-48 w-full" />
    </CardContent>
  </Card>
)

const quizTypeConfig = {
  mcq: { icon: Target, label: "Multiple Choice", color: "from-blue-500 to-cyan-500" },
  code: { icon: Code2, label: "Code Quiz", color: "from-green-500 to-emerald-500" },
  blanks: { icon: Focus, label: "Fill Blanks", color: "from-cyan-500 to-teal-500" },
  openended: { icon: FileText, label: "Open Ended", color: "from-violet-500 to-purple-500" },
  flashcard: { icon: CreditCard, label: "Flashcards", color: "from-orange-500 to-red-500" },
  quiz: { icon: BookOpen, label: "General Quiz", color: "from-indigo-500 to-blue-500" },
  others: { icon: Play, label: "Mixed Quiz", color: "from-gray-500 to-slate-500" },
}

const difficultyConfig = {
  easy: { color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800", label: "Easy" },
  medium: { color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800", label: "Medium" },
  hard: { color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800", label: "Hard" },
}

const QuizPlayLayout: React.FC<QuizPlayLayoutProps> = ({
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
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")
  const pathname = usePathname()
  const [isLoaded, setIsLoaded] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [totalTimeSpent, setTotalTimeSpent] = useState(0)
  const quizOwnerId = useSelector(selectQuizUserId)

  const quizTitle = quizData?.title
  const quizSubtitle = quizData?.subtitle
  const difficulty: keyof typeof difficultyConfig = quizData?.difficulty || "medium"
  const totalQuestions = Math.max(1, quizData?.questions?.length || quizData?.totalQuestions || 1)
  const questionNumber = Math.max(
    1,
    Math.min(quizData?.currentQuestionIndex !== undefined ? quizData.currentQuestionIndex + 1 : 1, totalQuestions),
  )
  userId = userId || useAuth().user?.id || "";

  const isOwner = quizOwnerId === userId

  // Timer
  useEffect(() => {
    if (timeSpent === 0) {
      const timer = setInterval(() => {
        setTotalTimeSpent((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeSpent])

  // Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [isMobile])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const config = quizTypeConfig[quizType] || quizTypeConfig.quiz
  const diffConfig = difficultyConfig[difficulty] || difficultyConfig.medium
  const Icon = config.icon

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progressPercentage = Math.min(100, Math.max(0, Math.round((questionNumber / totalQuestions) * 100)))
  const displayedTimeSpent = timeSpent > 0 ? timeSpent : totalTimeSpent

  // Ref for auto-focus
  const mainContentRef = React.useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (mainContentRef.current) {
      const firstInput = mainContentRef.current.querySelector(
        'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement | null
      if (firstInput) firstInput.focus()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <JsonLD
        type="Quiz"
        data={{
          name: quizTitle || "Quiz",
          description: quizSubtitle || "Interactive quiz",
          educationalAlignment: {
            "@type": "AlignmentObject",
            alignmentType: "educationalSubject",
            targetName: "Education",
          },
          learningResourceType: config.label,
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-sm" aria-label="Quiz Header">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Quiz Info */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1" aria-label="Quiz Info">
              <div className={cn(
                "p-2.5 rounded-xl bg-gradient-to-r text-white shadow-lg",
                "transform transition-transform hover:scale-105",
                config.color
              )}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h1 className="font-bold text-lg sm:text-xl lg:text-2xl truncate leading-tight" tabIndex={0}>
                  {quizTitle || "Quiz"}
                </h1>
                <div className="flex items-center gap-2 flex-wrap" aria-label="Quiz Meta">
                  <Badge variant="secondary" className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary border-primary/20">
                    {config.label}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs font-medium px-2 py-1 border", diffConfig.color)}>
                    {diffConfig.label}
                  </Badge>
                  {quizData?.questions?.[questionNumber - 1]?.tags && (
                    <div className="hidden sm:flex items-center">
                      <TagsDisplay tags={quizData.questions[questionNumber - 1].tags || []} maxVisible={2} />
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground font-medium" aria-label="Question Progress">
                    {questionNumber} of {totalQuestions}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Stats & Controls */}
            <div className="flex items-center gap-2 sm:gap-3" aria-label="Quiz Controls">
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-2 lg:gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/60 hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors border border-border/50">
                  <Timer className="h-4 w-4 text-blue-500" />
                  <span className="font-mono tabular-nums">{formatTime(displayedTimeSpent)}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/60 hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors border border-border/50">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="tabular-nums">{progressPercentage}%</span>
                </div>
                {quizData?.rating && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/60 hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors border border-border/50">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="tabular-nums">{quizData.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Mobile Stats */}
              <div className="flex sm:hidden items-center gap-1">
                <div className="flex items-center gap-1 px-2 py-1 bg-muted/60 rounded-md text-xs font-medium">
                  <Timer className="h-3 w-3 text-blue-500" />
                  <span className="font-mono tabular-nums">{formatTime(displayedTimeSpent)}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-muted/60 rounded-md text-xs font-medium">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  <span className="tabular-nums">{progressPercentage}%</span>
                </div>
              </div>

              {/* Focus Mode Toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFocusMode(!focusMode)} 
                      className={cn(
                        "hidden md:flex h-9 w-9 p-0 rounded-lg transition-all",
                        "hover:bg-muted/80 hover:scale-105 active:scale-95",
                        focusMode && "bg-primary/10 text-primary border border-primary/20"
                      )}
                      aria-label={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                    >
                      {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-medium">
                    {focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Sidebar Toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSidebarOpen(!sidebarOpen)} 
                      className={cn(
                        "h-9 w-9 p-0 rounded-lg transition-all",
                        "hover:bg-muted/80 hover:scale-105 active:scale-95",
                        sidebarOpen && !focusMode && "bg-primary/10 text-primary border border-primary/20"
                      )}
                      aria-label={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                    >
                      {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-medium">
                    {sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2" aria-label="Quiz Progress">
            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground font-medium">
              <span>
                Question {questionNumber} of {totalQuestions}
              </span>
              <span className="tabular-nums">{progressPercentage}% Complete</span>
            </div>
            <div className="relative">
              <Progress 
                value={progressPercentage} 
                className="h-2.5 sm:h-3 transition-all duration-700 ease-out bg-muted/60" 
                aria-valuenow={progressPercentage} 
                aria-valuemin={0} 
                aria-valuemax={100}
              />
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/20 to-transparent rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className={cn(
          "flex gap-6 lg:gap-8",
          focusMode && "justify-center"
        )}>
          {/* Quiz Content */}
          <main 
            ref={mainContentRef} 
            className={cn(
              "flex-1 min-w-0 transition-all duration-300",
              focusMode ? "max-w-4xl mx-auto" : "max-w-none"
            )}
          >
            <div className={cn(
              "min-h-[60vh] rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm",
              "transition-all duration-300 hover:shadow-md hover:bg-card/60",
              "p-6 sm:p-8 lg:p-10"
            )}>
              {children}
            </div>
          </main>

          {/* Sidebar */}
          {!focusMode && (
            <aside
              className={cn(
                "shrink-0 transition-all duration-300 ease-in-out",
                isMobile
                  ? sidebarOpen
                    ? "fixed inset-y-0 right-0 z-40 w-80 sm:w-96 bg-background/95 backdrop-blur-lg border-l border-border/50 shadow-2xl"
                    : "w-0 overflow-hidden"
                  : sidebarOpen
                    ? isTablet ? "w-72" : "w-80 xl:w-96"
                    : "w-0 overflow-hidden",
              )}
              aria-label="Quiz Sidebar"
            >
              {/* Mobile Overlay */}
              {isMobile && sidebarOpen && (
                <div 
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300" 
                  onClick={() => setSidebarOpen(false)} 
                  aria-modal="true" 
                  role="dialog" 
                  tabIndex={-1} 
                />
              )}

              <div className={cn(
                "h-full space-y-4 sm:space-y-6 relative z-40",
                isMobile ? "p-4 sm:p-6 pt-20" : "sticky top-24 p-4"
              )}>
                {/* Mobile Close Button */}
                {isMobile && sidebarOpen && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSidebarOpen(false)}
                          className="absolute top-4 right-4 h-9 w-9 p-0 rounded-lg hover:bg-muted/80 transition-all"
                          aria-label="Close Sidebar"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="font-medium">Close Sidebar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <Suspense fallback={<QuizSkeleton />}>
                  <div className="space-y-4 sm:space-y-6">
                    {/* Quiz Actions */}
                    <div className="rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm transition-all hover:shadow-md hover:bg-card/60">
                      <QuizActions
                        quizSlug={quizSlug}
                        quizData={quizData}
                        initialIsFavorite={isFavorite}
                        initialIsPublic={isPublic}
                        isOwner={isOwner}
                      />
                    </div>

                    {/* Random Quiz Discovery */}
                    <div className="rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm transition-all hover:shadow-md hover:bg-card/60">
                      <RandomQuiz 
                        stats={randomQuizStats} 
                        isVisible={true} 
                        showHeader={true} 
                        showShuffle={true} 
                      />
                    </div>
                  </div>
                </Suspense>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuizPlayLayout

