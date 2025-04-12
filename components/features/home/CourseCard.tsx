"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookIcon, UsersIcon, FileQuestionIcon, StarIcon, EyeIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRipple } from "@/hooks/use-ripple"

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

const courseLevelConfig = {
  Beginner: {
    color: "bg-emerald-500",
    accent: "bg-emerald-100",
    text: "text-emerald-600",
    border: "border-emerald-200",
    gradient: "from-emerald-500/20 to-transparent",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
  Intermediate: {
    color: "bg-amber-500",
    accent: "bg-amber-100",
    text: "text-amber-600",
    border: "border-amber-200",
    gradient: "from-amber-500/20 to-transparent",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-500",
  },
  Advanced: {
    color: "bg-rose-500",
    accent: "bg-rose-100",
    text: "text-rose-600",
    border: "border-rose-200",
    gradient: "from-rose-500/20 to-transparent",
    bgColor: "bg-rose-50",
    iconColor: "text-rose-500",
  },
}

// Generate a consistent color based on the course title
const getColorFromTitle = (title: string): string => {
  const colors = ["emerald", "amber", "rose", "blue", "purple", "indigo", "teal"]
  let hash = 0

  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// SVG icons for different course categories
const courseSvgIcons = {
  Programming: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V5C19 3.89543 18.1046 3 17 3H16M8 3V5H16V3M8 3H16M10 11L8 13L10 15M14 11L16 13L14 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  "Web Development": (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 12H5M5 19H19M5 5H19M19 12H21M9 9H10M9 15H10M5 12C5 15.866 8.13401 19 12 19M5 12C5 8.13401 8.13401 5 12 5M19 12C19 15.866 15.866 19 12 19M19 12C19 8.13401 15.866 5 12 5M12 5C15.866 5 19 8.13401 19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 8.13401 8.13401 5 12 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  "Data Science": (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 6.5V6.5C16 5.09554 16 4.39331 15.6629 3.88886C15.517 3.67048 15.3295 3.48298 15.1111 3.33706C14.6067 3 13.9045 3 12.5 3H11.5C10.0955 3 9.39331 3 8.88886 3.33706C8.67048 3.48298 8.48298 3.67048 8.33706 3.88886C8 4.39331 8 5.09554 8 6.5V6.5M8 21H16M12 17V21M5 10.5C5 8.01472 7.01472 6 9.5 6H14.5C16.9853 6 19 8.01472 19 10.5V14.5C19 16.9853 16.9853 19 14.5 19H9.5C7.01472 19 5 16.9853 5 14.5V10.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  DevOps: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12H15.5M12 12V7.5M12 12L7.5 9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Design: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 7.5C16.5 7.5 15 9 12 9C9 9 7.5 7.5 7.5 7.5M16.5 16.5C16.5 16.5 15 15 12 15C9 15 7.5 16.5 7.5 16.5M12 9C12 9 12 12 12 15C12 18 12 15 12 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Development: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17 7.82959L18.6965 9.35641C20.239 10.7447 21.0103 11.4389 21.0103 12.3296C21.0103 13.2203 20.239 13.9145 18.6965 15.3028L17 16.8296"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.9868 5L10.0132 19.8297"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.00005 7.82959L5.30358 9.35641C3.76102 10.7447 2.98975 11.4389 2.98975 12.3296C2.98975 13.2203 3.76102 13.9145 5.30358 15.3028L7.00005 16.8296"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Default: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
}

export const CourseCard: React.FC<CourseCardProps> = React.memo(
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
  }) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const courseLevel = determineCourseLevel(unitCount, lessonCount, quizCount)
    const config = courseLevelConfig[courseLevel]
    const { rippleStyles, addRipple } = useRipple()
    const colorFromTitle = getColorFromTitle(title)

    // Get the appropriate SVG icon based on category
    const getCourseIcon = () => {
      const key = Object.keys(courseSvgIcons).find((k) => category.toLowerCase().includes(k.toLowerCase())) || "Default"
      return courseSvgIcons[key as keyof typeof courseSvgIcons]
    }

    const cardVariants = {
      initial: { y: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
      hover: {
        y: -5,
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        transition: { duration: 0.3 },
      },
    }

    const formattedRating = typeof rating === "number" ? rating.toFixed(1) : "0.0"

    if (loading) {
      return (
        <Card className={cn("overflow-hidden shadow-sm", className)}>
          <div className="p-4 space-y-4">
            <div className="w-full h-40 bg-muted rounded-md animate-pulse" />
            <div className="h-6 w-3/4 bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-full bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-2/3 bg-muted rounded-md animate-pulse" />
            <div className="flex gap-2">
              <div className="h-10 w-1/3 bg-muted rounded-md animate-pulse" />
              <div className="h-10 w-1/3 bg-muted rounded-md animate-pulse" />
              <div className="h-10 w-1/3 bg-muted rounded-md animate-pulse" />
            </div>
          </div>
        </Card>
      )
    }

    return (
      <motion.div
        initial="initial"
        whileHover="hover"
        variants={cardVariants}
        className={cn("group relative h-full", className)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Link
          href={`/dashboard/course/${slug}`}
          className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
          onClick={addRipple}
        >
          <Card className="h-full overflow-hidden border-muted bg-card transition-all duration-300 group-hover:border-primary/20">
            <div className="relative h-full">
              {/* Course Image with SVG */}
              <div
                className={cn(
                  "relative w-full h-48 overflow-hidden",
                  `bg-${colorFromTitle}-50 dark:bg-${colorFromTitle}-900/20`,
                )}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={cn("w-20 h-20", `text-${colorFromTitle}-600 dark:text-${colorFromTitle}-400`)}>
                    {getCourseIcon()}
                  </div>
                </div>
                <div className="absolute top-4 left-4">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-full px-3 py-1 text-sm font-medium shadow-sm",
                      config.text,
                      config.border,
                      config.accent,
                    )}
                  >
                    {courseLevel}
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <div className="flex items-center gap-1 rounded-full bg-gray-700/80 backdrop-blur-sm px-2 py-1">
                    <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-white">{formattedRating}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-700/80 backdrop-blur-sm px-2 py-1 rounded-full text-white text-sm">
                    <EyeIcon className="h-3.5 w-3.5" />
                    <span>{viewCount}</span>
                  </div>
                </div>
              </div>

              {/* Ripple Effect */}
              <AnimatePresence>
                {rippleStyles && (
                  <motion.span
                    className="absolute rounded-full bg-primary/20"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    style={rippleStyles}
                  />
                )}
              </AnimatePresence>

              <CardContent className="p-4 space-y-4">
                <div>
                  <motion.h3
                    className={cn(
                      "text-xl font-bold tracking-tight line-clamp-1 mb-2",
                      `text-${colorFromTitle}-700 dark:text-${colorFromTitle}-400`,
                    )}
                    initial={{ x: 0 }}
                    animate={{ x: isHovered ? 4 : 0 }}
                  >
                    {title}
                  </motion.h3>
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{description}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-full">
                    <div className={cn(`text-${colorFromTitle}-500`)}>
                      <BookIcon className="h-3 w-3" />
                    </div>
                    <span>{category}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-full">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{duration}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
                    { icon: BookIcon, label: "Units", value: unitCount },
                    { icon: UsersIcon, label: "Lessons", value: lessonCount },
                    { icon: FileQuestionIcon, label: "Quizzes", value: quizCount },
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                      <stat.icon className={cn("h-4 w-4 mb-1", config.iconColor)} />
                      <span className="font-semibold text-base">{stat.value}</span>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          </Card>
        </Link>
      </motion.div>
    )
  },
)

CourseCard.displayName = "CourseCard"

const determineCourseLevel = (
  unitCount: number,
  lessonCount: number,
  quizCount: number,
): "Beginner" | "Intermediate" | "Advanced" => {
  const totalItems = unitCount + lessonCount + quizCount
  if (totalItems < 15) return "Beginner"
  if (totalItems < 30) return "Intermediate"
  return "Advanced"
}
