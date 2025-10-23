"use client"

import { useMemo } from "react"

import type React from "react"
import { useState, memo, useCallback, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Star, BookOpen, Loader2, Play, Bookmark, Users, TrendingUp, Target } from "lucide-react"
import Link from "next/link"
import { cn, getColorClasses } from "@/lib/utils"
import { QUIZ_TYPE_CONFIG } from "./quiz-type-config"
import type { QuizType } from "@/app/types/quiz-types"

interface QuizCardProps {
  title: string
  description: string
  questionCount: number
  isPublic?: boolean
  onTypeClick?: (type: QuizType) => void
  selectedTypes?: QuizType[]
  activeFilter?: string
  slug: string
  quizType: QuizType
  estimatedTime: string
  completionRate?: number
  compact?: boolean
  userId?: string
  currentUserId?: string
  onDelete?: (slug: string, quizType: QuizType) => void
  showActions?: boolean
  isNavigating?: boolean
  onNavigationChange?: (loading: boolean) => void
}

const getDifficulty = (questionCount: number) => {
  if (questionCount <= 5)
    return {
      label: "BEGINNER",
      color: "bg-[var(--color-success)] text-white border-4 border-black font-black shadow-[3px_3px_0_#000]",
    }
  if (questionCount <= 15)
    return {
      label: "INTERMEDIATE",
      color: "bg-[var(--color-warning)] text-white border-4 border-black font-black shadow-[3px_3px_0_#000]",
    }
  return {
    label: "ADVANCED",
    color: "bg-[var(--color-destructive)] text-white border-4 border-black font-black shadow-[3px_3px_0_#000]",
  }
}

function QuizCardComponent({
  title,
  description,
  questionCount,
  isPublic = true,
  onTypeClick,
  selectedTypes = [],
  activeFilter,
  slug,
  quizType,
  estimatedTime,
  completionRate = 0,
  compact = false,
  userId,
  currentUserId,
  onDelete,
  showActions = false,
  isNavigating = false,
  onNavigationChange,
}: QuizCardProps) {
  const { buttonPrimary, cardPrimary } = getColorClasses()
  const [isHovered, setIsHovered] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const normalizedType = (quizType || "mcq").toLowerCase() as keyof typeof QUIZ_TYPE_CONFIG
  const config = QUIZ_TYPE_CONFIG[normalizedType] || QUIZ_TYPE_CONFIG.mcq
  const QuizTypeIcon = config.icon

  const isTypeActive = useMemo(
    () => (selectedTypes && selectedTypes.includes(quizType)) || activeFilter === quizType,
    [selectedTypes, activeFilter, quizType],
  )

  const loading = isNavigating || localLoading
  const difficulty = getDifficulty(questionCount)
  const isPopular = questionCount >= 10
  const attemptCount = Math.floor(Math.random() * 500) + 100

  const handleBookmarkClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsBookmarked(!isBookmarked)
    },
    [isBookmarked],
  )

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [])

  const handleQuizClick = useCallback(async () => {
    if (loading) return
    setLocalLoading(true)
    onNavigationChange?.(true)

    loadingTimeoutRef.current = setTimeout(() => {
      setLocalLoading(false)
      onNavigationChange?.(false)
    }, 4000)
  }, [loading, onNavigationChange])

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onDelete?.(slug, quizType)
    },
    [onDelete, slug, quizType],
  )

  const isOwner = userId && currentUserId && String(userId) === String(currentUserId)
  const canShowActions = showActions && isOwner

  return (
    <Link
      href={`/dashboard/${quizType}/${slug}`}
      className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl h-full group"
      tabIndex={0}
      aria-label={`Open quiz: ${title}`}
      onClick={handleQuizClick}
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="h-full transition-all duration-200 neo-hover"
      >
        <Card
          className={cn(
            "group relative h-full flex flex-col overflow-hidden bg-[var(--color-card)] cursor-pointer border-4 border-black transition-all duration-200",
            "hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[6px_6px_0_#000]",
            "active:translate-x-[0px] active:translate-y-[0px] active:shadow-none",
            "h-full flex items-center justify-center overflow-hidden",
            loading && "opacity-70 cursor-progress",
          )}
          aria-busy={loading}
          role="article"
          aria-labelledby={`quiz-title-${slug}`}
          aria-live="polite"
        >
          {/* Header Strip with bold color */}
          <div className={cn("h-3 border-b-4 border-black", config.bg)} />

          {loading && (
            <div className="absolute inset-0 bg-[var(--color-bg)]/90 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" strokeWidth={3} />
                </div>
                <span className="text-base font-black text-[var(--color-text)]">Starting quiz...</span>
              </div>
            </div>
          )}

          {/* Content Section */}
          <CardContent className="p-6 flex flex-col gap-4 text-center relative h-full">
            {/* Title & Description */}
            <div className="relative space-y-2 flex-1 flex flex-col justify-center min-h-[4rem]">
              <h3 className="font-black text-xl leading-tight text-[var(--color-text)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                {title}
              </h3>
              <p className="text-sm text-[var(--color-text)]/70 font-medium line-clamp-2 leading-relaxed">
                {description || `Test your ${config.label.toLowerCase()} skills`}
              </p>
            </div>

            {/* Difficulty Badge */}
            <div className="flex justify-center">
              <div className={cn("px-4 py-2 text-sm font-black rounded-lg border-4 border-black shadow-[4px_4px_0_#000]", difficulty.color)}>
                {difficulty.label}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[var(--color-bg)] border-4 border-black shadow-[4px_4px_0_#000]">
                <Clock className="w-6 h-6 text-[var(--color-text)]" strokeWidth={2.5} aria-hidden />
                <span className="text-sm font-black text-[var(--color-text)]">{estimatedTime}</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[var(--color-bg)] border-4 border-black shadow-[4px_4px_0_#000]">
                <BookOpen className="w-6 h-6 text-[var(--color-text)]" strokeWidth={2.5} aria-hidden />
                <span className="text-sm font-black text-[var(--color-text)]">{questionCount}</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[var(--color-bg)] border-4 border-black shadow-[4px_4px_0_#000]">
                <Users className="w-6 h-6 text-[var(--color-text)]" strokeWidth={2.5} aria-hidden />
                <span className="text-sm font-black text-[var(--color-text)]">{attemptCount}</span>
              </div>
            </div>

            {/* Start Button */}
            <Button
              variant="default"
              size="lg"
              className={cn(
                "w-full gap-3 text-lg font-black bg-black text-white border-4 border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" strokeWidth={3} />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6" strokeWidth={2.5} aria-hidden />
                  <span>Start Quiz</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Link>
  )
}

export const QuizCard = memo(QuizCardComponent)
