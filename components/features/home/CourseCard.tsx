"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BookIcon,
  UsersIcon,
  FileQuestionIcon,
  StarIcon,
  EyeIcon,
  ChevronRight,
  GraduationCapIcon,
  ClockIcon,
  TagIcon,
} from "lucide-react"
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
}

const courseLevelConfig = {
  Beginner: {
    color: "bg-emerald-500",
    accent: "bg-emerald-100",
    text: "text-emerald-600",
    border: "border-emerald-200",
    shadow: "shadow-emerald-500/20",
    gradient: "from-emerald-500/20 to-transparent",
  },
  Intermediate: {
    color: "bg-amber-500",
    accent: "bg-amber-100",
    text: "text-amber-600",
    border: "border-amber-200",
    shadow: "shadow-amber-500/20",
    gradient: "from-amber-500/20 to-transparent",
  },
  Advanced: {
    color: "bg-rose-500",
    accent: "bg-rose-100",
    text: "text-rose-600",
    border: "border-rose-200",
    shadow: "shadow-rose-500/20",
    gradient: "from-rose-500/20 to-transparent",
  },
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
    category,
    duration = "4-6 weeks",
    className,
  }) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const courseLevel = determineCourseLevel(unitCount, lessonCount, quizCount)
    const config = courseLevelConfig[courseLevel]
    const progressValue = 0 // replace with real data later

    const cardVariants = {
      initial: { y: 0, scale: 1 },
      hover: {
        y: -8,
        scale: 1.02,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
        },
      },
    }

    const iconVariants = {
      initial: { rotate: 0, scale: 1 },
      hover: {
        rotate: 360,
        scale: 1.1,
        transition: {
          rotate: { duration: 0.5, ease: "easeInOut" },
          scale: { duration: 0.2, ease: "easeOut" },
        },
      },
    }

    const progressVariants = {
      initial: { width: "0%" },
      animate: {
        width: `${progressValue}%`,
        transition: { duration: 1, ease: "easeOut", delay: 0.2 },
      },
    }

    const statVariants = {
      initial: { y: 0 },
      hover: (i: number) => ({
        y: -5,
        transition: { delay: i * 0.05, duration: 0.2 },
      }),
    }

    const formattedRating = typeof rating === "number" ? rating.toFixed(1) : "0.0"

    return (
      <motion.div
        initial="initial"
        whileHover="hover"
        animate="initial"
        variants={cardVariants}
        className={cn("h-full relative group", className)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <motion.div
          className={cn("absolute -inset-1 rounded-2xl opacity-0 blur-xl transition-all duration-300", config.shadow)}
          animate={{ opacity: isHovered ? 0.7 : 0 }}
        />

        <Link
          href={`/dashboard/course/${slug}`}
          className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        >
          <Card
            className={cn(
              "h-full overflow-hidden bg-background border transition-all duration-300",
              isHovered ? `shadow-lg ${config.border}` : "shadow-md border-muted",
              "rounded-xl",
            )}
          >
            <div className="h-1.5 w-full bg-muted relative overflow-hidden">
              <motion.div
                className={cn("h-full absolute left-0 top-0", config.color)}
                initial="initial"
                animate="animate"
                variants={progressVariants}
              />
            </div>

            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div variants={iconVariants} className={cn("p-2 rounded-lg", config.accent)}>
                    <GraduationCapIcon className={cn("h-5 w-5", config.text)} />
                  </motion.div>
                  <Badge
                    variant="outline"
                    className={cn("rounded-full px-3 py-0.5 text-sm font-medium border", config.text, config.border)}
                  >
                    {courseLevel}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{category || "Development"}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full leading-none">
                    <StarIcon className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-medium">{formattedRating}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 pb-3 space-y-4">
              <div>
                <motion.h3
                  className="text-xl font-bold tracking-tight line-clamp-2 mb-1.5"
                  animate={{ x: isHovered ? 4 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {title || "Untitled Course"}
                </motion.h3>

                <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                  {description || "No description available"}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <EyeIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{viewCount} views</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progressValue}%</span>
                </div>
                <Progress
                  value={progressValue}
                  className="h-2 bg-muted"
                  indicatorClassName={cn("transition-all duration-500", config.color)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[{ icon: BookIcon, label: "Units", value: unitCount }, { icon: UsersIcon, label: "Lessons", value: lessonCount }, { icon: FileQuestionIcon, label: "Quizzes", value: quizCount }].map(
                  (stat, index) => (
                    <motion.div
                      key={index}
                      custom={index}
                      variants={statVariants}
                      className={cn(
                        "flex flex-col items-center p-2 rounded-lg transition-colors duration-300",
                        isHovered ? config.accent : "bg-muted/50",
                      )}
                    >
                      <stat.icon
                        className={cn(
                          "h-5 w-5 mb-1 transition-colors duration-300",
                          isHovered ? config.text : "text-muted-foreground",
                        )}
                      />
                      <span className="font-semibold text-lg">{stat.value}</span>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </motion.div>
                  ),
                )}
              </div>
            </CardContent>

            <CardFooter
              className={cn(
                "p-4 pt-3 border-t flex items-center justify-between transition-colors duration-300",
                isHovered ? config.accent + " " + config.border : "",
              )}
            >
              <motion.div
                className="flex items-center w-full justify-between"
                animate={{ x: isHovered ? 4 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <span
                  className={cn(
                    "font-medium transition-colors duration-300",
                    isHovered ? config.text : "text-foreground",
                  )}
                >
                  Continue Learning
                </span>
                <motion.div
                  animate={{ x: isHovered ? 4 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 transition-colors duration-300",
                      isHovered ? config.text : "text-muted-foreground",
                    )}
                  />
                </motion.div>
              </motion.div>
            </CardFooter>

            <motion.div
              className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none", config.gradient)}
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 0.6 : 0 }}
              transition={{ duration: 0.3 }}
            />
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
