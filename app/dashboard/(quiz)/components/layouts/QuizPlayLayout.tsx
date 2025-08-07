"use client"

import { useAuth, useMediaQuery } from "@/hooks"
import { usePathname } from "next/navigation"
import { buildQuizUrl, cn } from "@/lib/utils"
import { Suspense, useEffect, useState, useRef, useMemo, useCallback, memo } from "react"
import { useSelector } from "react-redux"
im  const RandomQuizComponent = useMemo(() => (
    <div className="bg-card rounded-lg border p-3 shadow-sm">
      <h3 className="font-medium text-sm mb-2 text-gray-900 dark:text-gray-100">More Quizzes</h3>
      <Suspense fallback={<QuizSkeleton />}>
        <RandomQuiz showStats={true} autoRotate={true} />
      </Suspense>
    </div>
  ), []);electQuizUserId } from "@/store/slices/quiz"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { QuizActions } from "../QuizActions"
import { RandomQuiz } from "./RandomQuiz"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { TagsDisplay } from "@/components/quiz/TagsDisplay"
import { QuizType } from "@/app/types/quiz-types"
import Footer from "@/components/shared/Footer"

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
} from "lucide-react"

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
  timeSpent?: number
}

const quizTypeConfig = {
  mcq: { 
    icon: Target, 
    label: "Multiple Choice", 
    color: "text-blue-600", 
    bgColor: "bg-blue-50 dark:bg-blue-950",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },
  code: { 
    icon: Code2, 
    label: "Code Quiz", 
    color: "text-green-600", 
    bgColor: "bg-green-50 dark:bg-green-950",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  },
  blanks: { 
    icon: Focus, 
    label: "Fill Blanks", 
    color: "text-cyan-600", 
    bgColor: "bg-cyan-50 dark:bg-cyan-950",
    badgeColor: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
  },
  openended: { 
    icon: FileText, 
    label: "Open Ended", 
    color: "text-violet-600", 
    bgColor: "bg-violet-50 dark:bg-violet-950",
    badgeColor: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200"
  },
  flashcard: { 
    icon: CreditCard, 
    label: "Flashcards", 
    color: "text-orange-600", 
    bgColor: "bg-orange-50 dark:bg-orange-950",
    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  },
  quiz: { 
    icon: BookOpen, 
    label: "General Quiz", 
    color: "text-indigo-600", 
    bgColor: "bg-indigo-50 dark:bg-indigo-950",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
  },
  others: { 
    icon: Play, 
    label: "Mixed Quiz", 
    color: "text-gray-600", 
    bgColor: "bg-gray-50 dark:bg-gray-950",
    badgeColor: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  },
};

const QuizSkeleton = () => (
  <div className="w-full p-4 space-y-3 bg-card rounded-lg border shadow-sm">
    <div className="flex justify-between">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-5 w-14" />
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-36 w-full" />
  </div>
)

