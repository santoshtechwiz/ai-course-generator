"use client"

import * as React from "react"
import { useState, useMemo, useCallback, useEffect } from "react"
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
  CheckCircle,
  Clock,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { normalizeImageUrl } from "@/utils/image-utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/modules/auth"
// Removed toast error feedback for bookmark/favorite auth prompts per request
import bookmarkService from "@/lib/bookmark-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { useBookmarkStatus, bookmarkBatchManager } from "@/lib/bookmark-batch-manager"

// Removed old cache variables - now using batch bookmark manager
// const bookmarkPresenceCache = new Map<number, boolean>()
// const pendingBookmarkFetches = new Set<number>()

// Udemy-style course images - using improved SVGs with better designs
const COURSE_IMAGES = {
  default: "/generic-course-improved.svg",
  tech: "/generic-course-tech-improved.svg",
  programming: "/generic-course-tech-improved.svg",
  "web-development": "/generic-course-tech-improved.svg",
  "data-science": "/generic-course-tech-improved.svg",
  business: "/generic-course-business-improved.svg",
  marketing: "/generic-course-business-improved.svg",
  design: "/generic-course-creative-improved.svg",
  creative: "/generic-course-creative-improved.svg"
}

// Professional gradient backgrounds for when images fail - enhanced colors
const GRADIENT_BACKGROUNDS = [
  "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",
  "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50",
  "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50",
  "bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50",
  "bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50",
  "bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50",
]

