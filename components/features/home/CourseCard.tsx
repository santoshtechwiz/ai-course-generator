"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Star, Heart, Bookmark, Clock, Users, BookOpen, TrendingUp } from "lucide-react"
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

// Pick a random fallback (memoized so it doesn’t change per render)
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
      <Card className="w-full overflow-hidden animate-pulse border-4 border-black bg-[var(--color-card)]">
        <div className="h-48 bg-[var(--color-bg)]" />
        <CardContent className="p-6 space-y-4">
          <div className="h-6 bg-[var(--color-bg)] w-3/4" />
          <div className="h-4 bg-[var(--color-bg)] w-1/2" />
          <div className="flex gap-2">
            <div className="h-8 bg-[var(--color-bg)] w-20" />
            <div className="h-8 bg-[var(--color-bg)] w-24" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "group relative overflow-hidden bg-[var(--color-card)] cursor-pointer border-4 border-black transition-all duration-200",
        "hover:translate-x-[-6px] hover:translate-y-[-6px] hover:shadow-[6px_6px_0px_0px_#000]",
        "active:translate-x-[0px] active:translate-y-[0px] active:shadow-none",
        isNavigating && "opacity-75",
        variant === "list" && "flex flex-col sm:flex-row",
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
          variant === "list" && "w-full h-40 sm:w-48 sm:h-full sm:shrink-0 sm:border-b-0 sm:border-r-4",
          variant === "grid" && "w-full h-48",
        )}
      >
        {finalImage  ? (
          <Image
            src={finalImage }
            alt={`${title} course thumbnail`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-bg)] to-[var(--color-card)]">
            <BookOpen className="w-20 h-20 text-[var(--color-text)]/70" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="neutral"
            size="sm"
            className="h-9 w-9 p-0 bg-[var(--color-card)] border-4 border-black shadow-[3px_3px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
          </Button>
          <Button
            variant="neutral"
            size="sm"
            className="h-9 w-9 p-0 bg-[var(--color-card)] border-4 border-black shadow-[3px_3px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
            onClick={handleBookmarkClick}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark course"}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-blue-500 text-blue-500")} />
          </Button>
        </div>

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isPopular && (
            <Badge className="bg-[var(--color-warning)] text-[var(--color-text)] font-black border-4 border-black px-3 py-1 shadow-[3px_3px_0_#000] flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />
              POPULAR
            </Badge>
          )}
          {isTrending && (
            <Badge className="bg-[var(--color-destructive)] text-[var(--color-text)] font-black border-4 border-black px-3 py-1 shadow-[3px_3px_0_#000] flex items-center gap-1.5">
              🔥 TRENDING
            </Badge>
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge className={cn("font-black border-4 shadow-[3px_3px_0_#000] px-3 py-1", categoryColor)}>
            {category.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-6 flex flex-col gap-4 flex-1">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <Badge
            className={cn(
              "font-black border-4 px-3 py-1 shadow-[2px_2px_0_#000]",
              DIFFICULTY_STYLES[difficultyLevel],
            )}
          >
            {DIFFICULTY_ICONS[difficultyLevel]} {difficultyLevel.toUpperCase()}
          </Badge>
          {price !== undefined ? (
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl">${price}</span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-[var(--color-text)]/50 line-through">${originalPrice}</span>
              )}
            </div>
          ) : (
            <Badge className="bg-[var(--color-success)] text-[var(--color-text)] font-black px-3 py-1 border-4 border-black shadow-[2px_2px_0_#000]">
              FREE
            </Badge>
          )}
        </div>

        {/* Title & Instructor */}
        <div className="space-y-2">
          <h3 className="font-black text-xl leading-tight line-clamp-2 group-hover:underline">{title}</h3>
          <p className="text-sm text-[var(--color-text)]/70 font-bold flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {instructor}
          </p>
        </div>

        {/* Description */}
        {description && variant === "grid" && (
          <p className="text-sm text-[var(--color-text)]/70 line-clamp-2 leading-relaxed">{description}</p>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between py-3 border-y-4 border-black">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-black text-lg">{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-5 w-5" />
              <span className="font-black">{(enrolledCount || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-5 w-5" />
            <span className="font-bold text-sm">{duration}</span>
          </div>
        </div>

        {/* Course Details */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-black" />
            <span className="font-black">{unitCount || 0}</span>
            <span className="text-[var(--color-text)]/70 font-bold">chapters</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-black" />
            <span className="font-black">{lessonCount || 0}</span>
            <span className="text-[var(--color-text)]/70 font-bold">lessons</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-black" />
            <span className="font-black">{quizCount || 0}</span>
            <span className="text-[var(--color-text)]/70 font-bold">quizzes</span>
          </div>
        </div>

        {/* Progress Section (if enrolled) */}
        {isEnrolled && (
          <div className="p-4 border-4 border-black bg-[var(--color-bg)] shadow-[3px_3px_0_#000]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-black">
                {progressPercentage > 0 ? `${progressPercentage}% COMPLETE` : "NOT STARTED"}
              </span>
              <span className="text-xs font-bold text-[var(--color-text)]/70">
                {totalChapters > 0 ? `${completedChapters}/${totalChapters} chapters` : "N/A"}
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-4 border-4 border-black bg-[var(--color-card)] [&>div]:bg-black"
              aria-label={`${progressPercentage}% complete`}
            />
            {lastAccessedAt && (
              <p className="text-xs text-[var(--color-text)]/70 mt-3 flex items-center gap-1.5 font-bold">
                <Clock className="w-3 h-3" />
                Last accessed {new Date(lastAccessedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
  </Card>
  )
})

CourseCard.displayName = "CourseCard"
