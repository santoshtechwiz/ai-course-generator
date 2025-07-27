"use client"

import { useMediaQuery } from "@/hooks"
import type React from "react"
import { Suspense, useEffect, useState, useMemo } from "react"
import { JsonLD } from "@/lib/seo-manager-new"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { QuizActions } from "../QuizActions"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  ChevronRight,
  LayoutPanelLeft,
  Maximize,
  Minimize,
  Sparkles,
  Trophy,
  Timer,
  Users,
  Star,
  Zap,
  Target,
  BookOpen,
  Code2,
  Focus,
  FileText,
  CreditCard,
  Play,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { selectQuizUserId } from "@/store/slices/quiz"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSelector } from "react-redux"
import { RandomQuiz } from "./RandomQuiz"
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
  <Card className="w-full border-border/50 bg-card/50 backdrop-blur-sm shadow-sm rounded-xl">
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-4 w-full rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="flex justify-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-2 w-6 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </CardContent>
  </Card>
)

function getQuizTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    mcq: "Multiple Choice",
    code: "Code Quiz",
    blanks: "Fill Blanks",
    openended: "Open Ended",
    flashcard: "Flashcards",
    quiz: "General Quiz",
    others: "Mixed Quiz",
  }
  return labels[type] || "Quiz"
}

function getQuizTypeIcon(type: string) {
  const icons: Record<string, any> = {
    mcq: Target,
    code: Code2,
    blanks: Focus,
    openended: FileText,
    flashcard: CreditCard,
    quiz: BookOpen,
    others: Play,
  }
  return icons[type] || BookOpen
}

function getQuizTypeColor(type: string): string {
  const colors: Record<string, string> = {
    mcq: "from-blue-500 to-cyan-500",
    code: "from-green-500 to-emerald-500",
    blanks: "from-cyan-500 to-teal-500",
    openended: "from-violet-500 to-purple-500",
    flashcard: "from-orange-500 to-red-500",
    quiz: "from-indigo-500 to-blue-500",
    others: "from-gray-500 to-slate-500",
  }
  return colors[type] || "from-primary to-primary/80"
}

