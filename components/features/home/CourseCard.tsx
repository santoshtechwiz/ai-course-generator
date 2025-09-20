"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Play, Heart, Bookmark, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export interface CourseCardProps {
  title: string
  description: string
  rating: number
  slug: string
  courseId?: number
  variant?: "grid" | "list"
  unitCount: number
  lessonCount: number
  quizCount: number
  viewCount: number
  category?: string
  duration?: string
  className?: string
  loading?: boolean
  image?: string
  difficulty?: "Beginner" | "Intermediate" | "Advanced"
  price?: number
  originalPrice?: number
  isPopular?: boolean
  isTrending?: boolean
  completionRate?: number
  enrolledCount?: number
  ratingLoading?: boolean
  tags?: string[]
  instructor?: string
  updatedAt?: string
  isEnrolled?: boolean
  progressPercentage?: number
  completedChapters?: number
  totalChapters?: number
  lastAccessedAt?: string
  currentChapterTitle?: string
  timeSpent?: number
}

const DIFFICULTY_CONFIG = {
  Beginner: { badge: "bg-accent/10 text-accent border-accent/20", dot: "bg-accent" },
  Intermediate: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  Advanced: { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
}

export const CourseCard = React.memo((props: CourseCardProps) => {
  const {
    title,
    description,
    rating,
    slug,
    courseId,
    unitCount,
    lessonCount,
    quizCount,
    viewCount,
    category = "Course",
    duration = "4-6 weeks",
    className,
    loading = false,
    image,
    difficulty,
    price,
    originalPrice,
    isPopular = false,
    isTrending = false,
    completionRate = 85,
    enrolledCount = 1234,
    instructor = "Course Instructor",
    isEnrolled = false,
    progressPercentage = 0,
    completedChapters = 0,
    totalChapters = unitCount || 0,
    variant = "grid",
  } = props

  const [isNavigating, setIsNavigating] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const router = useRouter()

  const difficultyLevel =
    difficulty ||
    (unitCount + lessonCount > 20 ? "Advanced" : unitCount + lessonCount > 10 ? "Intermediate" : "Beginner")

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsNavigating(true)
      router.push(`/dashboard/course/${slug}`)
    },
    [router, slug],
  )

  const handleBookmarkClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsBookmarked(!isBookmarked)
    },
    [isBookmarked],
  )

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsFavorite(!isFavorite)
    },
    [isFavorite],
  )

  if (loading) {
    return (
      <Card className="w-full overflow-hidden animate-pulse border-0 shadow-sm">
        <div className="h-48 bg-muted" />
        <CardContent className="p-6 space-y-4">
          <div className="h-4 bg-muted rounded-md w-3/4" />
          <div className="h-3 bg-muted rounded-md w-1/2" />
          <div className="flex gap-2">
            <div className="h-6 bg-muted rounded-full w-16" />
            <div className="h-6 bg-muted rounded-full w-20" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "group relative overflow-hidden border-0 bg-card shadow-sm hover:shadow-lg transition-all duration-500 cursor-pointer",
        "hover:-translate-y-2 focus-visible:ring-2 focus-visible:ring-primary/60",
        isNavigating && "opacity-75 scale-95",
        variant === "list" && "md:flex md:flex-row md:h-32",
        variant === "grid" && "flex flex-col",
        className,
      )}
      role="button"
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleCardClick(e as any)
        }
      }}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          variant === "list" && "md:w-48 md:h-full md:shrink-0",
          variant === "grid" && "w-full h-48",
        )}
      >
        {/* Generic course image */}
        <div className="w-full h-full bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
              <Play className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{category}</div>
              <div className="text-sm font-semibold text-foreground/80">Course Preview</div>
            </div>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-500" />

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-card/90 hover:bg-card shadow-sm"
            onClick={handleFavoriteClick}
          >
            <Heart className={cn("h-4 w-4", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-card/90 hover:bg-card shadow-sm"
            onClick={handleBookmarkClick}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked ? "fill-primary text-primary" : "text-muted-foreground")} />
          </Button>
        </div>

        {/* Status badges */}
        {(isPopular || isTrending) && (
          <div className="absolute top-4 left-4">
            {isPopular && (
              <Badge className="bg-accent text-accent-foreground text-xs font-medium border-0">Popular</Badge>
            )}
          </div>
        )}
      </div>

      <CardContent
        className={cn(
          "flex flex-col justify-between bg-card",
          variant === "list" && "p-4 flex-1",
          variant === "grid" && "p-6 flex-1",
        )}
      >
        {/* Header with category and difficulty */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className={cn("text-xs font-medium border", DIFFICULTY_CONFIG[difficultyLevel].badge)}
            >
              {difficultyLevel}
            </Badge>
            {price !== undefined && (
              <div className="text-right">
                <span className="font-bold text-foreground text-lg">${price}</span>
                {originalPrice && originalPrice > price && (
                  <div className="text-xs text-muted-foreground line-through">${originalPrice}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title and instructor */}
        <div className="mb-4 space-y-2">
          <h3
            className={cn(
              "font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300",
              variant === "list" ? "text-base" : "text-lg",
            )}
          >
            {title}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">{instructor}</p>
        </div>

        {/* Rating and stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-sm text-foreground">{rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted-foreground">({enrolledCount.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{unitCount} lessons</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{duration}</span>
            </div>
          </div>
        </div>

        {/* Progress for enrolled courses */}
        {isEnrolled && (
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">{progressPercentage}% Complete</span>
              <span className="text-xs text-muted-foreground">
                {completedChapters}/{totalChapters} chapters
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Free course badge */}
        {price === undefined && (
          <div className="mt-auto">
            <Badge className="bg-accent/10 text-accent border-accent/20 font-semibold px-3 py-1 text-xs">
              Free Course
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

CourseCard.displayName = "CourseCard"
