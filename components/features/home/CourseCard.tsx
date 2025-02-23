"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BookIcon,
  UsersIcon,
  FileQuestionIcon,
  StarIcon,
  EyeIcon,
  TagIcon,
  GraduationCap,
  ChevronRight,
} from "lucide-react"
import type { CourseCardProps } from "@/app/types/types"
import { cn } from "@/lib/utils"

const courseLevelConfig = {
  Beginner: {
    gradient: "bg-gradient-to-br from-emerald-500/10 to-emerald-500/30 dark:from-emerald-500/20 dark:to-emerald-500/40",
    icon: "bg-emerald-500 dark:bg-emerald-600",
    badge:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  Intermediate: {
    gradient: "bg-gradient-to-br from-amber-500/10 to-amber-500/30 dark:from-amber-500/20 dark:to-amber-500/40",
    icon: "bg-amber-500 dark:bg-amber-600",
    badge:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300",
  },
  Advanced: {
    gradient: "bg-gradient-to-br from-red-500/10 to-red-500/30 dark:from-red-500/20 dark:to-red-500/40",
    icon: "bg-red-500 dark:bg-red-600",
    badge: "border-red-500/20 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-300",
  },
}

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

export const CourseCard: React.FC<CourseCardProps> = React.memo(
  ({ name, description, rating, slug, unitCount, lessonCount, quizCount, viewCount, category }) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const categoryName = typeof category === "object" ? category.name : category
    const progress = Math.floor(Math.random() * 101) // Simulated progress
    const courseLevel = determineCourseLevel(unitCount, lessonCount, quizCount)
    const config = courseLevelConfig[courseLevel]

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full pt-6"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Link
          href={`/dashboard/course/${slug}`}
          className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        >
          <div className="relative h-full">
            <motion.div
              className={cn("absolute -top-6 left-6 p-3 rounded-xl shadow-lg z-10", config.icon)}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </motion.div>

            <Card className="relative flex flex-col h-full overflow-hidden group border-2 transition-colors hover:border-primary/50">
              <div className={cn("absolute inset-0 opacity-100 transition-opacity duration-300", config.gradient)} />

              <CardContent className="relative flex flex-col flex-grow p-6 space-y-4">
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className={cn("px-2.5 py-0.5 text-xs font-medium rounded-lg transition-colors", config.badge)}
                  >
                    {courseLevel}
                  </Badge>

                  <h3 className="text-xl font-semibold leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                    {name}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <StarIcon className="w-3 h-3 mr-1 fill-current" />
                    {rating?.toFixed(1)}
                  </Badge>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <EyeIcon className="w-3 h-3 mr-1" />
                    {viewCount}
                  </Badge>
                  {categoryName && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      <TagIcon className="w-3 h-3 mr-1" />
                      {categoryName}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 group-hover:line-clamp-none transition-all flex-grow">
                  {description}
                </p>

                <div className="space-y-1.5">
                  <Progress value={progress} className="h-2 bg-primary/10" />
                  <div className="text-right text-xs text-muted-foreground">{progress}% complete</div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: BookIcon, label: "Units", value: unitCount },
                    { icon: UsersIcon, label: "Lessons", value: lessonCount },
                    { icon: FileQuestionIcon, label: "Quizzes", value: quizCount },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center justify-center p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <stat.icon className="w-4 h-4 mb-1 text-primary" />
                      <span className="font-medium text-sm">{stat.value}</span>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <motion.div className="flex items-center gap-2 text-primary font-medium ml-auto" whileHover={{ x: 5 }}>
                  Start Learning
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </CardFooter>

              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent flex items-end p-6"
                  >
                    <p className="text-foreground text-sm font-medium text-center">
                      Start your journey in {name} today!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>
        </Link>
      </motion.div>
    )
  },
)

CourseCard.displayName = "CourseCard"

