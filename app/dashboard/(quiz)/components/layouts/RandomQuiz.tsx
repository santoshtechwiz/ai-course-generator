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
  ChevronLeft,
  ChevronRight,
  Pause,
  Info,
} from "lucide-react"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"

// --- CONSTANTS (UNCHANGED) ---

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

// Using theme variables for colors as requested
const QUIZ_COLORS = {
  mcq: {
    bg: "bg-[var(--color-primary)]",
    text: "text-[var(--color-primary)]",
    shadow: "shadow-[3px_3px_0_var(--color-primary-dark)]",
    border: "border-[var(--color-primary)]",
  },
  code: {
    bg: "bg-[var(--color-secondary)]",
    text: "text-[var(--color-secondary)]",
    shadow: "shadow-[3px_3px_0_var(--color-secondary-dark)]",
    border: "border-[var(--color-secondary)]",
  },
  blanks: {
    bg: "bg-[var(--color-accent)]",
    text: "text-[var(--color-accent)]",
    shadow: "shadow-[3px_3px_0_var(--color-accent-dark)]",
    border: "border-[var(--color-accent)]",
  },
  openended: {
    bg: "bg-[var(--color-info)]",
    text: "text-[var(--color-info)]",
    shadow: "shadow-[3px_3px_0_var(--color-info-dark)]",
    border: "border-[var(--color-info)]",
  },
  flashcard: {
    bg: "bg-[var(--color-success)]",
    text: "text-[var(--color-success)]",
    shadow: "shadow-[3px_3px_0_var(--color-success-dark)]",
    border: "border-[var(--color-success)]",
  },
} as const

const CARD_ANIMATIONS = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.8,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.3 },
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.8,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.3 },
    },
  }),
}

// --- INTERFACES (UNCHANGED) ---

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
  mobileDetailsOnly?: boolean
}

// --- HELPER COMPONENTS (REDESIGNED) ---

const QuizIcon = memo(({ type, className }: { type: string; className?: string }) => {
  const Icon = QUIZ_ICONS[type as keyof typeof QUIZ_ICONS] || Target
  return <Icon className={className} />
})
QuizIcon.displayName = "QuizIcon"

