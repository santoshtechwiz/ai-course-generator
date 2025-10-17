"use client"

import type React from "react"
import { useState, memo, useCallback, useMemo, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import QuizBadge from "./QuizBadge"
import { Clock, Star, BookOpen, Loader2, Play, Bookmark, Users, TrendingUp } from "lucide-react"
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
      label: "Beginner",
      color: "bg-success/10 text-success border-success/20",
    }
  if (questionCount <= 15)
    return { label: "Intermediate", color: "bg-warning/10 text-warning border-warning/20" }
  return { label: "Advanced", color: "bg-destructive/10 text-destructive border-destructive/20" }
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
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl h-full"
      tabIndex={0}
      aria-label={`Open quiz: ${title}`}
      onClick={handleQuizClick}
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="h-full transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.01]"
      >
        <Card
          className={cn(
            "group relative h-full flex flex-col overflow-hidden border-3 transition-transform duration-200 rounded-none",
            "hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]",
            "active:translate-x-[0px] active:translate-y-[0px] active:shadow-none",
            "bg-card",
            config.border,
            loading && "opacity-70 cursor-progress",
          )}
          aria-busy={loading}
          role="article"
          aria-labelledby={`quiz-title-${slug}`}
          aria-live="polite"
        >
          <div className={cn("absolute top-0 left-0 right-0 h-2 border-b-3 border-border", config.bg)} />

          {loading && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-20 rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div className="absolute inset-0 h-8 w-8 animate-ping text-primary/20">
                    <Loader2 className="h-8 w-8" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-foreground">Starting quiz...</span>
              </div>
            </div>
          )}

          <div className={cn("relative px-4 pt-4 pb-3 border-b-3 transition-colors", config.bg, config.border)}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={cn(
                    "p-3 rounded-none border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] relative overflow-hidden shrink-0",
                    config.bg,
                    config.border,
                  )}
                >
                  <QuizTypeIcon className={cn("h-5 w-5 relative z-10", config.color)} aria-hidden />
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <QuizBadge className={difficulty.color} aria-label={`Difficulty: ${difficulty.label}`}>
                    {difficulty.label}
                  </QuizBadge>

                  {isPopular && (
                    <QuizBadge className="bg-primary/20 text-primary border-primary/40" aria-label="Popular quiz">
                      <TrendingUp className="w-4 h-4 mr-1 inline-block align-middle" aria-hidden />
                      <span className="align-middle">Popular</span>
                    </QuizBadge>
                  )}
                </div>
              </div>

              <button
                onClick={handleBookmarkClick}
                className={cn(
                  "p-2 rounded-none border-2 transition-transform shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none focus-visible:ring-4 focus-visible:ring-primary",
                  isBookmarked
                    ? "bg-primary border-border text-primary-foreground"
                    : "bg-card border-border text-foreground hover:bg-primary/10",
                )}
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark quiz"}
              >
                <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} aria-hidden />
              </button>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onTypeClick?.(quizType)
              }}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-none text-sm font-bold transition-transform border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none focus-visible:ring-4 focus-visible:ring-primary",
                config.pill,
                isTypeActive && "ring-4 ring-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]",
              )}
              aria-label={`Filter by ${config.label}`}
            >
              {config.label}
            </button>
          </div>

          <CardContent className="p-5 relative z-10 flex-1 flex flex-col">
            {/* Title & Description - Fixed height */}
            <div className="space-y-2 h-[88px] flex flex-col">
              <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                {description || `Test your ${config.label.toLowerCase()} skills`}
              </p>
            </div>

            {/* Stats Grid - Redesigned */}
            <div className="grid grid-cols-3 gap-2 py-4">
              <div className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-none bg-primary/10 border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)]">
                <Clock className="w-4 h-4 text-primary" aria-hidden />
                <span className="text-xs font-black text-foreground">{estimatedTime}</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-none bg-primary/10 border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)]">
                <BookOpen className="w-4 h-4 text-primary" aria-hidden />
                <span className="text-xs font-black text-foreground">{questionCount} Qs</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-none bg-primary/10 border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)]">
                <Users className="w-4 h-4 text-primary" aria-hidden />
                <span className="text-xs font-black text-foreground">{attemptCount}</span>
              </div>
            </div>

            {/* Progress Bar - Fixed height section to maintain alignment */}
            <div className="min-h-[60px] flex items-center">
              {completionRate > 0 ? (
                <div className="space-y-2 w-full">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Your progress</span>
                    <span className="font-black text-base text-primary">{Math.round(completionRate)}%</span>
                  </div>
                  <div
                    className="w-full bg-muted rounded-none h-3 overflow-hidden border-2 border-border"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(completionRate)}
                    aria-label="Quiz completion progress"
                  >
                    <div
                      style={{ width: `${completionRate}%` }}
                      className={cn(
                        "h-full rounded-none transition-all duration-500",
                        config.bg,
                      )}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full" /> // Empty placeholder to maintain height
              )}
            </div>

            {/* Footer - Always at bottom with consistent spacing */}
            <div className="flex flex-col gap-3 pt-4 mt-auto border-t border-border/30">
              {/* Rating & Badge Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-warning fill-warning" aria-hidden />
                  <span className="text-sm font-bold text-foreground">4.5</span>
                  <span className="text-xs text-muted-foreground">(128)</span>
                </div>

                <QuizBadge
                  variant="outline"
                  className={cn(
                    "text-xs px-2.5 py-1 font-semibold border shadow-sm rounded-full",
                    isPublic
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-muted text-muted-foreground border-border",
                  )}
                  aria-label={isPublic ? "Public quiz" : "Private quiz"}
                >
                  {isPublic ? "Public" : "Private"}
                </QuizBadge>
              </div>

              {/* Start Button - Full Width */}
              <Button
                variant="default"
                size="lg"
                className={cn(
                  "w-full gap-2 text-sm font-black rounded-none border-3 border-border transition-transform",
                  "bg-primary text-primary-foreground",
                  "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]",
                  "hover:translate-x-[-2px] hover:translate-y-[-2px]",
                  "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]",
                  "active:translate-x-[0px] active:translate-y-[0px] active:shadow-none",
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
                    <Play className="w-4 h-4 fill-current" aria-hidden />
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
