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
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
} from "lucide-react"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"

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

// Type-specific colors for engaging visual variety
const QUIZ_COLORS = {
  mcq: {
    bg: "bg-[#ff007f]",
    text: "text-[#ff007f]",
    border: "border-[#ff007f]",
    bgLight: "bg-[#ff007f]/10",
  },
  code: {
    bg: "bg-[#00f5d4]",
    text: "text-[#00f5d4]",
    border: "border-[#00f5d4]",
    bgLight: "bg-[#00f5d4]/10",
  },
  blanks: {
    bg: "bg-[#ff6b35]",
    text: "text-[#ff6b35]",
    border: "border-[#ff6b35]",
    bgLight: "bg-[#ff6b35]/10",
  },
  openended: {
    bg: "bg-[#00d4aa]",
    text: "text-[#00d4aa]",
    border: "border-[#00d4aa]",
    bgLight: "bg-[#00d4aa]/10",
  },
  flashcard: {
    bg: "bg-[#ff9500]",
    text: "text-[#ff9500]",
    border: "border-[#ff9500]",
    bgLight: "bg-[#ff9500]/10",
  },
} as const

const CARD_ANIMATIONS = {
  enter: {
    x: 100,
    opacity: 0,
    scale: 0.9,
  },
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    x: -100,
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.3,
    },
  },
}

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

const QuizIcon = memo(({ type, className }: { type: string; className?: string }) => {
  const Icon = QUIZ_ICONS[type as keyof typeof QUIZ_ICONS] || Target
  return <Icon className={className} />
})
QuizIcon.displayName = "QuizIcon"

