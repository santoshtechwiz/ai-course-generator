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
  ArrowRight
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

// Enhanced animations
const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2
    }
  })
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Types
interface Quiz {
  id: string
  title: string
  quizType: keyof typeof QUIZ_ROUTES
  difficulty: "easy" | "medium" | "hard"
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

// Difficulty Badge Component (since it was imported but not provided)
const DifficultyBadge = memo(({ difficulty }: { difficulty: string }) => {
  const getDifficultyConfig = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "easy":
        return { label: "EASY", className: "bg-green-500/15 text-green-600 border-green-500/30" }
      case "medium":
        return { label: "MEDIUM", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30" }
      case "hard":
        return { label: "HARD", className: "bg-red-500/15 text-red-600 border-red-500/30" }
      default:
        return { label: diff.toUpperCase(), className: "bg-gray-500/15 text-gray-600 border-gray-500/30" }
    }
  }

  const config = getDifficultyConfig(difficulty)

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "font-bold text-xs border rounded-lg px-2 py-1",
        config.className
      )}
    >
      {config.label}
    </Badge>
  )
})
DifficultyBadge.displayName = "DifficultyBadge"

// Sub-components
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
}: {
  questionCount: number
  estimatedTime?: number
  rating?: number
}) => (
  <motion.div 
    className="flex flex-wrap gap-2 text-sm"
    variants={containerVariants}
  >
    <motion.div 
      className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <BookOpen className="w-4 h-4 text-blue-600" />
      <span className="font-semibold text-blue-700 whitespace-nowrap">{questionCount} Qs</span>
    </motion.div>
    
    {estimatedTime && (
      <motion.div 
        className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <Clock className="w-4 h-4 text-purple-600" />
        <span className="font-semibold text-purple-700 whitespace-nowrap">{estimatedTime}m</span>
      </motion.div>
    )}

    {rating && (
      <motion.div 
        className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <Star className="w-4 h-4 text-amber-600 fill-current" />
        <span className="font-semibold text-amber-700 whitespace-nowrap">{rating.toFixed(1)}</span>
      </motion.div>
    )}
  </motion.div>
))
QuizStats.displayName = "QuizStats"

const QuizCard = memo(({ quiz, direction = 0 }: { quiz: Quiz; direction?: number }) => {
  const route = QUIZ_ROUTES[quiz.quizType] || QUIZ_ROUTES.mcq

  return (
    <motion.div
      key={quiz.id}
      custom={direction}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="w-full"
    >
      <Card className="border border-gray-200 bg-white shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <motion.div 
              className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <QuizIcon type={quiz.quizType} className="w-6 h-6" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className="font-semibold text-xs bg-gray-100 text-gray-700 border-0 rounded-lg">
                  {quiz.quizType.toUpperCase()}
                </Badge>
                <DifficultyBadge difficulty={quiz.difficulty} />
              </div>
              <h3 className="font-bold text-xl text-gray-900 leading-tight line-clamp-2">
                {quiz.title}
              </h3>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-4">
            <QuizStats 
              questionCount={quiz.questionCount}
              estimatedTime={quiz.estimatedTime}
              rating={quiz.rating}
            />
          </div>

          {/* Description */}
          {quiz.description && (
            <p className="text-sm text-gray-600 mb-6 line-clamp-2 leading-relaxed">
              {quiz.description}
            </p>
          )}

          {/* Action Button */}
          <Link href={`${route}/${quiz.slug}`} className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                className="w-full font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-lg transition-all duration-300"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Challenge
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
  <Card className="border border-gray-200 bg-white rounded-2xl">
    <CardContent className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-12 rounded-lg" />
      </div>
      
      <Skeleton className="h-12 w-full rounded-xl" />
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
    <Card className="border border-gray-200 bg-white rounded-2xl">
      <CardContent className="p-8 text-center">
        <motion.div 
          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Zap className="w-10 h-10" />
        </motion.div>
        
        <h3 className="text-2xl font-bold mb-3 text-gray-900">
          No Quizzes Found
        </h3>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto leading-relaxed">
          We're preparing new challenges for you. Check back soon!
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="outline" 
            asChild 
            className="font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-50"
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
    <Card className="border border-red-200 bg-red-50 rounded-2xl">
      <CardContent className="p-8 text-center">
        <motion.div 
          className="w-20 h-20 mx-auto mb-6 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-10 h-10" />
        </motion.div>
        
        <h3 className="text-2xl font-bold mb-3 text-gray-900">
          Failed to Load
        </h3>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto leading-relaxed">
          We couldn't load quiz recommendations. Let's try again!
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={onRetry} 
            className="font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700"
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

// Mock data
const MOCK_QUIZZES: Quiz[] = [
  {
    id: "1",
    title: "JavaScript Fundamentals Challenge",
    quizType: "mcq",
    difficulty: "medium",
    questionCount: 15,
    slug: "js-fundamentals",
    isPublic: true,
    description: "Test your core JavaScript knowledge with variables, functions, and data types in this comprehensive quiz",
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
    description: "Master advanced React hooks, custom hooks, and performance patterns with real-world scenarios",
    estimatedTime: 25,
    rating: 4.8,
    viewCount: 890,
    likeCount: 67
  },
  {
    id: "3",
    title: "CSS Flexbox & Grid Layout",
    quizType: "mcq",
    difficulty: "easy",
    questionCount: 8,
    slug: "css-layout",
    isPublic: true,
    description: "Learn modern CSS layout techniques including Flexbox and Grid for responsive designs",
    estimatedTime: 15,
    rating: 4.3,
    viewCount: 2100,
    likeCount: 45
  }
]

// Custom hook mock (since useRandomQuizzes wasn't provided)
const useRandomQuizzes = (maxQuizzes: number) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setQuizzes(MOCK_QUIZZES.slice(0, maxQuizzes))
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadQuizzes()
  }, [maxQuizzes])

  const refreshQuizzes = useCallback(() => {
    setIsLoading(true)
    setError(null)
    // Simulate refresh
    setTimeout(() => {
      setQuizzes(MOCK_QUIZZES.slice(0, maxQuizzes))
      setIsLoading(false)
    }, 800)
  }, [maxQuizzes])

  return { quizzes, isLoading, error, refreshQuizzes }
}