const QuizCard = memo(({ quiz, direction }: { quiz: Quiz; direction: number }) => {
  const route = QUIZ_ROUTES[quiz.quizType as keyof typeof QUIZ_ROUTES] || QUIZ_ROUTES.mcq
  const colors = QUIZ_COLORS[quiz.quizType as keyof typeof QUIZ_COLORS] || QUIZ_COLORS.mcq

  // Enhanced Neo-Brutalism Card Style
  const cardStyle = cn(
    "w-full h-full border-4 border-[var(--color-text)] bg-[var(--color-bg)] rounded-none",
    "transition-all duration-150 ease-out",
    colors.shadow // Use the specific color shadow for better contrast
  )

  const buttonStyle = cn(
    "w-full h-12 font-black text-sm uppercase tracking-wider text-white rounded-none",
    "border-4 border-[var(--color-text)]",
    colors.bg,
    colors.shadow,
    "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_var(--color-text)]",
    "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
  )

  return (
    <motion.div
      custom={direction}
      variants={CARD_ANIMATIONS}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute w-full h-full p-0" // Use absolute positioning for smooth AnimatePresence transitions
      style={{ willChange: "transform, opacity" }}
    >
      <Card className={cardStyle}>
        <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full overflow-hidden">
          {/* Header */}
          <div className="mb-4">
            {/* Icon & Badges */}
            <div className="flex items-start gap-4 mb-4">
              <motion.div 
                className={cn(
                  "p-3 text-white rounded-none border-4 border-[var(--color-text)] flex-shrink-0",
                  colors.bg,
                  colors.shadow
                )}
                whileHover={{ scale: 1.05, rotate: 3 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <QuizIcon type={quiz.quizType} className="w-6 h-6" />
              </motion.div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs font-black uppercase tracking-wider rounded-none",
                      "border-3 border-[var(--color-text)] bg-[var(--color-bg)]",
                      "shadow-[2px_2px_0_var(--color-text)]",
                      colors.text
                    )}
                  >
                    {quiz.quizType}
                  </Badge>
                  <DifficultyBadge 
                    difficulty={quiz.difficulty} 
                    className="border-3 border-[var(--color-text)] shadow-[2px_2px_0_var(--color-text)]"
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-black text-xl sm:text-2xl leading-snug text-[var(--color-text)] line-clamp-3 mb-3">
              {quiz.title}
            </h3>

            {/* Description (Visible on larger screens) */}
            {quiz.description && (
              <p className="text-sm text-[var(--color-text)]/80 mb-4 line-clamp-3 leading-relaxed hidden sm:block">
                {quiz.description}
              </p>
            )}
          </div>

          {/* Footer/Stats and Action */}
          <div>
            {/* Stats */}
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Question Count */}
              <motion.div 
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 border-3 border-[var(--color-text)] rounded-none",
                  "shadow-[2px_2px_0_var(--color-text)]",
                  colors.text,
                  "bg-[var(--color-bg)]"
                )}
                whileHover={{ scale: 1.03, backgroundColor: colors.text, color: "white" }}
                transition={{ duration: 0.1 }}
              >
                <BookOpen className={cn("w-4 h-4", colors.text)} />
                <span className="font-black text-sm">{quiz.questionCount} Questions</span>
              </motion.div>
              
              {/* Estimated Time */}
              {quiz.estimatedTime && (
                <motion.div 
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 border-3 border-[var(--color-text)] rounded-none",
                    "shadow-[2px_2px_0_var(--color-text)]",
                    "text-[var(--color-secondary)] bg-[var(--color-bg)]"
                  )}
                  whileHover={{ scale: 1.03, backgroundColor: "var(--color-secondary)", color: "white" }}
                  transition={{ duration: 0.1 }}
                >
                  <Clock className="w-4 h-4" />
                  <span className="font-black text-sm">{quiz.estimatedTime}m</span>
                </motion.div>
              )}

              {/* Rating */}
              {quiz.rating && quiz.rating > 0 && (
                <motion.div 
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 border-3 border-[var(--color-text)] rounded-none",
                    "shadow-[2px_2px_0_var(--color-text)]",
                    "text-[var(--color-warning)] bg-[var(--color-bg)]"
                  )}
                  whileHover={{ scale: 1.03, backgroundColor: "var(--color-warning)", color: "white" }}
                  transition={{ duration: 0.1 }}
                >
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-black text-sm">{quiz.rating.toFixed(1)}</span>
                </motion.div>
              )}
            </div>

            {/* Action Button */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                asChild
                className={buttonStyle}
              >
                <Link href={`${route}/${quiz.slug}`} className="flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" />
                  START QUIZ
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
  <Card className="w-full h-full border-4 border-[var(--color-text)] bg-[var(--color-bg)] rounded-none shadow-[4px_4px_0_var(--color-text)]">
    <CardContent className="p-6 space-y-6 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-start gap-4 mb-4">
          <Skeleton className="w-12 h-12 rounded-none border-4 border-[var(--color-text)] shadow-[3px_3px_0_var(--color-text)]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-24 rounded-none border-2 border-[var(--color-text)]" />
            <Skeleton className="h-8 w-full rounded-none border-2 border-[var(--color-text)]" />
          </div>
        </div>
        <Skeleton className="h-6 w-3/4 rounded-none border-2 border-[var(--color-text)] mb-3" />
        <Skeleton className="h-4 w-full rounded-none border-2 border-[var(--color-text)]" />
        <Skeleton className="h-4 w-11/12 rounded-none border-2 border-[var(--color-text)]" />
      </div>

      {/* Footer */}
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          <Skeleton className="h-8 w-20 rounded-none border-3 border-[var(--color-text)] shadow-[2px_2px_0_var(--color-text)]" />
          <Skeleton className="h-8 w-16 rounded-none border-3 border-[var(--color-text)] shadow-[2px_2px_0_var(--color-text)]" />
        </div>
        <Skeleton className="h-12 w-full rounded-none border-4 border-[var(--color-text)] shadow-[4px_4px_0_var(--color-text)]" />
      </div>
    </CardContent>
  </Card>
))
LoadingCard.displayName = "LoadingCard"

