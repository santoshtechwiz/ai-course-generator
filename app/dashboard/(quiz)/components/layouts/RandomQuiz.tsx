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
  ThumbsUp
} from "lucide-react"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
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

const DIFFICULTY_COLORS = {
  easy: {
    bg: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200/50 dark:border-green-700/50",
    accent: "from-green-500 to-emerald-500"
  },
  medium: {
    bg: "from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20", 
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200/50 dark:border-yellow-700/50",
    accent: "from-yellow-500 to-orange-500"
  },
  hard: {
    bg: "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
    text: "text-red-700 dark:text-red-300", 
    border: "border-red-200/50 dark:border-red-700/50",
    accent: "from-red-500 to-pink-500"
  },
} as const

const CARD_ANIMATIONS = {
  hidden: { opacity: 0, y: 30, scale: 0.9, rotateX: -15 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -30,
    scale: 0.9,
    rotateX: 15,
    transition: { duration: 0.4 },
  },
}

const FLOATING_ANIMATION = {
  y: [-2, 2, -2],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut"
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
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
        {rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
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
      <Card
        className={cn(
          "group relative overflow-hidden border-2 transition-all duration-500 hover:shadow-2xl cursor-pointer",
          isActive 
            ? `bg-gradient-to-br ${difficultyColors.bg} border-2 ${difficultyColors.border} shadow-xl` 
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
        )}
      >
        {/* Animated background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
              style={{
                left: `${20 + (i * 12)}%`,
                top: `${15 + (i * 8)}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <CardContent className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className={cn(
                "p-3 rounded-2xl text-white shadow-lg",
                `bg-gradient-to-br ${difficultyColors.accent}`
              )}>
                <QuizIcon type={quiz.quizType} className="w-6 h-6" />
              </div>
              <div>
                <Badge variant="outline" className="mb-2 text-xs font-medium">
                  {quiz.quizType.toUpperCase()}
                </Badge>
                <h3 className="font-bold text-lg leading-tight text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                  {quiz.title}
                </h3>
              </div>
            </motion.div>
            
            <div className="flex flex-col items-end gap-2">
              {quiz.isFavorite && (
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </motion.div>
              )}
              <DifficultyBadge difficulty={quiz.difficulty} />
            </div>
          </div>

          {/* Description */}
          {quiz.description && (
            <motion.p 
              className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed"
              initial={{ opacity: 0.7 }}
              whileHover={{ opacity: 1 }}
            >
              {quiz.description}
            </motion.p>
          )}

          {/* Stats */}
          <div className="mb-4">
            <QuizStats 
              questionCount={quiz.questionCount} 
              estimatedTime={quiz.estimatedTime} 
              rating={quiz.rating}
              viewCount={quiz.viewCount}
              likeCount={quiz.likeCount}
            />
          </div>

          {/* Tags */}
          <div className="mb-6">
            <QuizTags tags={quiz.tags} />
          </div>

          {/* Action Button */}
          <Link href={`${route}/${quiz.slug}`} className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                className={cn(
                  "w-full font-semibold shadow-lg transition-all duration-300",
                  `bg-gradient-to-r ${difficultyColors.accent} hover:shadow-xl text-white border-0`
                )}
              >
                <motion.div 
                  className="flex items-center justify-center gap-2"
                  whileHover={{ x: 5 }}
                >
                  <Play className="w-5 h-5" />
                  Start Quiz
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </Button>
            </motion.div>
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
    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
      <CardContent className="p-12 text-center">
        <motion.div 
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Zap className="w-10 h-10 text-purple-600 dark:text-purple-400" />
        </motion.div>
        
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
          No Quizzes Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
          We're fetching fresh quiz recommendations for you. Check back in a moment!
        </p>
        
        <Button variant="outline" asChild className="hover:shadow-lg transition-all duration-300">
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
    <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
      <CardContent className="p-12 text-center">
        <motion.div 
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 flex items-center justify-center"
          animate={{ x: [0, -6, 6, 0] }}
          transition={{ duration: 0.5, repeat: 3 }}
        >
          <Zap className="w-10 h-10 text-red-600 dark:text-red-400" />
        </motion.div>
        
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
          Oops! Something went wrong
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
          We couldn't load the quiz recommendations. Let's try again!
        </p>
        
        <Button 
          onClick={onRetry} 
          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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


// Main component
export const RandomQuiz = memo(({ 
  className, 
  autoRotate = true, 
  rotationInterval = 8000, // Increased from 6000 to 8000 for slower rotation
  showControls = true, 
  maxQuizzes = 5 
}: RandomQuizProps) => {
  const { quizzes, isLoading: loading, error, refreshQuizzes: refetch } = useSharedRandomQuizzes(maxQuizzes)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate)
  const [progress, setProgress] = useState(0)

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
      className={cn("w-full space-y-4", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Recommended Quiz
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Curated just for you
              {currentQuiz && (
                <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                  {currentQuiz.questionCount} questions
                </span>
              )}
            </p>
          </div>
        </motion.div>

        {showControls && quizzes.length > 1 && (
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAutoRotate}
              className={cn(
                "h-9 px-3 rounded-full border-gray-300 dark:border-gray-600 transition-all duration-300",
                isAutoRotating 
                  ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300" 
                  : "bg-gray-50 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600"
              )}
            >
              {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={prevQuiz}
              className="h-9 w-9 p-0 rounded-full border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextQuiz}
              className="h-9 w-9 p-0 rounded-full border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Quiz Card */}
      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait">
          {currentQuiz && (() => {
            // Normalize API data to the local `Quiz` shape expected by QuizCard
            const safeQuiz: Quiz = {
              id: currentQuiz.id,
              title: currentQuiz.title || 'Untitled Quiz',
              // Ensure quizType matches expected union; fallback to 'mcq'
              quizType: ((currentQuiz.quizType as unknown) as keyof typeof QUIZ_ROUTES) || 'mcq',
              difficulty: currentQuiz.difficulty || 'medium',
              questionCount: currentQuiz.questionCount || 0,
              timeStarted: currentQuiz.timeStarted,
              slug: currentQuiz.slug || String(currentQuiz.id),
              isPublic: currentQuiz.isPublic ?? true,
              isFavorite: currentQuiz.isFavorite ?? false,
              description: currentQuiz.description,
              tags: currentQuiz.tags,
              estimatedTime: currentQuiz.estimatedTime,
              rating: typeof currentQuiz.rating === 'number' ? currentQuiz.rating : undefined,
              viewCount: (currentQuiz as any).viewCount,
              likeCount: (currentQuiz as any).likeCount,
            }

            return (
              <QuizCard key={safeQuiz.id} quiz={safeQuiz as any} isActive={true} />
            )
          })()}
        </AnimatePresence>
      </div>

      {/* Enhanced Indicators */}
      {quizzes.length > 1 && (
        <motion.div 
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Quiz counter */}
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {currentIndex + 1} of {quizzes.length} quizzes
          </div>
          
          {/* Dot indicators */}
          <div className="flex justify-center gap-2">
            {quizzes.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 hover:scale-125",
                  index === currentIndex 
                    ? "w-8 bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg" 
                    : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-purple-300 dark:hover:bg-purple-700"
                )}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Go to quiz ${index + 1} of ${quizzes.length}`}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Auto-rotation indicator */}
      <AnimatePresence>
        {isAutoRotating && !isPaused && quizzes.length > 1 && (
          <motion.div
            className="absolute top-6 right-6 flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <div className="relative w-6 h-6">
              <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-gray-300 dark:text-gray-600"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 10}`}
                  strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress / 100)}`}
                  className="text-green-500 transition-all duration-100"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Auto-rotating
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts hint */}
      {quizzes.length > 1 && (
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Use ← → arrow keys to navigate • Spacebar to pause/play
          </p>
        </motion.div>
      )}
    </motion.div>
  )
})

RandomQuiz.displayName = "RandomQuiz"

export default RandomQuiz