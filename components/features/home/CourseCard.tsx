"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Play, Heart, Bookmark, BookOpen, Clock, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

const CourseSVGs = {
  programming: (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <defs>
        <linearGradient id="prog-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#prog-bg)" />
      <rect x="20" y="20" width="160" height="80" rx="8" fill="rgba(255,255,255,0.1)" />
      <rect x="30" y="30" width="4" height="60" fill="#10B981" />
      <rect x="40" y="35" width="60" height="4" fill="rgba(255,255,255,0.8)" />
      <rect x="40" y="45" width="80" height="4" fill="rgba(255,255,255,0.6)" />
      <rect x="40" y="55" width="40" height="4" fill="rgba(255,255,255,0.8)" />
      <rect x="40" y="65" width="100" height="4" fill="rgba(255,255,255,0.6)" />
      <circle cx="160" cy="50" r="8" fill="#F59E0B" />
      <rect x="150" y="65" width="20" height="4" fill="rgba(255,255,255,0.8)" />
    </svg>
  ),
  design: (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <defs>
        <linearGradient id="design-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#design-bg)" />
      <circle cx="60" cy="40" r="15" fill="rgba(255,255,255,0.2)" />
      <rect x="90" y="25" width="80" height="30" rx="15" fill="rgba(255,255,255,0.15)" />
      <path
        d="M30 70 Q50 50 70 70 Q90 90 110 70 Q130 50 150 70"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="3"
        fill="none"
      />
      <circle cx="170" cy="80" r="6" fill="#FBBF24" />
      <rect x="20" y="90" width="160" height="2" fill="rgba(255,255,255,0.3)" />
    </svg>
  ),
  business: (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <defs>
        <linearGradient id="biz-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#biz-bg)" />
      <rect x="40" y="80" width="8" height="20" fill="rgba(255,255,255,0.8)" />
      <rect x="60" y="70" width="8" height="30" fill="rgba(255,255,255,0.9)" />
      <rect x="80" y="60" width="8" height="40" fill="rgba(255,255,255,1)" />
      <rect x="100" y="50" width="8" height="50" fill="rgba(255,255,255,0.9)" />
      <rect x="120" y="65" width="8" height="35" fill="rgba(255,255,255,0.8)" />
      <path d="M35 85 L125 45" stroke="#FBBF24" strokeWidth="2" fill="none" />
      <circle cx="160" cy="30" r="12" fill="rgba(255,255,255,0.2)" />
      <path d="M155 30 L160 25 L165 30 L160 35 Z" fill="#FBBF24" />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <defs>
        <linearGradient id="default-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#default-bg)" />
      <rect x="30" y="30" width="140" height="60" rx="8" fill="rgba(255,255,255,0.1)" />
      <circle cx="60" cy="50" r="8" fill="rgba(255,255,255,0.8)" />
      <rect x="80" y="45" width="60" height="4" fill="rgba(255,255,255,0.6)" />
      <rect x="80" y="55" width="40" height="4" fill="rgba(255,255,255,0.4)" />
      <rect x="30" y="100" width="140" height="2" fill="rgba(255,255,255,0.3)" />
    </svg>
  ),
}

const CATEGORY_CONFIG: Record<
  string,
  {
    svg: React.ReactNode
    badge: string
    accent: string
  }