const EmptyState = memo(() => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className="h-full"
  >
    <Card className="h-full border-4 border-[var(--color-text)] bg-[var(--color-bg)] rounded-none shadow-[4px_4px_0_var(--color-text)]">
      <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
        <motion.div 
          className="w-16 h-16 mx-auto mb-6 bg-[var(--color-accent)] text-white rounded-none border-4 border-[var(--color-text)] shadow-[4px_4px_0_var(--color-text)] flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Zap className="w-8 h-8" />
        </motion.div>
        
        <h3 className="text-xl font-black mb-3 text-[var(--color-text)] uppercase tracking-wider">
          No Quizzes Available
        </h3>
        <p className="text-base text-[var(--color-text)]/80 mb-6 leading-relaxed max-w-sm">
          The system is currently generating new, challenging content. Check back soon for fresh quizzes!
        </p>
        <Button
          onClick={() => window.location.reload()}
          className={cn(
            "h-10 font-black text-sm uppercase tracking-wider text-white rounded-none",
            "border-4 border-[var(--color-text)] bg-[var(--color-primary)] shadow-[3px_3px_0_var(--color-text)]",
            "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_var(--color-text)]",
            "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          )}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  </motion.div>
))
EmptyState.displayName = "EmptyState"

const ErrorState = memo(({ onRetry }: { onRetry: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className="h-full"
  >
    <Card className="h-full border-4 border-[var(--color-text)] bg-[var(--color-bg)] rounded-none shadow-[4px_4px_0_var(--color-text)]">
      <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
        <motion.div 
          className="w-16 h-16 mx-auto mb-6 bg-[var(--color-error)] text-white rounded-none border-4 border-[var(--color-text)] shadow-[4px_4px_0_var(--color-text)] flex items-center justify-center"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Info className="w-8 h-8" />
        </motion.div>
        
        <h3 className="text-xl font-black mb-3 text-[var(--color-text)] uppercase tracking-wider">
          Error Loading Quizzes
        </h3>
        <p className="text-base text-[var(--color-text)]/80 mb-6 leading-relaxed max-w-sm">
          An unexpected error occurred while fetching the quizzes. Please check your connection and try again.
        </p>
        <Button
          onClick={onRetry}
          className={cn(
            "h-10 font-black text-sm uppercase tracking-wider text-white rounded-none",
            "border-4 border-[var(--color-text)] bg-[var(--color-error)] shadow-[3px_3px_0_var(--color-text)]",
            "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_var(--color-text)]",
            "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          )}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          RETRY LOAD
        </Button>
      </CardContent>
    </Card>
  </motion.div>
))
ErrorState.displayName = "ErrorState"

// --- MAIN COMPONENT (LOGIC UNCHANGED, STYLING REDESIGNED) ---

export function RandomQuiz({
  className,
  autoRotate = true,
  rotationInterval = 5000,
  showControls = true,
  maxQuizzes = 5,
}: RandomQuizProps) {
  const { quizzes, isLoading, isError, refetch } = useRandomQuizzes()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const displayQuizzes = useMemo(() => quizzes.slice(0, maxQuizzes), [quizzes, maxQuizzes])
  const currentQuiz = displayQuizzes[currentIndex]

  const nextQuiz = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % displayQuizzes.length)
  }, [displayQuizzes.length])

  const prevQuiz = useCallback(() => {
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + displayQuizzes.length) % displayQuizzes.length)
  }, [displayQuizzes.length])

  const goToQuiz = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
    setIsAutoRotating(false) // Pause rotation when user manually navigates
  }, [currentIndex])

  const toggleAutoRotate = useCallback(() => {
    setIsAutoRotating((prev) => !prev)
  }, [])

  // Auto-rotation effect
  useEffect(() => {
    if (isAutoRotating && displayQuizzes.length > 1) {
      intervalRef.current = setInterval(nextQuiz, rotationInterval)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAutoRotating, nextQuiz, rotationInterval, displayQuizzes.length])

  // Reset index when quizzes change
  useEffect(() => {
    setCurrentIndex(0)
    setDirection(0)
  }, [quizzes])

  // --- RENDER LOGIC ---

  if (isLoading) {
    // Ensure the container has a defined height for the loading card
    return (
      <motion.div
        className={cn("w-full h-80", className)} // Added h-80 for a defined height
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <LoadingCard />
      </motion.div>
    )
  }

  if (isError) {
    return (
      <motion.div
        className={cn("w-full h-80", className)} // Added h-80 for a defined height
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ErrorState onRetry={refetch} />
      </motion.div>
    )
  }

  if (displayQuizzes.length === 0) {
    return (
      <motion.div
        className={cn("w-full h-80", className)} // Added h-80 for a defined height
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <EmptyState />
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn("w-full relative", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b-4 border-[var(--color-text)] pb-3">
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-2 bg-[var(--color-primary)] text-white rounded-none border-4 border-[var(--color-text)] shadow-[3px_3px_0_var(--color-text)]"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Zap className="w-5 h-5" />
          </motion.div>
          <div>
            <h3 className="font-black text-lg text-[var(--color-text)] uppercase tracking-widest leading-none">
              FEATURED QUIZ
            </h3>
            <p className="text-sm text-[var(--color-text)]/70 font-medium mt-1">
              Handpicked challenge for you
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
              variant="ghost"
              className={cn(
                "h-10 w-10 rounded-none font-black uppercase",
                "border-4 border-[var(--color-text)] bg-[var(--color-bg)]",
                "shadow-[3px_3px_0_var(--color-text)]",
                "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--color-text)]",
                "active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
                isAutoRotating ? "bg-[var(--color-error)] text-white" : "bg-[var(--color-success)] text-white"
              )}
              title={isAutoRotating ? "Pause Rotation" : "Start Rotation"}
            >
              {isAutoRotating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Card Container - Added fixed height to prevent scrollbar/layout shift and ensure responsiveness */}
      <div className="relative w-full h-80 sm:h-96 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {currentQuiz && (
            <QuizCard key={currentQuiz.id} quiz={currentQuiz} direction={direction} />
          )}
        </AnimatePresence>

        {/* Navigation Arrows */}
        {showControls && displayQuizzes.length > 1 && (
          <>
            {/* Previous Button */}
            <motion.button
              onClick={prevQuiz}
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 -ml-2 z-20 h-12 w-12",
                "bg-[var(--color-bg)] text-[var(--color-text)] rounded-none",
                "border-4 border-[var(--color-text)] shadow-[4px_4px_0_var(--color-text)]",
                "hover:bg-[var(--color-primary)] hover:text-white",
                "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
                "transition-all duration-150 flex items-center justify-center"
              )}
              whileHover={{ scale: 1.05, x: 0 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous quiz"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>

            {/* Next Button */}
            <motion.button
              onClick={nextQuiz}
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 -mr-2 z-20 h-12 w-12",
                "bg-[var(--color-bg)] text-[var(--color-text)] rounded-none",
                "border-4 border-[var(--color-text)] shadow-[-4px_4px_0_var(--color-text)]",
                "hover:bg-[var(--color-primary)] hover:text-white",
                "active:translate-x-[-2px] active:translate-y-[2px] active:shadow-none",
                "transition-all duration-150 flex items-center justify-center"
              )}
              whileHover={{ scale: 1.05, x: 0 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Next quiz"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      {displayQuizzes.length > 1 && (
        <div className="mt-4 flex flex-col items-center gap-2">
          {/* Dot Indicators */}
          <div className="flex gap-2">
            {displayQuizzes.map((quiz, index) => {
              const colors = QUIZ_COLORS[quiz.quizType as keyof typeof QUIZ_COLORS] || QUIZ_COLORS.mcq
              const isActive = index === currentIndex
              return (
                <motion.button
                  key={quiz.id}
                  onClick={() => goToQuiz(index)}
                  className={cn(
                    "h-3 rounded-none border-3 border-[var(--color-text)] transition-all duration-300",
                    isActive
                      ? `w-8 ${colors.bg} shadow-[2px_2px_0_var(--color-text)]`
                      : "w-3 bg-[var(--color-bg)] hover:bg-[var(--color-text)]/20 shadow-[1px_1px_0_var(--color-text)]"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Go to quiz ${index + 1}`}
                />
              )
            })}
          </div>
          
          {/* Counter */}
          <div className="text-sm font-black text-[var(--color-text)] uppercase tracking-wider">
            {currentIndex + 1} / {displayQuizzes.length}
          </div>
        </div>
      )}
    </motion.div>
  )
}

RandomQuiz.displayName = "RandomQuiz"
