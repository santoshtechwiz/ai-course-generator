"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookIcon, UsersIcon, FileQuestionIcon, StarIcon, EyeIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

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
}

// Simple level config with minimal classes
const LEVEL_CONFIG = {
  Beginner: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  Intermediate: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  Advanced: {
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    icon: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-900/20",
  },
}

// Simple category icons
const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "programming":
    case "web development":
    case "development":
      return <BookIcon className="h-full w-full" />
    case "data science":
      return <BookIcon className="h-full w-full" />
    default:
      return <BookIcon className="h-full w-full" />
  }
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
    category = "Development",
    duration = "4-6 weeks",
    className,
    loading = false,
  }: CourseCardProps) => {
    const courseLevel = determineCourseLevel(unitCount, lessonCount, quizCount)
    const config = LEVEL_CONFIG[courseLevel]

    if (loading) {
      return (
        <Card className={cn("h-full", className)}>
          <div className="w-full h-40 bg-muted animate-pulse" />
          <CardContent className="p-4 space-y-4">
            <div className="h-6 w-3/4 bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-full bg-muted rounded-md animate-pulse" />
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Link
        href={`/dashboard/course/${slug}`}
        className={cn(
          "block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
          className,
        )}
      >
        <Card className="h-full overflow-hidden border-muted hover:border-primary/20">
          {/* Course Image with Icon */}
          <div className={cn("relative w-full h-40", config.bg)}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 text-primary-600">{getCategoryIcon(category)}</div>
            </div>

            {/* Level Badge */}
            <Badge variant="secondary" className={cn("absolute top-3 left-3 rounded-full px-2.5 py-0.5", config.badge)}>
              {courseLevel}
            </Badge>

            {/* Rating and Views */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between">
              <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5">
                <StarIcon className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-medium text-white">
                  {typeof rating === "number" ? rating.toFixed(1) : "0.0"}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full text-white text-xs">
                <EyeIcon className="h-3 w-3" />
                <span>{viewCount}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-4 space-y-3">
            {/* Title and Description */}
            <div>
              <h3 className="text-lg font-bold tracking-tight line-clamp-1 mb-1">{title}</h3>
              <p className="text-muted-foreground line-clamp-2 text-sm">{description}</p>
            </div>

            {/* Category and Duration */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full">
                <BookIcon className="h-3 w-3 text-primary" />
                <span>{category}</span>
              </div>
              <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>{duration}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: BookIcon, label: "Units", value: unitCount },
                { icon: UsersIcon, label: "Lessons", value: lessonCount },
                { icon: FileQuestionIcon, label: "Quizzes", value: quizCount },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                  <stat.icon className={cn("h-4 w-4 mb-1", config.icon)} />
                  <span className="font-semibold text-base">{stat.value}</span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>
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
