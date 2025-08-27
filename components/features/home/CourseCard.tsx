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
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  programming: { icon: Code, color: "text-blue-500", bg: "bg-blue-500/10" },
  web: { icon: Globe, color: "text-green-500", bg: "bg-green-500/10" },
  data: { icon: Database, color: "text-purple-500", bg: "bg-purple-500/10" },
  cloud: { icon: Cloud, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  design: { icon: Paintbrush, color: "text-pink-500", bg: "bg-pink-500/10" },
  mobile: { icon: Smartphone, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  security: { icon: Shield, color: "text-red-500", bg: "bg-red-500/10" },
  ai: { icon: BrainCircuit, color: "text-violet-500", bg: "bg-violet-500/10" },
  default: { icon: BookOpen, color: "text-slate-500", bg: "bg-slate-500/10" },
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

    if (loading) {
      return (
        <Card className={cn("w-full overflow-hidden border border-border/50 bg-card/50", className)}>
          <div className="animate-pulse flex flex-col lg:flex-row">
            {/* Image skeleton */}
            <div className="w-full lg:w-80 aspect-video lg:aspect-[4/3] bg-gradient-to-br from-muted/60 to-muted/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
            </div>
            {/* Content skeleton */}
            <div className="flex-1 p-4 lg:p-6 space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted/60 rounded-full" />
                <div className="h-6 w-3/4 bg-muted/60 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted/60 rounded" />
                <div className="h-4 w-2/3 bg-muted/60 rounded" />
              </div>
              <div className="flex gap-4">
                <div className="h-4 w-24 bg-muted/60 rounded" />
                <div className="h-4 w-20 bg-muted/60 rounded" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-6 w-32 bg-muted/60 rounded" />
                <div className="h-9 w-24 bg-muted/60 rounded-md" />
              </div>
            </div>
          </div>
        </Card>
      )
    }

    const cardVariants = {
      initial: { opacity: 0, y: 20, scale: 0.95 },
      animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 200,
          damping: 20,
        },
      },
      hover: {
        y: -4,
        scale: 1.01,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      },
    }

    return (
      <TooltipProvider>
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className={cn("w-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
        >
          <Card
            onClick={handleCardClick}
            className={cn(
              "w-full overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/95",
              "shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer",
              "flex flex-col lg:flex-row group relative backdrop-blur-sm",
              levelConfig.glow,
              isHovered && "shadow-xl shadow-primary/10",
              isNavigating && "opacity-75 scale-95",
            )}
            role="button"
            tabIndex={0}
            aria-label={`View course: ${title}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(e as any);
              }
            }}
          >
            {/* Image Section - Bigger fixed width on desktop */}
            <div className="relative w-full lg:w-96 aspect-video lg:aspect-[4/3] overflow-hidden flex-shrink-0">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

              {!imageError ? (
                <Image
                  src={selectedImage || "/placeholder.svg"}
                  alt={`${title} course thumbnail`}
                  fill
                  loading="lazy"
                  className={cn(
                    "object-cover transition-all duration-700 motion-reduce:transition-none",
                    isHovered ? "scale-105 brightness-105" : "scale-100",
                  )}
                  sizes="(max-width: 1024px) 100vw, 384px"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className={cn("absolute inset-0 flex items-center justify-center", gradientBg)}>
                  <motion.div
                    animate={{ rotate: isHovered ? 360 : 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="w-16 h-16 text-white/90"
                  >
                    <categoryConfig.icon className="w-full h-full drop-shadow-lg" />
                  </motion.div>
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Top left badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <Badge className={cn("px-2 py-1 text-xs font-semibold", levelConfig.badge)}>
                  {courseLevel}
                </Badge>
                {isPopular && (
                  <Badge className="px-2 py-1 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Popular
                  </Badge>
                )}
                {isTrending && (
                  <Badge className="px-2 py-1 text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>

              {/* Top right actions */}
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleFavoriteClick}
                      className={cn(
                        "p-2 rounded-full backdrop-blur-sm transition-all duration-300",
                        isFavorite
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                          : "bg-white/20 text-white hover:bg-white/30",
                      )}
                      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={cn("w-3 h-3", isFavorite && "fill-current")} />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFavorite ? "Remove from favorites" : "Add to favorites"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleBookmarkClick}
                      className={cn(
                        "p-2 rounded-full backdrop-blur-sm transition-all duration-300",
                        isBookmarked
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : "bg-white/20 text-white hover:bg-white/30",
                      )}
                      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark course"}
                    >
                      <Bookmark className={cn("w-3 h-3", isBookmarked && "fill-current")} />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isBookmarked ? "Remove bookmark" : "Bookmark course"}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Play button overlay */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-12 h-12 bg-primary rounded-full shadow-lg shadow-primary/25 flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom stats overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-semibold text-white">
                      {typeof rating === "number" ? rating.toFixed(1) : "0.0"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
                    <Eye className="h-3 w-3 text-blue-400" />
                    <span className="text-xs font-semibold text-white">
                      {viewCount > 999 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-4 lg:p-6 flex flex-col">
              <div className="flex-1 space-y-3">
                {/* Category and title */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1 rounded", categoryConfig.bg)}>
                      <categoryConfig.icon className={cn("w-3 h-3", categoryConfig.color)} />
                    </div>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {category}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2">
                    {title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {description}
                </p>

                {/* Instructor and updated date */}
                <div className="text-xs text-muted-foreground">
                  By {instructor}
                  {updatedAt && ` • Updated ${new Date(updatedAt).toLocaleDateString()}`}
                </div>

                {/* Rating */}
                {ratingLoading ? (
                  <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-orange-500">
                      {typeof rating === 'number' ? rating.toFixed(1) : rating}
                    </span>
                    <div className="flex">
                      {[1,2,3,4,5].map((i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "h-3 w-3", 
                            rating >= i ? "fill-orange-400 text-orange-400" : "text-muted-foreground/50"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({enrolledCount.toLocaleString()})
                    </span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{computedDuration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>{lessonCount} lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{courseLevel}</span>
                  </div>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 4).map((tag) => (
                      <span 
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-4">
                <div className="flex items-center gap-2">
                  {price !== undefined ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-primary">${price}</span>
                      {originalPrice && originalPrice > price && (
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
                  size="sm"
                  className={cn(
                    "group/btn relative overflow-hidden transition-all duration-300",
                    "bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary",
                    "shadow-md hover:shadow-lg hover:shadow-primary/25 border-0 px-4 py-2",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(e);
                  }}
                  disabled={isNavigating}
                  aria-label={`Enroll in ${title}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    {isNavigating ? "Loading..." : "Enroll Now"}
                    {!isNavigating && (
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    )}
                  </span>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </TooltipProvider>
    )
  },
)

CourseCard.displayName = "CourseCard"

const determineCourseLevel = (unitCount: number, lessonCount: number, quizCount: number): keyof typeof LEVEL_CONFIG => {
  const totalItems = unitCount + lessonCount + quizCount
  if (totalItems < 15) return "Beginner"
  if (totalItems < 30) return "Intermediate"
  return "Advanced"
}