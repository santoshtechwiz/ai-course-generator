"use client"

import * as React from "react"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen, Users, FileQuestion, Star, Eye, Clock,
  Code, Globe, Database, Cloud, Paintbrush,
  Smartphone, Shield, BrainCircuit, Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

// Array of placeholder course images (replace with your actual image paths)
const COURSE_IMAGES = [
  "/course.png",
  "/course_2.png",
  "/course_3.png",
  "/course_4.png",
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
}

const LEVEL_CONFIG = {
  Beginner: {
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: "text-emerald-500",
    bg: "bg-emerald-500/5"
  },
  Intermediate: {
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: "text-amber-500",
    bg: "bg-amber-500/5"
  },
  Advanced: {
    badge: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    icon: "text-rose-500",
    bg: "bg-rose-500/5"
  }
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  programming: Code,
  web: Globe,
  data: Database,
  cloud: Cloud,
  design: Paintbrush,
  mobile: Smartphone,
  security: Shield,
  ai: BrainCircuit,
  default: BookOpen
}

export const CourseCard = React.memo(({
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
  difficulty
}: CourseCardProps) => {
  const [isNavigating, setIsNavigating] = useState(false)
  const [imageError, setImageError] = useState(false)
  const router = useRouter()

  // Select a random image if none provided
  const selectedImage = COURSE_IMAGES[Math.floor(Math.random() * COURSE_IMAGES.length)]
  const courseLevel = difficulty || determineCourseLevel(unitCount, lessonCount, quizCount)
  const levelConfig = LEVEL_CONFIG[courseLevel] || LEVEL_CONFIG.Intermediate

  // Get appropriate icon for category
  const getCategoryIcon = () => {
    const normalizedCategory = category.toLowerCase()
    const Icon =
      CATEGORY_ICONS[normalizedCategory] ||
        Object.keys(CATEGORY_ICONS).find(key => normalizedCategory.includes(key)) ?
        CATEGORY_ICONS[Object.keys(CATEGORY_ICONS).find(key => normalizedCategory.includes(key))!] :
        CATEGORY_ICONS.default
    return <Icon className="h-5 w-5" />
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsNavigating(true)
    router.push(`/dashboard/course/${slug}`)
  }

  if (loading) {
    return (
      <Card className={cn("h-full overflow-hidden border border-border/50 animate-pulse", className)}>
        <div className="w-full aspect-video bg-muted rounded-t-lg" />
        <CardContent className="p-6 space-y-4">
          <div className="h-6 w-3/4 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn("h-full outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
    >
      <Card
        onClick={handleCardClick}
        className={cn(
          "h-full overflow-hidden border-border/50 hover:border-primary/30 transition-colors cursor-pointer",
          "flex flex-col group relative"
        )}
      >
        {isNavigating && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Image Section */}
        <div className={cn("relative w-full aspect-video overflow-hidden", levelConfig.bg)}>
          {!imageError ? (
            <Image
              src={selectedImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="w-16 h-16 text-primary/80">{getCategoryIcon()}</div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={cn("px-3 py-1 rounded-full", levelConfig.badge)}>
              {courseLevel}
            </Badge>
            {category && (
              <Badge variant="secondary" className="px-3 py-1 rounded-full">
                {category}
              </Badge>
            )}
          </div>

          {/* Rating and Views */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between">
            <div className="flex items-center gap-1.5 bg-background/90 px-3 py-1 rounded-full backdrop-blur-sm">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500/20" />
              <span className="text-sm font-medium">
                {typeof rating === "number" ? rating.toFixed(1) : "0.0"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-background/90 px-3 py-1 rounded-full backdrop-blur-sm">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">
                {viewCount > 999 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold leading-tight line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </CardHeader>

        {/* Stats Section */}
        <CardContent className="py-0 px-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: BookOpen, label: "Units", value: unitCount },
              { icon: Users, label: "Lessons", value: lessonCount },
              { icon: FileQuestion, label: "Quizzes", value: quizCount }
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50"
              >
                <stat.icon className={cn("h-5 w-5", levelConfig.icon)} />
                <span className="text-sm font-medium">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="pt-4 pb-6 px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
          <Badge variant="outline" className="text-sm">
            Enroll Now
          </Badge>
        </CardFooter>
      </Card>
    </motion.div>
  )
})

CourseCard.displayName = "CourseCard"

const determineCourseLevel = (
  unitCount: number,
  lessonCount: number,
  quizCount: number
): keyof typeof LEVEL_CONFIG => {
  const totalItems = unitCount + lessonCount + quizCount
  if (totalItems < 15) return "Beginner"
  if (totalItems < 30) return "Intermediate"
  return "Advanced"
}