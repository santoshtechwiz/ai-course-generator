"use client"

import { useState, useEffect } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Book, FileQuestion, Star, Zap } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const controls = useAnimation()

  useEffect(() => {
    controls.start({
      scale: [1, 1.02, 1],
      transition: { duration: 4, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
    })
  }, [controls])

  const svgVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    hover: {
      scale: 1.1,
      transition: { duration: 0.3 },
    },
  }

  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: { delay: i * 0.2, duration: 0.5 },
    }),
  }

  const lineVariants = {
    hidden: { pathLength: 0 },
    visible: {
      pathLength: 1,
      transition: { duration: 1.5, ease: "easeInOut" },
    },
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
          "hover:shadow-xl dark:hover:shadow-primary/20",
          "border-2 border-transparent hover:border-primary/20",
          "dark:bg-card dark:text-card-foreground",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <motion.div
            className={cn(
              "h-48 w-full flex items-center justify-center overflow-hidden",
              "bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5",
              "dark:from-primary/10 dark:via-secondary/10 dark:to-accent/10",
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
              className="w-40 mt-10 h-40 text-primary dark:text-primary-foreground"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              variants={svgVariants}
              initial="hidden"
              animate={isHovered ? "hover" : "visible"}
            >
              <motion.path
                d="M50 10 C25 10 10 30 10 50 C10 70 25 90 50 90 C75 90 90 70 90 50 C90 30 75 10 50 10"
                stroke="currentColor"
                strokeWidth="2"
                variants={lineVariants}
              />
              <motion.path
                d="M30 30 L70 70 M30 70 L70 30 M50 20 L50 80 M20 50 L80 50"
                stroke="currentColor"
                strokeWidth="1"
                variants={lineVariants}
              />
              {[30, 50, 70].map((cx, i) =>
                [30, 50, 70].map((cy, j) => (
                  <motion.circle
                    key={`${i}-${j}`}
                    cx={cx}
                    cy={cy}
                    r="3"
                    fill="currentColor"
                    custom={i * 3 + j}
                    variants={circleVariants}
                  />
                )),
              )}
            </motion.svg>
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute inset-0 bg-primary/10 backdrop-blur-[1px] flex items-center justify-center"
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
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Badge variant="secondary" className="font-medium">
                {unitCount} Unit{unitCount !== 1 && "s"}
              </Badge>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                AI-Powered
              </Badge>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Badge variant="secondary" className="bg-purple-500 dark:bg-purple-700 text-white">
                Popular
              </Badge>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <Badge
                variant="outline"
                className="border-yellow-500 text-yellow-500 dark:border-yellow-400 dark:text-yellow-400"
              >
                Best Seller
              </Badge>
            </motion.div>
            {rating >= 4.5 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                <Badge
                  variant="outline"
                  className="border-green-500 text-green-500 dark:border-green-400 dark:text-green-400"
                >
                  Top Rated
                </Badge>
              </motion.div>
            )}
          </div>
        </div>

        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-xl mb-2">{name}</CardTitle>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          <p className="text-muted-foreground text-sm mb-4">{description}</p>
          <div className="flex items-center gap-6 text-sm">
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
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <Button asChild className="w-full group" size="lg">
            <Link href={`/dashboard/course/${slug}`}>
              <span className="relative">
                Explore Course
                <motion.span
                  className="absolute -right-6 top-1/2 -translate-y-1/2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Zap className="w-4 h-4" />
                </motion.span>
              </span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
