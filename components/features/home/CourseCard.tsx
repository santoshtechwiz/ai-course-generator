"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import neo from '@/components/neo/tokens'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Star, Heart, Bookmark, Clock, Users, BookOpen, TrendingUp, ArrowRight, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface CourseCardProps {
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
  instructor?: string
  isEnrolled?: boolean
  progressPercentage?: number
  completedChapters?: number
  totalChapters?: number
  lastAccessedAt?: string
  currentChapterTitle?: string
  timeSpent?: number
  tags?: string[]
}

const CATEGORY_COLORS: Record<string, string> = {
  AI: "bg-[var(--color-primary)] text-[var(--color-text)] border-4 border-black",
  "Machine Learning": "bg-[var(--color-secondary)] text-[var(--color-text)] border-4 border-black",
  Programming: "bg-[var(--color-accent)] text-[var(--color-text)] border-4 border-black",
  "Web Development": "bg-[var(--color-warning)] text-[var(--color-text)] border-4 border-black",
  Cloud: "bg-[var(--color-info)] text-[var(--color-text)] border-4 border-black",
  DevOps: "bg-[var(--color-success)] text-[var(--color-text)] border-4 border-black",
  Design: "bg-[var(--color-destructive)] text-[var(--color-text)] border-4 border-black",
  "UI/UX": "bg-[var(--color-muted)] text-[var(--color-text)] border-4 border-black",
  "Data Science": "bg-[var(--color-card)] text-[var(--color-text)] border-4 border-black",
  Networking: "bg-[var(--color-bg)] text-[var(--color-text)] border-4 border-black",
  "Software Architecture": "bg-[var(--color-primary)] text-[var(--color-text)] border-4 border-black",
  General: "bg-[var(--color-secondary)] text-[var(--color-text)] border-4 border-black",
}

const DIFFICULTY_STYLES = {
  Beginner: "bg-[var(--color-success)] text-[var(--color-text)] border-4 border-black",
  Intermediate: "bg-[var(--color-warning)] text-[var(--color-text)] border-4 border-black",
  Advanced: "bg-[var(--color-destructive)] text-[var(--color-text)] border-4 border-black",
}

const DIFFICULTY_ICONS = {
  Beginner: "🌱",
  Intermediate: "⚡",
  Advanced: "🚀",
}

const fallbackImages = [
  "/ai-machine-learning-neural-network.jpg",
  "/cloud-computing-servers.jpg",
  "/data-science-analytics-python.jpg",
  "/programming-code-beginner.jpg",
  "/ui-ux-design-interface.jpg",
  "/web-development-coding-react.jpg",
];

const getRandomFallbackImage = () => {
  const randomIndex = Math.floor(Math.random() * fallbackImages.length);
  return fallbackImages[randomIndex];
};

