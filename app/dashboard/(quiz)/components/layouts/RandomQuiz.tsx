"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Clock,
  Star,
  BookOpen,
  Brain,
  Code,
  FileText,
  Zap,
  Target,
  Trophy,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Constants
const QUIZ_ROUTES = {
  mcq: "/dashboard/mcq",
  code: "/dashboard/code",
  blanks: "/dashboard/blanks",
  openended: "/dashboard/openended",
  flashcard: "/dashboard/flashcard",
} as const

const QUIZ_ICONS = {
  mcq: Target,
  code: Code,
  blanks: FileText,
  openended: BookOpen,
  flashcard: Brain,
} as const

const DIFFICULTY_STYLES = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  hard: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
} as const

const CARD_ANIMATIONS = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.3 },
  },
}

// Types
interface Quiz {
  id: string
  title: string
  quizType: keyof typeof QUIZ_ROUTES
  difficulty: string
  questionCount: number
  timeStarted?: Date
  slug: string
  isPublic: boolean
  isFavorite?: boolean
  description?: string
  tags?: string[]
  estimatedTime?: number
  rating?: number
}

interface RandomQuizProps {
  className?: string
  autoRotate?: boolean
  rotationInterval?: number
  showControls?: boolean
  maxQuizzes?: number
}

// Sub-components
const QuizIcon = memo(({ type, className }: { type: keyof typeof QUIZ_ICONS; className?: string }) => {
  const Icon = QUIZ_ICONS[type] || Target
  return <Icon className={className} />
})
QuizIcon.displayName = "QuizIcon"

const QuizBadges = memo(({ difficulty, type }: { difficulty: string; type: string }) => {
  const difficultyKey = difficulty?.toLowerCase() as keyof typeof DIFFICULTY_STYLES
  const difficultyStyle = DIFFICULTY_STYLES[difficultyKey] || DIFFICULTY_STYLES.medium

  return (
    <div className="flex items-center gap-2 mb-3">
      <Badge variant="outline" className={cn("text-xs font-medium", difficultyStyle)}>
        {difficulty?.charAt(0).toUpperCase() + difficulty?.slice(1) || "Medium"}
      </Badge>
      <Badge variant="secondary" className="text-xs">
        {type.toUpperCase()}
      </Badge>
    </div>
  )
})
QuizBadges.displayName = "QuizBadges"

const QuizStats = memo(
  ({
    questionCount,
    estimatedTime,
    rating,
  }: {
    questionCount: number
    estimatedTime?: number
    rating?: number
  }) => (
    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
      <div className="flex items-center gap-1">
        <BookOpen className="w-4 h-4" />
        <span>{questionCount} questions</span>
      </div>
      {estimatedTime && (
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{estimatedTime}min</span>
        </div>
      )}
      {rating && (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span>{rating.toFixed(1)}</span>
        </div>
      )}
    </div>
  ),
)
QuizStats.displayName = "QuizStats"

const QuizTags = memo(({ tags }: { tags?: string[] }) => {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mb-4">
      {tags.slice(0, 3).map((tag) => (
        <Badge key={tag} variant="outline" className="text-xs px-2 py-1">
          {tag}
        </Badge>
      ))}
      {tags.length > 3 && (
        <Badge variant="outline" className="text-xs px-2 py-1">
          +{tags.length - 3}
        </Badge>
      )}
    </div>
  )
})
QuizTags.displayName = "QuizTags"