export interface CourseCardProps {
  title: string
  description: string
  rating: number
  slug: string
  courseId?: number // optional numeric id to enable bookmark persistence
  variant?: 'grid' | 'list'
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
  // Progress tracking props
  isEnrolled?: boolean
  progressPercentage?: number
  completedChapters?: number
  totalChapters?: number
  lastAccessedAt?: string
  currentChapterTitle?: string
  timeSpent?: number
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
    ratingLoading = false,
    tags = [],
    instructor = "Course Instructor",
    updatedAt,
    // Progress tracking props
    isEnrolled = false,
    progressPercentage = 0,
    completedChapters = 0,
    totalChapters = unitCount || 0,
    lastAccessedAt,
    currentChapterTitle,
  timeSpent = 0,
  variant = 'grid'
  }: CourseCardProps) => {
    const [isNavigating, setIsNavigating] = useState(false)
    const [imageError, setImageError] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [optimisticBusy, setOptimisticBusy] = useState<null | 'favorite' | 'bookmark'>(null)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  // Toast removed (no user-facing error popups for auth on bookmark/favorite)
  // Keep an up-to-date ref of auth state to avoid stale closures in keyboard handler
  const authRef = React.useRef({ isAuthenticated, authLoading })
  useEffect(() => { authRef.current = { isAuthenticated, authLoading } }, [isAuthenticated, authLoading])
  const router = useRouter()

  // Use new batch bookmark system - only when authenticated
  const { isBookmarked, loading: bookmarkLoading } = useBookmarkStatus(courseId, isAuthenticated)

    // Memoized random selections for consistent rendering
    const { selectedImage, gradientBg } = useMemo(() => {
  // Simplified image handling - prioritize actual course images over fallbacks
  let imageToUse = image

  // If no image provided or image is empty, use category-based fallback
  if (!imageToUse || imageToUse.trim() === '' || imageToUse === 'null' || imageToUse === 'undefined') {
        const normalizedCategory = (typeof category === 'string' ? category : '')?.toLowerCase().replace(/\s+/g, '-')
        imageToUse = COURSE_IMAGES[normalizedCategory as keyof typeof COURSE_IMAGES] || COURSE_IMAGES.default
      } else {
        // Ensure image has proper path
        if (!imageToUse.startsWith('http') && !imageToUse.startsWith('/')) {
          imageToUse = `/${imageToUse}`
        }
      }

      const gradientIndex =
        Math.abs(slug?.split("")?.reduce((a, b) => a + b.charCodeAt(0), 0) || 0) % GRADIENT_BACKGROUNDS.length
      return {
        selectedImage: imageToUse,
        gradientBg: GRADIENT_BACKGROUNDS[gradientIndex],
      }
    }, [category, slug, image])

    const handleCardClick = useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      setIsNavigating(true)
      router.push(`/dashboard/course/${slug}`)
    }, [router, slug])

    // Initial favorite status fetch (keeping individual for now - could batch later)
    useEffect(() => {
      let cancelled = false
      if (!isAuthenticated) return

      const load = async () => {
        // Favorite status (uncached for now – inexpensive, could batch later)
        try {
          const statusRes = await fetch(`/api/course/status/${slug}`)
          if (statusRes.ok) {
            const data = await statusRes.json()
            if (!cancelled) setIsFavorite(!!data.isFavorite)
          }
        } catch { /* silent */ }
      }

      load()
      return () => { cancelled = true }
    }, [slug, isAuthenticated])

    const handleFavoriteClick = useCallback(async (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation()
      if (authRef.current.authLoading || optimisticBusy) return
  if (!authRef.current.isAuthenticated) return
      const next = !isFavorite
      setIsFavorite(next)
      setOptimisticBusy('favorite')
      try {
        const res = await fetch(`/api/course/${slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFavorite: next })
        })
  if (res.status === 401) { setIsFavorite(!next); return }
        if (!res.ok) throw new Error('Failed to update favorite')
  // Silent success
      } catch (err) {
        setIsFavorite(!next) // revert
  // Silent failure
      } finally {
        setOptimisticBusy(null)
      }
  }, [optimisticBusy, isFavorite, slug])

    const handleBookmarkClick = useCallback(async (e: React.MouseEvent | React.KeyboardEvent) => {
      console.log('Bookmark click - Auth state:', { 
        isAuthenticated: authRef.current.isAuthenticated,
        isLoading: authRef.current.authLoading,
        busy: optimisticBusy
      })
      e.stopPropagation()
      
      // Block all actions if loading or busy
      if (authRef.current.authLoading || optimisticBusy) {
        console.log('Blocked: Loading or busy')
        return
      }
      
      // Early return if not authenticated
  if (!authRef.current.isAuthenticated) return

      const next = !isBookmarked
      console.log('Proceeding with bookmark:', { next })
      setOptimisticBusy('bookmark')
  // TODO: Replace with correct state setter for isBookmarked
  // setIsBookmarked(next)
      try {
        if (courseId) {
          const result = await bookmarkService.toggleBookmark(courseId)
          if (result.bookmarked !== next) {
            // TODO: Replace with correct state setter for isBookmarked
            // setIsBookmarked(result.bookmarked)
          } else {
            // TODO: Replace with correct state setter for isBookmarked
            // setIsBookmarked(next)
          }
          // Invalidate batch cache for this course
          bookmarkBatchManager.invalidateCache(courseId)
        } else {
          // No courseId => revert; bookmarking unsupported
          // TODO: Replace with correct state setter for isBookmarked
          // setIsBookmarked(false)
        }
      } catch (err) {
        // Revert on failure
  // TODO: Replace with correct state setter for isBookmarked
  // setIsBookmarked(!next)
      } finally {
        setOptimisticBusy(null)
      }
    }, [optimisticBusy, isBookmarked, courseId])

    // Keyboard shortcuts: f = favorite, b = bookmark when card focused
    const keyHandler = useCallback((e: React.KeyboardEvent) => {
      // Ignore if ctrl/cmd/alt/shift is pressed to avoid conflicts
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      // Only handle when focused (redundant but explicit)
      if (document.activeElement !== e.currentTarget) return;
      
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
  if (!authRef.current.isAuthenticated) return;
        handleFavoriteClick(e as any);
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
  if (!authRef.current.isAuthenticated) return;
        handleBookmarkClick(e as any);
      }
    }, [handleFavoriteClick, handleBookmarkClick]);

    if (loading) {
      return (
        <Card className="w-full overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          {/* Image skeleton with proper aspect ratio */}
          <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
            <div className="absolute top-3 left-3">
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="absolute top-3 right-3">
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            {/* Play button placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Skeleton className="w-5 h-5 rounded" />
              </div>
            </div>
          </div>

          <CardContent className="p-5 space-y-4">
            {/* Header badges */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>

            {/* Instructor */}
            <Skeleton className="h-4 w-32" />

            {/* Rating and enrollment */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-8" />
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <Skeleton key={i} className="h-4 w-4 rounded" />
                  ))}
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>

            {/* Trending badges */}
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="flex gap-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-12 rounded" />
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <TooltipProvider>
  <Card
          onClick={handleCardClick}
          className={cn(
      "relative w-full overflow-hidden border border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group focus:outline-none",
      "hover:border-primary/20 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isNavigating && "opacity-75 scale-95",
      variant === 'list' && 'md:flex md:flex-row md:h-32',
      variant === 'grid' && 'flex flex-col h-80',
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
              return
            }
            keyHandler(e)
          }}
        >
      {/* Category Accent Bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        CATEGORY_CONFIG[category.toLowerCase()]?.badge
          ?.replace('text-white','text-transparent')
          ?.replace('px-2','px-0')
          ?.replace('py-0.5','py-0') || 'bg-gradient-to-r from-slate-500 to-gray-600'
      )} />

      {/* Course Thumbnail */}
  <div className={cn(
    "relative overflow-hidden bg-gray-100",
    variant === 'list' && 'md:w-48 md:h-full md:shrink-0',
    variant === 'grid' && 'w-full h-48'
  )}>
            {!imageError ? (
              <>
                {imageLoading && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-400 rounded-full animate-spin"></div>
                  </div>
                )}
                <Image
                  src={selectedImage || "/generic-course-improved.svg"}
                  alt={`${title} course thumbnail`}
                  fill
                  className={cn(
                    "object-cover transition-transform duration-300 group-hover:scale-105",
                    imageLoading && "opacity-0"
                  )}
                  sizes={variant === 'grid' ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw" : "(max-width: 640px) 100vw, 200px"}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
                  onError={(e) => {
                    console.log('Image failed to load:', selectedImage, 'Error:', e)
                    setImageError(true)
                    setImageLoading(false)
                  }}
                  quality={75}
                  onLoad={() => {
                    setImageError(false)
                    setImageLoading(false)
                  }}
                  onLoadingComplete={() => setImageLoading(false)}
                />
              </>
            ) : (
              <div className={cn("w-full h-full flex flex-col items-center justify-center", gradientBg)}>
                <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm mb-2">
                  <BookOpen className="w-8 h-8 text-gray-500" />
                </div>
                <div className="text-gray-500 text-sm font-medium text-center px-2">
                  Course Preview
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Image unavailable
                </div>
              </div>
            )}
            {/* Hover overlay with play button */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className={cn(
                  "bg-white/95 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center",
                  variant === 'grid' ? 'w-12 h-12' : 'w-8 h-8'
                )}>
                  <Play className={cn("text-gray-800 ml-0.5", variant === 'grid' ? 'w-5 h-5' : 'w-4 h-4')} fill="currentColor" />
                </div>
              </div>
            </div>

            {/* Best Seller Badge */}
            {isPopular && (
              <Badge className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 hover:bg-yellow-400 border-0 font-semibold text-xs px-1.5 py-0.5">
                Bestseller
              </Badge>
            )}

            {/* Bookmark button - Grid view only */}
            {variant === 'grid' && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-all duration-200"
                onClick={handleBookmarkClick}
              >
                <Bookmark className={cn("h-4 w-4 transition-all duration-300", isBookmarked ? "fill-blue-500 text-blue-500" : "text-gray-600")} />
              </Button>
            )}
          </div>

          {/* Course Content */}
          <CardContent className={cn(
            "flex flex-col bg-white",
            variant === 'list' && 'p-3 h-full md:flex-1',
            variant === 'grid' && 'p-4 flex-1'
          )}>
            {/* Header with Category and Actions */}
            <div className={cn(
              "flex items-start justify-between",
              variant === 'list' && 'mb-2',
              variant === 'grid' && 'mb-3'
            )}>
              <div className="flex flex-wrap items-center gap-1">
                {category && (
                  <Badge className={cn("font-medium px-1.5 py-0.5", 
                    variant === 'grid' ? 'text-xs' : 'text-xs',
                    CATEGORY_CONFIG[category.toLowerCase()]?.badge || CATEGORY_CONFIG.default.badge
                  )}>
                    <span>{category}</span>
                  </Badge>
                )}
                {difficulty && (
                  <Badge className={cn("font-medium px-1.5 py-0.5",
                    variant === 'grid' ? 'text-xs' : 'text-xs',
                    LEVEL_CONFIG[difficulty].badge
                  )}>
                    {difficulty}
                  </Badge>
                )}
              </div>

              {/* Action button for list view */}
              {variant === 'list' && (
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                    onClick={handleBookmarkClick}
                  >
                    <Bookmark className={cn("h-3 w-3 transition-all duration-300", isBookmarked ? "fill-blue-500 text-blue-500" : "text-gray-400")} />
                  </Button>
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className={cn(
              "font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-purple-600 transition-colors duration-200",
              variant === 'list' && 'text-base mb-1',
              variant === 'grid' && 'text-lg mb-2'
            )}>
              {title}
            </h3>

            {/* Instructor */}
            <p className={cn(
              "text-gray-600 font-medium",
              variant === 'list' && 'text-xs mb-2',
              variant === 'grid' && 'text-sm mb-3'
            )}>
              {instructor}
            </p>

            {/* Rating and Stats */}
            <div className={cn(
              "flex items-center",
              variant === 'list' && 'justify-between mb-2',
              variant === 'grid' && 'gap-2 mb-3'
            )}>
              <div className="flex items-center gap-1">
                <span className={cn("font-bold text-gray-900", variant === 'grid' ? 'text-sm' : 'text-sm')}>{rating.toFixed(1)}</span>
                <div className="flex" role="img" aria-label={`Rating: ${rating} out of 5 stars`}>
                  {[1,2,3,4,5].map((i) => (
                    <Star
                      key={i}
                      className={cn(
                        rating >= i ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
                        variant === 'grid' ? 'h-4 w-4' : 'h-3 w-3'
                      )}
                    />
                  ))}
                </div>
                <span className={cn("text-gray-500 ml-1", variant === 'grid' ? 'text-sm' : 'text-xs')}>
                  ({enrolledCount.toLocaleString()})
                </span>
              </div>
            </div>

            {/* Course Stats */}
            {variant === 'list' ? (
              <div className="flex items-center gap-4 mb-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-blue-500" />
                  <span>{unitCount} units</span>
                </div>
                <div className="flex items-center gap-1">
                  <Play className="h-3 w-3 text-green-500" />
                  <span>{lessonCount} lessons</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-purple-500" />
                  <span>{duration}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span>{unitCount} units</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-green-500" />
                  <span>{lessonCount} lessons</span>
                </div>
              </div>
            )}

            {/* Progress Section for Enrolled Courses */}
            {isEnrolled && (
              <div className={cn(
                "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg",
                variant === 'list' && 'mb-2 p-3',
                variant === 'grid' && 'mb-4 p-3'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("font-medium text-blue-900", variant === 'grid' ? 'text-sm' : 'text-xs')}>
                    Progress: {progressPercentage}%
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-700 font-medium">Active</span>
                  </div>
                </div>
                <Progress value={progressPercentage} className="h-2 mb-2 bg-blue-100" />
                <div className={cn("text-blue-700 flex items-center justify-between", variant === 'grid' ? 'text-xs' : 'text-xs')}>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {completedChapters || 0} of {totalChapters || 0} chapters
                  </span>
                  {lastAccessedAt && (
                    <span className="text-blue-600">
                      {new Date(lastAccessedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mt-auto">
              {price !== undefined ? (
                <div className="flex items-center gap-2">
                  <span className={cn("font-bold text-gray-900", variant === 'grid' ? 'text-xl' : 'text-lg')}>${price}</span>
                  {originalPrice && price && originalPrice > price && (
                    <span className={cn("text-gray-500 line-through", variant === 'grid' ? 'text-sm' : 'text-sm')}>${originalPrice}</span>
                  )}
                </div>
              ) : (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0 font-semibold px-2 py-1 text-xs">
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