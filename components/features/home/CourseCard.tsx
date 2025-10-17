"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Heart, Bookmark, Clock, Users, BookOpen, TrendingUp } from "lucide-react"
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

const CATEGORY_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>
    gradient: string
    accentColor: string
    bgColor: string
    borderColor: string
  }
> = {
  AI: {
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    gradient: "from-secondary to-secondary",
    accentColor: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/20",
  },
  "Machine Learning": {
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 2V5M12 19V22M22 12H19M5 12H2M19.07 4.93L16.95 7.05M7.05 16.95L4.93 19.07M19.07 19.07L16.95 16.95M7.05 7.05L4.93 4.93"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    gradient: "from-secondary to-secondary",
    accentColor: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/20",
  },
  Programming: {
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16 18L22 12L16 6M8 6L2 12L8 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    gradient: "from-primary to-primary",
    accentColor: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
  "Web Development": {
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M2 8H22" stroke="currentColor" strokeWidth="2" />
        <circle cx="6" cy="5.5" r="0.5" fill="currentColor" />
        <circle cx="8" cy="5.5" r="0.5" fill="currentColor" />
        <circle cx="10" cy="5.5" r="0.5" fill="currentColor" />
      </svg>
    ),
    gradient: "from-accent to-accent",
    accentColor: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/20",
  },
  Cloud: {
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M18 10H16.74C16.38 8.28 14.89 7 13.08 7C11.65 7 10.39 7.82 9.76 9.04C7.67 9.13 6 10.86 6 13C6 15.21 7.79 17 10 17H18C19.66 17 21 15.66 21 14C21 12.34 19.66 11 18 11V10Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    gradient: "from-primary to-primary",
    accentColor: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
  DevOps: {
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    gradient: "from-muted-foreground to-muted-foreground",
    accentColor: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
  },
  Design: {
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    gradient: "from-secondary to-secondary",
    accentColor: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/20",
  },
  "UI/UX": {
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    gradient: "from-secondary to-secondary",
    accentColor: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/20",
  },
  "Data Science": {
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3V18C3 19.66 4.34 21 6 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M18 17L13 9L9 13L6 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    gradient: "from-warning to-warning",
    accentColor: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
  },
  Networking: {
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="19" cy="5" r="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="19" cy="19" r="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="5" cy="19" r="2" stroke="currentColor" strokeWidth="2" />
        <path d="M12 10V6M12 14V18M10 12H6M14 12H18" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    gradient: "from-success to-success",
    accentColor: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  },
  "Software Architecture": {
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <path d="M10 6.5H14M10 17.5H14M17.5 10V14M6.5 10V14" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    gradient: "from-secondary to-secondary",
    accentColor: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/20",
  },
  General: {
    icon: BookOpen,
    gradient: "from-muted-foreground to-muted-foreground",
    accentColor: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
  },
}

const DIFFICULTY_CONFIG = {
  Beginner: {
    badge: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
    icon: "🌱",
  },
  Intermediate: {
    badge: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
    icon: "⚡",
  },
  Advanced: {
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
    icon: "🚀",
  },
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
    category = "General",
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

  const categoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG["General"]
  const CategoryIcon = categoryConfig.icon

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
        "group relative overflow-hidden rounded-xl bg-card shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-border/50",
        "hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isNavigating && "opacity-75 scale-[0.98]",
        variant === "list" && "flex flex-col sm:flex-row sm:h-36",
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
      aria-label={`${title} course card`}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          variant === "list" && "w-full h-32 sm:w-40 sm:h-full sm:shrink-0",
          variant === "grid" && "w-full h-48",
        )}
      >
        {image ? (
          <div className="w-full h-full relative">
            <Image
              src={image || "/placeholder.svg"}
              alt={`${title} course thumbnail`}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-20 group-hover:opacity-30 transition-opacity duration-300",
                categoryConfig.gradient,
              )}
            />
          </div>
        ) : (
          <div
            className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br", categoryConfig.gradient)}
          >
            <div className="p-6 text-white/90">
              <CategoryIcon className="w-16 h-16" />
            </div>
          </div>
        )}

        <div
          className={cn(
            "absolute top-3 right-3 flex gap-2 transition-all duration-300",
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:translate-y-[-8px]",
          )}
        >
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-white/95 dark:bg-gray-900/95 hover:bg-white dark:hover:bg-gray-900 shadow-lg backdrop-blur-sm focus:ring-2 focus:ring-primary"
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all",
                isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground",
              )}
            />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-white/95 dark:bg-gray-900/95 hover:bg-white dark:hover:bg-gray-900 shadow-lg backdrop-blur-sm focus:ring-2 focus:ring-primary"
            onClick={handleBookmarkClick}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark course"}
          >
            <Bookmark
              className={cn(
                "h-4 w-4 transition-all",
                isBookmarked ? "fill-primary text-primary scale-110" : "text-muted-foreground",
              )}
            />
          </Button>
        </div>

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isPopular && (
            <Badge
              className="bg-primary text-primary-foreground text-xs font-semibold border-0 px-2.5 py-1 shadow-lg backdrop-blur-sm flex items-center gap-1"
              aria-label="Popular course"
            >
              <TrendingUp className="w-3 h-3" />
              Popular
            </Badge>
          )}
          {isTrending && (
            <Badge
              className="bg-primary text-primary-foreground text-xs font-semibold border-0 px-2.5 py-1 shadow-lg backdrop-blur-sm flex items-center gap-1"
              aria-label="Trending course"
            >
              🔥 Trending
            </Badge>
          )}
        </div>

        <div className="absolute bottom-3 left-3">
          <Badge
            className={cn(
              "text-xs font-semibold border shadow-lg backdrop-blur-sm flex items-center gap-1.5 px-2.5 py-1",
              categoryConfig.bgColor,
              categoryConfig.accentColor,
              categoryConfig.borderColor,
            )}
          >
            <CategoryIcon className="w-3.5 h-3.5" />
            {category}
          </Badge>
        </div>
      </div>

      <CardContent
        className={cn(
          "flex flex-col justify-between bg-card",
          variant === "list" && "sm:flex-row sm:items-center p-4 gap-3",
          variant === "grid" && "p-5 flex-1 space-y-3",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-semibold border px-2.5 py-1 flex items-center gap-1.5",
              DIFFICULTY_CONFIG[difficultyLevel].badge,
            )}
          >
            <span>{DIFFICULTY_CONFIG[difficultyLevel].icon}</span>
            {difficultyLevel}
          </Badge>
          {price !== undefined && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-lg">${price}</span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-muted-foreground line-through">${originalPrice}</span>
              )}
            </div>
          )}
          {price === undefined && (
            <Badge className="bg-success text-success-foreground font-semibold px-2.5 py-1 text-xs border-0">Free</Badge>
          )}
        </div>

        <div className="space-y-1.5">
          <h3
            className={cn(
              "font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300",
              variant === "list" ? "text-base" : "text-lg",
            )}
          >
            {title}
          </h3>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            {instructor}
          </p>
        </div>

        {description && variant === "grid" && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
        )}

        <div className="flex items-center justify-between py-2.5 border-y border-border/40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
              <span className="font-bold text-foreground text-sm">{rating.toFixed(1)}</span>
              <span className="sr-only">rating out of 5</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" aria-hidden="true" />
              <span className="font-semibold text-foreground text-sm">{enrolledCount.toLocaleString()}</span>
              <span className="sr-only">enrolled students</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium text-foreground text-sm">{duration}</span>
          </div>
        </div>

        <div className="flex items-center gap-5 text-sm">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-1.5 h-1.5 rounded-full", categoryConfig.accentColor.replace("text-", "bg-"))} />
            <span className="font-semibold text-foreground">
              {typeof unitCount === "number" && unitCount > 0 ? unitCount : "0"}
            </span>
            <span className="text-muted-foreground text-xs">chapters</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={cn("w-1.5 h-1.5 rounded-full", categoryConfig.accentColor.replace("text-", "bg-"))} />
            <span className="font-semibold text-foreground">
              {typeof lessonCount === "number" && lessonCount > 0 ? lessonCount : "0"}
            </span>
            <span className="text-muted-foreground text-xs">lessons</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={cn("w-1.5 h-1.5 rounded-full", categoryConfig.accentColor.replace("text-", "bg-"))} />
            <span className="font-semibold text-foreground">
              {typeof quizCount === "number" && quizCount > 0 ? quizCount : "0"}
            </span>
            <span className="text-muted-foreground text-xs">quizzes</span>
          </div>
        </div>

        {isEnrolled && (
          <div
            className={cn("rounded-lg p-3 border-2", categoryConfig.bgColor, categoryConfig.borderColor)}
            role="region"
            aria-label="Course progress"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-sm font-bold", categoryConfig.accentColor)}>
                {progressPercentage > 0 ? `${progressPercentage}% Complete` : "Not started"}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {typeof totalChapters === "number" && totalChapters > 0
                  ? `${completedChapters}/${totalChapters} chapters`
                  : "N/A"}
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className={cn("h-2.5", categoryConfig.accentColor)}
              aria-label={`${progressPercentage}% complete`}
            />
            {lastAccessedAt && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
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
