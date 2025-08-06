"use client"

import { useAuth, useMediaQuery } from "@/hooks"
import { usePathname } from "next/navigation"
import { buildQuizUrl, cn } from "@/lib/utils"
import { Suspense, useEffect, useState, useRef, useMemo, useCallback, memo } from "react"
import { useSelector } from "react-redux"
import { selectQuizUserId } from "@/store/slices/quiz"

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
  mcq: { icon: Target, label: "Multiple Choice", color: "text-blue-500" },
  code: { icon: Code2, label: "Code Quiz", color: "text-green-500" },
  blanks: { icon: Focus, label: "Fill Blanks", color: "text-cyan-500" },
  openended: { icon: FileText, label: "Open Ended", color: "text-violet-500" },
  flashcard: { icon: CreditCard, label: "Flashcards", color: "text-orange-500" },
  quiz: { icon: BookOpen, label: "General Quiz", color: "text-indigo-500" },
  others: { icon: Play, label: "Mixed Quiz", color: "text-gray-500" },
};

const QuizSkeleton = () => (
  <div className="w-full p-6 space-y-4 bg-card rounded-xl border">
    <div className="flex justify-between">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-6 w-16" />
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-48 w-full" />
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
  const quizTitle = quizData?.title || "Interactive Quiz";
  const quizSubtitle = quizData?.subtitle || "Test your knowledge";
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
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b p-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Quiz Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`p-2 rounded-lg ${config.color} bg-muted`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold truncate">{quizTitle}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{config.label}</Badge>
                <DifficultyBadge difficulty={difficulty} />
                <span className="text-sm text-muted-foreground">
                  {questionNumber}/{totalQuestions}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-3">
              <TimerDisplay initialTime={timeSpent} />
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>{progressPercentage}%</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="icon"
              onClick={toggleSidebar}
              className="shrink-0"
            >
              {sidebarOpen ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} />
        </div>
      </div>
    </header>
  ), [quizTitle, config, Icon, difficulty, questionNumber, totalQuestions, progressPercentage, timeSpent, sidebarOpen, toggleSidebar]);

  // Memoized sidebar component
  const SidebarComponent = useMemo(() => (
    <div className="bg-card rounded-xl border p-4">
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
    <div className="bg-card rounded-xl border p-4">
      <h3 className="font-semibold mb-3">More Quizzes</h3>
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
      <main className="flex-1 flex max-w-screen-2xl mx-auto w-full p-4">
        <div className="flex w-full gap-6">
          {/* Question Area */}
          <div 
            ref={mainContentRef}
            className="flex-1 bg-card rounded-xl border p-6"
          >
            {children}
          </div>

          {/* Sidebar */}
          {sidebarOpen && (
            <aside className="hidden lg:block w-80 xl:w-96 shrink-0 space-y-6">
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
            className="absolute right-0 top-0 h-full w-4/5 bg-background border-l p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-end mb-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={closeSidebar}
              >
                <ChevronRight />
              </Button>
            </div>
            
            <div className="space-y-6">
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