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

const QUIZ_COLORS = {
  mcq: {
    bg: "bg-[var(--color-primary)]",
    text: "text-[var(--color-primary)]",
    bgLight: "bg-[var(--color-primary)]/10",
  },
  code: {
    bg: "bg-[var(--color-secondary)]",
    text: "text-[var(--color-secondary)]",
    bgLight: "bg-[var(--color-secondary)]/10",
  },
  blanks: {
    bg: "bg-[var(--color-accent)]",
    text: "text-[var(--color-accent)]",
    bgLight: "bg-[var(--color-accent)]/10",
  },
  openended: {
    bg: "bg-[var(--color-primary)]",
    text: "text-[var(--color-primary)]",
    bgLight: "bg-[var(--color-primary)]/15",
  },
  flashcard: {
    bg: "bg-[var(--color-secondary)]",
    text: "text-[var(--color-secondary)]",
    bgLight: "bg-[var(--color-secondary)]/15",
  },
} as const

const CARD_ANIMATIONS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  }),
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
  mobileDetailsOnly?: boolean
}

const QuizIcon = memo(({ type, className }: { type: string; className?: string }) => {
  const Icon = QUIZ_ICONS[type as keyof typeof QUIZ_ICONS] || Target
  return <Icon className={className} />
})
QuizIcon.displayName = "QuizIcon"

const QuizCard = memo(({ quiz, direction }: { quiz: Quiz; direction: number }) => {
  const route = QUIZ_ROUTES[quiz.quizType as keyof typeof QUIZ_ROUTES] || QUIZ_ROUTES.mcq
  const colors = QUIZ_COLORS[quiz.quizType as keyof typeof QUIZ_COLORS] || QUIZ_COLORS.mcq

  return (
    <motion.div
      custom={direction}
      variants={CARD_ANIMATIONS}
      initial="enter"
      animate="center"
      exit="exit"
      className="w-full"
    >
      <Card className="neo-card overflow-hidden">
        <CardContent className="p-0 overflow-hidden">
          {/* Colored Header Strip */}
          <div className={cn("h-2", colors.bg)} />

          <div className="p-4">
            {/* Icon & Badges */}
            <div className="flex items-start gap-3 mb-3">
              <motion.div 
                className={cn(
                  "p-2.5 text-white rounded-none border-4 border-[var(--color-border)] shadow-[3px_3px_0_var(--shadow-color)] flex-shrink-0",
                  colors.bg
                )}
                whileHover={{ scale: 1.05, rotate: 3 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <QuizIcon type={quiz.quizType} className="w-5 h-5" />
              </motion.div>

              <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 overflow-hidden">
                  <Badge 
                    variant="outline"
                    className="text-xs font-black uppercase tracking-wider border-3 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none shadow-[2px_2px_0_var(--shadow-color)] px-2 py-0.5 flex-shrink-0"
                  >
                    {quiz.quizType}
                  </Badge>
                  <DifficultyBadge difficulty={quiz.difficulty} />
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-black text-base leading-tight text-[var(--color-text)] mb-3 line-clamp-2">
              {quiz.title}
            </h3>

            {/* Stats */}
            <div className="flex flex-wrap gap-2 mb-3 overflow-hidden">
              <motion.div 
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 border-3 border-[var(--color-border)] rounded-none shadow-[2px_2px_0_var(--shadow-color)]",
                  colors.bgLight
                )}
                whileHover={{ scale: 1.03 }}
              >
                <BookOpen className={cn("w-3.5 h-3.5", colors.text)} />
                <span className={cn("font-black text-xs", colors.text)}>{quiz.questionCount}Q</span>
              </motion.div>
              
              {quiz.estimatedTime && (
                <motion.div 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--color-secondary)]/10 border-3 border-[var(--color-border)] rounded-none shadow-[2px_2px_0_var(--shadow-color)]"
                  whileHover={{ scale: 1.03 }}
                >
                  <Clock className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  <span className="font-black text-xs text-[var(--color-secondary)]">{quiz.estimatedTime}m</span>
                </motion.div>
              )}

              {quiz.rating && quiz.rating > 0 && (
                <motion.div 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--color-warning)]/10 border-3 border-[var(--color-border)] rounded-none shadow-[2px_2px_0_var(--shadow-color)]"
                  whileHover={{ scale: 1.03 }}
                >
                  <Star className="w-3.5 h-3.5 text-[var(--color-warning)] fill-current" />
                  <span className="font-black text-xs text-[var(--color-warning)]">{quiz.rating.toFixed(1)}</span>
                </motion.div>
              )}
            </div>

            {/* Description */}
            {quiz.description && (
              <p className="text-sm text-[var(--color-text)]/70 mb-4 line-clamp-2 leading-relaxed">
                {quiz.description}
              </p>
            )}

            {/* Action Button */}
            <motion.div
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                asChild
                className={cn(
                  "neo-button neo-button-primary",
                  "w-full h-11 font-black text-sm uppercase tracking-wider",
                  colors.bg
                )}
              >
                <Link href={`${route}/${quiz.slug}`} className="flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" />
                  Start Quiz
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
  <Card className="neo-card overflow-hidden">
    <CardContent className="p-4 space-y-3 overflow-hidden">
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-none border-4 border-[var(--color-border)]" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-20 rounded-none" />
          <Skeleton className="h-6 w-full rounded-none" />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-16 rounded-none" />
        <Skeleton className="h-8 w-14 rounded-none" />
      </div>
      
      <Skeleton className="h-11 w-full rounded-none" />
    </CardContent>
  </Card>
))
LoadingCard.displayName = "LoadingCard"

