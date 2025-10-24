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
  RefreshCw,
  Users,
  ArrowRight
} from "lucide-react"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import neo from "@/components/neo/tokens"

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

// Enhanced neo-brutalism animations
const CARD_ANIMATIONS = {
  hidden: { 
    opacity: 0, 
    x: 40,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { 
      duration: 0.4, 
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    x: -40,
    scale: 0.95,
    transition: { duration: 0.3 },
  },
}

const FLOAT_ANIMATION = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
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

// Enhanced sub-components
const QuizIcon = memo(({ type, className }: { type: keyof typeof QUIZ_ICONS; className?: string }) => {
  const Icon = QUIZ_ICONS[type] || Target
  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <Icon className={className} />
    </motion.div>
  )
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
    <motion.div 
      className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <BookOpen className="w-4 h-4 text-primary" />
      <span className="font-bold text-primary whitespace-nowrap">{questionCount} Qs</span>
    </motion.div>
    
    {estimatedTime && (
      <motion.div 
        className="flex items-center gap-2 px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-lg"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <Clock className="w-4 h-4 text-secondary" />
        <span className="font-bold text-secondary whitespace-nowrap">{estimatedTime}m</span>
      </motion.div>
    )}

    {rating && (
      <motion.div 
        className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <Star className="w-4 h-4 text-amber-500 fill-current" />
        <span className="font-bold text-amber-600 whitespace-nowrap">{rating.toFixed(1)}</span>
      </motion.div>
    )}
  </div>
))
QuizStats.displayName = "QuizStats"

const QuizCard = memo(({ quiz, isActive }: { quiz: Quiz; isActive: boolean }) => {
  const route = QUIZ_ROUTES[quiz.quizType] || QUIZ_ROUTES.mcq

  return (
    <motion.div
      variants={CARD_ANIMATIONS}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={cn(neo.inner,
        "bg-card shadow-sm rounded-lg transition-all duration-300",
        isActive && "ring-2 ring-primary/30 shadow-md"
      )}>
        <CardContent className="p-4">
          {/* Header - Cleaner layout */}
          <div className="flex items-start gap-3 mb-3">
            <div className={cn(
              "p-2 bg-primary text-primary-foreground rounded-lg flex-shrink-0"
            )}>
              <QuizIcon type={quiz.quizType} className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge 
                    variant="neutral"
                    className={cn(neo.badge, "text-xs h-7 px-2 py-0 rounded-md font-semibold")}
                >
                  {quiz.quizType.toUpperCase()}
                </Badge>
                <div className="flex-shrink-0">
                  <DifficultyBadge difficulty={quiz.difficulty} />
                </div>
              </div>
              <h3 className="font-semibold text-lg leading-tight text-foreground line-clamp-2 break-words">
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
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed break-words">
              {quiz.description}
            </p>
          )}

          {/* Action Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Use Button asChild to avoid nesting interactive elements (anchor > button) */}
            <Button
              asChild
              size="lg"
              className={cn(
                "w-full font-semibold text-sm bg-primary text-primary-foreground rounded-lg",
                "shadow-sm hover:shadow-md transition-all duration-300",
                "hover:bg-primary/90"
              )}
            >
              <Link href={`${route}/${quiz.slug}`}>
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Challenge
                </>
              </Link>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
})
QuizCard.displayName = "QuizCard"

const LoadingCard = memo(() => (
  <Card className="border border-border bg-card rounded-lg">
    <CardContent className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-14 rounded-md" />
        <Skeleton className="h-6 w-12 rounded-md" />
      </div>
      
      <Skeleton className="h-10 w-full rounded-lg" />
    </CardContent>
  </Card>
))
LoadingCard.displayName = "LoadingCard"

const EmptyState = memo(() => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    {...FLOAT_ANIMATION}
  >
    <Card className="border border-border bg-card rounded-lg">
      <CardContent className="p-6 text-center">
        <motion.div 
          className="w-16 h-16 mx-auto mb-4 bg-primary/10 text-primary rounded-xl flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Zap className="w-8 h-8" />
        </motion.div>
        
        <h3 className="text-xl font-semibold mb-2 text-foreground">
          No Quizzes Found
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto leading-relaxed">
          We're preparing new challenges for you. Check back soon!
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="outline" 
            asChild 
            className="font-semibold rounded-lg"
          >
            <Link href="/dashboard/quizzes" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Browse All Quizzes
            </Link>
          </Button>
        </motion.div>
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
    <Card className="border border-destructive/20 bg-destructive/5 rounded-lg">
      <CardContent className="p-6 text-center">
        <motion.div 
          className="w-16 h-16 mx-auto mb-4 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-8 h-8" />
        </motion.div>
        
        <h3 className="text-xl font-semibold mb-2 text-foreground">
          Failed to Load
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto leading-relaxed">
          We couldn't load quiz recommendations. Let's try again!
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={onRetry} 
            className="font-semibold rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  </motion.div>
))
ErrorState.displayName = "ErrorState"


// No mocked fallback quizzes — rely on API and show EmptyState when none available.

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

  // Use server data only — show empty state when there are no quizzes
  const displayQuizzes = useMemo(() => {
    if (quizzes && quizzes.length > 0) {
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

  // Enhanced auto-rotation with better timing
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

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (displayQuizzes.length <= 1) return
      
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
  }, [displayQuizzes.length, prevQuiz, nextQuiz, toggleAutoRotate])

  if (loading) {
    return (
      <div className={cn("w-full max-w-2xl mx-auto", className)}>
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
      <div className={cn("w-full max-w-2xl mx-auto", className)}>
        <ErrorState onRetry={refetch} />
      </div>
    )
  }

  // If no quizzes returned from API, show the EmptyState (no mocked data)
  if (!loading && displayQuizzes.length === 0) {
    return (
      <div className={cn("w-full max-w-2xl mx-auto", className)}>
        <EmptyState />
      </div>
    )
  }
  return (
    <motion.div
      className={cn("w-full max-w-2xl mx-auto", neo.card, className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Enhanced Header with neobrutalism tokens */}
      <div className={cn(neo.header, "flex flex-col sm:flex-row sm:items-center justify-between gap-3")}>
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-2 bg-primary text-primary-foreground rounded-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Zap className="w-5 h-5" />
          </motion.div>
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

      {/* Enhanced Content */}
      <div className="p-4">
        <div className="space-y-4">
          {/* Quiz Card */}
          <div className="w-full">
            <AnimatePresence mode="wait">
              {currentQuiz && (
                <QuizCard key={currentQuiz.id} quiz={currentQuiz} isActive={true} />
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced Progress Indicators */}
          {displayQuizzes.length > 1 && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-1.5">
                {displayQuizzes.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      index === currentIndex
                        ? "bg-primary scale-125"
                        : "bg-muted-foreground/30 hover:bg-primary/50"
                    )}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
              
              <div className="text-xs text-muted-foreground font-medium">
                {currentIndex + 1} of {displayQuizzes.length}
              </div>
            </div>
          )}

          {/* Enhanced View All Link */}
          <div className="text-center pt-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/dashboard/quizzes" 
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Explore all quizzes
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

RandomQuiz.displayName = "RandomQuiz"