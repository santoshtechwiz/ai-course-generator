"use client"

import type React from "react"
import { useState, memo } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Code,
  PenTool,
  Flashlight,
  Play,
  Clock,
  Star,
  Trophy,
  Zap,
  Target,
  BookOpen,
  ChevronRight,
  Heart,
  Users,
  Brain,
} from "lucide-react"
import { motion } from "framer-motion"
import { AsyncNavLink } from "@/components/loaders/AsyncNavLink"
import { cn } from "@/lib/utils"
import type { QuizType } from "@/app/types/quiz-types"

interface QuizCardProps {
  title: string
  description: string
  questionCount: number
  isPublic?: boolean
  slug: string
  quizType: QuizType
  estimatedTime: string
  completionRate?: number
  difficulty?: "Easy" | "Medium" | "Hard"
  rating?: number
  enrolledCount?: number
  isPopular?: boolean
  isTrending?: boolean
  isPremium?: boolean
}

const quizTypeConfig = {
  mcq: {
    label: "Multiple Choice",
    icon: Target,
    gradient: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  openended: {
    label: "Open Ended",
    icon: Brain,
    gradient: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-50 dark:bg-violet-950/20",
    textColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
  code: {
    label: "Code Challenge",
    icon: Code,
    gradient: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    textColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
  },
  blanks: {
    label: "Fill Blanks",
    icon: PenTool,
    gradient: "from-cyan-500 to-teal-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    textColor: "text-cyan-600 dark:text-cyan-400",
    borderColor: "border-cyan-200 dark:border-cyan-800",
  },
  flashcard: {
    label: "Flash Cards",
    icon: Flashlight,
    gradient: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    textColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
} as const

const difficultyConfig = {
  Easy: { color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/30" },
  Medium: { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30" },
  Hard: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-950/30" },
} as const

function QuizCardComponent({
  title,
  description,
  questionCount,
  slug,
  quizType,
  estimatedTime,
  completionRate = 0,
  difficulty = "Medium",
  rating = 4.5,
  enrolledCount = 1250,
  isPopular = false,
  isTrending = false,
}: QuizCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)

  const config = quizTypeConfig[quizType] || quizTypeConfig.mcq
  const difficultyStyle = difficultyConfig[difficulty]

  const getButtonContent = () => {
    if (completionRate >= 100) {
      return { text: "Review Quiz", icon: Trophy, className: "bg-emerald-600 hover:bg-emerald-700" }
    } else if (completionRate > 0) {
      return { text: "Continue Quiz", icon: Play, className: "bg-blue-600 hover:bg-blue-700" }
    } else {
      return { text: "Start Quiz", icon: Zap, className: "bg-primary hover:bg-primary/90" }
    }
  }

  const buttonContent = getButtonContent()
  const ButtonIcon = buttonContent.icon

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorited(!isFavorited)
  }

  return (
    <AsyncNavLink
      href={`/dashboard/${quizType}/${slug}`}
      className="h-full group block focus:outline-none"
      tabIndex={0}
      aria-label={`Open quiz: ${title}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card
          className={cn(
            "h-full overflow-hidden flex flex-col relative transition-all duration-300 border-0 shadow-md hover:shadow-xl",
            config.bgColor,
            "backdrop-blur-sm",
          )}
        >
          {/* Header */}
          <CardHeader className="pb-4 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className={cn("p-2.5 rounded-xl bg-gradient-to-r text-white shadow-sm", config.gradient)}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <config.icon className="h-5 w-5" />
                </motion.div>
                <div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-medium", difficultyStyle.bg, difficultyStyle.color)}
                  >
                    {difficulty}
                  </Badge>
                  <p className={cn("text-sm font-medium mt-1", config.textColor)}>{config.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(isTrending || isPopular) && (
                  <Badge
                    className={cn(
                      "text-xs border-0",
                      isTrending
                        ? "bg-gradient-to-r from-orange-500 to-red-500"
                        : "bg-gradient-to-r from-purple-500 to-pink-500",
                    )}
                  >
                    {isTrending ? "Hot" : "Popular"}
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                  onClick={handleFavorite}
                >
                  <Heart className={cn("h-4 w-4", isFavorited && "fill-current text-red-500")} />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 space-y-4 px-6">
            {/* Title and Rating */}
            <div className="space-y-2">
              <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </h3>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold">{rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span className="text-xs">({enrolledCount.toLocaleString()})</span>
                  </div>
                </div>

                {completionRate > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(completionRate)}% Complete
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{estimatedTime}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>{questionCount} questions</span>
              </div>
            </div>

            {/* Progress Bar */}
            {completionRate > 0 && (
              <div className="space-y-2">
                <Progress value={completionRate} className="h-2" />
              </div>
            )}
          </CardContent>

          <CardFooter className="p-6 pt-0">
            <Button className={cn("w-full group/btn", buttonContent.className)} size="lg" tabIndex={-1}>
              <ButtonIcon className="w-4 h-4 mr-2" />
              {buttonContent.text}
              <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </CardFooter>

          {/* Hover Border Effect */}
          <motion.div
            className={cn(
              "absolute inset-0 rounded-lg border-2",
              isHovered ? config.borderColor : "border-transparent",
            )}
            animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </Card>
      </motion.div>
    </AsyncNavLink>
  )
}

export const QuizCard = memo(QuizCardComponent)
