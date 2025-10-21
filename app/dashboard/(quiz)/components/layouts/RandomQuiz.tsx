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

// Neobrutalism animations
const CARD_ANIMATIONS = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: -20,
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
}: {
  questionCount: number
  estimatedTime?: number
  rating?: number
  viewCount?: number
}) => (
  <div className="flex flex-wrap gap-2 text-sm">
    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border-2 border-border rounded-none">
      <BookOpen className="w-4 h-4 text-foreground" />
      <span className="font-black text-foreground whitespace-nowrap">{questionCount} Qs</span>
    </div>
    
    {estimatedTime && (
      <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border-2 border-border rounded-none">
        <Clock className="w-4 h-4 text-foreground" />
        <span className="font-black text-foreground whitespace-nowrap">{estimatedTime}m</span>
      </div>
    )}

    {rating && (
      <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border-2 border-border rounded-none">
        <Star className="w-4 h-4 text-foreground fill-current" />
        <span className="font-black text-foreground whitespace-nowrap">{rating.toFixed(1)}</span>
      </div>
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
    >
      <Card className={cn(
        "border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgb(0,0,0)] rounded-none transition-all duration-200",
        isActive && "shadow-[6px_6px_0px_0px_rgb(0,0,0)] border-foreground"
      )}>
        <CardContent className="p-4">
          {/* Header - Fixed responsive layout */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn(
                "p-3 border-2 border-foreground bg-background shadow-[2px_2px_0px_0px_rgb(0,0,0)] rounded-none flex-shrink-0"
              )}>
                <QuizIcon type={quiz.quizType} className="w-5 h-5 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge 
                    variant="secondary" 
                    className="font-black text-xs border-2 border-foreground bg-primary text-primary-foreground rounded-none whitespace-nowrap flex-shrink-0"
                  >
                    {quiz.quizType.toUpperCase()}
                  </Badge>
                  <div className="flex-shrink-0">
                    <DifficultyBadge difficulty={quiz.difficulty} />
                  </div>
                </div>
                <h3 className="font-black text-lg leading-tight text-foreground line-clamp-2 break-words">
                  {quiz.title}
                </h3>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-4">
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
          <Link href={`${route}/${quiz.slug}`} className="block">
            <Button
              size="lg"
              className={cn(
                "w-full font-black text-lg border-2 border-foreground bg-primary text-primary-foreground rounded-none",
                "shadow-[4px_4px_0px_0px_rgb(0,0,0)] hover:shadow-[6px_6px_0px_0px_rgb(0,0,0)]",
                "hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200",
                "active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgb(0,0,0)]"
              )}
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              Start Challenge
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
})
QuizCard.displayName = "QuizCard"

const LoadingCard = memo(() => (
  <Card className="border-2 border-border bg-card rounded-none">
    <CardContent className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-12 h-12 rounded-none border-2 border-border" />
        <div className="flex-1">
          <Skeleton className="h-4 w-16 mb-2 border-2 border-border" />
          <Skeleton className="h-6 w-48 border-2 border-border" />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-8 w-20 border-2 border-border" />
        <Skeleton className="h-8 w-16 border-2 border-border" />
        <Skeleton className="h-8 w-12 border-2 border-border" />
      </div>
      
      <Skeleton className="h-12 w-full rounded-none border-2 border-border" />
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
    <Card className="border-2 border-border bg-card rounded-none">
      <CardContent className="p-8 text-center">
        <motion.div 
          className="w-16 h-16 mx-auto mb-4 border-2 border-foreground bg-primary/10 flex items-center justify-center"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Zap className="w-8 h-8 text-foreground" />
        </motion.div>
        
        <h3 className="text-xl font-black mb-2 text-foreground">
          No Quizzes Found
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
          We're preparing new challenges for you. Check back soon!
        </p>
        
        <Button 
          variant="outline" 
          asChild 
          className="border-2 border-foreground font-black rounded-none hover:bg-accent"
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
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="border-2 border-destructive bg-destructive/5 rounded-none">
      <CardContent className="p-8 text-center">
        <motion.div 
          className="w-16 h-16 mx-auto mb-4 border-2 border-destructive bg-destructive/10 flex items-center justify-center"
          animate={{ x: [0, -4, 4, 0] }}
          transition={{ duration: 0.5, repeat: 3 }}
        >
          <Zap className="w-8 h-8 text-destructive" />
        </motion.div>
        
        <h3 className="text-xl font-black mb-2 text-foreground">
          Failed to Load
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
          We couldn't load quiz recommendations. Let's try again!
        </p>
        
        <Button 
          onClick={onRetry} 
          className="border-2 border-foreground bg-destructive text-destructive-foreground font-black rounded-none hover:bg-destructive/90"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  </motion.div>
))
ErrorState.displayName = "ErrorState"

// Mock data for fallback
const MOCK_QUIZZES: Quiz[] = [
  {
    id: "1",
    title: "JavaScript Fundamentals Challenge",
    quizType: "mcq",
    difficulty: "medium",
    questionCount: 15,
    slug: "js-fundamentals",
    isPublic: true,
    description: "Test your core JavaScript knowledge with this comprehensive quiz",
    estimatedTime: 20,
    rating: 4.5,
    viewCount: 1250,
    likeCount: 89
  },
  {
    id: "2",
    title: "React Hooks Mastery",
    quizType: "code",
    difficulty: "hard",
    questionCount: 10,
    slug: "react-hooks",
    isPublic: true,
    description: "Advanced React hooks and patterns quiz",
    estimatedTime: 25,
    rating: 4.8,
    viewCount: 890,
    likeCount: 67
  },
  {
    id: "3",
    title: "CSS Flexbox & Grid",
    quizType: "mcq",
    difficulty: "easy",
    questionCount: 8,
    slug: "css-layout",
    isPublic: true,
    description: "Master modern CSS layout techniques",
    estimatedTime: 15,
    rating: 4.3,
    viewCount: 2100,
    likeCount: 45
  }
]

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

  // Use mock data if no quizzes are available from the API
  const displayQuizzes = useMemo(() => {
    if (quizzes && quizzes.length > 0) {
      return quizzes.slice(0, maxQuizzes)
    }
    return MOCK_QUIZZES.slice(0, maxQuizzes)
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

  // Keyboard navigation
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

  return (
    <motion.div
      className={cn("w-full border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgb(0,0,0)] rounded-none", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b-2 border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 border-2 border-foreground bg-primary/10">
            <Zap className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-black text-lg text-foreground">
              Featured Challenge
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              Try these handpicked quizzes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showControls && displayQuizzes.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAutoRotate}
                className={cn(
                  "h-8 w-8 p-0 border-2 border-foreground rounded-none",
                  isAutoRotating ? "bg-primary text-primary-foreground" : "bg-background"
                )}
              >
                {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={prevQuiz}
                className="h-8 w-8 p-0 border-2 border-foreground rounded-none bg-background"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextQuiz}
                className="h-8 w-8 p-0 border-2 border-foreground rounded-none bg-background"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-4">
          {/* Quiz Card */}
          <div className="max-w-md mx-auto w-full">
            <AnimatePresence mode="wait">
              {currentQuiz && (
                <QuizCard key={currentQuiz.id} quiz={currentQuiz} isActive={true} />
              )}
            </AnimatePresence>
          </div>

          {/* Progress Indicators */}
          {displayQuizzes.length > 1 && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2">
                {displayQuizzes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "w-3 h-3 border-2 border-foreground transition-all duration-200",
                      index === currentIndex
                        ? "bg-primary"
                        : "bg-background hover:bg-primary/50"
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
          <div className="text-center pt-2">
            <Link 
              href="/dashboard/quizzes" 
              className="inline-flex items-center gap-2 text-sm font-black text-primary hover:underline"
            >
              View all quizzes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

RandomQuiz.displayName = "RandomQuiz"