// Controls Component
const QuizControls = memo(({ 
  isAutoRotating, 
  onToggleAutoRotate, 
  onPrev, 
  onNext,
  currentIndex,
  totalQuizzes 
}: {
  isAutoRotating: boolean
  onToggleAutoRotate: () => void
  onPrev: () => void
  onNext: () => void
  currentIndex: number
  totalQuizzes: number
}) => (
  <div className="flex items-center gap-3">
    {/* Auto-rotate toggle */}
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleAutoRotate}
        className={cn(
          "h-10 w-10 p-0 border border-gray-300 rounded-xl",
          isAutoRotating 
            ? "bg-blue-500 text-white border-blue-500" 
            : "bg-white border-gray-300"
        )}
      >
        {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>
    </motion.div>

    {/* Navigation */}
    <div className="flex items-center gap-2">
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          className="h-10 w-10 p-0 border border-gray-300 rounded-xl bg-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Progress indicator */}
      <div className="flex items-center gap-1 px-3">
        <span className="text-sm font-semibold text-gray-900">
          {currentIndex + 1}
        </span>
        <span className="text-sm text-gray-500">/</span>
        <span className="text-sm text-gray-500">{totalQuizzes}</span>
      </div>

      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          className="h-10 w-10 p-0 border border-gray-300 rounded-xl bg-white"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </motion.div>
    </div>
  </div>
))
QuizControls.displayName = "QuizControls"

// Main Component
export const RandomQuiz = memo(({
  className,
  autoRotate = false,
  rotationInterval = 5000,
  showControls = true,
  maxQuizzes = 3
}: RandomQuizProps) => {
  const { quizzes, isLoading, error, refreshQuizzes } = useRandomQuizzes(maxQuizzes)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate)
  const [direction, setDirection] = useState(0)
  const rotationRef = useRef<NodeJS.Timeout | null>(null)

  const displayQuizzes = useMemo(() => {
    return quizzes.length > 0 ? quizzes : MOCK_QUIZZES.slice(0, maxQuizzes)
  }, [quizzes, maxQuizzes])

  const currentQuiz = useMemo(() => displayQuizzes[currentIndex], [displayQuizzes, currentIndex])

  const nextQuiz = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % displayQuizzes.length)
  }, [displayQuizzes.length])

  const prevQuiz = useCallback(() => {
    setDirection(-1)
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

  if (isLoading) {
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
        <ErrorState onRetry={refreshQuizzes} />
      </div>
    )
  }

  return (
    <motion.div
      className={cn("w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-t-2xl">
        <div className="flex items-center gap-4">
          <motion.div 
            className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Zap className="w-6 h-6" />
          </motion.div>
          <div>
            <h3 className="font-bold text-2xl text-gray-900">
              Featured Challenge
            </h3>
            <p className="text-sm text-gray-600 font-medium">
              Handpicked quizzes to boost your skills
            </p>
          </div>
        </div>

        {showControls && displayQuizzes.length > 1 && (
          <QuizControls
            isAutoRotating={isAutoRotating}
            onToggleAutoRotate={toggleAutoRotate}
            onPrev={prevQuiz}
            onNext={nextQuiz}
            currentIndex={currentIndex}
            totalQuizzes={displayQuizzes.length}
          />
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Quiz Card */}
          <div className="w-full">
            <AnimatePresence mode="wait" custom={direction}>
              {currentQuiz && (
                <QuizCard key={currentQuiz.id} quiz={currentQuiz} direction={direction} />
              )}
            </AnimatePresence>
          </div>

          {/* Progress Indicators */}
          {displayQuizzes.length > 1 && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                {displayQuizzes.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1)
                      setCurrentIndex(index)
                    }}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-300",
                      index === currentIndex
                        ? "bg-blue-500 scale-125"
                        : "bg-gray-300 hover:bg-blue-300"
                    )}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* View All Link */}
          <div className="text-center pt-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/dashboard/quizzes" 
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
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