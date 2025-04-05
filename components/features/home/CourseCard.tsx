"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
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
  Info,
} from "lucide-react"
import type { CourseCardProps } from "@/app/types/types"
import { cn } from "@/lib/utils"

// Animation variants for consistent animations
const cardVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  hover: { 
    scale: 1.03, 
    y: -5,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  }
}

const iconVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.15, 
    rotate: [-5, 5, -5, 0],
    y: -3,
    transition: {
      rotate: { repeat: Number.POSITIVE_INFINITY, repeatType: "mirror", duration: 1.5 },
      scale: { type: "spring", stiffness: 500, damping: 15 },
      y: { type: "spring", stiffness: 500, damping: 15 },
    }
  }
}

const statVariants = {
  initial: { opacity: 0, y: 10 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 * i }
  }),
  hover: {
    scale: 1.05,
    backgroundColor: "rgba(var(--primary), 0.15)",
  }
}

const progressPulseKeyframes = `
@keyframes progressPulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.progress-pulse::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(var(--primary), 0.3), transparent);
  animation: progressPulse 2s infinite;
}
`

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
    // Add keyframes for progress pulse animation
    React.useEffect(() => {
      const style = document.createElement("style")
      style.innerHTML = progressPulseKeyframes
      document.head.appendChild(style)
      return () => {
        document.head.removeChild(style)
      }
    }, [])

    const [isHovered, setIsHovered] = React.useState(false)
    const [showFullDescription, setShowFullDescription] = React.useState(false)
    const descriptionRef = React.useRef<HTMLParagraphElement>(null)
    const [isDescriptionTruncated, setIsDescriptionTruncated] = React.useState(false)

    const categoryName = typeof category === "object" ? category.name : category
    const progress = Math.floor(Math.random() * 101) // Simulated progress
    const courseLevel = determineCourseLevel(unitCount, lessonCount, quizCount)
    const config = courseLevelConfig[courseLevel]

    // Check if description is truncated
    React.useEffect(() => {
      if (descriptionRef.current) {
        setIsDescriptionTruncated(descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight)
      }
    }, [description])

    // Add progress pulse animation when hovered
    React.useEffect(() => {
      if (isHovered) {
        const progressBar = document.querySelector(`.progress-${slug}`) as HTMLElement
        if (progressBar) {
          progressBar.classList.add("progress-pulse")
          return () => progressBar.classList.remove("progress-pulse")
        }
      }
    }, [isHovered, slug])

    return (
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        className="h-full pt-6"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => {
          setIsHovered(false)
          setShowFullDescription(false)
        }}
      >
        <Link
          href={`/dashboard/course/${slug}`}
          className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        >
          <div className="relative h-full">
            <motion.div
              className={cn("absolute -top-6 left-6 p-3 rounded-xl shadow-lg z-10", config.icon)}
              variants={iconVariants}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </motion.div>

            <Card className="relative flex flex-col h-[450px] overflow-hidden group border-2 transition-all duration-500 hover:border-primary/50 hover:shadow-lg">
              <div className={cn("absolute inset-0 opacity-100 transition-opacity duration-300", config.gradient)} />

              <CardContent className="relative flex flex-col flex-grow p-6 space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={cn("px-2.5 py-0.5 text-xs font-medium rounded-lg transition-colors", config.badge)}
                    >
                      {courseLevel}
                    </Badge>

                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        <StarIcon className="w-3 h-3 mr-1 fill-current" />
                        {rating?.toFixed(1)}
                      </Badge>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        <EyeIcon className="w-3 h-3 mr-1" />
                        {viewCount}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                    {name}
                  </h3>
                </div>

                {categoryName && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 w-fit">
                      <motion.div
                        animate={{ rotate: isHovered ? [0, -5, 5, 0] : 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <TagIcon className="w-3 h-3 mr-1" />
                      </motion.div>
                      {categoryName}
                    </Badge>
                  </motion.div>
                )}

                <div className="relative mt-1">
                  <p
                    ref={descriptionRef}
                    className={cn(
                      "text-sm text-muted-foreground line-clamp-3 h-[4.5rem] leading-relaxed",
                      showFullDescription && "line-clamp-none h-auto max-h-[8rem] overflow-y-auto pr-2 scrollbar-thin",
                    )}
                  >
                    {description}
                  </p>

                  {isDescriptionTruncated && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setShowFullDescription(!showFullDescription)
                      }}
                      className="absolute -bottom-5 right-0 text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 font-medium group/readmore"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, repeatDelay: 3, duration: 0.5 }}
                      >
                        <Info className="w-3 h-3" />
                      </motion.span>
                      <span className="relative overflow-hidden">
                        {showFullDescription ? "Show less" : "Read more"}
                        <motion.span
                          className="absolute bottom-0 left-0 w-full h-[1px] bg-primary"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "0%" }}
                          transition={{ duration: 0.3 }}
                        />
                      </span>
                    </button>
                  )}
                </div>

                <div className="space-y-2 mt-auto pt-3">
                  <Progress
                    value={progress}
                    className={`h-2 bg-primary/10 overflow-hidden relative progress-${slug}`}
                  />
                  <div className="text-right text-xs text-muted-foreground font-medium">{progress}% complete</div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-1">
                  {[
                    { icon: BookIcon, label: "Units", value: unitCount },
                    { icon: UsersIcon, label: "Lessons", value: lessonCount },
                    { icon: FileQuestionIcon, label: "Quizzes", value: quizCount },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      className="flex flex-col items-center justify-center p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                      variants={statVariants}
                      custom={index}
                      initial="initial"
                      animate="animate"
                      whileHover="hover"
                    >
                      <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5 }}>
                        <stat.icon className="w-4 h-4 mb-1 text-primary" />
                      </motion.div>
                      <span className="font-medium text-sm">{stat.value}</span>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <motion.div
                  className="flex items-center gap-2 text-primary font-medium ml-auto"
                  whileHover={{
                    x: 5,
                    scale: 1.05,
                    transition: { type: "spring", stiffness: 400, damping: 10 },
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Learning
                  <motion.div
                    animate={{ x: isHovered ? [0, 5, 0] : 0 }}
                    transition={{
                      repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
                      repeatType: "mirror",
                      duration: 1,
                      repeatDelay: 0.5,
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                </motion.div>
              </CardFooter>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered && !showFullDescription ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent flex items-center justify-center pointer-events-none"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 20, opacity: 0 }}
                  animate={{ 
                    scale: isHovered && !showFullDescription ? 1 : 0.8, 
                    y: isHovered && !showFullDescription ? 0 : 20, 
                    opacity: isHovered && !showFullDescription ? 1 : 0 
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                  className="bg-card p-4 rounded-xl shadow-lg border border-primary/20 max-w-[80%] text-center"
                >
                  <motion.h4
                    className="font-semibold mb-2 text-primary"
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ 
                      y: isHovered && !showFullDescription ? 0 : -10, 
                      opacity: isHovered && !showFullDescription ? 1 : 0 
                    }}
                    transition={{ delay: 0.2 }}
                  >
                    {name}
                  </motion.h4>
                  <motion.p
                    className="text-foreground text-sm mb-3"
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ 
                      y: isHovered && !showFullDescription ? 0 : -5, 
                      opacity: isHovered && !showFullDescription ? 1 : 0 
                    }}
                    transition={{ delay: 0.3 }}
                  >
                    Start your learning journey today!
                  </motion.p>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ 
                      scale: isHovered && !showFullDescription ? 1 : 0.9, 
                      opacity: isHovered && !showFullDescription ? 1 : 0 
                    }}
                    transition={{ delay: 0.4 }}
                  >
                    <Badge variant="default" className="mx-auto">
                      {unitCount} Units • {lessonCount} Lessons • {quizCount} Quizzes
                    </Badge>
                  </motion.div>
                </motion.div>
              </motion.div>
            </Card>
          </div>
        </Link>
      </motion.div>
    )
  },
)

CourseCard.displayName = "CourseCard"
