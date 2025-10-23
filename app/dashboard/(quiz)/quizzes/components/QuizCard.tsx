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
      color: "bg-emerald-400 dark:bg-emerald-500 border-border text-foreground font-black",
    }
  if (questionCount <= 15)
    return {
      label: "INTERMEDIATE",
      color: "bg-amber-400 dark:bg-amber-500 border-border text-foreground font-black",
    }
  return {
    label: "ADVANCED",
    color: "bg-rose-400 dark:bg-rose-500 border-border text-foreground font-black",
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
            "group relative h-full flex flex-col overflow-hidden rounded-xl transition-all duration-200",
            cardPrimary,
            loading && "opacity-70 cursor-progress",
          )}
          aria-busy={loading}
          role="article"
          aria-labelledby={`quiz-title-${slug}`}
          aria-live="polite"
        >
          {/* Header Strip with bold color */}
          <div className={cn("h-3 border-b-3 border-border", config.bg)} />

          {loading && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={3} />
                </div>
                <span className="text-base font-black text-foreground">Starting quiz...</span>
              </div>
            </div>
          )}

          {/* Header Section */}
          <div className={cn("relative px-5 pt-5 pb-4 border-b-3 border-border", config.bg)}>
            <div className="flex items-start justify-between gap-3 mb-4">
              {/* Icon and Badges */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn("p-3 rounded-xl border-3 border-border bg-background neo-shadow shrink-0")}>
                  <QuizTypeIcon className={cn("h-5 w-5 relative z-10", config.color)} strokeWidth={2.5} aria-hidden />
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <div
                    className={cn(
                      "px-3 py-1.5 text-xs font-black rounded-lg border-3 border-border neo-shadow",
                      difficulty.color,
                    )}
                  >
                    {difficulty.label}
                  </div>

                  {isPopular && (
                    <div className="px-3 py-1.5 text-xs font-black rounded-lg border-3 border-border bg-primary/20 text-primary neo-shadow flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" strokeWidth={3} />
                      TRENDING
                    </div>
                  )}
                </div>
              </div>

              {/* Bookmark Button */}
              <button
                onClick={handleBookmarkClick}
                className={cn(
                  "p-2.5 rounded-xl border-3 border-border transition-all duration-200 shrink-0 neo-shadow hover:neo-shadow-lg hover:translate-x-[-2px] hover:translate-y-[-2px]",
                  isBookmarked ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-accent",
                )}
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark quiz"}
              >
                <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} strokeWidth={2.5} aria-hidden />
              </button>
            </div>

            {/* Quiz Type Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onTypeClick?.(quizType)
              }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all border-3 border-border neo-shadow hover:neo-shadow-lg hover:translate-x-[-2px] hover:translate-y-[-2px]",
                "bg-background text-foreground",
              )}
              aria-label={`Filter by ${config.label}`}
            >
              {config.label}
            </button>
          </div>

          {/* Content Section */}
          <CardContent className="p-5 relative z-10 flex-1 flex flex-col min-h-0 bg-card">
            {/* Title & Description */}
            <div className="space-y-3 min-h-[5rem] flex flex-col mb-5">
              <h3 className="font-black text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed flex-1">
                {description || `Test your ${config.label.toLowerCase()} skills`}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 py-4 mb-5">
              <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 border-3 border-border neo-shadow">
                <Clock className="w-5 h-5 text-foreground" strokeWidth={2.5} aria-hidden />
                <span className="text-sm font-black text-foreground">{estimatedTime}</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 border-3 border-border neo-shadow">
                <BookOpen className="w-5 h-5 text-foreground" strokeWidth={2.5} aria-hidden />
                <span className="text-sm font-black text-foreground">{questionCount}</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 border-3 border-border neo-shadow">
                <Users className="w-5 h-5 text-foreground" strokeWidth={2.5} aria-hidden />
                <span className="text-sm font-black text-foreground">{attemptCount}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 flex items-center min-h-[3.5rem] mb-5">
              {completionRate > 0 ? (
                <div className="space-y-3 w-full">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-bold">Your progress</span>
                    <span className="font-black text-foreground text-base">{Math.round(completionRate)}%</span>
                  </div>
                  <div
                    className="w-full bg-muted rounded-full h-3 overflow-hidden border-3 border-border neo-shadow"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(completionRate)}
                    aria-label="Quiz completion progress"
                  >
                    <div
                      style={{ width: `${completionRate}%` }}
                      className={cn("h-full rounded-full transition-all duration-500 bg-primary")}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full flex items-center justify-center p-3 bg-muted/50 rounded-xl border-3 border-border neo-shadow">
                  <Target className="w-5 h-5 mr-2 text-foreground" strokeWidth={2.5} />
                  <span className="text-sm font-black text-foreground">New Challenge!</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-4 pt-4 mt-auto border-t-3 border-border">
              {/* Rating & Badge Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg border-3 border-border neo-shadow">
                    <Star className="w-4 h-4 text-foreground fill-current" strokeWidth={2.5} aria-hidden />
                    <span className="text-sm font-black text-foreground">4.5</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-bold">(128)</span>
                </div>

                <div
                  className={cn(
                    "px-3 py-1.5 text-xs font-black rounded-lg border-3 border-border neo-shadow",
                    isPublic ? "bg-emerald-400 dark:bg-emerald-500 text-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {isPublic ? "PUBLIC" : "PRIVATE"}
                </div>
              </div>

              {/* Start Button */}
              <Button
                variant="default"
                size="lg"
                className={cn(
                  buttonPrimary,
                  "w-full gap-2 text-base rounded-xl",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" strokeWidth={2.5} aria-hidden />
                    <span>Start Quiz</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Link>
  )
}

export const QuizCard = memo(QuizCardComponent)
