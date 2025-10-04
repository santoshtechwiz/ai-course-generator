"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Play, Heart, Bookmark, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { CourseIcon } from "@/components/icons/CourseIcon"
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
          variant === "list" && "w-full h-48 sm:w-48 sm:h-full sm:shrink-0",
          variant === "grid" && "w-full h-40 sm:h-48",
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
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 bg-card/90 hover:bg-card shadow-sm touch-manipulation"
            onClick={handleFavoriteClick}
          >
            <Heart className={cn("h-3 w-3 sm:h-4 sm:w-4", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 bg-card/90 hover:bg-card shadow-sm touch-manipulation"
            onClick={handleBookmarkClick}
          >
            <Bookmark className={cn("h-3 w-3 sm:h-4 sm:w-4", isBookmarked ? "fill-primary text-primary" : "text-muted-foreground")} />
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
          variant === "list" && "sm:flex-row sm:items-center p-4 sm:p-6 gap-3 sm:gap-6",
          variant === "grid" && "p-4 sm:p-6 flex-1",
        )}
      >
        {/* Header with category and difficulty */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className={cn("text-xs font-medium border", DIFFICULTY_CONFIG[difficultyLevel].badge)}
            >
              {difficultyLevel}
            </Badge>
            {price !== undefined && (
              <div className="text-right">
                <span className="font-bold text-foreground text-base sm:text-lg">${price}</span>
                {originalPrice && originalPrice > price && (
                  <div className="text-xs text-muted-foreground line-through">${originalPrice}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title and instructor */}
        <div className="mb-3 space-y-1">
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

        {/* Description - show on both grid and list so home cards display content */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {description}
          </p>
        )}

        {/* Rating and enrollment stats */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-sm text-foreground">{rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted-foreground">({enrolledCount.toLocaleString()})</span>
          </div>
          {viewCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{viewCount.toLocaleString()} views</span>
            </div>
          )}
        </div>

        {/* Course stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
            <div className="text-sm font-bold text-foreground">{typeof unitCount === 'number' && unitCount > 0 ? unitCount : 'N/A'}</div>
            <div className="text-xs text-muted-foreground">Chapters</div>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
            <div className="text-sm font-bold text-foreground">{typeof lessonCount === 'number' && lessonCount > 0 ? lessonCount : 'N/A'}</div>
            <div className="text-xs text-muted-foreground">Lessons</div>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
            <div className="text-sm font-bold text-foreground">{typeof quizCount === 'number' && quizCount > 0 ? quizCount : 'N/A'}</div>
            <div className="text-xs text-muted-foreground">Quizzes</div>
          </div>
        </div>

        {/* Duration and last updated */}
        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{duration}</span>
          </div>
          {updatedAt && (
            <div className="flex items-center gap-1">
              <span>Updated {new Date(updatedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Progress for enrolled courses */}
        {isEnrolled && (
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">{progressPercentage > 0 ? `${progressPercentage}% Complete` : 'Not started'}</span>
              <span className="text-xs text-muted-foreground">
                {typeof totalChapters === 'number' && totalChapters > 0 ? `${completedChapters}/${totalChapters} chapters` : 'N/A chapters'}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 mb-2" />
            {currentChapterTitle && (
              <div className="text-xs text-muted-foreground mb-1">
                Current: {currentChapterTitle}
              </div>
            )}
            {timeSpent && (
              <div className="text-xs text-muted-foreground">
                Time spent: {Math.round(timeSpent / 60)}h {timeSpent % 60}m
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer with badges */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            {price === undefined && (
              <Badge className="bg-accent/10 text-accent border-accent/20 font-semibold px-3 py-1 text-xs">
                Free Course
              </Badge>
            )}
            {isPopular && (
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-xs">
                Popular
              </Badge>
            )}
            {isTrending && (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">
                Trending
              </Badge>
            )}
          </div>
          {lastAccessedAt && (
            <div className="text-xs text-muted-foreground">
              Last accessed {new Date(lastAccessedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

CourseCard.displayName = "CourseCard"
