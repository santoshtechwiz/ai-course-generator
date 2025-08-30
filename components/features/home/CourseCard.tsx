"use client"

import * as React from "react"
import { useState, useMemo, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Users,
  FileQuestion,
  Star,
  Eye,
  Clock,
  Code,
  Globe,
  Database,
  Cloud,
  Paintbrush,
  Smartphone,
  Shield,
  BrainCircuit,
  Play,
  ArrowRight,
  TrendingUp,
  Heart,
  Bookmark,
  Share2,
  ChevronRight,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedWrapper } from "@/components/AnimatedWrapper"

// Enhanced course images with better variety
const COURSE_IMAGES = ["/course.png", "/course_2.png", "/course_3.png", "/course_4.png"]

// Enhanced gradient backgrounds for when images fail
const GRADIENT_BACKGROUNDS = [
  "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500",
  "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500",
  "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500",
  "bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500",
  "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500",
  "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500",
  "bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500",
  "bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500",
]

export interface CourseCardProps {
  title: string
  description: string
  rating: number
  slug: string
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
}

const LEVEL_CONFIG = {
  Beginner: {
    badge: "bg-gradient-to-r from-emerald-400 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25",
    icon: "text-emerald-500",
    bg: "bg-emerald-500/5",
    glow: "shadow-emerald-500/20",
  },
  Intermediate: {
    badge: "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/25",
    icon: "text-amber-500",
    bg: "bg-amber-500/5",
    glow: "shadow-amber-500/20",
  },
  Advanced: {
    badge: "bg-gradient-to-r from-rose-400 to-red-500 text-white border-0 shadow-lg shadow-rose-500/25",
    icon: "text-rose-500",
    bg: "bg-rose-500/5",
    glow: "shadow-rose-500/20",
  },
}

const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; badge: string; glow: string }
> = {
  programming: {
    icon: Code,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    badge: "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg shadow-blue-500/25",
    glow: "shadow-blue-500/20"
  },
  web: {
    icon: Globe,
    color: "text-green-500",
    bg: "bg-green-500/10",
    badge: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg shadow-green-500/25",
    glow: "shadow-green-500/20"
  },
  "web-development": {
    icon: Globe,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    badge: "bg-gradient-to-r from-teal-500 to-cyan-600 text-white border-0 shadow-lg shadow-teal-500/25",
    glow: "shadow-teal-500/20"
  },
  data: {
    icon: Database,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    badge: "bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0 shadow-lg shadow-purple-500/25",
    glow: "shadow-purple-500/20"
  },
  "data-science": {
    icon: Database,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    badge: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg shadow-indigo-500/25",
    glow: "shadow-indigo-500/20"
  },
  cloud: {
    icon: Cloud,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    badge: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-lg shadow-cyan-500/25",
    glow: "shadow-cyan-500/20"
  },
  design: {
    icon: Paintbrush,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    badge: "bg-gradient-to-r from-pink-500 to-rose-600 text-white border-0 shadow-lg shadow-pink-500/25",
    glow: "shadow-pink-500/20"
  },
  mobile: {
    icon: Smartphone,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    badge: "bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-0 shadow-lg shadow-indigo-500/25",
    glow: "shadow-indigo-500/20"
  },
  security: {
    icon: Shield,
    color: "text-red-500",
    bg: "bg-red-500/10",
    badge: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-lg shadow-red-500/25",
    glow: "shadow-red-500/20"
  },
  ai: {
    icon: BrainCircuit,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    badge: "bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 shadow-lg shadow-violet-500/25",
    glow: "shadow-violet-500/20"
  },
  default: {
    icon: BookOpen,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    badge: "bg-gradient-to-r from-slate-500 to-gray-600 text-white border-0 shadow-lg shadow-slate-500/25",
    glow: "shadow-slate-500/20"
  },
}

const determineCourseLevel = (unitCount: number, lessonCount: number, quizCount: number): "Beginner" | "Intermediate" | "Advanced" => {
  const totalItems = unitCount + lessonCount + quizCount
  if (totalItems < 15) return "Beginner"
  if (totalItems < 30) return "Intermediate"
  return "Advanced"
}

