"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
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
} from "lucide-react"
import { useGlobalLoader } from '@/store/loaders/global-loader'
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
  }: CourseCardProps) => {
    const [isNavigating, setIsNavigating] = useState(false)
    const [imageError, setImageError] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isFavorite, setIsFavorite] = useState(false)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const router = useRouter()
    const { startLoading, stopLoading } = useGlobalLoader()

    // Memoized random selections for consistent rendering
    const { selectedImage, gradientBg, categoryConfig } = useMemo(() => {
      const imageIndex = Math.abs(title.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % COURSE_IMAGES.length
      const gradientIndex =
        Math.abs(slug.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % GRADIENT_BACKGROUNDS.length
      const normalizedCategory = category.toLowerCase()
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

    const handleCardClick = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsNavigating(true);
      startLoading({ message: "Loading course...", isBlocking: true });
      setTimeout(() => {
        router.push(`/dashboard/course/${slug}`);
      }, 100);
    }

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsFavorite(!isFavorite)
    }

    const handleBookmarkClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsBookmarked(!isBookmarked)
    }

    const handleShareClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      // Share functionality would be implemented here
      navigator.share?.({
        title: title,
        text: description,
        url: window.location.origin + `/dashboard/course/${slug}`,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard?.writeText(window.location.origin + `/dashboard/course/${slug}`)
      })
    }

    if (loading) {
      return (
        <Card className={cn("h-full overflow-hidden border border-border/50 bg-card/50", className)}>
          <div className="animate-pulse">
            <div className="w-full aspect-[16/10] bg-gradient-to-br from-muted/60 to-muted/30 rounded-t-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted/60 rounded-full" />
                <div className="h-6 w-3/4 bg-muted/60 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted/60 rounded" />
                <div className="h-4 w-2/3 bg-muted/60 rounded" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/60 rounded-lg" />
                ))}
              </div>
              <div className="h-2 bg-muted/60 rounded-full" />
              <div className="flex justify-between items-center">
                <div className="h-8 w-16 bg-muted/60 rounded" />
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
          staggerChildren: 0.1,
        },
      },
      hover: {
        y: -8,
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      },
    }

    const contentVariants = {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
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
          className={cn(
            "h-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className,
          )}
        >
          <Card
            onClick={handleCardClick}
            className={cn(
              "h-full overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/95",
              "shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer",
              "flex flex-col group relative backdrop-blur-sm",
              levelConfig.glow,
              isHovered && "shadow-2xl shadow-primary/10",
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
            {/* Enhanced Image Section */}
            <div className="relative w-full aspect-[16/10] overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

              {!imageError ? (
                <Image
                  src={selectedImage || "/placeholder.svg"}
                  alt={`${title} course thumbnail`}
                  fill
                  className={cn(
                    "object-cover transition-all duration-700",
                    isHovered ? "scale-110 brightness-110" : "scale-100",
                  )}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  priority
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className={cn("absolute inset-0 flex items-center justify-center", gradientBg)}>
                  <motion.div
                    animate={{ rotate: isHovered ? 360 : 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="w-16 h-16 sm:w-20 sm:h-20 text-white/90"
                  >
                    <categoryConfig.icon className="w-full h-full drop-shadow-lg" />
                  </motion.div>
                </div>
              )}

              {/* Enhanced Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Top Badges */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                <div className="flex flex-wrap gap-2">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge className={cn("px-3 py-1 rounded-full text-xs font-semibold", levelConfig.badge)}>
                      {courseLevel}
                    </Badge>
                  </motion.div>

                  {isPopular && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Badge className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Popular
                      </Badge>
                    </motion.div>
                  )}

                  {isTrending && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Badge className="px-3 py-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-lg">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    </motion.div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
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
                        <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
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
                        <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isBookmarked ? "Remove bookmark" : "Bookmark course"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleShareClick}
                        className="p-2 rounded-full backdrop-blur-sm bg-white/20 text-white hover:bg-white/30 transition-all duration-300"
                        aria-label="Share course"
                      >
                        <Share2 className="w-4 h-4" />
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Share course
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Bottom Stats */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full"
                      >
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold text-white">
                          {typeof rating === "number" ? rating.toFixed(1) : "0.0"}
                        </span>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Course rating: {typeof rating === "number" ? rating.toFixed(1) : "0.0"} out of 5
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full"
                      >
                        <Eye className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-semibold text-white">
                          {viewCount > 999 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}
                        </span>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {viewCount} views
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Play Button - appears on hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="flex items-center justify-center w-12 h-12 bg-primary rounded-full shadow-lg shadow-primary/25"
                    >
                      <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Enhanced Content Section */}
            <div className="flex-1 flex flex-col">
              <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                <motion.div variants={contentVariants} className="space-y-3">
                  {/* Category Badge */}
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg", categoryConfig.bg)}>
                      <categoryConfig.icon className={cn("w-4 h-4", categoryConfig.color)} />
                    </div>
                    <Badge variant="secondary" className="text-xs px-2 py-1 rounded-full">
                      {category}
                    </Badge>
                  </div>

                  {/* Title */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-lg font-semibold leading-tight group-hover:text-primary transition-colors duration-300">
                      {title}
                    </h3>
                    {difficulty && (
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {difficulty}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
                </motion.div>
              </CardHeader>

              {/* Enhanced Stats Grid */}
              <CardContent className="py-0 px-4 sm:px-6 flex-1">
                <motion.div variants={contentVariants} className="space-y-4">
                  {/* Main Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {[
                      { icon: BookOpen, label: "Units", value: unitCount, color: "text-blue-500", description: `${unitCount} learning units` },
                      { icon: Users, label: "Lessons", value: lessonCount, color: "text-green-500", description: `${lessonCount} video lessons` },
                      { icon: FileQuestion, label: "Quizzes", value: quizCount, color: "text-purple-500", description: `${quizCount} practice quizzes` },
                    ].map((stat, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 hover:from-primary/5 hover:to-primary/10 transition-all duration-300 cursor-help"
                          >
                            <stat.icon className={cn("h-5 w-5", stat.color)} />
                            <span className="text-lg font-bold">{stat.value}</span>
                            <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {stat.description}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">Completion Rate</span>
                      <span className="font-bold text-primary">{completionRate}%</span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionRate}%` }}
                        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              </CardContent>

              {/* Enhanced Footer */}
              <CardFooter className="pt-4 pb-4 sm:pb-6 px-4 sm:px-6">
                <motion.div variants={contentVariants} className="w-full space-y-4">
                  {/* Duration and Enrolled Count */}
                  <div className="flex justify-between items-center text-sm">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 text-muted-foreground cursor-help">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{duration}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        Estimated completion time: {duration}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 text-muted-foreground cursor-help">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">
                            {enrolledCount > 999 ? `${(enrolledCount / 1000).toFixed(1)}k` : enrolledCount} enrolled
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {enrolledCount} students enrolled
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Price and CTA */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {price !== undefined ? (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-primary">${price}</span>
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
                        "shadow-lg hover:shadow-xl hover:shadow-primary/25 border-0 px-4 py-2",
                        "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
                        "after:translate-x-[-100%] after:group-hover/btn:translate-x-[100%] after:transition-transform after:duration-700",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(e);
                      }}
                      disabled={isNavigating}
                      aria-label={`Enroll in ${title}`}
                    >
                      <span className="relative z-10 flex items-center gap-2 font-semibold">
                        {isNavigating ? "Loading..." : "Enroll Now"}
                        {!isNavigating && (
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        )}
                      </span>
                    </Button>
                  </div>
                </motion.div>
              </CardFooter>
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

