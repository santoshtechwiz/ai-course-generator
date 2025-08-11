"use client"

import React from "react"

import type { ReactElement } from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, RefreshCw, ExternalLink, Play, Pause, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useRandomQuizzes, type RandomQuiz } from "@/hooks/useRandomQuizzes"

interface RandomQuizProps {
  maxQuizzes?: number
  showStats?: boolean
  autoRotate?: boolean
  rotationInterval?: number
  className?: string
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

// Quiz type configurations
const quizTypeConfig = {
  mcq: {
    label: "Multiple Choice",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  code: {
    label: "Code Quiz",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
  },
  blanks: {
    label: "Fill Blanks",
    color: "bg-cyan-500",
    textColor: "text-cyan-700",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    borderColor: "border-cyan-200 dark:border-cyan-800",
  },
  openended: {
    label: "Open Ended",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  flashcard: {
    label: "Flashcards",
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  quiz: {
    label: "General Quiz",
    color: "bg-indigo-500",
    textColor: "text-indigo-700",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    borderColor: "border-indigo-200 dark:border-indigo-800",
  },
}

// Difficulty configurations
const difficultyConfig = {
  easy: {
    label: "Easy",
    color: "bg-green-500",
    textColor: "text-green-700",
  },
  medium: {
    label: "Medium",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
  },
  hard: {
    label: "Hard",
    color: "bg-red-500",
    textColor: "text-red-700",
  },
}

// Loading skeleton component
const QuizCardSkeleton = () => (
  <Card className="w-full h-full">
    <CardContent className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </CardContent>
  </Card>
)

// Error state component
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <Card className="w-full h-full border-destructive/20">
    <CardContent className="p-6 text-center space-y-4">
      <div className="text-4xl">⚠️</div>
      <h3 className="font-semibold text-destructive">Failed to Load Quizzes</h3>
      <p className="text-sm text-muted-foreground">{error}</p>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </CardContent>
  </Card>
)

// Empty state component
const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
  <Card className="w-full h-full">
    <CardContent className="p-6 text-center space-y-4">
      <div className="text-4xl">📚</div>
      <h3 className="font-semibold">No Quizzes Available</h3>
      <p className="text-sm text-muted-foreground">Check back later for new quizzes</p>
      <Button onClick={onRefresh} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>
    </CardContent>
  </Card>
)

// Quiz card component
const QuizCard = React.memo(({ quiz, showStats }: { quiz: RandomQuiz; showStats: boolean }) => {
  const config = quizTypeConfig[quiz.quizType as keyof typeof quizTypeConfig] || quizTypeConfig.quiz
  const difficultyConf = difficultyConfig[quiz.difficulty as keyof typeof difficultyConfig] || difficultyConfig.medium

  const handleQuizClick = useCallback(() => {
    const url = `/dashboard/${quiz.quizType}/${quiz.slug || quiz.id}`
    window.open(url, "_blank", "noopener,noreferrer")
  }, [quiz.quizType, quiz.slug, quiz.id])

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="w-full h-full">
      <Card
        className={cn("w-full h-full cursor-pointer transition-all duration-200 hover:shadow-lg", config.borderColor)}
      >
        <CardContent className="p-6 space-y-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start">
            <Badge variant="secondary" className={cn("text-xs", config.bgColor, config.textColor)}>
              {config.label}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", difficultyConf.textColor)}>
              {difficultyConf.label}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 flex-1">{quiz.title}</h3>

          {/* Description */}
          {quiz.description && <p className="text-sm text-muted-foreground line-clamp-2">{quiz.description}</p>}

          {/* Stats */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{quiz.questionCount} questions</span>
              {showStats && quiz.rating && <span className="flex items-center gap-1">⭐ {quiz.rating.toFixed(1)}</span>}
            </div>
            <Button onClick={handleQuizClick} size="sm" className="h-8 px-3 text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              Start
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

QuizCard.displayName = "QuizCard"

export function RandomQuiz({
  maxQuizzes = 6,
  showStats = true,
  autoRotate = false,
  rotationInterval = 5000,
  className,
}: RandomQuizProps): ReactElement {
  const { quizzes, isLoading, error, refreshQuizzes, shuffleQuizzes } = useRandomQuizzes(maxQuizzes)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-rotation logic
  useEffect(() => {
    if (!autoRotate || isPaused || quizzes.length <= 1) return

    const interval = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % quizzes.length)
    }, rotationInterval)

    return () => clearInterval(interval)
  }, [autoRotate, isPaused, quizzes.length, rotationInterval])

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (quizzes.length <= 1) return
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % quizzes.length)
  }, [quizzes.length])

  const goToPrevious = useCallback(() => {
    if (quizzes.length <= 1) return
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + quizzes.length) % quizzes.length)
  }, [quizzes.length])

  const toggleAutoRotation = useCallback(() => {
    setIsPaused((prev) => !prev)
  }, [])

  // Current quiz
  const currentQuiz = useMemo(() => {
    return quizzes[currentIndex] || null
  }, [quizzes, currentIndex])

  // Reset index when quizzes change
  useEffect(() => {
    setCurrentIndex(0)
  }, [quizzes])

  if (isLoading) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className={cn("w-full", className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Discover Quizzes</h2>
            <Skeleton className="h-8 w-20" />
          </div>
          <QuizCardSkeleton />
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className={cn("w-full", className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Discover Quizzes</h2>
          </div>
          <ErrorState error={error} onRetry={refreshQuizzes} />
        </div>
      </motion.div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className={cn("w-full", className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Discover Quizzes</h2>
          </div>
          <EmptyState onRefresh={refreshQuizzes} />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={cn("w-full", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Discover Quizzes</h2>
          <div className="flex items-center gap-2">
            {autoRotate && (
              <Button
                onClick={toggleAutoRotation}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title={isPaused ? "Resume auto-rotation" : "Pause auto-rotation"}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
            )}
            <Button onClick={shuffleQuizzes} variant="ghost" size="sm" className="h-8 w-8 p-0" title="Shuffle quizzes">
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button onClick={refreshQuizzes} variant="ghost" size="sm" className="h-8 w-8 p-0" title="Refresh quizzes">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quiz Display */}
        <div className="relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {currentQuiz && (
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="w-full"
              >
                <QuizCard quiz={currentQuiz} showStats={showStats} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        {quizzes.length > 1 && (
          <div className="flex items-center justify-between">
            <Button onClick={goToPrevious} variant="outline" size="sm" className="h-8 px-3 bg-transparent">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {/* Dot indicators */}
            <div className="flex items-center gap-2">
              {quizzes.slice(0, Math.min(5, quizzes.length)).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1)
                    setCurrentIndex(index)
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    index === currentIndex
                      ? "bg-primary scale-125"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                  )}
                  aria-label={`Go to quiz ${index + 1}`}
                />
              ))}
              {quizzes.length > 5 && (
                <span className="text-xs text-muted-foreground ml-2">+{quizzes.length - 5} more</span>
              )}
            </div>

            <Button onClick={goToNext} variant="outline" size="sm" className="h-8 px-3 bg-transparent">
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Quiz counter */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Showing {currentIndex + 1} of {quizzes.length} quizzes
          </p>
        </div>
      </div>
    </motion.div>
  )
}