const EmptyState = memo(() => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="neo-card overflow-hidden">
      <CardContent className="p-6 text-center overflow-hidden">
        <motion.div 
          className="w-16 h-16 mx-auto mb-4 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-none border-4 border-[var(--color-border)] shadow-[3px_3px_0_var(--shadow-color)] flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Zap className="w-8 h-8" />
        </motion.div>
        
        <h3 className="text-lg font-black mb-2 text-[var(--color-text)] uppercase tracking-wider">
          No Quizzes
        </h3>
        <p className="text-sm text-[var(--color-text)]/70 mb-4 leading-relaxed">
          Check back soon for new challenges!
        </p>
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
  >
    <Card className="neo-card overflow-hidden">
      <CardContent className="p-6 text-center overflow-hidden">
        <motion.div 
          className="w-16 h-16 mx-auto mb-4 bg-[var(--color-error)]/10 text-[var(--color-error)] rounded-none border-4 border-[var(--color-border)] shadow-[3px_3px_0_var(--shadow-color)] flex items-center justify-center"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-8 h-8" />
        </motion.div>
        
        <h3 className="text-lg font-black mb-2 text-[var(--color-text)] uppercase tracking-wider">
          Loading Failed
        </h3>
        <p className="text-sm text-[var(--color-text)]/70 mb-4 leading-relaxed">
          Couldn't load recommendations
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={onRetry} 
            className="neo-button neo-button-primary font-black uppercase tracking-wider h-10 px-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
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
  maxQuizzes = 5,
  mobileDetailsOnly = false
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

  const currentQuiz = useMemo((): Quiz | undefined => displayQuizzes[currentIndex], [displayQuizzes, currentIndex])

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

  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
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

  if (!loading && displayQuizzes.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <EmptyState />
      </div>
    )
  }

  if (mobileDetailsOnly) {
    return (
      <motion.div
        className={cn("w-full overflow-hidden", className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Mobile Details Section */}
        {currentQuiz && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="block"
          >
            <Card className="neo-card overflow-hidden">
              <CardContent className="p-4 overflow-hidden">
                <div className="space-y-3">
                  {/* Additional Stats Row */}
                  <div className="flex flex-wrap gap-2">
                    {currentQuiz.viewCount && currentQuiz.viewCount > 0 && (
                      <motion.div
                        className="neo-badge flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--color-primary)]/10"
                        whileHover={{ scale: 1.03 }}
                      >
                        <Target className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        <span className="font-black text-xs text-[var(--color-primary)]">{currentQuiz.viewCount} views</span>
                      </motion.div>
                    )}

                    {currentQuiz.likeCount && currentQuiz.likeCount > 0 && (
                      <motion.div
                        className="neo-badge flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--color-success)]/10"
                        whileHover={{ scale: 1.03 }}
                      >
                        <Star className="w-3.5 h-3.5 text-[var(--color-success)] fill-current" />
                        <span className="font-black text-xs text-[var(--color-success)]">{currentQuiz.likeCount} likes</span>
                      </motion.div>
                    )}

                    {currentQuiz.isPublic !== undefined && (
                      <motion.div
                        className={cn(
                          "neo-badge flex items-center gap-1.5 px-2.5 py-1.5",
                          currentQuiz.isPublic
                            ? "bg-[var(--color-success)]/10"
                            : "bg-[var(--color-secondary)]/10"
                        )}
                        whileHover={{ scale: 1.03 }}
                      >
                        <Zap className={cn(
                          "w-3.5 h-3.5",
                          currentQuiz.isPublic ? "text-[var(--color-success)]" : "text-[var(--color-secondary)]"
                        )} />
                        <span className={cn(
                          "font-black text-xs",
                          currentQuiz.isPublic ? "text-[var(--color-success)]" : "text-[var(--color-secondary)]"
                        )}>
                          {currentQuiz.isPublic ? "Public" : "Private"}
                        </span>
                      </motion.div>
                    )}

                    {currentQuiz.isFavorite && (
                      <motion.div
                        className="neo-badge flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--color-warning)]/10"
                        whileHover={{ scale: 1.03 }}
                      >
                        <Star className="w-3.5 h-3.5 text-[var(--color-warning)] fill-current" />
                        <span className="font-black text-xs text-[var(--color-warning)]">Favorite</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Tags */}
                  {currentQuiz.tags && currentQuiz.tags.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-[var(--color-text)] uppercase tracking-wider">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {currentQuiz.tags.slice(0, 5).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs font-medium border-2 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none shadow-[1px_1px_0_var(--shadow-color)] px-2 py-0.5"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {currentQuiz.tags.length > 5 && (
                          <Badge
                            variant="secondary"
                            className="text-xs font-medium border-2 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none shadow-[1px_1px_0_var(--shadow-color)] px-2 py-0.5"
                          >
                            +{currentQuiz.tags.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Full Description (Mobile Only) */}
                  {currentQuiz.description && currentQuiz.description.length > 100 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-[var(--color-text)] uppercase tracking-wider">
                        About
                      </h4>
                      <p className="text-sm text-[var(--color-text)]/70 leading-relaxed">
                        {currentQuiz.description}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn("w-full overflow-hidden", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div 
            className="p-2 bg-[var(--color-primary)] text-white rounded-none border-4 border-[var(--color-border)] shadow-[3px_3px_0_var(--shadow-color)]"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Zap className="w-4 h-4" />
          </motion.div>
          <div>
            <h3 className="font-black text-sm text-[var(--color-text)] uppercase tracking-wider leading-none">
              Featured
            </h3>
            <p className="text-xs text-[var(--color-text)]/70 font-medium mt-0.5">
              Handpicked for you
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
              className="h-9 w-9 border-3 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none shadow-[2px_2px_0_var(--shadow-color)] hover:shadow-[3px_3px_0_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all duration-150"
              title={isAutoRotating ? "Pause" : "Play"}
            >
              {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Card Container */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {currentQuiz && (
            <QuizCard key={currentQuiz.id} quiz={currentQuiz} direction={direction} />
          )}
        </AnimatePresence>

        {/* Navigation Arrows */}
        {showControls && displayQuizzes.length > 1 && (
          <>
            <motion.button
              onClick={prevQuiz}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 h-10 w-10 bg-[var(--color-bg)] border-4 border-[var(--color-border)] rounded-none shadow-[3px_3px_0_var(--shadow-color)] hover:shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-1px] active:shadow-[2px_2px_0_var(--shadow-color)] active:translate-x-0 active:translate-y-0 transition-all duration-150 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous quiz"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--color-text)]" />
            </motion.button>

            <motion.button
              onClick={nextQuiz}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 h-10 w-10 bg-[var(--color-bg)] border-4 border-[var(--color-border)] rounded-none shadow-[3px_3px_0_var(--shadow-color)] hover:shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[-1px] active:shadow-[2px_2px_0_var(--shadow-color)] active:translate-x-0 active:translate-y-0 transition-all duration-150 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Next quiz"
            >
              <ChevronRight className="w-5 h-5 text-[var(--color-text)]" />
            </motion.button>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      {displayQuizzes.length > 1 && (
        <div className="mt-3 flex flex-col items-center gap-2">
          {/* Dot Indicators */}
          <div className="flex gap-1.5">
            {displayQuizzes.map((quiz, index) => {
              const colors = QUIZ_COLORS[quiz.quizType as keyof typeof QUIZ_COLORS] || QUIZ_COLORS.mcq
              return (
                <motion.button
                  key={quiz.id}
                  onClick={() => goToQuiz(index)}
                  className={cn(
                    "h-2 rounded-none border-3 border-[var(--color-border)] transition-all duration-300",
                    index === currentIndex
                      ? `w-8 ${colors.bg} shadow-[2px_2px_0_var(--shadow-color)]`
                      : "w-2 bg-[var(--color-text)]/20 hover:bg-[var(--color-text)]/40 shadow-[1px_1px_0_var(--shadow-color)]"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Go to quiz ${index + 1}`}
                />
              )
            })}
          </div>
          
          {/* Counter */}
          <div className="text-xs font-black text-[var(--color-text)]/70 uppercase tracking-wider">
            {currentIndex + 1} / {displayQuizzes.length}
          </div>
        </div>
      )}
    </motion.div>
  )
})

RandomQuiz.displayName = "RandomQuiz"