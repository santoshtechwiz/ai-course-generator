"use client"

import type React from "react"
import { useState, memo, useCallback, useMemo, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import QuizBadge from "./QuizBadge"
import { Clock, Star, BookOpen, Loader2, Play, Bookmark, Users, TrendingUp, Zap, Target, Award } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
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
      color: "bg-green-500 border-border text-primary-foreground font-bold",
    }
  if (questionCount <= 15)
    return { 
      label: "INTERMEDIATE", 
      color: "bg-yellow-500 border-border text-primary-foreground font-bold" 
    }
  return { 
    label: "ADVANCED", 
    color: "bg-red-500 border-border text-primary-foreground font-bold" 
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
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg h-full"
      tabIndex={0}
      aria-label={`Open quiz: ${title}`}
      onClick={handleQuizClick}
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="h-full transition-all duration-200 hover:-translate-y-1"
      >
        <Card
          className={cn(
            "group relative h-full flex flex-col overflow-hidden border-2 transition-all duration-200 rounded-lg",
            "bg-card text-card-foreground border-border shadow-sm",
            "hover:shadow-md hover:border-primary/50",
            loading && "opacity-70 cursor-progress",
          )}
          aria-busy={loading}
          role="article"
          aria-labelledby={`quiz-title-${slug}`}
          aria-live="polite"
        >
          {/* Header Strip */}
          <div className={cn("h-2 border-b border-border", config.bg)} />

          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Starting quiz...</span>
              </div>
            </div>
          )}

          {/* Header Section */}
          <div className={cn("relative px-4 pt-4 pb-3 border-b border-border", config.bg)}>
            <div className="flex items-start justify-between gap-3 mb-3">
              {/* Icon and Badges */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={cn(
                    "p-2 rounded-md border border-border bg-background shadow-sm relative overflow-hidden shrink-0",
                  )}
                >
                  <QuizTypeIcon className={cn("h-4 w-4 relative z-10", config.color)} aria-hidden />
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <div className={cn("px-2 py-1 text-xs font-semibold rounded-md border border-border", difficulty.color)}>
                    {difficulty.label}
                  </div>

                  {isPopular && (
                    <div className="px-2 py-1 text-xs font-semibold rounded-md border border-border bg-primary/10 text-primary flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      TRENDING
                    </div>
                  )}
                </div>
              </div>

              {/* Bookmark Button */}
              <button
                onClick={handleBookmarkClick}
                className={cn(
                  "p-2 rounded-md border border-border transition-all duration-200 shrink-0 bg-background",
                  "hover:bg-accent hover:text-accent-foreground",
                  isBookmarked ? "bg-primary text-primary-foreground" : "bg-background text-foreground",
                )}
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark quiz"}
              >
                <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} aria-hidden />
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
                "inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-all border border-border",
                "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                isTypeActive && "ring-2 ring-ring",
              )}
              aria-label={`Filter by ${config.label}`}
            >
              {config.label}
            </button>
          </div>

          {/* Content Section */}
          <CardContent className="p-4 relative z-10 flex-1 flex flex-col min-h-0 bg-background">
            {/* Title & Description */}
            <div className="space-y-2 min-h-[4rem] flex flex-col mb-4">
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                {description || `Test your ${config.label.toLowerCase()} skills`}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 py-3 mb-4">
              <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-md bg-muted/50 border border-border">
                <Clock className="w-4 h-4 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium text-foreground">{estimatedTime}</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-md bg-muted/50 border border-border">
                <BookOpen className="w-4 h-4 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium text-foreground">{questionCount}</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-md bg-muted/50 border border-border">
                <Users className="w-4 h-4 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium text-foreground">{attemptCount}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 flex items-center min-h-[3rem] mb-4">
              {completionRate > 0 ? (
                <div className="space-y-2 w-full">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Your progress</span>
                    <span className="font-semibold text-foreground">
                      {Math.round(completionRate)}%
                    </span>
                  </div>
                  <div
                    className="w-full bg-muted rounded-full h-2 overflow-hidden"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(completionRate)}
                    aria-label="Quiz completion progress"
                  >
                    <div
                      style={{ width: `${completionRate}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-500 bg-primary",
                      )}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full flex items-center justify-center p-2 bg-muted/50 rounded-md border border-border">
                  <Target className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">New Challenge!</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 pt-3 mt-auto border-t border-border">
              {/* Rating & Badge Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md border border-border">
                    <Star className="w-3 h-3 text-foreground fill-current" aria-hidden />
                    <span className="text-sm font-medium text-foreground">4.5</span>
                  </div>
                  <span className="text-xs text-muted-foreground">(128)</span>
                </div>

                <div className={cn(
                  "px-2 py-1 text-xs font-medium rounded-md border border-border",
                  isPublic 
                    ? "bg-green-500/10 text-green-700 border-green-200" 
                    : "bg-muted text-muted-foreground border-border"
                )}>
                  {isPublic ? "PUBLIC" : "PRIVATE"}
                </div>
              </div>

              {/* Start Button */}
              <Button
                variant="default"
                size="sm"
                className={cn(
                  "w-full gap-2 text-sm font-medium rounded-md transition-all",
                  "hover:shadow-sm",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" aria-hidden />
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