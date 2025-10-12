"use client"

import type React from "react"
import { useState, memo, useCallback, useMemo, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
      color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    }
  if (questionCount <= 15)
    return { label: "Intermediate", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" }
  return { label: "Advanced", color: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30" }
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
            "group relative h-full flex flex-col overflow-hidden border transition-all duration-200",
            "hover:shadow-xl hover:shadow-primary/5",
            "bg-gradient-to-br from-card via-card to-card/95",
            config.border,
            loading && "opacity-70 cursor-progress",
          )}
          aria-busy={loading}
          aria-live="polite"
        >
          <div className={cn("absolute top-0 left-0 right-0 h-1", "bg-gradient-to-r", config.accent)} />

          <div
            className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              "bg-gradient-to-br",
              config.gradient || "from-primary/5 via-transparent to-accent/5",
            )}
          />

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

          <div className={cn("relative px-4 pt-4 pb-3 border-b transition-colors", config.bg, config.border)}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className={cn(
                    "p-2 rounded-lg border shadow-sm relative overflow-hidden shrink-0 transition-transform hover:scale-105",
                    config.bg,
                    config.border,
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 opacity-20 bg-gradient-to-br",
                      config.gradient || "from-primary to-accent",
                    )}
                  />
                  <QuizTypeIcon className={cn("h-4 w-4 relative z-10", config.color)} />
                </div>

                <div className="flex flex-col gap-1.5 min-w-0">
                  <Badge
                    variant="secondary"
                    className={cn("text-[10px] px-2 py-0.5 font-semibold border shadow-sm w-fit", difficulty.color)}
                  >
                    {difficulty.label}
                  </Badge>

                  {isPopular && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-700 dark:text-orange-300 border-orange-500/40 font-semibold shadow-sm w-fit"
                    >
                      <TrendingUp className="w-2.5 h-2.5 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>
              </div>

              <button
                onClick={handleBookmarkClick}
                className={cn(
                  "p-1.5 rounded-lg border transition-all shrink-0 shadow-sm hover:scale-105 active:scale-95",
                  isBookmarked
                    ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-card/80 backdrop-blur-sm border-border hover:border-primary/50 text-muted-foreground hover:text-primary hover:bg-primary/5",
                )}
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark quiz"}
              >
                <Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
              </button>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onTypeClick?.(quizType)
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all border shadow-sm hover:scale-105 active:scale-95",
                config.pill,
                isTypeActive && "ring-2 ring-primary ring-offset-1 shadow-md",
              )}
              aria-label={`Filter by ${config.label}`}
            >
              {config.label}
            </button>
          </div>

          <CardContent className="p-4 space-y-3 relative z-10 flex-1 flex flex-col">
            <div className="space-y-1.5">
              <h3 className="font-bold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {description || `Test your ${config.label.toLowerCase()} skills with ${questionCount} questions`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 py-3 border-y border-border/50">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[10px] font-semibold text-foreground">{estimatedTime}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="p-1.5 rounded-lg bg-accent/10">
                  <BookOpen className="w-3.5 h-3.5 text-accent-foreground" />
                </div>
                <span className="text-[10px] font-semibold text-foreground">{questionCount} Qs</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="p-1.5 rounded-lg bg-secondary/10">
                  <Users className="w-3.5 h-3.5 text-secondary-foreground" />
                </div>
                <span className="text-[10px] font-semibold text-foreground">{attemptCount}</span>
              </div>
            </div>

            {completionRate > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground font-medium">Your Progress</span>
                  <span className="font-bold text-primary">{Math.round(completionRate)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden shadow-inner">
                  <div
                    style={{ width: `${completionRate}%` }}
                    className={cn(
                      "h-2 rounded-full bg-gradient-to-r shadow-sm transition-all duration-500",
                      config.accent,
                    )}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 mt-auto">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-bold text-foreground">4.5</span>
                  <span className="text-[10px] text-muted-foreground">(128)</span>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-2 py-0.5 font-medium border shadow-sm",
                    isPublic
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
                  )}
                >
                  {isPublic ? "Public" : "Private"}
                </Badge>
              </div>

              <Button
                variant="default"
                size="sm"
                className={cn(
                  "gap-1.5 text-[10px] h-8 px-3 font-semibold shadow-md transition-all",
                  "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80",
                  "hover:shadow-lg hover:shadow-primary/20",
                  isHovered && "shadow-lg shadow-primary/20",
                )}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start</span>
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
