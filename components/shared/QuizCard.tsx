"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  CheckCircle2,
  Clock,
  Code,
  HelpCircle,
  ChevronRight,
  PenLine,
  Puzzle,
  Star,
  Trophy,
  BookOpen,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// Animation variants for consistent animations
const cardVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  hover: { 
    scale: 1.01,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
}

const iconVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.1, 
    transition: { type: "spring", stiffness: 400, damping: 15 }
  }
}

interface QuizCardProps {
  title: string
  questionCount: number
  slug: string
  quizType: "mcq" | "openended" | "fill-blanks" | "code" | "flashcard"
  estimatedTime?: string
  description: string
  isPublic?: boolean
  completionRate: number
  bestScore?: number
  difficulty?: "easy" | "medium" | "hard"
}

const quizTypeIcons = {
  mcq: CheckCircle2,
  openended: PenLine,
  "fill-blanks": Puzzle,
  code: Code,
  flashcard: BookOpen,
}

const quizTypeLabels = {
  mcq: "Multiple Choice",
  openended: "Open-Ended",
  "fill-blanks": "Fill in the Blanks",
  code: "Code Challenge",
  flashcard: "Flashcards",
}

const quizTypeConfig = {
  mcq: {
    gradient: "from-emerald-500/5 to-emerald-500/20 dark:from-emerald-500/10 dark:to-emerald-500/30",
    icon: "bg-emerald-500/90 dark:bg-emerald-600",
    badge:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  openended: {
    gradient: "from-blue-500/5 to-blue-500/20 dark:from-blue-500/10 dark:to-blue-500/30",
    icon: "bg-blue-500/90 dark:bg-blue-600",
    badge:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300",
  },
  "fill-blanks": {
    gradient: "from-amber-500/5 to-amber-500/20 dark:from-amber-500/10 dark:to-amber-500/30",
    icon: "bg-amber-500/90 dark:bg-amber-600",
    badge:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300",
  },
  code: {
    gradient: "from-violet-500/5 to-violet-500/20 dark:from-violet-500/10 dark:to-violet-500/30",
    icon: "bg-violet-500/90 dark:bg-violet-600",
    badge:
      "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/20 dark:text-violet-300",
  },
  flashcard: {
    gradient: "from-pink-500/5 to-pink-500/20 dark:from-pink-500/10 dark:to-pink-500/30",
    icon: "bg-pink-500/90 dark:bg-pink-600",
    badge:
      "border-pink-500/20 bg-pink-500/10 text-pink-700 dark:border-pink-500/30 dark:bg-pink-500/20 dark:text-pink-300",
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
  difficulty = quizType === "mcq" ? "easy" : quizType === "fill-blanks" ? "medium" : "hard",
}) => {
  const QuizTypeIcon = quizTypeIcons[quizType]
  const config = quizTypeConfig[quizType]
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="h-full flex"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link
        href={`/dashboard/${quizType === "fill-blanks" ? "blanks" : quizType}/${slug}`}
        className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      >
        <Card className="relative flex flex-col h-full overflow-hidden group border transition-all hover:border-primary/50 hover:shadow-md">
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-100 transition-opacity duration-300",
              config.gradient,
            )}
          />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <motion.div 
                  className={cn("p-2 rounded-md", config.icon)}
                  variants={iconVariants}
                >
                  <QuizTypeIcon className="w-4 h-4 text-white" />
                </motion.div>
                <Badge variant="outline" className={cn(config.badge)}>
                  {quizTypeLabels[quizType]}
                </Badge>
              </div>
              {bestScore !== undefined && (
                <div className="flex items-center gap-1 bg-background/80 px-2 py-1 rounded-full">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium">{bestScore}%</span>
                </div>
              )}
            </div>
            <CardTitle className="mt-3 text-xl group-hover:text-primary transition-colors">{title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">{description}</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 flex-grow space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{estimatedTime}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{questionCount} questions</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Difficulty:</span>
                  <div className="flex">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-3.5 h-3.5",
                          i < difficultyConfig[difficulty].stars
                            ? `${difficultyConfig[difficulty].color} fill-current`
                            : "text-muted-foreground/30",
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{completionRate}% complete</div>
              </div>
              <Progress
                value={completionRate}
                className={cn(
                  "h-1.5 bg-muted/50 overflow-hidden relative",
                  isHovered && "progress-pulse"
                )}
                indicatorClassName={cn(
                  completionRate === 100 ? "bg-emerald-500" : completionRate > 50 ? "bg-amber-500" : "bg-primary",
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="relative z-10 pt-0">
            <motion.div 
              className="flex items-center gap-1 text-primary font-medium ml-auto text-sm group-hover:text-primary/80 transition-colors"
              animate={{ 
                x: isHovered ? 3 : 0 
              }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Start Quiz
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </motion.div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}