const QuizCard = memo(({ quiz, isActive }: { quiz: Quiz; isActive: boolean }) => {
  const route = QUIZ_ROUTES[quiz.quizType] || QUIZ_ROUTES.mcq

  return (
    <motion.div variants={CARD_ANIMATIONS} initial="hidden" animate="visible" exit="exit" className="w-full">
      <Card
        className={cn(
          "group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg",
          isActive ? "border-primary shadow-md" : "border-border hover:border-primary/50",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardContent className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <QuizIcon type={quiz.quizType} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg leading-tight line-clamp-2">{quiz.title}</h3>
              </div>
            </div>
            {quiz.isFavorite && <Trophy className="w-5 h-5 text-yellow-500 opacity-60" />}
          </div>

          <QuizBadges difficulty={quiz.difficulty} type={quiz.quizType} />
          <QuizStats questionCount={quiz.questionCount} estimatedTime={quiz.estimatedTime} rating={quiz.rating} />

          {quiz.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{quiz.description}</p>}

          <QuizTags tags={quiz.tags} />

          <Link href={`${route}/${quiz.slug}`} className="block">
            <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Play className="w-4 h-4 mr-2" />
              Start Quiz
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
})
QuizCard.displayName = "QuizCard"

const LoadingCard = memo(() => (
  <Card className="border-2">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-12" />
      </div>
      <div className="flex gap-4 mb-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="flex gap-1 mb-4">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-14" />
      </div>
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
))
LoadingCard.displayName = "LoadingCard"

const EmptyState = memo(() => (
  <Card className="border-2 border-dashed">
    <CardContent className="p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
        <Zap className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Random Quizzes Available</h3>
      <p className="text-muted-foreground mb-4">Check back later for new quiz recommendations</p>
      <Button variant="outline" asChild>
        <Link href="/dashboard/quizzes">Browse All Quizzes</Link>
      </Button>
    </CardContent>
  </Card>
))
EmptyState.displayName = "EmptyState"

const ErrorState = memo(({ onRetry }: { onRetry: () => void }) => (
  <Card className="border-2 border-destructive/20">
    <CardContent className="p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
        <Zap className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Failed to Load Quizzes</h3>
      <p className="text-muted-foreground mb-4">Something went wrong while fetching random quizzes</p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </CardContent>
  </Card>
))
ErrorState.displayName = "ErrorState"

// Custom hook for random quizzes using existing API
const useRandomQuizzes = (maxQuizzes = 5) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use the existing random quiz API endpoint
      const response = await fetch("/api/quizzes/common/random", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch quizzes: ${response.statusText}`)
      }

      const data = await response.json()

      // Transform the data to match our Quiz interface
      const transformedQuizzes: Quiz[] = (data.quizzes || data || []).slice(0, maxQuizzes).map((quiz: any) => ({
        id: quiz.id,
        title: quiz.title,
        quizType: quiz.quizType || "mcq",
        difficulty: quiz.difficulty || "medium",
        questionCount: quiz.questionCount || quiz._count?.questions || 0,
        timeStarted: quiz.timeStarted ? new Date(quiz.timeStarted) : undefined,
        slug: quiz.slug,
        isPublic: quiz.isPublic ?? true,
        isFavorite: quiz.isFavorite || false,
        description: quiz.description,
        tags: quiz.tags || [],
        estimatedTime: quiz.estimatedTime || Math.ceil((quiz.questionCount || 10) * 1.5),
        rating: quiz.rating || Math.random() * 2 + 3, // Fallback rating between 3-5
      }))

      setQuizzes(transformedQuizzes)
    } catch (err) {
      console.error("Error fetching random quizzes:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch quizzes")

      // Fallback: try to fetch from the general quizzes endpoint
      try {
        const fallbackResponse = await fetch("/api/quizzes?limit=" + maxQuizzes, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          const transformedFallbackQuizzes: Quiz[] = (fallbackData.quizzes || fallbackData || [])
            .slice(0, maxQuizzes)
            .map((quiz: any) => ({
              id: quiz.id,
              title: quiz.title,
              quizType: quiz.quizType || "mcq",
              difficulty: quiz.difficulty || "medium",
              questionCount: quiz.questionCount || quiz._count?.questions || 0,
              timeStarted: quiz.timeStarted ? new Date(quiz.timeStarted) : undefined,
              slug: quiz.slug,
              isPublic: quiz.isPublic ?? true,
              isFavorite: quiz.isFavorite || false,
              description: quiz.description,
              tags: quiz.tags || [],
              estimatedTime: quiz.estimatedTime || Math.ceil((quiz.questionCount || 10) * 1.5),
              rating: quiz.rating || Math.random() * 2 + 3,
            }))

          setQuizzes(transformedFallbackQuizzes)
          setError(null)
        }
      } catch (fallbackErr) {
        console.error("Fallback fetch also failed:", fallbackErr)
      }
    } finally {
      setLoading(false)
    }
  }, [maxQuizzes])

  useEffect(() => {
    fetchQuizzes()
  }, [fetchQuizzes])

  return { quizzes, loading, error, refetch: fetchQuizzes }
}

// Main component
export const RandomQuiz = memo(
  ({ className, autoRotate = true, rotationInterval = 5000, showControls = true, maxQuizzes = 5 }: RandomQuizProps) => {
    const { quizzes, loading, error, refetch } = useRandomQuizzes(maxQuizzes)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)

    const currentQuiz = useMemo(() => quizzes[currentIndex], [quizzes, currentIndex])

    const nextQuiz = useCallback(() => {
      setCurrentIndex((prev) => (prev + 1) % quizzes.length)
    }, [quizzes.length])

    const prevQuiz = useCallback(() => {
      setCurrentIndex((prev) => (prev - 1 + quizzes.length) % quizzes.length)
    }, [quizzes.length])

    // Auto-rotation with pause on hover
    useEffect(() => {
      if (!autoRotate || isPaused || quizzes.length <= 1) return

      const interval = setInterval(nextQuiz, rotationInterval)
      return () => clearInterval(interval)
    }, [autoRotate, isPaused, rotationInterval, nextQuiz, quizzes.length])

    // Reset index when quizzes change
    useEffect(() => {
      setCurrentIndex(0)
    }, [quizzes])

    if (loading) {
      return (
        <div className={cn("w-full", className)}>
          <LoadingCard />
        </div>
      )
    }

    if (error) {
      return (
        <div className={cn("w-full", className)}>
          <ErrorState onRetry={refetch} />
        </div>
      )
    }

    if (quizzes.length === 0) {
      return (
        <div className={cn("w-full", className)}>
          <EmptyState />
        </div>
      )
    }

    return (
      <div
        className={cn("w-full space-y-4", className)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Random Quiz</h2>
          </div>

          {showControls && quizzes.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevQuiz}
                disabled={quizzes.length <= 1}
                className="h-8 w-8 p-0 bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextQuiz}
                disabled={quizzes.length <= 1}
                className="h-8 w-8 p-0 bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Quiz Card */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {currentQuiz && <QuizCard key={currentQuiz.id} quiz={currentQuiz} isActive={true} />}
          </AnimatePresence>
        </div>

        {/* Indicators */}
        {quizzes.length > 1 && (
          <div className="flex justify-center gap-2">
            {quizzes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentIndex ? "bg-primary w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
                aria-label={`Go to quiz ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Auto-rotation indicator */}
        {autoRotate && !isPaused && quizzes.length > 1 && (
          <motion.div
            className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
        )}
      </div>
    )
  },
)

RandomQuiz.displayName = "RandomQuiz"
