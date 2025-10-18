"use client"

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
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
  TrendingUp,
  Users,
  Award,
  Sparkles,
  Eye,
  ThumbsUp,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Simplified constants - reduced color usage
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

// Simplified difficulty colors - less saturated, more subtle
const DIFFICULTY_COLORS = {
  easy: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    accent: "bg-emerald-600"
  },
  medium: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    accent: "bg-amber-600"
  },
  hard: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    accent: "bg-red-600"
  },
} as const

// Simplified animations - reduced motion
const CARD_ANIMATIONS = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
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
  viewCount?: number
  likeCount?: number
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

const QuizStats = memo(({
  questionCount,
  estimatedTime,
  rating,
  viewCount,
  likeCount,
}: {
  questionCount: number
  estimatedTime?: number
  rating?: number
  viewCount?: number
  likeCount?: number
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4" />
        <span className="font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
          {questionCount} questions
        </span>
      </div>
      {estimatedTime && (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{estimatedTime}min</span>
        </div>
      )}
    </div>
    
    {(rating || viewCount || likeCount) && (
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-warning text-warning" />
            <span>{rating.toFixed(1)}</span>
          </div>
        )}
        {viewCount && (
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{viewCount.toLocaleString()}</span>
          </div>
        )}
        {likeCount && (
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            <span>{likeCount}</span>
          </div>
        )}
      </div>
    )}
  </div>
))
QuizStats.displayName = "QuizStats"

const QuizTags = memo(({ tags }: { tags?: string[] }) => {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {tags.slice(0, 3).map((tag) => (
        <motion.span
          key={tag}
          className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700"
          whileHover={{ scale: 1.05 }}
        >
          #{tag}
        </motion.span>
      ))}
      {tags.length > 3 && (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700">
          +{tags.length - 3} more
        </span>
      )}
    </div>
  )
})
QuizTags.displayName = "QuizTags"

const QuizCard = memo(({ quiz, isActive }: { quiz: Quiz; isActive: boolean }) => {
  const route = QUIZ_ROUTES[quiz.quizType] || QUIZ_ROUTES.mcq
  const difficultyKey = quiz.difficulty?.toLowerCase() as keyof typeof DIFFICULTY_COLORS
  const difficultyColors = DIFFICULTY_COLORS[difficultyKey] || DIFFICULTY_COLORS.medium

  return (
    <motion.div
      variants={CARD_ANIMATIONS}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full"
    >
      <Card className={cn(
        "border-3 transition-all duration-200 shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))]",
        isActive
          ? `${difficultyColors.bg} ${difficultyColors.border} border-3`
          : "bg-card border-border hover:border-accent/50"
      )}>
        <CardContent className="p-4">
          {/* Header - simplified */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn(
                "p-2 rounded-lg flex-shrink-0 border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]",
                difficultyColors.accent, "text-white"
              )}>
                <QuizIcon type={quiz.quizType} className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <Badge variant="outline" className="mb-1 text-xs font-bold border-2">
                  {quiz.quizType.toUpperCase()}
                </Badge>
                <h3 className="font-black text-sm leading-tight text-foreground line-clamp-2">
                  {quiz.title}
                </h3>
              </div>
            </div>
            <DifficultyBadge difficulty={quiz.difficulty} />
          </div>

          {/* Stats - simplified */}
          <div className="mb-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>{quiz.questionCount} questions</span>
              </div>
              {quiz.estimatedTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{quiz.estimatedTime}min</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button - simplified */}
          <Link href={`${route}/${quiz.slug}`} className="block">
            <Button
              size="sm"
              className={cn(
                "w-full font-black text-white border-2 border-border h-9 shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_0px_hsl(var(--border))] transition-all",
                difficultyColors.accent, "hover:opacity-90"
              )}
            >
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
  <Card className="border-2 border-gray-200 dark:border-gray-700">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="flex-1">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>
      
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      
      <div className="flex gap-4 mb-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-14" />
      </div>
      
      <Skeleton className="h-12 w-full rounded-2xl" />
    </CardContent>
  </Card>
))
LoadingCard.displayName = "LoadingCard"

const EmptyState = memo(() => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="border-3 border-dashed border-border shadow-[4px_4px_0px_0px_hsl(var(--border))]">
      <CardContent className="p-12 text-center">
        <motion.div 
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 border-3 border-primary/20 flex items-center justify-center shadow-[4px_4px_0px_0px_hsl(var(--primary)/0.2)]"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Zap className="w-10 h-10 text-primary" />
        </motion.div>
        
        <h3 className="text-xl font-black mb-3 text-foreground">
          No Quizzes Available
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed font-medium">
          We're fetching fresh quiz recommendations for you. Check back in a moment!
        </p>
        
        <Button variant="outline" asChild className="hover:shadow-[4px_4px_0px_0px_hsl(var(--border))] transition-all duration-300 border-2 font-bold">
          <Link href="/dashboard/quizzes" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Browse All Quizzes
          </Link>
        </Button>
      </CardContent>
    </Card>
  </motion.div>
))
EmptyState.displayName = "EmptyState"