// Memoized Timer component to prevent unnecessary re-renders
const TimerDisplay = memo(({ initialTime = 0 }: { initialTime?: number }) => {
  const [timeSpent, setTimeSpent] = useState(initialTime)

  useEffect(() => {
    if (initialTime === 0) {
      const timer = setInterval(() => {
        setTimeSpent(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [initialTime])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  const displayTime = initialTime > 0 ? initialTime : timeSpent

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
      <Timer className="h-4 w-4 text-blue-500" />
      <span>{formatTime(displayTime)}</span>
    </div>
  )
})

TimerDisplay.displayName = "TimerDisplay"

export default function QuizPlayLayout({
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
}: QuizPlayLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const quizOwnerId = useSelector(selectQuizUserId);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Quiz metadata
  const quizTitle = quizData?.title || "";
  const quizSubtitle = quizData?.subtitle || "";
  const difficulty = quizData?.difficulty || "medium";
  const totalQuestions = Math.max(1, quizData?.questions?.length || 1);
  const questionNumber = Math.max(
    1,
    Math.min(quizData?.currentQuestionIndex !== undefined ? quizData.currentQuestionIndex + 1 : 1, totalQuestions)
  );
  
  // Auth and ownership
  const authUser = useAuth().user;
  userId =  authUser?.id || "";
  const isOwner = quizOwnerId === userId;

  // Memoized callback for sidebar toggle
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Memoized callback for closing sidebar
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Responsive sidebar
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-focus first input
  useEffect(() => {
    if (mainContentRef.current) {
      const firstInput = mainContentRef.current.querySelector(
        'input, button, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement | null;
      if (firstInput) firstInput.focus();
    }
  }, [questionNumber]);

  // Derived values - memoized to prevent unnecessary recalculations
  const config = useMemo(() => quizTypeConfig[quizType] || quizTypeConfig.quiz, [quizType]);
  const Icon = config.icon;
  const progressPercentage = useMemo(() => 
    Math.min(100, Math.max(0, Math.round((questionNumber / totalQuestions) * 100))), 
    [questionNumber, totalQuestions]
  );

  // Memoized header component
  const HeaderComponent = useMemo(() => (
    <header className={`sticky top-0 z-50 backdrop-blur border-b p-3 ${config.bgColor}`}>
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          {/* Quiz Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`p-2 rounded-lg ${config.color} bg-white dark:bg-gray-800 shadow-sm border`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-base truncate leading-tight text-gray-900 dark:text-gray-100">
                {quizTitle || `${config.label}`}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs px-2 py-0.5 font-medium ${config.badgeColor} border-0`}>
                  {config.label}
                </Badge>
                <DifficultyBadge difficulty={difficulty} />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {questionNumber}/{totalQuestions}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-sm shadow-sm border">
                <Timer className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{timeSpent > 0 ? Math.floor(timeSpent/60) + ':' + (timeSpent%60).toString().padStart(2,'0') : '0:00'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-sm shadow-sm border">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">{progressPercentage}%</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleSidebar}
              className="shrink-0 h-8 w-8 p-0 bg-white dark:bg-gray-800 shadow-sm"
            >
              {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="mt-3">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
        </div>
      </div>
    </header>
  ), [quizTitle, config, Icon, difficulty, questionNumber, totalQuestions, progressPercentage, timeSpent, sidebarOpen, toggleSidebar]);

  // Memoized sidebar component
  const SidebarComponent = useMemo(() => (
    <div className="bg-card rounded-lg border p-2">
      <QuizActions
        quizSlug={quizSlug}
        quizData={quizData}
        initialIsFavorite={isFavorite}
        initialIsPublic={isPublic}
        isOwner={isOwner}
      />
    </div>
  ), [quizSlug, quizData, isFavorite, isPublic, isOwner]);

  const RandomQuizComponent = useMemo(() => (
    <div className="bg-card rounded-lg border p-2">
      <h3 className="font-medium text-sm mb-2">More Quizzes</h3>
      <Suspense fallback={<QuizSkeleton />}>
        <RandomQuiz showStats={true} autoRotate={true} />
      </Suspense>
    </div>
  ), []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      {HeaderComponent}

      {/* Main Content */}
      <main className="flex-1 flex max-w-screen-2xl mx-auto w-full p-2 sm:p-3">
        <div className="flex w-full gap-3 sm:gap-4">
          {/* Question Area */}
          <div 
            ref={mainContentRef}
            className="flex-1 bg-card rounded-lg border p-4 sm:p-5 overflow-auto shadow-sm"
          >
            {children}
          </div>

          {/* Sidebar */}
          {sidebarOpen && (
            <aside className="hidden lg:block w-72 xl:w-80 shrink-0 space-y-3">
              {SidebarComponent}
              {RandomQuizComponent}
            </aside>
          )}
        </div>
      </main>

      {/* Mobile Sidebar */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeSidebar}>
          <div 
            className="absolute right-0 top-0 h-full w-4/5 bg-background border-l p-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-end mb-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={closeSidebar}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {SidebarComponent}
              {RandomQuizComponent}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}