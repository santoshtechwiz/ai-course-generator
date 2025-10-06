"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Heart, Bookmark, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import CoursePlaceholder from '@/components/icons/CoursePlaceholder'

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
    lastAccessedAt,
    updatedAt,
    currentChapterTitle,
    timeSpent,
    tags,
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
      <Card className="w-full overflow-hidden animate-pulse rounded-xl bg-card shadow-sm border border-border/50">
        <div className="h-48 bg-muted" />
        <CardContent className="p-4 sm:p-6 space-y-4">
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
        "group relative overflow-hidden rounded-xl bg-card shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-border/50",
        "hover:-translate-y-1 sm:hover:-translate-y-2 focus-visible:ring-2 focus-visible:ring-primary/60",
        isNavigating && "opacity-75 scale-95",
        variant === "list" && "flex flex-col sm:flex-row sm:h-32",
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
          variant === "list" && "w-full h-32 sm:w-40 sm:h-full sm:shrink-0",
          variant === "grid" && "w-full h-32",
        )}
      >
  {/* Course image or generic placeholder */}
        {image ? (
          <div className="w-full h-full relative">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/10">
            <div className="p-4">
              <CoursePlaceholder className="w-full h-auto" />
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-500" />

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-card/90 hover:bg-card shadow-sm"
            onClick={handleFavoriteClick}
          >
            <Heart className={cn("h-3.5 w-3.5", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-card/90 hover:bg-card shadow-sm"
            onClick={handleBookmarkClick}
          >
            <Bookmark className={cn("h-3.5 w-3.5", isBookmarked ? "fill-primary text-primary" : "text-muted-foreground")} />
          </Button>
        </div>

        {/* Status badges */}
        {(isPopular || isTrending) && (
          <div className="absolute top-2 left-2">
            {isPopular && (
              <Badge className="bg-accent text-accent-foreground text-[10px] font-medium border-0 px-2 py-0.5">🔥</Badge>
            )}
          </div>
        )}
      </div>

      <CardContent
        className={cn(
          "flex flex-col justify-between bg-card",
          variant === "list" && "sm:flex-row sm:items-center p-3 gap-2",
          variant === "grid" && "p-3 flex-1 space-y-2.5",
        )}
      >
        {/* Header with category and difficulty */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn("text-[10px] font-medium border px-1.5 py-0.5", DIFFICULTY_CONFIG[difficultyLevel].badge)}
            >
              {difficultyLevel}
            </Badge>
            {price !== undefined && (
              <div className="text-right">
                <span className="font-bold text-foreground text-sm">${price}</span>
                {originalPrice && originalPrice > price && (
                  <div className="text-[10px] text-muted-foreground line-through">${originalPrice}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title and instructor */}
        <div className="space-y-0.5">
          <h3
            className={cn(
              "font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300",
              variant === "list" ? "text-sm" : "text-base",
            )}
          >
            {title}
          </h3>
          <p className="text-[10px] text-muted-foreground font-medium">{instructor}</p>
        </div>

        {/* Description - show on both grid and list so home cards display content */}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Compact inline stats */}
        <div className="flex items-center justify-between text-xs border-y border-border/30 py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{enrolledCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{duration}</span>
            </div>
          </div>
        </div>

        {/* Compact course stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium text-foreground">{typeof unitCount === 'number' && unitCount > 0 ? unitCount : '0'}</span>
            <span>chapters</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-foreground">{typeof lessonCount === 'number' && lessonCount > 0 ? lessonCount : '0'}</span>
            <span>lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-foreground">{typeof quizCount === 'number' && quizCount > 0 ? quizCount : '0'}</span>
            <span>quizzes</span>
          </div>
        </div>

        {/* Progress for enrolled courses */}
        {isEnrolled && (
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-primary">{progressPercentage > 0 ? `${progressPercentage}%` : 'Not started'}</span>
              <span className="text-[10px] text-muted-foreground">
                {typeof totalChapters === 'number' && totalChapters > 0 ? `${completedChapters}/${totalChapters}` : 'N/A'}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>
        )}

        {/* Footer with badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {price === undefined && (
              <Badge className="bg-accent/10 text-accent border-accent/20 font-semibold px-2 py-0.5 text-[10px]">
                Free
              </Badge>
            )}
            {isPopular && (
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] px-2 py-0.5">
                Popular
              </Badge>
            )}
            {isTrending && (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-2 py-0.5">
                Trending
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

CourseCard.displayName = "CourseCard"