const ErrorState = memo(({ onRetry }: { onRetry: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="border-3 border-destructive/20 bg-destructive/5 shadow-[4px_4px_0px_0px_hsl(var(--destructive)/0.2)]">
      <CardContent className="p-12 text-center">
        <motion.div 
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-destructive/10 to-destructive/5 border-3 border-destructive/20 flex items-center justify-center shadow-[4px_4px_0px_0px_hsl(var(--destructive)/0.2)]"
          animate={{ x: [0, -6, 6, 0] }}
          transition={{ duration: 0.5, repeat: 3 }}
        >
          <Zap className="w-10 h-10 text-destructive" />
        </motion.div>
        
        <h3 className="text-xl font-black mb-3 text-foreground">
          Oops! Something went wrong
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed font-medium">
          We couldn't load the quiz recommendations. Let's try again!
        </p>
        
        <Button 
          onClick={onRetry} 
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-[4px_4px_0px_0px_hsl(var(--destructive)/0.3)] hover:shadow-[6px_6px_0px_0px_hsl(var(--destructive)/0.3)] transition-all duration-300 border-2 border-border font-black"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  </motion.div>
))
ErrorState.displayName = "ErrorState"

// Use the shared hook to avoid duplicate network calls and console spam
import { useRandomQuizzes as useSharedRandomQuizzes } from "@/hooks/useRandomQuizzes"


// Main component - simplified and collapsible
export const RandomQuiz = memo(({
  className,
  autoRotate = false, // Disabled by default to reduce distraction
  rotationInterval = 10000, // Slower rotation
  showControls = true,
  maxQuizzes = 3 // Reduced from 5
}: RandomQuizProps) => {
  const { quizzes, isLoading: loading, error, refreshQuizzes: refetch } = useSharedRandomQuizzes(maxQuizzes)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate)
  const [progress, setProgress] = useState(0)
  const [isCollapsed, setIsCollapsed] = useState(false) // New: collapsible state

  const currentQuiz = useMemo(() => quizzes[currentIndex], [quizzes, currentIndex])

  const nextQuiz = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % quizzes.length)
  }, [quizzes.length])

  const prevQuiz = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + quizzes.length) % quizzes.length)
  }, [quizzes.length])

  // Auto-rotation with pause on hover
  useEffect(() => {
    if (!isAutoRotating || isPaused || quizzes.length <= 1) return

    const interval = setInterval(nextQuiz, rotationInterval)
    return () => clearInterval(interval)
  }, [isAutoRotating, isPaused, rotationInterval, nextQuiz, quizzes.length])

  // Progress indicator for auto-rotation
  useEffect(() => {
    if (!isAutoRotating || isPaused || quizzes.length <= 1) {
      setProgress(0)
      return
    }

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / rotationInterval) * 100, 100)
      setProgress(newProgress)
    }, 100)

    return () => clearInterval(interval)
  }, [isAutoRotating, isPaused, rotationInterval, quizzes.length, currentIndex])

  const toggleAutoRotate = useCallback(() => {
    setIsAutoRotating(prev => !prev)
  }, [])

  // Debounced refetch when component mounts or when user explicitly triggers refetch
  const refetchRef = useRef<number | null>(null)
  const debouncedRefetch = useCallback(() => {
    if (refetchRef.current) {
      window.clearTimeout(refetchRef.current)
    }
    refetchRef.current = window.setTimeout(() => {
      refetch()
      refetchRef.current = null
    }, 250)
  }, [refetch])

  useEffect(() => {
    // ensure we kick off a refresh on mount but debounce to avoid duplicate triggers
    debouncedRefetch()
    return () => {
      if (refetchRef.current) window.clearTimeout(refetchRef.current)
    }
  }, [debouncedRefetch])

  // Reset index when quizzes change
  useEffect(() => {
    setCurrentIndex(0)
  }, [quizzes])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (quizzes.length <= 1) return
      
      // Don't capture keyboard shortcuts when user is typing in input fields
      const target = e.target as HTMLElement
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return
      }
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          prevQuiz()
          break
        case 'ArrowRight':
          e.preventDefault()
          nextQuiz()
          break
        case ' ':
          e.preventDefault()
          toggleAutoRotate()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [quizzes.length, prevQuiz, nextQuiz, toggleAutoRotate])

  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingCard />
        </motion.div>
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
    <motion.div
      className={cn("w-full border-3 border-border rounded-lg bg-card/50 shadow-[4px_4px_0px_0px_hsl(var(--border))]", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Simplified Header with Collapse Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-accent/10 border-2 border-accent/20 shadow-[2px_2px_0px_0px_hsl(var(--accent)/0.2)]">
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="font-black text-sm text-foreground">
              Recommended Quiz
            </h3>
            <p className="text-xs text-muted-foreground font-bold">
              {currentQuiz ? `${currentQuiz.questionCount} questions` : 'Loading...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showControls && quizzes.length > 1 && !isCollapsed && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAutoRotate}
                className="h-7 px-2 text-xs"
              >
                {isAutoRotating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={prevQuiz}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextQuiz}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 p-0"
          >
            {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">Failed to load quiz</p>
                  <Button variant="outline" size="sm" onClick={refetch}>
                    Retry
                  </Button>
                </div>
              ) : quizzes.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No quizzes available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quiz Card */}
                  <div className="max-w-md mx-auto">
                    <AnimatePresence mode="wait">
                      {currentQuiz && (
                        <QuizCard key={currentQuiz.id} quiz={currentQuiz as any} isActive={true} />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Simplified Indicators */}
                  {quizzes.length > 1 && (
                    <div className="flex justify-center">
                      <div className="flex gap-1">
                        {quizzes.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                              "w-2 h-2 rounded-full transition-colors",
                              index === currentIndex
                                ? "bg-accent"
                                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

RandomQuiz.displayName = "RandomQuiz"

export default RandomQuiz