const QuizStats = memo(({
  questionCount,
  estimatedTime,
  rating,
  quizType,
}: {
  questionCount: number
  estimatedTime?: number
  rating?: number
  quizType: string
}) => {
  const colors = QUIZ_COLORS[quizType as keyof typeof QUIZ_COLORS] || QUIZ_COLORS.mcq

  return (
    <div className="flex flex-wrap gap-2">
      <motion.div 
        className={cn(
          "flex items-center gap-2 px-3 py-2 border-4 border-[var(--color-border)] rounded-none shadow-[2px_2px_0_var(--shadow-color)]",
          colors.bgLight
        )}
        whileHover={{ scale: 1.05, y: -2 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <BookOpen className={cn("w-4 h-4", colors.text)} />
        <span className={cn("font-black text-sm", colors.text)}>{questionCount} Questions</span>
      </motion.div>
      
      {estimatedTime && (
        <motion.div 
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-secondary)]/10 border-4 border-[var(--color-border)] rounded-none shadow-[2px_2px_0_var(--shadow-color)]"
          whileHover={{ scale: 1.05, y: -2 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Clock className="w-4 h-4 text-[var(--color-secondary)]" />
          <span className="font-black text-sm text-[var(--color-secondary)]">{estimatedTime} min</span>
        </motion.div>
      )}

      {rating && rating > 0 && (
        <motion.div 
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-warning)]/10 border-4 border-[var(--color-border)] rounded-none shadow-[2px_2px_0_var(--shadow-color)]"
          whileHover={{ scale: 1.05, y: -2 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Star className="w-4 h-4 text-[var(--color-warning)] fill-current" />
          <span className="font-black text-sm text-[var(--color-warning)]">{rating.toFixed(1)}</span>
        </motion.div>
      )}
    </div>
  )
})
QuizStats.displayName = "QuizStats"

const QuizCard = memo(({ quiz }: { quiz: Quiz }) => {
  const route = QUIZ_ROUTES[quiz.quizType as keyof typeof QUIZ_ROUTES] || QUIZ_ROUTES.mcq
  const colors = QUIZ_COLORS[quiz.quizType as keyof typeof QUIZ_COLORS] || QUIZ_COLORS.mcq

  return (
    <motion.div
      variants={CARD_ANIMATIONS}
      initial="enter"
      animate="center"
      exit="exit"
      className="w-full h-full"
    >
      <Card className="h-full border-6 border-[var(--color-border)] bg-[var(--color-card)] shadow-[6px_6px_0_var(--shadow-color)] rounded-none overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          {/* Colored Header Strip */}
          <div className={cn("h-3", colors.bg)} />

          <div className="p-6 flex-1 flex flex-col">
            {/* Icon & Type Badge */}
            <div className="flex items-start gap-4 mb-4">
              <motion.div 
                className={cn(
                  "p-4 text-white rounded-none border-4 border-[var(--color-border)] shadow-[4px_4px_0_var(--shadow-color)]",
                  colors.bg
                )}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <QuizIcon type={quiz.quizType} className="w-8 h-8" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <Badge 
                  variant="outline"
                  className="mb-3 text-xs font-black uppercase tracking-widest border-4 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none shadow-[2px_2px_0_var(--shadow-color)] px-3 py-1"
                >
                  {quiz.quizType}
                </Badge>
                <DifficultyBadge difficulty={quiz.difficulty} className="ml-2" />
              </div>
            </div>

            {/* Title */}
            <h3 className="font-black text-2xl md:text-3xl leading-tight text-[var(--color-text)] mb-4 line-clamp-2">
              {quiz.title}
            </h3>

            {/* Stats */}
            <div className="mb-4">
              <QuizStats 
                questionCount={quiz.questionCount}
                estimatedTime={quiz.estimatedTime}
                rating={quiz.rating}
                quizType={quiz.quizType}
              />
            </div>

            {/* Description */}
            {quiz.description && (
              <p className="text-base text-[var(--color-text)]/70 mb-6 line-clamp-3 leading-relaxed font-medium">
                {quiz.description}
              </p>
            )}

            {/* Spacer to push button to bottom */}
            <div className="flex-1" />

            {/* Action Button */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                asChild
                size="lg"
                className={cn(
                  "w-full h-14 font-black text-base uppercase tracking-wider rounded-none",
                  "border-6 border-[var(--color-border)] text-white shadow-[6px_6px_0_var(--shadow-color)]",
                  "hover:shadow-[8px_8px_0_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
                  "active:shadow-[2px_2px_0_var(--shadow-color)] active:translate-x-[2px] active:translate-y-[2px]",
                  "transition-all duration-150",
                  colors.bg
                )}
              >
                <Link href={`${route}/${quiz.slug}`}>
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Challenge
                  </>
                </Link>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})
QuizCard.displayName = "QuizCard"

const LoadingCard = memo(() => (
  <Card className="h-full border-6 border-[var(--color-border)] bg-[var(--color-card)] shadow-[6px_6px_0_var(--shadow-color)] rounded-none">
    <CardContent className="p-6 h-full flex flex-col">
      <div className="flex items-start gap-4 mb-6">
        <Skeleton className="w-16 h-16 rounded-none border-4 border-[var(--color-border)]" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-24 rounded-none" />
          <Skeleton className="h-8 w-full rounded-none" />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-6">
        <Skeleton className="h-10 w-32 rounded-none" />
        <Skeleton className="h-10 w-24 rounded-none" />
        <Skeleton className="h-10 w-20 rounded-none" />
      </div>
      
      <Skeleton className="h-20 w-full mb-6 rounded-none" />
      
      <div className="flex-1" />
      
      <Skeleton className="h-14 w-full rounded-none" />
    </CardContent>
  </Card>
))
LoadingCard.displayName = "LoadingCard"

const EmptyState = memo(() => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
    className="h-full"
  >
    <Card className="h-full border-6 border-[var(--color-border)] bg-[var(--color-card)] shadow-[6px_6px_0_var(--shadow-color)] rounded-none">
      <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center">
        <motion.div 
          className="w-20 h-20 mb-6 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-none border-6 border-[var(--color-border)] shadow-[4px_4px_0_var(--shadow-color)] flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Zap className="w-10 h-10" />
        </motion.div>
        
        <h3 className="text-2xl font-black mb-3 text-[var(--color-text)] uppercase tracking-wider">
          No Quizzes Available
        </h3>
        <p className="text-base text-[var(--color-text)]/70 mb-6 max-w-md leading-relaxed font-medium">
          We're preparing fresh challenges for you. Check back soon or explore our full quiz library!
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            asChild 
            className="font-black uppercase tracking-wider border-6 border-[var(--color-border)] bg-[var(--color-primary)] text-white shadow-[4px_4px_0_var(--shadow-color)] hover:shadow-[6px_6px_0_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] rounded-none transition-all duration-150 h-12 px-6"
          >
            <Link href="/dashboard/quizzes" className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
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
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
    className="h-full"
  >
    <Card className="h-full border-6 border-[var(--color-border)] bg-[var(--color-card)] shadow-[6px_6px_0_var(--shadow-color)] rounded-none">
      <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center">
        <motion.div 
          className="w-20 h-20 mb-6 bg-[var(--color-error)]/10 text-[var(--color-error)] rounded-none border-6 border-[var(--color-border)] shadow-[4px_4px_0_var(--shadow-color)] flex items-center justify-center"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-10 h-10" />
        </motion.div>
        
        <h3 className="text-2xl font-black mb-3 text-[var(--color-text)] uppercase tracking-wider">
          Loading Failed
        </h3>
        <p className="text-base text-[var(--color-text)]/70 mb-6 max-w-md leading-relaxed font-medium">
          We couldn't load quiz recommendations. Let's give it another shot!
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={onRetry} 
            className="font-black uppercase tracking-wider border-6 border-[var(--color-border)] bg-[var(--color-error)] text-white shadow-[4px_4px_0_var(--shadow-color)] hover:shadow-[6px_6px_0_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] rounded-none transition-all duration-150 h-12 px-6"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  </motion.div>
))
ErrorState.displayName = "ErrorState"

export const RandomQuiz = memo(({
  className,
  autoRotate = true,
  rotationInterval = 8000,
  showControls = true,
  maxQuizzes = 5
}: RandomQuizProps) => {
  const { quizzes, isLoading: loading, error, refreshQuizzes: refetch } = useRandomQuizzes(maxQuizzes)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate)
  const [direction, setDirection] = useState(0)
  const rotationRef = useRef<NodeJS.Timeout | null>(null)

  const displayQuizzes = useMemo(() => {
    if (quizzes && quizzes.length > 0) {
      return quizzes.slice(0, maxQuizzes)
    }
    return []
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

  const goToQuiz = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }, [currentIndex])

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

  useEffect(() => {
    setCurrentIndex(0)
  }, [displayQuizzes])

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
      <div className={cn("w-full h-[600px]", className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="h-full"
        >
          <LoadingCard />
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("w-full h-[600px]", className)}>
        <ErrorState onRetry={refetch} />
      </div>
    )
  }

  if (!loading && displayQuizzes.length === 0) {
    return (
      <div className={cn("w-full h-[600px]", className)}>
        <EmptyState />
      </div>
    )
  }

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-4 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-3 bg-[var(--color-primary)] text-white rounded-none border-6 border-[var(--color-border)] shadow-[4px_4px_0_var(--shadow-color)]"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Zap className="w-6 h-6" />
            </motion.div>
            <div>
              <h3 className="font-black text-2xl text-[var(--color-text)] uppercase tracking-wider">
                Featured Quiz
              </h3>
              <p className="text-sm text-[var(--color-text)]/70 font-medium">
                Handpicked challenges to boost your skills
              </p>
            </div>
          </div>

          {/* Auto-rotate toggle */}
          {showControls && displayQuizzes.length > 1 && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={toggleAutoRotate}
                size="icon"
                variant="outline"
                className="h-12 w-12 border-4 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none shadow-[3px_3px_0_var(--shadow-color)] hover:shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-150"
                title={isAutoRotating ? "Pause rotation" : "Resume rotation"}
              >
                {isAutoRotating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Card Container */}
      <div className="relative h-[600px]">
        <AnimatePresence mode="wait" custom={direction}>
          {currentQuiz && (
            <QuizCard key={currentQuiz.id} quiz={currentQuiz} />
          )}
        </AnimatePresence>

        {/* Navigation Controls */}
        {showControls && displayQuizzes.length > 1 && (
          <>
            <motion.button
              onClick={prevQuiz}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 h-14 w-14 bg-[var(--color-bg)] border-6 border-[var(--color-border)] rounded-none shadow-[4px_4px_0_var(--shadow-color)] hover:shadow-[6px_6px_0_var(--shadow-color)] hover:translate-x-[-3px] hover:translate-y-[-1px] active:shadow-[2px_2px_0_var(--shadow-color)] active:translate-x-[-1px] active:translate-y-[1px] transition-all duration-150 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous quiz"
            >
              <ChevronLeft className="w-6 h-6 text-[var(--color-text)]" />
            </motion.button>

            <motion.button
              onClick={nextQuiz}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 h-14 w-14 bg-[var(--color-bg)] border-6 border-[var(--color-border)] rounded-none shadow-[4px_4px_0_var(--shadow-color)] hover:shadow-[6px_6px_0_var(--shadow-color)] hover:translate-x-[3px] hover:translate-y-[-1px] active:shadow-[2px_2px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-150 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Next quiz"
            >
              <ChevronRight className="w-6 h-6 text-[var(--color-text)]" />
            </motion.button>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      {displayQuizzes.length > 1 && (
        <div className="mt-6 flex flex-col items-center gap-4">
          {/* Dot Indicators */}
          <div className="flex gap-2">
            {displayQuizzes.map((quiz, index) => {
              const colors = QUIZ_COLORS[quiz.quizType as keyof typeof QUIZ_COLORS] || QUIZ_COLORS.mcq
              return (
                <motion.button
                  key={quiz.id}
                  onClick={() => goToQuiz(index)}
                  className={cn(
                    "h-3 rounded-none border-4 border-[var(--color-border)] transition-all duration-300",
                    index === currentIndex
                      ? `w-12 ${colors.bg} shadow-[3px_3px_0_var(--shadow-color)]`
                      : "w-3 bg-[var(--color-text)]/20 hover:bg-[var(--color-text)]/40 shadow-[2px_2px_0_var(--shadow-color)]"
                  )}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Go to quiz ${index + 1}`}
                />
              )
            })}
          </div>
          
          {/* Counter */}
          <div className="text-sm font-black text-[var(--color-text)]/70 uppercase tracking-wider">
            {currentIndex + 1} / {displayQuizzes.length}
          </div>
        </div>
      )}

      {/* Explore All Link */}
      <div className="text-center mt-6">
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link 
            href="/dashboard/quizzes" 
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-black uppercase tracking-wider text-[var(--color-primary)] border-4 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none shadow-[4px_4px_0_var(--shadow-color)] hover:shadow-[6px_6px_0_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-150"
          >
            Explore All Quizzes
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
})

RandomQuiz.displayName = "RandomQuiz"