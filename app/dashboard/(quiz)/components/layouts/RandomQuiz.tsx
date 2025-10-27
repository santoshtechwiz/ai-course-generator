"use client"

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Play,
  Clock,
  Star,
  BookOpen,
  Brain,
  Code,
  FileText,
  Zap,
  Target,
  RefreshCw,
  ArrowRight
} from "lucide-react"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"

// Simplified constants
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

// Simplified animations
const CARD_ANIMATIONS = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
}

// Types
interface Quiz {
  id: string
  title: string
  quizType: string
  difficulty: string
  questionCount: number
  timeStarted?: Date
  slug?: string
  isPublic?: boolean
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

// Cache implementation
const quizCache = {
  data: null as Quiz[] | null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes cache
  set: function(quizzes: Quiz[]) {
    this.data = quizzes
    this.timestamp = Date.now()
  },
  get: function(): Quiz[] | null {
    if (this.data && Date.now() - this.timestamp < this.ttl) {
      return this.data
    }
    this.data = null
    return null
  },
  clear: function() {
    this.data = null
    this.timestamp = 0
  }
}

// Enhanced sub-components
const QuizIcon = memo(({ type, className }: { type: string; className?: string }) => {
  const Icon = QUIZ_ICONS[type as keyof typeof QUIZ_ICONS] || Target
  return <Icon className={className} />
})
QuizIcon.displayName = "QuizIcon"

const QuizStats = memo(({
  questionCount,
  estimatedTime,
  rating,
  viewCount,
}: {
  questionCount: number
  estimatedTime?: number
  rating?: number
  viewCount?: number
}) => (
  <div className="flex flex-wrap gap-2 text-sm">
    <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-sm">
      <BookOpen className="w-3 h-3 text-primary" />
      <span className="font-semibold text-primary whitespace-nowrap">{questionCount} Qs</span>
    </div>
    
    {estimatedTime && (
      <div className="flex items-center gap-2 px-2 py-1 bg-secondary/10 rounded-sm">
        <Clock className="w-3 h-3 text-secondary" />
        <span className="font-semibold text-secondary whitespace-nowrap">{estimatedTime}m</span>
      </div>
    )}

    {rating && (
      <div className="flex items-center gap-2 px-2 py-1 bg-amber-500/10 rounded-sm">
        <Star className="w-3 h-3 text-amber-500" />
        <span className="font-semibold text-amber-600 whitespace-nowrap">{rating.toFixed(1)}</span>
      </div>
    )}
  </div>
))
QuizStats.displayName = "QuizStats"

const QuizCard = memo(({ quiz, isActive }: { quiz: Quiz; isActive: boolean }) => {
  const route = QUIZ_ROUTES[quiz.quizType as keyof typeof QUIZ_ROUTES] || QUIZ_ROUTES.mcq

  return (
    <motion.div
      variants={CARD_ANIMATIONS}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full"
    >
      <Card className={cn(
        "bg-card border neo-shadow rounded-none transition-all duration-200",
        isActive && "ring-2 ring-primary border-primary/50 neo-hover-lift"
      )}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className={cn(
              "p-2 bg-primary text-primary-foreground rounded-none flex-shrink-0"
            )}>
              <QuizIcon type={quiz.quizType} className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge 
                  variant="secondary"
                  className="text-xs font-medium"
                >
                  {quiz.quizType.toUpperCase()}
                </Badge>
                <DifficultyBadge difficulty={quiz.difficulty} />
              </div>
              <h3 className="font-semibold text-base leading-tight text-foreground line-clamp-2 break-words">
                {quiz.title}
              </h3>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-3">
            <QuizStats 
              questionCount={quiz.questionCount}
              estimatedTime={quiz.estimatedTime}
              rating={quiz.rating}
              viewCount={quiz.viewCount}
            />
          </div>

          {/* Description */}
          {quiz.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed break-words">
              {quiz.description}
            </p>
          )}

          {/* Action Button */}
          <Button
            asChild
            size="sm"
            className={cn(
              "w-full font-medium text-sm"
            )}
          >
            <Link href={`${route}/${quiz.slug}`}>
              <Play className="w-3 h-3 mr-2" />
              Start Challenge
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
})
QuizCard.displayName = "QuizCard"

const LoadingCard = memo(() => (
  <Card className="border bg-card neo-shadow rounded-none">
    <CardContent className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-8 h-8 rounded-none" />
        <div className="flex-1">
          <Skeleton className="h-3 w-16 mb-2 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <Skeleton className="h-6 w-16 rounded" />
        <Skeleton className="h-6 w-14 rounded" />
        <Skeleton className="h-6 w-12 rounded" />
      </div>
      
      <Skeleton className="h-9 w-full rounded" />
    </CardContent>
  </Card>
))
LoadingCard.displayName = "LoadingCard"

const EmptyState = memo(() => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="border bg-card neo-shadow rounded-none">
      <CardContent className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 text-primary rounded-none flex items-center justify-center">
          <Zap className="w-6 h-6" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          No Quizzes Found
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto leading-relaxed">
          We're preparing new challenges for you. Check back soon!
        </p>
        
        <Button 
          variant="outline" 
          asChild 
          className="font-medium"
        >
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
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="border bg-card neo-shadow rounded-none">
      <CardContent className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-destructive/10 text-destructive rounded-none flex items-center justify-center">
          <Zap className="w-6 h-6" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          Failed to Load
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto leading-relaxed">
          We couldn't load quiz recommendations. Let's try again!
        </p>
        
        <Button 
          onClick={onRetry} 
          className="font-medium"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  </motion.div>
))
ErrorState.displayName = "ErrorState"

