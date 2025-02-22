"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, CheckCircle2, PenLine, Puzzle, Code, ChevronRight, HelpCircle, Star, Trophy } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface QuizCardProps {
  title: string
  questionCount: number
  slug: string
  quizType: "mcq" | "openended" | "fill-blanks" | "code"
  estimatedTime?: string
  description: string
  isPublic?: boolean
  completionRate: number
  bestScore?: number
}

const quizTypeIcons = {
  mcq: CheckCircle2,
  openended: PenLine,
  "fill-blanks": Puzzle,
  code: Code,
}

const quizTypeLabels = {
  mcq: "Multiple Choice",
  openended: "Open-Ended",
  "fill-blanks": "Fill in the Blanks",
  code: "Code Challenge",
}

const quizTypeConfig = {
  mcq: {
    gradient: "bg-gradient-to-br from-emerald-500/10 to-emerald-500/30 dark:from-emerald-500/20 dark:to-emerald-500/40",
    icon: "bg-emerald-500 dark:bg-emerald-600",
    badge:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300",
    difficulty: "easy",
  },
  openended: {
    gradient: "bg-gradient-to-br from-blue-500/10 to-blue-500/30 dark:from-blue-500/20 dark:to-blue-500/40",
    icon: "bg-blue-500 dark:bg-blue-600",
    badge:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300",
    difficulty: "hard",
  },
  "fill-blanks": {
    gradient: "bg-gradient-to-br from-amber-500/10 to-amber-500/30 dark:from-amber-500/20 dark:to-amber-500/40",
    icon: "bg-amber-500 dark:bg-amber-600",
    badge:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300",
    difficulty: "medium",
  },
  code: {
    gradient: "bg-gradient-to-br from-violet-500/10 to-violet-500/30 dark:from-violet-500/20 dark:to-violet-500/40",
    icon: "bg-violet-500 dark:bg-violet-600",
    badge:
      "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/20 dark:text-violet-300",
    difficulty: "hard",
  },
}

const difficultyConfig = {
  easy: {
    stars: 1,
    color: "text-emerald-500 dark:text-emerald-400",
  },
  medium: {
    stars: 2,
    color: "text-amber-500 dark:text-amber-400",
  },
  hard: {
    stars: 3,
    color: "text-red-500 dark:text-red-400",
  },
}

export const QuizCard: React.FC<QuizCardProps> = ({
  title,
  questionCount,
  slug,
  quizType,
  estimatedTime = "5 min",
  description,
  isPublic = false,
  completionRate,
  bestScore,
}) => {
  const QuizTypeIcon = quizTypeIcons[quizType]
  const config = quizTypeConfig[quizType]
  const difficulty = config.difficulty
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full pt-6"
    >
      <Link
        href={`/dashboard/${quizType === "fill-blanks" ? "blanks" : quizType}/${slug}`}
        className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      >
        <div className="relative">
          <motion.div
            className={cn("absolute -top-6 left-6 p-3 rounded-xl shadow-lg z-10", config.icon)}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <QuizTypeIcon className="w-5 h-5 text-white" />
          </motion.div>

          <Card className="relative flex flex-col h-full overflow-hidden group border-2 transition-colors hover:border-primary/50">
            <div className={cn("absolute inset-0 opacity-100 transition-opacity duration-300", config.gradient)} />

            <CardHeader className="relative space-y-3">
              <div className="pt-2">
                <Badge
                  variant="outline"
                  className={cn("px-2.5 py-0.5 text-xs font-medium rounded-lg transition-colors", config.badge)}
                >
                  {quizTypeLabels[quizType]}
                </Badge>
              </div>

              <h3 className="text-xl font-semibold leading-tight tracking-tight group-hover:text-primary transition-colors">
                {title}
              </h3>
            </CardHeader>

            <CardContent className="flex-grow space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2 group-hover:line-clamp-none transition-all">
                {description}
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HelpCircle className="w-4 h-4" />
                  <span>{questionCount} questions</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">Difficulty:</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: difficultyConfig[difficulty].stars }).map((_, i) => (
                        <Star key={i} className={cn("w-4 h-4 fill-current", difficultyConfig[difficulty].color)} />
                      ))}
                    </div>
                  </div>
                  {bestScore !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">{bestScore}%</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Progress value={completionRate} className="h-2 bg-primary/10" />
                  <div className="text-right text-xs text-muted-foreground">{completionRate}% complete</div>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <motion.div className="flex items-center gap-2 text-primary font-medium ml-auto" whileHover={{ x: 5 }}>
                Start Quiz
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
                    Challenge yourself with this {quizTypeLabels[quizType].toLowerCase()} quiz!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </Link>
    </motion.div>
  )
}

