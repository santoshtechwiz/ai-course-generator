"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Book, FileQuestion, Star, Zap, ChevronRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface CourseCardProps {
  id: string
  name: string
  description: string
  image: string
  rating: number
  slug: string
  unitCount: number
  lessonCount: number
  quizCount: number
  userId: string
  progress?: number
}

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  name,
  description,
  rating,
  slug,
  unitCount,
  lessonCount,
  quizCount,
  progress = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const badgeVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300",
          "hover:shadow-lg dark:hover:shadow-primary/20",
          "border-2 border-transparent hover:border-primary/30",
          "dark:bg-card dark:text-card-foreground",
          "transform hover:-translate-y-1",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <motion.div
            className={cn(
              "h-48 w-full flex items-center justify-center overflow-hidden",
              "bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10",
              "dark:from-primary/20 dark:via-secondary/20 dark:to-accent/20",
            )}
            animate={
              isHovered
                ? {
                    backgroundImage:
                      "linear-gradient(to bottom right, var(--primary), var(--secondary), var(--accent))",
                  }
                : {}
            }
            transition={{ duration: 0.5 }}
          >
            <motion.svg
              className="w-40 h-40 text-primary dark:text-primary-foreground"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              initial="hidden"
              animate={isHovered ? "visible" : "hidden"}
            >
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
              <motion.path
                d="M30 50 L70 50 M50 30 L50 70"
                stroke="currentColor"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut", delay: 0.5 }}
              />
            </motion.svg>
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-primary-foreground text-lg font-medium">Explore Course</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="absolute top-3 left-3 flex flex-row gap-2 flex-wrap max-w-[calc(100%-24px)]">
            <AnimatePresence>
              {isHovered && (
                <>
                  <motion.div
                    variants={badgeVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ delay: 0.1 }}
                  >
                    <Badge variant="secondary" className="font-medium">
                      {unitCount} Unit{unitCount !== 1 && "s"}
                    </Badge>
                  </motion.div>
                  <motion.div
                    variants={badgeVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ delay: 0.2 }}
                  >
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      AI-Powered
                    </Badge>
                  </motion.div>
                  {rating >= 4.5 && (
                    <motion.div
                      variants={badgeVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ delay: 0.3 }}
                    >
                      <Badge
                        variant="outline"
                        className="border-green-500 text-green-500 dark:border-green-400 dark:text-green-400"
                      >
                        Top Rated
                      </Badge>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-xl mb-2">{name}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <p className="text-muted-foreground text-sm mb-4">{description}</p>
          <div className="flex items-center justify-between text-sm mb-4">
            <motion.div className="flex items-center" whileHover={{ scale: 1.05 }}>
              <Book className="w-4 h-4 mr-2 text-primary dark:text-primary-foreground" />
              <span className="text-muted-foreground">{lessonCount} lessons</span>
            </motion.div>
            <motion.div className="flex items-center" whileHover={{ scale: 1.05 }}>
              <FileQuestion className="w-4 h-4 mr-2 text-secondary dark:text-secondary-foreground" />
              <span className="text-muted-foreground">{quizCount} quizzes</span>
            </motion.div>
            <motion.div className="flex items-center" whileHover={{ scale: 1.05 }}>
              <Star className="w-4 h-4 mr-2 text-yellow-500 dark:text-yellow-400" />
              <span className="text-muted-foreground">{rating.toFixed(1)}</span>
            </motion.div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Button asChild className="w-full group" size="lg">
            <Link href={`/dashboard/course/${slug}`}>
              <span className="relative flex items-center justify-center">
                Explore Course
                <motion.span
                  className="absolute right-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.span>
              </span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

