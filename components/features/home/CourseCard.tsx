"use client"

import * as React from "react"
import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import neo from '@/components/neo/tokens'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Star, Clock, Users, BookOpen, TrendingUp, ArrowRight, Play } from "lucide-react"
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
  AI: "bg-[var(--color-primary)]",
  "Machine Learning": "bg-[var(--color-secondary)]",
  Programming: "bg-[var(--color-accent)]",
  "Web Development": "bg-[var(--color-warning)]",
  Cloud: "bg-[var(--color-info)]",
  DevOps: "bg-[var(--color-success)]",
  Design: "bg-[var(--color-destructive)]",
  "UI/UX": "bg-[var(--color-muted)]",
  "Data Science": "bg-[var(--color-card)]",
  Networking: "bg-[var(--color-bg)]",
  "Software Architecture": "bg-[var(--color-primary)]",
  General: "bg-[var(--color-secondary)]",
}

const DIFFICULTY_CONFIG = {
  Beginner: {
    color: "bg-[var(--color-success)]",
    icon: "🌱"
  },
  Intermediate: {
    color: "bg-[var(--color-warning)]",
    icon: "⚡"
  },
  Advanced: {
    color: "bg-[var(--color-destructive)]",
    icon: "🚀"
  }
}

const FALLBACK_IMAGES = [
  "/ai-machine-learning-neural-network.jpg",
  "/cloud-computing-servers.jpg",
  "/data-science-analytics-python.jpg",
  "/programming-code-beginner.jpg",
  "/ui-ux-design-interface.jpg",
  "/web-development-coding-react.jpg",
]

const getRandomFallbackImage = () => {
  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]
}

