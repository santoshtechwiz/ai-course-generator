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
  TagIcon,
  GraduationCap,
  ChevronRight,
} from "lucide-react"
import type { CourseCardProps } from "@/app/types/types"
import { cn } from "@/lib/utils"

const cardVariants = {
  hover: { 
    y: -4,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }
}

const courseLevelConfig = {
  Beginner: {
    color: "bg-emerald-500",
    accent: "bg-emerald-100",
    text: "text-emerald-600"
  },
  Intermediate: {
    color: "bg-amber-500",
    accent: "bg-amber-100",
    text: "text-amber-600"
  },
  Advanced: {
    color: "bg-rose-500",
    accent: "bg-rose-100",
    text: "text-rose-600"
  },
}

export const CourseCard: React.FC<CourseCardProps> = React.memo(
  ({ title, description, rating, slug, unitCount, lessonCount, quizCount, viewCount, category }) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const courseLevel = determineCourseLevel(unitCount, lessonCount, quizCount)
    const config = courseLevelConfig[courseLevel]

    return (
      <motion.div
        whileHover="hover"
        className="h-full relative group"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className={cn(
          "absolute inset-0 rounded-xl transition-opacity duration-300",
          config.color,
          isHovered ? "opacity-10" : "opacity-0"
        )} />

        <Link href={`/dashboard/course/${slug}`} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
          <Card className="h-full overflow-hidden bg-background hover:shadow-lg transition-shadow border-0 shadow-sm">
            {/* Status Bar */}
            <div className={cn("h-1 w-full", config.color)} />

            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <motion.div 
                    animate={{ rotate: isHovered ? 360 : 0 }}
                    className={cn("p-2 rounded-lg", config.accent)}
                  >
                    <GraduationCap className={cn("h-5 w-5", config.text)} />
                  </motion.div>
                  <Badge 
                    variant="outline" 
                    className={cn("rounded-full px-3 py-1 text-sm font-medium border-2", config.text)}
                  >
                    {courseLevel}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex items-center gap-1 text-sm">
                    <StarIcon className="h-4 w-4" />
                    <span>{rating?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="space-y-4">
                <motion.h3 
                  className="text-xl font-bold tracking-tight line-clamp-2"
                  animate={{ x: isHovered ? 2 : 0 }}
                >
                  {title}
                </motion.h3>

                <p className="text-muted-foreground line-clamp-3 text-[0.925rem] leading-snug font-medium">
                  {description}
                </p>

                <div className="space-y-2">
                  <Progress 
                    value={Math.floor(Math.random() * 101)} 
                    className="h-2 bg-muted"
                    indicatorClassName={cn("transition-all duration-500", config.color)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: BookIcon, label: "Units", value: unitCount },
                    { icon: UsersIcon, label: "Lessons", value: lessonCount },
                    { icon: FileQuestionIcon, label: "Quizzes", value: quizCount },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      className="flex flex-col items-center p-2 rounded-lg bg-muted/30 backdrop-blur-sm"
                      whileHover={{ scale: 1.05 }}
                    >
                      <stat.icon className="h-5 w-5 text-muted-foreground mb-1.5" />
                      <span className="font-semibold text-lg">{stat.value}</span>
                      <span className="text-xs text-muted-foreground/80">{stat.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-3 border-t">
              <motion.div 
                className="flex items-center w-full text-foreground font-medium gap-1"
                animate={{ x: isHovered ? 4 : 0 }}
              >
                <span className="flex-1">Start Learning</span>
                <ChevronRight className="h-4 w-4" />
                <EyeIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{viewCount}</span>
              </motion.div>
            </CardFooter>

            {/* Hover Glow */}
            <div className={cn(
              "absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300",
              "bg-gradient-to-br from-white/30 to-transparent",
              isHovered ? "opacity-100" : "opacity-0"
            )} />
          </Card>
        </Link>
      </motion.div>
    )
  }
)

CourseCard.displayName = "CourseCard"

// Helper function remains the same
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