// Main component
export const RandomQuiz = memo(({
  className,
  autoRotate = false,
  rotationInterval = 8000,
  showControls = true,
  maxQuizzes = 3
}: RandomQuizProps) => {
  const { quizzes, isLoading: loading, error, refreshQuizzes: refetch } = useRandomQuizzes(maxQuizzes)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate)
  const rotationRef = useRef<NodeJS.Timeout | null>(null)

  // Enhanced caching logic
  const displayQuizzes = useMemo(() => {
    // Check cache first
    const cached = quizCache.get()
    if (cached) {
      return cached.slice(0, maxQuizzes)
    }

    // Use fresh data and cache it
    if (quizzes && quizzes.length > 0) {
      quizCache.set(quizzes)
      return quizzes.slice(0, maxQuizzes)
    }
    
    return []
  }, [quizzes, maxQuizzes])

  const currentQuiz = useMemo(() => displayQuizzes[currentIndex], [displayQuizzes, currentIndex])

  const nextQuiz = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % displayQuizzes.length)
  }, [displayQuizzes.length])

  const prevQuiz = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + displayQuizzes.length) % displayQuizzes.length)
  }, [displayQuizzes.length])

  // Auto-rotation
  useEffect(() => {
    if (!isAutoRotating || displayQuizzes.length <= 1) {
      if (rotationRef.current) {
        clearInterval(rotationRef.current)
        rotationRef.current = null
      }
      return
    }

    rotationRef.current = setInterval(nextQuiz, rotationInterval)
    return () => {
      if (rotationRef.current) {
        clearInterval(rotationRef.current)
      }
    }
  }, [isAutoRotating, rotationInterval, nextQuiz, displayQuizzes.length])

  const toggleAutoRotate = useCallback(() => {
    setIsAutoRotating(prev => !prev)
  }, [])

  // Reset index when quizzes change
  useEffect(() => {
    setCurrentIndex(0)
  }, [displayQuizzes])

  // Clear cache on component unmount
  useEffect(() => {
    return () => {
      quizCache.clear()
    }
  }, [])

  if (loading) {
    return (
      <div className={cn("w-full max-w-2xl mx-auto", className)}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LoadingCard />
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("w-full max-w-2xl mx-auto", className)}>
        <ErrorState onRetry={refetch} />
      </div>
    )
  }

  if (!loading && displayQuizzes.length === 0) {
    return (
      <div className={cn("w-full max-w-2xl mx-auto", className)}>
        <EmptyState />
      </div>
    )
  }

  return (
    <motion.div
      className={cn("w-full max-w-2xl mx-auto border bg-card neo-shadow rounded-none", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className={cn("px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2")}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary text-primary-foreground rounded-none">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">
              Featured Challenge
            </h3>
            <p className="text-sm text-muted-foreground">
              Handpicked quizzes to boost your skills
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-3">
          {/* Quiz Cards - responsive grid */}
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayQuizzes.map((q, idx) => (
                <div
                  key={q.id}
                  className={cn(
                    "w-full",
                    idx === currentIndex ? "order-first" : ""
                  )}
                >
                  <QuizCard quiz={q} isActive={idx === currentIndex} />
                </div>
              ))}
            </div>
          </div>

          {/* Progress Indicators */}
          {displayQuizzes.length > 1 && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1.5">
                {displayQuizzes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-200",
                      index === currentIndex
                        ? "bg-primary scale-125"
                        : "bg-muted-foreground/30 hover:bg-primary/50"
                    )}
                  />
                ))}
              </div>
              
              <div className="text-xs text-muted-foreground font-medium">
                {currentIndex + 1} of {displayQuizzes.length}
              </div>
            </div>
          )}

          {/* View All Link */}
          <div className="text-center pt-1">
            <Link 
              href="/dashboard/quizzes" 
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Explore all quizzes
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

RandomQuiz.displayName = "RandomQuiz"