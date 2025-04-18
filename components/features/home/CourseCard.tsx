"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookIcon, UsersIcon, FileQuestionIcon, StarIcon, EyeIcon, Clock, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

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
  difficulty?: string
}

// Level configuration with enhanced styling
const LEVEL_CONFIG = {
  Beginner: {
    badge:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    icon: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  Intermediate: {
    badge:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    icon: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  Advanced: {
    badge: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
    icon: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/20",
  },
}

// Enhanced category icons with more options
const getCategoryIcon = (category: string) => {
  const categoryLower = category?.toLowerCase() || ""

  if (
    categoryLower.includes("programming") ||
    categoryLower.includes("coding") ||
    categoryLower.includes("development")
  ) {
    return <BookIcon className="h-full w-full" />
  } else if (
    categoryLower.includes("data") ||
    categoryLower.includes("science") ||
    categoryLower.includes("analytics")
  ) {
    return <FileQuestionIcon className="h-full w-full" />
  } else if (categoryLower.includes("design") || categoryLower.includes("ui") || categoryLower.includes("ux")) {
    return <UsersIcon className="h-full w-full" />
  } else {
    return <BookOpen className="h-full w-full" />
  }
}

// Improved CourseCard with enhanced animations, accessibility, and responsive design
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
    category = "Development",
    duration = "4-6 weeks",
    className,
    loading = false,
    image,
    difficulty,
  }: CourseCardProps) => {
    const courseLevel = difficulty || determineCourseLevel(unitCount, lessonCount, quizCount)
    const config = LEVEL_CONFIG[courseLevel as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.Intermediate

    // Loading skeleton with improved animation
    if (loading) {
      return (
        <Card className={cn("h-full overflow-hidden border border-border/50", className)}>
          <div className="w-full h-40 bg-muted/60 animate-pulse rounded-t-lg" />
          <CardContent className="p-4 space-y-4">
            <div className="h-6 w-3/4 bg-muted/60 rounded-md animate-pulse" />
            <div className="h-4 w-full bg-muted/60 rounded-md animate-pulse" />
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/60 rounded-md animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <motion.div
        whileHover={{ y: -8, transition: { type: "spring", stiffness: 300, damping: 20 } }}
        className={cn(
          "h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg transition-all duration-300",
          className,
        )}
      >
        <Link
          href={`/dashboard/course/${slug}`}
          className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          aria-label={`View ${title} course`}
        >
          <motion.div
            initial={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
            whileHover={{
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
              borderColor: "rgba(var(--primary), 0.3)",
            }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Card className="h-full overflow-hidden border-muted hover:border-primary/20 transition-colors duration-300 bg-card">
              {/* Course Image with Icon */}
              <motion.div
                className={cn("relative w-full h-40", config.bg)}
                initial={{ opacity: 0.9 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {image ? (
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={title}
                    fill
                    className="object-cover opacity-90 hover:opacity-100 transition-opacity"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                  />
                ) : (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="w-16 h-16 text-primary-600">{getCategoryIcon(category)}</div>
                  </motion.div>
                )}

                {/* Level Badge */}
                <Badge
                  variant="secondary"
                  className={cn("absolute top-3 left-3 rounded-full px-2.5 py-0.5 z-10", config.badge)}
                >
                  {courseLevel}
                </Badge>

                {/* Rating and Views */}
                <div className="absolute bottom-3 left-3 right-3 flex justify-between z-10">
                  <motion.div
                    className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <StarIcon className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-medium text-white">
                      {typeof rating === "number" ? rating.toFixed(1) : "0.0"}
                    </span>
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full text-white text-xs backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <EyeIcon className="h-3 w-3" />
                    <span>{viewCount > 999 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}</span>
                  </motion.div>
                </div>
              </motion.div>

              <CardContent className="p-4 space-y-3">
                {/* Title and Description */}
                <div>
                  <motion.h3
                    className="text-lg font-bold tracking-tight line-clamp-1 mb-1 group-hover:text-primary transition-colors"
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {title}
                  </motion.h3>
                  <p className="text-muted-foreground line-clamp-2 text-sm">{description}</p>
                </div>

                {/* Category and Duration */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <motion.div
                    className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--primary), 0.1)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <BookIcon className="h-3 w-3 text-primary" />
                    <span>{category}</span>
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--primary), 0.1)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{duration}</span>
                  </motion.div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: BookIcon, label: "Units", value: unitCount },
                    { icon: UsersIcon, label: "Lessons", value: lessonCount },
                    { icon: FileQuestionIcon, label: "Quizzes", value: quizCount },
                  ].map((stat) => (
                    <motion.div
                      key={stat.label}
                      className="flex flex-col items-center p-2 rounded-lg bg-muted/50"
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "rgba(var(--primary), 0.1)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <stat.icon className={cn("h-4 w-4 mb-1", config.icon)} />
                      <span className="font-semibold text-base">{stat.value}</span>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Link>
      </motion.div>
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