const CourseCardComponent = (props: CourseCardProps) => {
  const {
    title,
    description,
    rating,
    slug,
    variant = "grid",
    unitCount = 0,
    lessonCount = 0,
    quizCount = 0,
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
    enrolledCount = 0,
    instructor,
    isEnrolled,
    progressPercentage = 0,
    completedChapters = 0,
    totalChapters = unitCount || 0,
    lastAccessedAt,
  } = props

  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  // Memoized calculations
  const finalImage = useMemo(() => image || getRandomFallbackImage(), [image])
  
  const difficultyLevel = useMemo(() => 
    difficulty || (unitCount + lessonCount > 20 ? "Advanced" : unitCount + lessonCount > 10 ? "Intermediate" : "Beginner"),
    [difficulty, unitCount, lessonCount]
  )

  const categoryColor = useMemo(() => 
    CATEGORY_COLORS[category] || CATEGORY_COLORS["General"],
    [category]
  )

  const difficultyConfig = DIFFICULTY_CONFIG[difficultyLevel]

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (isNavigating) return
      setIsNavigating(true)
      router.push(`/dashboard/course/${slug}`)
    },
    [router, slug, isNavigating],
  )

  if (loading) {
    return (
      <Card className="w-full overflow-hidden animate-pulse border-3 border-black bg-[var(--color-card)] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] rounded-none">
        <div className="h-48 bg-[var(--color-bg)]" />
        <CardContent className="p-5 space-y-3">
          <div className="h-5 bg-[var(--color-bg)] w-3/4 border-2 border-black rounded-none" />
          <div className="h-4 bg-[var(--color-bg)] w-1/2 border-2 border-black rounded-none" />
          <div className="flex gap-2">
            <div className="h-8 bg-[var(--color-bg)] w-20 border-2 border-black rounded-none" />
            <div className="h-8 bg-[var(--color-bg)] w-24 border-2 border-black rounded-none" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "group relative overflow-hidden bg-[var(--color-card)] cursor-pointer border-3 border-black rounded-none transition-all duration-200",
        "shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]",
        "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        "active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[0px] active:translate-y-[0px]",
        isNavigating && "opacity-70 pointer-events-none",
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
          "relative overflow-hidden bg-[var(--color-bg)] border-b-3 border-black",
          variant === "list" && "w-full h-48 md:w-64 md:h-auto md:shrink-0 md:border-b-0 md:border-r-3",
          variant === "grid" && "w-full h-48",
        )}
      >
        {finalImage ? (
          <Image
            src={finalImage}
            alt={`${title} course thumbnail`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-card)]">
            <BookOpen className="w-16 h-16 text-[var(--color-text)]/40" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {isPopular && (
            <Badge className="bg-[var(--color-warning)] text-white font-black border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] flex items-center gap-1.5 text-xs rounded-none">
              <TrendingUp className="w-3.5 h-3.5" />
              POPULAR
            </Badge>
          )}
          {isTrending && (
            <Badge className="bg-[var(--color-destructive)] text-white font-black border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] flex items-center gap-1.5 text-xs rounded-none">
              🔥 TRENDING
            </Badge>
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-2 left-2">
          <Badge className={cn("font-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] px-3 py-1 text-xs rounded-none", categoryColor)}>
            {category.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className={cn(
        "p-4 flex flex-col gap-3 flex-1",
        variant === "list" && "md:justify-between"
      )}>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <Badge className={cn("font-black text-white border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] text-xs whitespace-nowrap rounded-none", difficultyConfig.color)}>
            <span className="mr-1">{difficultyConfig.icon}</span>
            {difficultyLevel.toUpperCase()}
          </Badge>
          {price !== undefined ? (
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl">${price}</span>
              {originalPrice && originalPrice > price && (
                <span className="text-xs text-[var(--color-text)]/50 line-through font-bold">${originalPrice}</span>
              )}
            </div>
          ) : (
            <Badge className="bg-[var(--color-success)] text-white font-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] text-xs rounded-none">
              FREE
            </Badge>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h3 className="font-black text-lg leading-tight line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
            {title}
          </h3>
          {instructor && (
            <p className="text-xs text-[var(--color-text)]/70 font-bold flex items-center gap-1.5 truncate">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
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
        <div className="flex items-center justify-between py-2.5 border-y-2 border-black/20 gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
              <span className="font-black text-sm">{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 flex-shrink-0 text-[var(--color-text)]/70" />
              <span className="font-black text-sm">{enrolledCount.toLocaleString()}</span>
            </div>
          </div>
          {duration && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 flex-shrink-0 text-[var(--color-text)]/70" />
              <span className="font-bold text-xs">{duration}</span>
            </div>
          )}
        </div>

        {/* Course Details */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-black rounded-full flex-shrink-0" />
            <span className="font-black">{unitCount || 0}</span>
            <span className="text-[var(--color-text)]/70 font-bold">chapters</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-black rounded-full flex-shrink-0" />
            <span className="font-black">{lessonCount || 0}</span>
            <span className="text-[var(--color-text)]/70 font-bold">lessons</span>
          </div>
          {quizCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-black rounded-full flex-shrink-0" />
              <span className="font-black">{quizCount || 0}</span>
              <span className="text-[var(--color-text)]/70 font-bold">quizzes</span>
            </div>
          )}
        </div>

        {/* Progress Section (if enrolled) */}
        {isEnrolled && (
          <div className="p-3 border-2 border-black bg-[var(--color-muted)] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] rounded-none">
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-xs font-black">
                {progressPercentage > 0 ? `${progressPercentage}% COMPLETE` : "NOT STARTED"}
              </span>
              <span className="text-xs font-bold text-[var(--color-text)]/70">
                {totalChapters > 0 ? `${completedChapters}/${totalChapters}` : "0/0"}
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-3 border-2 border-black bg-[var(--color-card)] [&>div]:bg-black rounded-none"
              aria-label={`${progressPercentage}% complete`}
            />
            {lastAccessedAt && (
              <p className="text-xs text-[var(--color-text)]/70 mt-2 flex items-center gap-1.5 font-bold">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>Last accessed {new Date(lastAccessedAt).toLocaleDateString()}</span>
              </p>
            )}
          </div>
        )}

        {/* CTA Button */}
        <Button
          onClick={handleCardClick}
          disabled={isNavigating}
          className={cn(
            "w-full mt-auto font-black text-sm py-5 border-3 border-black rounded-none transition-all duration-200",
            "shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)]",
            "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
            "active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[0px] active:translate-y-[0px]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isEnrolled 
              ? "bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white" 
              : "bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white"
          )}
        >
          {isEnrolled ? (
            <>
              <Play className="w-4 h-4 mr-2" fill="currentColor" />
              CONTINUE LEARNING
            </>
          ) : (
            <>
              START COURSE
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export const CourseCard = React.memo(CourseCardComponent, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.slug === nextProps.slug &&
    prevProps.title === nextProps.title &&
    prevProps.progressPercentage === nextProps.progressPercentage &&
    prevProps.isEnrolled === nextProps.isEnrolled &&
    prevProps.loading === nextProps.loading
  )
})

CourseCard.displayName = "CourseCard"