export const CourseCard = React.memo(
  ({
    title,
    description,
    rating,
    slug,
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
    ratingLoading = false,
    tags = [],
    instructor = "Course Instructor",
    updatedAt,
  }: CourseCardProps) => {
    const [isNavigating, setIsNavigating] = useState(false)
    const [imageError, setImageError] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isFavorite, setIsFavorite] = useState(false)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const router = useRouter()

    // Memoized random selections for consistent rendering
    const { selectedImage, gradientBg, categoryConfig } = useMemo(() => {
      const imageIndex = Math.abs(title?.split("")?.reduce((a, b) => a + b.charCodeAt(0), 0) || 0) % COURSE_IMAGES.length
      const gradientIndex =
        Math.abs(slug?.split("")?.reduce((a, b) => a + b.charCodeAt(0), 0) || 0) % GRADIENT_BACKGROUNDS.length
      const normalizedCategory = (typeof category === 'string' ? category : '')?.toLowerCase()
      const config =
        CATEGORY_CONFIG[normalizedCategory] ||
        Object.entries(CATEGORY_CONFIG).find(([key]) => normalizedCategory.includes(key))?.[1] ||
        CATEGORY_CONFIG.default

      return {
        selectedImage: image || COURSE_IMAGES[imageIndex],
        gradientBg: GRADIENT_BACKGROUNDS[gradientIndex],
        categoryConfig: config,
      }
    }, [title, slug, category, image])

    const courseLevel = difficulty || determineCourseLevel(unitCount, lessonCount, quizCount)
    const levelConfig = LEVEL_CONFIG[courseLevel] || LEVEL_CONFIG.Intermediate

    // Use category-specific glow effect
    const categoryGlow = categoryConfig.glow

    // Compute duration from number of lessons if explicit duration is not provided
    const computedDuration = useMemo(() => {
      if (duration) return duration
      const minutesPerLesson = 6 // heuristic average per lesson
      const totalMinutes = Math.max(lessonCount * minutesPerLesson, 10)
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    }, [duration, lessonCount])

    const handleCardClick = useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      setIsNavigating(true)
      router.push(`/dashboard/course/${slug}`)
    }, [router, slug])

    const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      setIsFavorite(!isFavorite)
    }, [isFavorite])

    const handleBookmarkClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      setIsBookmarked(!isBookmarked)
    }, [isBookmarked])

    const handleShareClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      navigator.share?.({
        title: title,
        text: description,
        url: window.location.origin + `/dashboard/course/${slug}`,
      }).catch(() => {
        navigator.clipboard?.writeText(window.location.origin + `/dashboard/course/${slug}`)
      })
    }, [title, description, slug])

    const handleEnrollClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      setIsNavigating(true)
      router.push(`/dashboard/course/${slug}`)
    }, [router, slug])

    if (loading) {
      return (
        <Card className={cn(
          "w-full min-h-96 overflow-hidden border border-border/50 bg-card/50",
          "animate-pulse",
          className
        )}>
          <div className="flex flex-col h-full">
            {/* Image skeleton with shimmer */}
            <div className="relative w-full h-64 bg-gradient-to-br from-muted/60 to-muted/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
              <div className="absolute top-4 left-4">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>

            {/* Content skeleton */}
            <div className="flex-1 p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-8 w-4/5 rounded-lg" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
                <Skeleton className="h-4 w-48 rounded" />
                <div className="flex items-center gap-3 p-3 bg-muted/60 rounded-lg">
                  <Skeleton className="h-5 w-16 rounded" />
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((i) => (
                      <Skeleton key={i} className="h-4 w-4 rounded" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/60 rounded-lg">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-16 rounded" />
                        <Skeleton className="h-4 w-20 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-border/50">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-12 w-32 rounded-md" />
              </div>
            </div>
          </div>
        </Card>
      )
    }

    return (
      <TooltipProvider>
        <AnimatedWrapper
          animation="scale"
          delay={0.1}
          duration={0.4}
          className={cn("w-full h-auto min-h-96 overflow-hidden border border-border/50 bg-card course-card-enhanced", className)}
        >
          <Card
            onClick={handleCardClick}
            className={cn(
              "w-full h-full overflow-hidden border border-border/50 bg-card",
              "shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer",
              "flex flex-col group relative",
              isHovered && "border-primary/20",
              isNavigating && "opacity-75 scale-95",
            )}
            role="button"
            tabIndex={0}
            aria-label={`View course: ${title} - ${description}. ${lessonCount} lessons, ${computedDuration} duration, rated ${rating} stars by ${enrolledCount} students.`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(e as any);
              }
            }}
          >
            {/* Image Section - Larger for better visibility */}
            <div className="relative w-full h-64 overflow-hidden flex-shrink-0">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

              {!imageError ? (
                <Image
                  src={selectedImage || "/placeholder.svg"}
                  alt={`${title} course thumbnail`}
                  fill
                  loading="lazy"
                  className={cn(
                    "object-cover transition-all duration-500",
                    isHovered ? "scale-110 brightness-105" : "scale-100",
                  )}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className={cn("absolute inset-0 flex items-center justify-center", gradientBg)}>
                  <div
                    className="w-16 h-16 text-white/90"
                  >
                    <categoryConfig.icon className="w-full h-full drop-shadow-lg" />
                  </div>
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Top left badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <Badge className={cn("px-3 py-1 text-xs font-semibold", levelConfig.badge)}>
                  {courseLevel}
                </Badge>
                {isPopular && (
                  <Badge className="px-3 py-1 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Popular
                  </Badge>
                )}
                {isTrending && (
                  <Badge className="px-3 py-1 text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>

              {/* Top right actions */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleFavoriteClick}
                      className={cn(
                        "p-2 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110",
                        isFavorite
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                          : "bg-white/20 text-white hover:bg-white/30",
                      )}
                      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFavorite ? "Remove from favorites" : "Add to favorites"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleBookmarkClick}
                      className={cn(
                        "p-2 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110",
                        isBookmarked
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : "bg-white/20 text-white hover:bg-white/30",
                      )}
                      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark course"}
                    >
                      <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isBookmarked ? "Remove bookmark" : "Bookmark course"}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Play button overlay */}
              <AnimatedWrapper
                animation={isHovered ? "scale" : "none"}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-12 h-12 bg-primary rounded-full shadow-lg shadow-primary/25 flex items-center justify-center">
                  <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
                </div>
              </AnimatedWrapper>
            </div>

            {/* Content Section - Standardized height with better typography hierarchy */}
            <div className="flex-1 p-8 flex flex-col justify-between min-h-0">
              <div className="space-y-3 flex-1 min-h-0">
                {/* Category and title - Enhanced typography hierarchy */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg", categoryConfig.bg)}>
                      <categoryConfig.icon className={cn("w-5 h-5", categoryConfig.color)} />
                    </div>
                    <Badge className={cn("text-sm px-4 py-1.5 font-semibold", categoryConfig.badge)}>
                      {category}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2 text-foreground font-heading">
                    {title}
                  </h3>
                </div>

                {/* Description - Enhanced typography */}
                <p className="text-base text-muted-foreground line-clamp-3 leading-relaxed font-medium course-description">
                  {description}
                </p>

                {/* Instructor and updated date - Enhanced metadata typography */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">By {instructor}</span>
                  {updatedAt && (
                    <>
                      <span className="text-muted-foreground/60">•</span>
                      <span className="font-medium">Updated {new Date(updatedAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>

                {/* Rating - Enhanced prominent display */}
                {ratingLoading ? (
                  <div className="h-5 w-32 bg-muted/60 rounded animate-pulse" />
                ) : (
                  <div className="flex items-center gap-3 p-3 course-rating rounded-lg border border-yellow-200/50 dark:border-yellow-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {typeof rating === 'number' ? rating.toFixed(1) : rating}
                      </span>
                      <div className="flex" role="img" aria-label={`Rating: ${rating} out of 5 stars`}>
                        {[1,2,3,4,5].map((i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-4 w-4",
                              rating >= i ? "fill-orange-400 text-orange-400" : "text-muted-foreground/50"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      ({enrolledCount.toLocaleString()} students)
                    </div>
                  </div>
                )}

                {/* Stats - Enhanced display with better typography */}
                <div className="grid grid-cols-2 gap-4 p-4 course-stats-grid rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Duration</p>
                      <p className="text-sm font-bold text-foreground course-stat">{computedDuration}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-blue-500" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Lessons</p>
                      <p className="text-sm font-bold text-foreground course-stat">{lessonCount} lessons</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-green-500" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Level</p>
                      <p className="text-sm font-bold text-foreground">{courseLevel}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                      <FileQuestion className="h-4 w-4 text-purple-500" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Quizzes</p>
                      <p className="text-sm font-bold text-foreground course-stat">{quizCount} quizzes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Consistent button alignment and sizing */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                <div className="flex items-center gap-2">
                  {price !== undefined ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-primary">${price}</span>
                      {originalPrice && price && originalPrice > price && (
                        <span className="text-sm text-muted-foreground line-through">${originalPrice}</span>
                      )}
                    </div>
                  ) : (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1">
                      Free
                    </Badge>
                  )}
                </div>

                <Button
                  size="lg"
                  className={cn(
                    "group/btn relative overflow-hidden transition-all duration-300 enroll-button-enhanced",
                    "bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary",
                    "shadow-lg hover:shadow-xl hover:shadow-primary/25 border-0 px-8 py-3 h-12",
                    "text-base font-bold text-primary-foreground",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "hover:scale-105 active:scale-95"
                  )}
                  onClick={handleEnrollClick}
                  disabled={isNavigating}
                  aria-label={`Enroll in ${title} course`}
                >
                  <span className="flex items-center gap-3">
                    {isNavigating ? "Loading..." : "Enroll Now"}
                    {!isNavigating && (
                      <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                    )}
                  </span>
                </Button>
              </div>
            </div>
          </Card>
        </AnimatedWrapper>
      </TooltipProvider>
    )
  },
)

CourseCard.displayName = "CourseCard"