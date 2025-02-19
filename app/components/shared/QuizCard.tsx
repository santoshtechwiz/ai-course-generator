"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, CheckCircle2, PenLine, Puzzle, Code, ChevronRight, HelpCircle, Star, Trophy } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
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
  difficulty: "easy" | "medium" | "hard"
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

const quizTypeColors = {
  mcq: "from-green-500 to-green-600",
  openended: "from-blue-500 to-blue-600",
  "fill-blanks": "from-yellow-500 to-yellow-600",
  code: "from-purple-500 to-purple-600",
}

const badgeColors = {
  mcq: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  openended: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  "fill-blanks": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  code: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
}

const difficultyColors = {
  easy: "text-green-500",
  medium: "text-yellow-500",
  hard: "text-red-500",
}

const difficultyStars = {
  easy: 1,
  medium: 2,
  hard: 3,
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
  difficulty,
  bestScore,
}) => {
  const QuizTypeIcon = quizTypeIcons[quizType]
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="h-full"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link href={`/dashboard/${quizType === "fill-blanks" ? "blanks" : quizType}/${slug}`} className="block h-full">
        <Card className="relative flex flex-col h-full overflow-visible group">
          <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", quizTypeColors[quizType])} />
          <CardHeader className="relative pb-2 pt-8">
            <motion.div
              className={cn(
                "absolute -top-4 left-4 p-2 rounded-full shadow-lg bg-gradient-to-br",
                quizTypeColors[quizType],
              )}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <QuizTypeIcon className="w-5 h-5 text-white" />
            </motion.div>
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{title}</h3>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 group-hover:line-clamp-none transition-all">
              {description}
            </p>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>{estimatedTime}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>{questionCount} questions</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">Difficulty:</span>
                {Array.from({ length: difficultyStars[difficulty] }).map((_, i) => (
                  <Star key={i} className={cn("w-4 h-4 fill-current", difficultyColors[difficulty])} />
                ))}
              </div>
              {bestScore !== undefined && (
                <div className="flex items-center text-sm">
                  <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
                  <span>Best: {bestScore}%</span>
                </div>
              )}
            </div>
            <Progress value={completionRate} className="h-2 mb-2" />
            <div className="text-right text-xs text-muted-foreground">{completionRate}% complete</div>
          </CardContent>
          <CardFooter className="flex justify-between items-center pt-2">
            <Badge
              variant="secondary"
              className={cn("px-2 py-1 text-xs font-medium rounded-full", badgeColors[quizType])}
            >
              {quizTypeLabels[quizType]}
            </Badge>
            <motion.div className="text-primary font-semibold flex items-center text-sm" whileHover={{ x: 5 }}>
              Start Quiz <ChevronRight className="w-4 h-4 ml-1" />
            </motion.div>
          </CardFooter>
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center p-4"
              >
                <p className="text-white text-center text-sm">
                  Challenge yourself and improve your skills in {quizTypeLabels[quizType].toLowerCase()}!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </Link>
    </motion.div>
  )
}

