"use client"

import * as React from "react"
import { useState, useMemo, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Star,
  Users,
  Play,
  Heart,
  Bookmark,
  Share2,
  Code,
  Globe,
  Database,
  Cloud,
  Paintbrush,
  Smartphone,
  Shield,
  BrainCircuit,
  BookOpen,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

// Udemy-style course images - generic SVGs for different categories
const COURSE_IMAGES = {
  default: "/generic-course.svg",
  tech: "/generic-course-tech.svg",
  programming: "/generic-course-tech.svg",
  "web-development": "/generic-course-tech.svg",
  "data-science": "/generic-course-tech.svg",
  business: "/generic-course-business.svg",
  marketing: "/generic-course-business.svg",
  design: "/generic-course-creative.svg",
  creative: "/generic-course-creative.svg"
}

// Professional gradient backgrounds for when images fail
const GRADIENT_BACKGROUNDS = [
  "bg-gradient-to-br from-slate-100 to-slate-200",
  "bg-gradient-to-br from-gray-100 to-gray-200",
  "bg-gradient-to-br from-zinc-100 to-zinc-200",
  "bg-gradient-to-br from-neutral-100 to-neutral-200",
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
    const { selectedImage, gradientBg } = useMemo(() => {
      // Choose generic SVG based on category
      const normalizedCategory = (typeof category === 'string' ? category : '')?.toLowerCase().replace(/\s+/g, '-')
      const categoryImage = COURSE_IMAGES[normalizedCategory as keyof typeof COURSE_IMAGES] || COURSE_IMAGES.default

      const gradientIndex =
        Math.abs(slug?.split("")?.reduce((a, b) => a + b.charCodeAt(0), 0) || 0) % GRADIENT_BACKGROUNDS.length
      return {
        selectedImage: categoryImage,
        gradientBg: GRADIENT_BACKGROUNDS[gradientIndex],
      }
    }, [category, slug])

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

    if (loading) {
      return (
        <Card className="w-full overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="aspect-video bg-gray-200 animate-pulse" />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div>
                    <Skeleton className="h-4 w-8 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-6 w-20" />
          </CardContent>
        </Card>
      )
    }

    return (
      <TooltipProvider>
        <Card
          onClick={handleCardClick}
          className={cn(
            "w-full overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group",
            "hover:border-gray-300 hover:-translate-y-1",
            isNavigating && "opacity-75 scale-95",
            className
          )}
          role="button"
          tabIndex={0}
          aria-label={`View course: ${title} - ${description}. Rated ${rating} stars by ${enrolledCount} students.`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCardClick(e as any);
            }
          }}
        >
          {/* Course Thumbnail */}
          <div className="relative aspect-video overflow-hidden bg-gray-100">
            {!imageError ? (
              <Image
                src={selectedImage || "/generic-course-fallback.svg"}
                alt={`${title} course thumbnail`}
                fill
                loading="lazy"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={cn("w-full h-full flex items-center justify-center", gradientBg)}>
                <div className="text-gray-400 text-sm font-medium">Course Image</div>
              </div>
            )}

            {/* Play button overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/90 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Play className="w-5 h-5 text-gray-800 ml-0.5" fill="currentColor" />
              </div>
            </div>

            {/* Best Seller Badge */}
            {isPopular && (
              <Badge className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 hover:bg-yellow-400 border-0 font-semibold text-xs px-2 py-1">
                Bestseller
              </Badge>
            )}
          </div>

          {/* Course Content */}
          <CardContent className="p-4 flex flex-col h-full">
            {/* Header with Category and Badges */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {category && (
                  <Badge className={cn("text-xs font-medium px-2 py-1", CATEGORY_CONFIG[category.toLowerCase()]?.badge || CATEGORY_CONFIG.default.badge)}>
                    {React.createElement(CATEGORY_CONFIG[category.toLowerCase()]?.icon || CATEGORY_CONFIG.default.icon, { className: "w-3 h-3 mr-1" })}
                    {category}
                  </Badge>
                )}
                {difficulty && (
                  <Badge className={cn("text-xs font-medium px-2 py-1", LEVEL_CONFIG[difficulty].badge)}>
                    {difficulty}
                  </Badge>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={handleFavoriteClick}
                    >
                      <Heart className={cn("h-4 w-4", isFavorite ? "fill-red-500 text-red-500" : "text-gray-400")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={handleBookmarkClick}
                    >
                      <Bookmark className={cn("h-4 w-4", isBookmarked ? "fill-blue-500 text-blue-500" : "text-gray-400")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isBookmarked ? "Remove bookmark" : "Bookmark course"}</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Share2 className="h-4 w-4 text-gray-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share course</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-purple-600 transition-colors duration-200">
              {title}
            </h3>

            {/* Instructor */}
            <p className="text-sm text-gray-600 mb-2 font-medium">
              {instructor}
            </p>

            {/* Rating and Enrollment */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-gray-900">{rating.toFixed(1)}</span>
                  <div className="flex" role="img" aria-label={`Rating: ${rating} out of 5 stars`}>
                    {[1,2,3,4,5].map((i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          rating >= i ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  ({enrolledCount.toLocaleString()})
                </span>
              </div>
              
              {/* Completion Rate */}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <span className="font-medium">{completionRate}%</span>
              </div>
            </div>

            {/* Trending/Popular Indicators */}
            <div className="flex items-center gap-2 mb-3">
              {isTrending && (
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-0 font-semibold text-xs px-2 py-0.5">
                  🔥 Trending
                </Badge>
              )}
              {isPopular && (
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-0 font-semibold text-xs px-2 py-0.5">
                  ⭐ Popular
                </Badge>
              )}
              {completionRate >= 90 && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0 font-semibold text-xs px-2 py-0.5">
                  🏆 High Completion
                </Badge>
              )}
            </div>

            {/* Course Description Preview */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
              {description}
            </p>

            {/* Course Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="font-medium text-gray-900">{unitCount}</div>
                  <div className="text-xs">Units</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Play className="h-4 w-4 text-green-500" />
                <div>
                  <div className="font-medium text-gray-900">{lessonCount}</div>
                  <div className="text-xs">Lessons</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Code className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="font-medium text-gray-900">{quizCount}</div>
                  <div className="text-xs">Quizzes</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="font-medium text-gray-900">{viewCount.toLocaleString()}</div>
                  <div className="text-xs">Views</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-2 py-0.5 text-gray-500 border-gray-300">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 text-gray-500 border-gray-300">
                    +{tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Duration and Updated Date */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                {duration}
              </span>
              {updatedAt && (
                <span>
                  Updated {new Date(updatedAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mt-auto">
              {price !== undefined ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-gray-900">${price}</span>
                  {originalPrice && price && originalPrice > price && (
                    <span className="text-sm text-gray-500 line-through">${originalPrice}</span>
                  )}
                  {originalPrice && price && originalPrice > price && (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0 font-semibold text-xs px-2 py-0.5 ml-2">
                      {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                </div>
              ) : (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0 font-semibold px-3 py-1">
                  Free
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    )
  },
)

CourseCard.displayName = "CourseCard"