> = {
  programming: {
    svg: CourseSVGs.programming,
    badge: "bg-blue-500 text-white",
    accent: "border-blue-500",
  },
  "web-development": {
    svg: CourseSVGs.programming,
    badge: "bg-blue-500 text-white",
    accent: "border-blue-500",
  },
  design: {
    svg: CourseSVGs.design,
    badge: "bg-pink-500 text-white",
    accent: "border-pink-500",
  },
  business: {
    svg: CourseSVGs.business,
    badge: "bg-green-500 text-white",
    accent: "border-green-500",
  },
  marketing: {
    svg: CourseSVGs.business,
    badge: "bg-green-500 text-white",
    accent: "border-green-500",
  },
  default: {
    svg: CourseSVGs.default,
    badge: "bg-indigo-500 text-white",
    accent: "border-indigo-500",
  },
}

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
  Beginner: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Intermediate: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  Advanced: { badge: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
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
    category = "default",
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

  const categoryConfig = CATEGORY_CONFIG[category.toLowerCase()] || CATEGORY_CONFIG.default
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
      <Card className="w-full overflow-hidden animate-pulse">
        <div className="h-32 bg-gray-200" />
        <CardContent className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded w-16" />
            <div className="h-6 bg-gray-200 rounded w-20" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "group relative overflow-hidden border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer",
        "hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary/60",
        isNavigating && "opacity-75 scale-95",
        variant === "list" && "md:flex md:flex-row md:h-28",
        variant === "grid" && "flex flex-col h-72",
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
      <div className={cn("absolute top-0 left-0 right-0 h-1", categoryConfig.badge)} />

      <div
        className={cn(
          "relative overflow-hidden",
          variant === "list" && "md:w-40 md:h-full md:shrink-0",
          variant === "grid" && "w-full h-32",
        )}
      >
        {image && !image.includes("generic-course") ? (
          <Image
            src={image || "/placeholder.svg"}
            alt={`${title} course thumbnail`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={variant === "grid" ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" : "160px"}
          />
        ) : (
          <div className="w-full h-full">{categoryConfig.svg}</div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
            <Play className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" />
          </div>
        </div>

        <div className="absolute top-2 left-2 flex gap-1">
          {isPopular && (
            <Badge className="bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 font-medium">Popular</Badge>
          )}
          {isTrending && (
            <Badge className="bg-orange-400 text-orange-900 text-xs px-1.5 py-0.5 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Hot
            </Badge>
          )}
        </div>

        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-white/80 hover:bg-white"
            onClick={handleFavoriteClick}
          >
            <Heart className={cn("h-3 w-3", isFavorite ? "fill-red-500 text-red-500" : "text-gray-600")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-white/80 hover:bg-white"
            onClick={handleBookmarkClick}
          >
            <Bookmark className={cn("h-3 w-3", isBookmarked ? "fill-blue-500 text-blue-500" : "text-gray-600")} />
          </Button>
        </div>
      </div>

      <CardContent
        className={cn(
          "flex flex-col justify-between bg-white",
          variant === "list" && "p-3 flex-1",
          variant === "grid" && "p-4 flex-1",
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs px-2 py-0.5 font-medium", categoryConfig.badge)}>{category}</Badge>
            <div className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-full", DIFFICULTY_CONFIG[difficultyLevel].dot)} />
              <span className="text-xs text-gray-600 font-medium">{difficultyLevel}</span>
            </div>
          </div>
          {price !== undefined && (
            <div className="text-right">
              <span className="font-bold text-gray-900 text-lg">${price}</span>
              {originalPrice && originalPrice > price && (
                <div className="text-xs text-gray-500 line-through">${originalPrice}</div>
              )}
            </div>
          )}
        </div>

        <div className="mb-3">
          <h3
            className={cn(
              "font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors duration-200",
              variant === "list" ? "text-sm mb-1" : "text-base mb-1",
            )}
          >
            {title}
          </h3>
          <p className="text-xs text-gray-600 font-medium">{instructor}</p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <span className="font-bold text-sm text-gray-900">{rating.toFixed(1)}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn("h-3 w-3", rating >= i ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({enrolledCount.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-blue-500" />
              <span>{unitCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-green-500" />
              <span>{duration}</span>
            </div>
          </div>
        </div>

        {isEnrolled && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">{progressPercentage}% Complete</span>
              <span className="text-xs text-blue-700">
                {completedChapters}/{totalChapters} chapters
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-blue-100" />
          </div>
        )}

        {price === undefined && (
          <div className="mt-auto">
            <Badge className="bg-green-100 text-green-800 font-semibold px-2 py-1 text-xs">Free Course</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

CourseCard.displayName = "CourseCard"