function getDifficultyColor(difficulty?: string): string {
  const colors: Record<string, string> = {
    easy: "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-800",
    medium:
      "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/20 dark:border-yellow-800",
    hard: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-800",
  }
  return colors[difficulty?.toLowerCase() || "medium"] || colors.medium
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
  animationKey = "quiz",

}) => {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")
  const pathname = usePathname()
  const [isLoaded, setIsLoaded] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [totalTimeSpent, setTotalTimeSpent] = useState(0)
  const quizOwnerId = useSelector(selectQuizUserId)

  // Always use quizData for title, subtitle, difficulty, progress, and question count if available
  const quizTitle = quizData?.title;
  const quizSubtitle = quizData?.subtitle;
  const difficulty = quizData?.difficulty || "medium";
  // Use quizData for progress and question count, always fallback to 1 if missing
  const totalQuestionsRaw = quizData?.questions?.length ?? quizData?.totalQuestions;
  const totalQuestions = Number.isFinite(totalQuestionsRaw) && totalQuestionsRaw > 0 ? totalQuestionsRaw : 1;
  const questionNumberRaw = quizData?.currentQuestionIndex !== undefined
    ? quizData.currentQuestionIndex + 1
    : (quizData?.questionNumber ?? 1);
  const questionNumber = Number.isFinite(questionNumberRaw)
    ? Math.max(1, Math.min(questionNumberRaw, totalQuestions))
    : 1;
  
  const [quizMeta, setQuizMeta] = useState({
    title: quizTitle,
    description: quizSubtitle,
    type: quizType,
  })
  const isOwner = quizOwnerId === userId;

  // Timer for engagement - only run if timeSpent isn't provided
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (timeSpent === 0) {
      timer = setInterval(() => {
        setTotalTimeSpent((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [timeSpent])

  // Update quiz meta when props change
  useEffect(() => {
    setQuizMeta({
      title: quizTitle,
      description: quizSubtitle,
      type: quizType,
    })
  }, [quizTitle, quizSubtitle, quizType])

  useEffect(() => {
    try {
      if (typeof document === "undefined") return

      const urlSegments = pathname?.split("/").filter(Boolean) || []
      const typeFromUrl = urlSegments[1] || quizType
      const slugFromUrl = urlSegments[2] || quizSlug

      const cleanedSlug = slugFromUrl.replace(/-[a-z0-9]{4,}$/i, "")
      const formattedTitle =
        quizTitle ||
        `${cleanedSlug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")} Quiz`

      if (document) {
        document.title = formattedTitle
      }

      const metaDescription =
        quizSubtitle ||
        document?.querySelector('meta[name="description"]')?.getAttribute("content") ||
        document?.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        "Test your programming knowledge with this interactive quiz"

      setQuizMeta({
        title: formattedTitle,
        description: metaDescription,
        type: typeFromUrl as any,
      })

      const timer = setTimeout(() => setIsLoaded(true), 100)

      return () => {
        clearTimeout(timer)
      }
    } catch (error) {
      console.warn("Failed to update quiz metadata:", error)
      setIsLoaded(true)
    }
  }, [pathname, quizType, quizSlug, quizTitle, quizSubtitle])

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }, [isMobile])

  const quizTypeLabel = getQuizTypeLabel(quizMeta.type)
  const QuizIcon = getQuizTypeIcon(quizMeta.type)
  const quizTypeColor = getQuizTypeColor(quizMeta.type)
  const difficultyColor = getDifficultyColor(difficulty)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Calculate progress percentage safely
  const progressPercentage = useMemo(() => {
    if (totalQuestions <= 0) return 0
    const progress = Math.min(100, Math.round((questionNumber / totalQuestions) * 100))
    return Math.max(0, progress)
  }, [questionNumber, totalQuestions])

  // Calculate displayed time
  const displayedTimeSpent = timeSpent > 0 ? timeSpent : totalTimeSpent

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <JsonLD
        type="Quiz"
        data={{
          name: quizMeta.title,
          description: quizMeta.description,
          educationalAlignment: {
            "@type": "AlignmentObject",
            alignmentType: "educationalSubject",
            targetName: "Computer Programming",
          },
          learningResourceType: quizTypeLabel,
          about: {
            "@type": "Thing",
            name: quizMeta.title.split("|")[0].trim(),
          },
        }}
      />

      {/* Header with Progress and Stats */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="flex md:hidden hover:bg-primary/10 transition-colors"
              >
                <LayoutPanelLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-gradient-to-r", quizTypeColor)}>
                  <QuizIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                    {quizMeta.title}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {quizTypeLabel}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs px-2 py-0.5", difficultyColor)}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {questionNumber}/{totalQuestions}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg">
                  <Timer className="h-4 w-4 text-blue-500" />
                  <span className="font-mono">{formatTime(displayedTimeSpent)}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>{progressPercentage}%</span>
                </div>
                {quizData?.rating !== undefined && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{quizData.rating.toFixed(1)}</span>
                  </div>
                )}
                {quizData?.attempts !== undefined && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg">
                    <Users className="h-4 w-4 text-green-500" />
                    <span>{quizData.attempts.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Focus Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFocusMode(!focusMode)}
                className="flex items-center gap-1.5 hover:bg-primary/10 transition-colors"
              >
                {focusMode ? (
                  <>
                    <Minimize className="h-4 w-4" />
                    <span className="hidden sm:inline">Exit Focus</span>
                  </>
                ) : (
                  <>
                    <Maximize className="h-4 w-4" />
                    <span className="hidden sm:inline">Focus Mode</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Question {questionNumber} of {totalQuestions}
              </span>
              <span>{progressPercentage}% Complete</span>
            </div>
            <div className="relative">
              <Progress value={progressPercentage} className="h-2 bg-muted/50" />
              {/* Add milestone markers */}
              <div className="absolute inset-0 flex items-center justify-between px-1">
                {[25, 50, 75].map((milestone) => (
                  <div
                    key={milestone}
                    className={cn(
                      "w-0.5 h-2 rounded-full transition-colors",
                      progressPercentage >= milestone ? "bg-background" : "bg-muted-foreground/30",
                    )}
                    style={{ left: `${milestone}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex gap-4 sm:gap-6 lg:gap-8 h-full">
          {/* Main Quiz Content */}
          <main
            className={cn(
              "flex-1 min-w-0 transition-all duration-300 relative",
              focusMode && "mx-auto max-w-4xl",
              isMobile ? "w-full" : "min-w-[60%]",
            )}
          >
            {/* Enhanced Engagement Elements */}
            <div className="absolute top-0 right-0 z-10 flex gap-2 p-2">
              <div className="p-2 bg-yellow-400/20 rounded-full animate-pulse">
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
              {progressPercentage > 50 && (
                <div className="p-2 bg-green-400/20 rounded-full animate-bounce">
                  <Trophy className="h-4 w-4 text-green-500" />
                </div>
              )}
              {progressPercentage > 75 && (
                <div className="p-2 bg-blue-400/20 rounded-full">
                  <Zap className="h-4 w-4 text-blue-500" />
                </div>
              )}
            </div>

            {/* Quiz Content Area */}
            <div className="min-h-[calc(100vh-12rem)] w-full relative">
              {children}
            </div>
          </main>

          {/* Enhanced Sidebar */}
          {!focusMode && (
            <aside
              className={cn(
                "shrink-0 transition-all duration-300",
                isMobile
                  ? sidebarCollapsed
                    ? "w-0 overflow-hidden"
                    : "w-full fixed inset-y-0 right-0 z-40 bg-background/95 backdrop-blur-md border-l border-border shadow-xl"
                  : isTablet
                    ? sidebarCollapsed
                      ? "w-0 overflow-hidden"
                      : "w-80"
                    : "w-80 xl:w-96",
              )}
            >
              {/* Mobile Overlay */}
              {isMobile && !sidebarCollapsed && (
                <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarCollapsed(true)} />
              )}

              <div className={cn("h-full space-y-4 relative z-40", isMobile ? "p-4 pt-16" : "sticky top-20")}>
                {/* Mobile Close Button */}
                {isMobile && !sidebarCollapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(true)}
                    className="absolute top-4 right-4 z-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}

                {/* Enhanced Sidebar Header */}
           

                <Suspense fallback={<QuizSkeleton />}>
                  <SidebarProvider>
                    <div className="space-y-4 w-full overflow-y-auto">
                      {/* Quiz Actions */}
                      <div>
                        <QuizActions
                          quizSlug={quizSlug}
                          quizData={quizData}
                          initialIsFavorite={isFavorite}
                          initialIsPublic={isPublic}
                          ownerId={isOwner }
                          userId={userId}
                          className="w-full"
                          quizId={quizId ?? ""}
                        />
                      </div>

                      {/* Discover New Quizzes Section with Embedded RandomQuiz */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Discover New Quizzes</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">Explore trending quizzes and challenge yourself</p>

                        {/* Embedded RandomQuiz Component */}
                        <div className="min-h-[400px]">
                          <RandomQuiz
                            stats={randomQuizStats}
                            isVisible={true}
                            className="h-full"
                            showHeader={false}
                            showStats={false}
                            showShuffle={false}
                          />
                        </div>
                      </div>
                    </div>
                  </SidebarProvider>
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