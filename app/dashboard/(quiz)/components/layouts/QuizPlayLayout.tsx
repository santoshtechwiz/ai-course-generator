"use client"

import { useAuth, useMediaQuery } from "@/hooks"
import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { JsonLD } from "@/lib/seo-manager-new"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
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
  easy: { color: "bg-green-100 text-green-800 border-green-200", label: "Easy" },
  medium: { color: "bg-amber-100 text-amber-800 border-amber-200", label: "Medium" },
  hard: { color: "bg-red-100 text-red-800 border-red-200", label: "Hard" },
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

  return (
    <div className="min-h-screen bg-background">
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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Quiz Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={cn("p-2 rounded-lg bg-gradient-to-r text-white", config.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-lg truncate">{quizTitle || "Quiz"}</h1>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="text-xs">
                    {config.label}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs", diffConfig.color)}>
                    {diffConfig.label}
                  </Badge>
                  <span className="text-muted-foreground">
                    {questionNumber}/{totalQuestions}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Stats & Controls */}
            <div className="flex items-center gap-2">
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg text-sm">
                  <Timer className="h-4 w-4 text-blue-500" />
                  <span className="font-mono">{formatTime(displayedTimeSpent)}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg text-sm">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>{progressPercentage}%</span>
                </div>
                {quizData?.rating && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg text-sm">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span>{quizData.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Focus Mode Toggle */}
              <Button variant="ghost" size="sm" onClick={() => setFocusMode(!focusMode)} className="hidden md:flex">
                {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              {/* Sidebar Toggle */}
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">
                {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Question {questionNumber} of {totalQuestions}
              </span>
              <span>{progressPercentage}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Quiz Content */}
          <main className={cn("flex-1 min-w-0", focusMode && "mx-auto max-w-4xl")}>
            <div className="min-h-[60vh]">{children}</div>
          </main>

          {/* Sidebar */}
          {!focusMode && (
            <aside
              className={cn(
                "shrink-0 transition-all duration-200",
                isMobile
                  ? sidebarOpen
                    ? "fixed inset-y-0 right-0 z-40 w-80 bg-background border-l shadow-lg"
                    : "w-0 overflow-hidden"
                  : sidebarOpen
                    ? "w-80"
                    : "w-0 overflow-hidden",
              )}
            >
              {/* Mobile Overlay */}
              {isMobile && sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
              )}

              <div className={cn("h-full space-y-4 relative z-40", isMobile ? "p-4 pt-20" : "sticky top-24")}>
                {/* Mobile Close Button */}
                {isMobile && sidebarOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}

                <Suspense fallback={<QuizSkeleton />}>
                  <div className="space-y-4">
                    {/* Quiz Actions */}
                    <QuizActions
                      quizSlug={quizSlug}
                      quizData={quizData}
                      initialIsFavorite={isFavorite}
                      initialIsPublic={isPublic}
                      isOwner={isOwner}
                    />

                    {/* Random Quiz Discovery */}
                    <RandomQuiz stats={randomQuizStats} isVisible={true} showHeader={true} showShuffle={true} />
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
