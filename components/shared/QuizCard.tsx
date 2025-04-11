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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const cardVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  hover: {
    scale: 1.03,
    y: -5,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
}

const iconVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.15,
    rotate: [0, -10, 10, 0],
    transition: { duration: 0.6 },
  },
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

const quizTypeConfig = {
  mcq: {
    gradient: "from-emerald-600/80 to-emerald-500/60",
    icon: "bg-emerald-500",
    text: "text-emerald-500",
  },
  openended: {
    gradient: "from-blue-600/80 to-blue-500/60",
    icon: "bg-blue-500",
    text: "text-blue-500",
  },
  "fill-blanks": {
    gradient: "from-amber-600/80 to-amber-500/60",
    icon: "bg-amber-500",
    text: "text-amber-500",
  },
  code: {
    gradient: "from-violet-600/80 to-violet-500/60",
    icon: "bg-violet-500",
    text: "text-violet-500",
  },
  flashcard: {
    gradient: "from-pink-600/80 to-pink-500/60",
    icon: "bg-pink-500",
    text: "text-pink-500",
  },
}

const difficultyConfig = {
  easy: { stars: 1, color: "text-emerald-500" },
  medium: { stars: 2, color: "text-amber-500" },
  hard: { stars: 3, color: "text-red-500" },
}

export const QuizCard: React.FC<QuizCardProps> = ({
  title,
  questionCount,
  slug,
  quizType,
  estimatedTime = "5 min",
  description,
  completionRate,
  bestScore,
  difficulty = "medium",
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
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full flex"
    >
      <Link
        href={`/dashboard/${quizType === "fill-blanks" ? "blanks" : quizType}/${slug}`}
        className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl h-full"
      >
        <Card className="relative h-full flex flex-col overflow-hidden group border-0 bg-gradient-to-br via-card/50 to-card/70 shadow-lg hover:shadow-xl transition-shadow">
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity",
              config.gradient,
              isHovered && "opacity-30"
            )}
          />

          <CardHeader className="relative z-10 pb-3">
            <div className="flex items-center justify-between mb-4">
              <motion.div
                variants={iconVariants}
                className={cn(
                  "p-3 rounded-xl shadow-sm backdrop-blur-sm",
                  config.icon,
                  "bg-opacity-90 text-white"
                )}
              >
                <QuizTypeIcon className="w-6 h-6" />
              </motion.div>
              <div className="flex items-center gap-2">
                {bestScore !== undefined && (
                  <div className="flex items-center gap-1.5 bg-background/80 px-3 py-1 rounded-full shadow-sm">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold">{bestScore}%</span>
                  </div>
                )}
                <div className="h-8 w-8 rounded-full bg-background/80 flex items-center justify-center shadow-sm">
                  <span className={`text-sm font-bold ${config.text}`}>
                    {completionRate}%
                  </span>
                </div>
              </div>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight mb-2">
              {title}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-muted-foreground/90">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 flex-grow">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HelpCircle className="w-4 h-4" />
                  <span className="font-medium">{questionCount} Questions</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Difficulty:</span>
                  <div className="flex">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < difficultyConfig[difficulty].stars
                            ? `${difficultyConfig[difficulty].color} fill-current`
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-500", config.icon)}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="relative z-10 pt-0">
            <motion.div
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all",
                "bg-background/80 hover:bg-background",
                "text-primary hover:text-primary/90",
                "border-border/50 hover:border-primary/30"
              )}
              whileTap={{ scale: 0.98 }}
            >
              <span className="font-semibold">Start Quiz</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}