export const CourseCard = React.memo((props: CourseCardProps) => {
  const {
    title,
    description,
    rating,
    slug,
    courseId,
    variant = "grid",
    unitCount = 0,
    lessonCount = 0,
    quizCount = 0,
    viewCount,
    category = "General",
    duration,
    className,
    loading,
    image,
    difficulty,
    price,
    originalPrice,
    isPopular,
    isTrending,
    completionRate,
    enrolledCount,
    instructor,
    isEnrolled,
    progressPercentage = 0,
    completedChapters = 0,
    totalChapters = unitCount || 0,
    lastAccessedAt,
    currentChapterTitle,
    timeSpent,
    tags = [],
  } = props

  const [isNavigating, setIsNavigating] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const router = useRouter()

  const finalImage = image || getRandomFallbackImage()

  const difficultyLevel =
    difficulty ||
    (unitCount + lessonCount > 20 ? "Advanced" : unitCount + lessonCount > 10 ? "Intermediate" : "Beginner")

  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS["General"]

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
      <Card className="w-full overflow-hidden animate-pulse border-4 border-black bg-[var(--color-card)] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="h-48 bg-[var(--color-bg)]" />
        <CardContent className="p-6 space-y-4">
          <div className="h-6 bg-[var(--color-bg)] w-3/4 border-2 border-black" />
          <div className="h-4 bg-[var(--color-bg)] w-1/2 border-2 border-black" />
          <div className="flex gap-2">
            <div className="h-8 bg-[var(--color-bg)] w-20 border-2 border-black" />
            <div className="h-8 bg-[var(--color-bg)] w-24 border-2 border-black" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "group relative overflow-hidden bg-[var(--color-card)] cursor-pointer border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200",
        "hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        "active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]",
        isNavigating && "opacity-75",
        variant === "list" && "flex flex-col md:flex-row",
        className,
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleCardClick(e as any)
        }
      }}
      aria-label={`${title} course card`}
    >
      {/* Image Section */}
      <div
        className={cn(
          "relative overflow-hidden bg-[var(--color-bg)] border-b-4 border-black",
          variant === "list" && "w-full h-48 md:w-64 md:h-auto md:shrink-0 md:border-b-0 md:border-r-4",
          variant === "grid" && "w-full h-56",
        )}
      >
        {finalImage ? (
          <Image
            src={finalImage}
            alt={`${title} course thumbnail`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-card)] border-4 border-[var(--color-border)] shadow-[4px_4px_0px_0px_hsl(var(--border))]">
            <BookOpen className="w-20 h-20 text-[var(--color-text)]/70" />
          </div>
        )}

        {/* Overlay gradient for better badge visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30" />

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="neutral"
            size="sm"
            className="h-10 w-10 p-0 bg-[var(--color-card)] border-4 border-black shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#000]"
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn("h-5 w-5 transition-all", isFavorite && "fill-red-500 text-red-500 scale-110")} />
          </Button>
          <Button
            variant="neutral"
            size="sm"
            className="h-10 w-10 p-0 bg-[var(--color-card)] border-4 border-black shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#000]"
            onClick={handleBookmarkClick}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark course"}
          >
            <Bookmark className={cn("h-5 w-5 transition-all", isBookmarked && "fill-blue-500 text-blue-500 scale-110")} />
          </Button>
        </div>

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isPopular && (
            <Badge variant="neutral" className={cn(neo.badge, "bg-[var(--color-warning)] text-[var(--color-text)] font-black border-4 border-black px-3 py-1.5 shadow-[4px_4px_0_#000] flex items-center gap-2 text-xs")}>
              <TrendingUp className="w-4 h-4" />
              POPULAR
            </Badge>
          )}
          {isTrending && (
            <Badge variant="neutral" className={cn(neo.badge, "bg-[var(--color-destructive)] text-[var(--color-text)] font-black border-4 border-black px-3 py-1.5 shadow-[4px_4px_0_#000] flex items-center gap-2 text-xs")}>
              🔥 TRENDING
            </Badge>
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="neutral" className={cn(neo.badge, "font-black border-4 shadow-[4px_4px_0_#000] px-4 py-1.5 text-xs", categoryColor)}>
            {category.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className={cn(
        "p-5 sm:p-6 flex flex-col gap-4 flex-1",
        variant === "list" && "md:justify-between"
      )}>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <Badge variant="neutral" className={cn(neo.badge, "font-black border-4 px-3 py-1.5 shadow-[3px_3px_0_#000] text-xs whitespace-nowrap", DIFFICULTY_STYLES[difficultyLevel])}>
            <span className="mr-1">{DIFFICULTY_ICONS[difficultyLevel]}</span>
            {difficultyLevel.toUpperCase()}
          </Badge>
          {price !== undefined ? (
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl sm:text-3xl">${price}</span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-[var(--color-text)]/50 line-through font-bold">${originalPrice}</span>
              )}
            </div>
          ) : (
            <Badge variant="neutral" className={cn(neo.badge, "bg-[var(--color-success)] text-[var(--color-text)] font-black px-4 py-1.5 border-4 border-black shadow-[3px_3px_0_#000] text-xs")}>
              FREE
            </Badge>
          )}
        </div>

        {/* Title & Instructor */}
        <div className="space-y-2">
          <h3 className="font-black text-lg sm:text-xl leading-tight line-clamp-2 group-hover:underline decoration-4 decoration-black underline-offset-4">
            {title}
          </h3>
          {instructor && (
            <p className="text-sm text-[var(--color-text)]/70 font-bold flex items-center gap-2">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{instructor}</span>
            </p>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-[var(--color-text)]/70 line-clamp-2 leading-relaxed font-medium">
            {description}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between py-3 border-y-4 border-black gap-4 flex-wrap">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
              <span className="font-black text-base sm:text-lg">{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 flex-shrink-0" />
              <span className="font-black text-sm sm:text-base">{(enrolledCount || 0).toLocaleString()}</span>
            </div>
          </div>
          {duration && (
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 flex-shrink-0" />
              <span className="font-bold text-sm whitespace-nowrap">{duration}</span>
            </div>
          )}
        </div>

        {/* Course Details */}
        <div className="flex items-center gap-4 sm:gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-black flex-shrink-0" />
            <span className="font-black">{unitCount || 0}</span>
            <span className="text-[var(--color-text)]/70 font-bold">chapters</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-black flex-shrink-0" />
            <span className="font-black">{lessonCount || 0}</span>
            <span className="text-[var(--color-text)]/70 font-bold">lessons</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-black flex-shrink-0" />
            <span className="font-black">{quizCount || 0}</span>
            <span className="text-[var(--color-text)]/70 font-bold">quizzes</span>
          </div>
        </div>

        {/* Progress Section (if enrolled) */}
        {isEnrolled && (
          <div className="p-4 border-4 border-black bg-[var(--color-muted)] shadow-[4px_4px_0_#000]">
            <div className="flex items-center justify-between mb-3 gap-2">
              <span className="text-sm font-black">
                {progressPercentage > 0 ? `${progressPercentage}% COMPLETE` : "NOT STARTED"}
              </span>
              <span className="text-xs font-bold text-[var(--color-text)]/70">
                {totalChapters > 0 ? `${completedChapters}/${totalChapters}` : "N/A"}
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-5 border-4 border-black bg-[var(--color-card)] [&>div]:bg-black"
              aria-label={`${progressPercentage}% complete`}
            />
            {lastAccessedAt && (
              <p className="text-xs text-[var(--color-text)]/70 mt-3 flex items-center gap-2 font-bold">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Last accessed {new Date(lastAccessedAt).toLocaleDateString()}</span>
              </p>
            )}
          </div>
        )}

        {/* CTA Button */}
        <Button
          onClick={handleCardClick}
          className={cn(
            "w-full mt-2 font-black text-base py-6 border-4 border-black shadow-[4px_4px_0_#000]",
            "hover:shadow-[6px_6px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]",
            "active:shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px]",
            "transition-all duration-150",
            isEnrolled 
              ? "bg-[var(--color-success)] hover:bg-[var(--color-success)]/90" 
              : "bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
          )}
        >
          {isEnrolled ? (
            <>
              <Play className="w-5 h-5 mr-2" />
              CONTINUE LEARNING
            </>
          ) : (
            <>
              START COURSE
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
})

CourseCard.displayName = "CourseCard"