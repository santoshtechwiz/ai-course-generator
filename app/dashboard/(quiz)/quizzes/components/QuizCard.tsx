"use client"

import type React from "react"
import { useState, memo } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  FileQuestion,
  AlignJustify,
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
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  Heart,
  MoreVertical,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AsyncNavLink } from "@/components/loaders/AsyncNavLink"
import { cn } from "@/lib/utils"
import type { QuizType } from "@/app/types/quiz-types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
    icon: FileQuestion,
    gradient: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    textColor: "text-blue-600 dark:text-blue-400",
    category: "Knowledge Test",
  },
  openended: {
    label: "Open Ended",
    icon: AlignJustify,
    gradient: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
    category: "Critical Thinking",
  },
  code: {
    label: "Code Challenge",
    icon: Code,
    gradient: "from-purple-500 to-violet-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    textColor: "text-purple-600 dark:text-purple-400",
    category: "Programming",
  },
  blanks: {
    label: "Fill in the Blanks",
    icon: PenTool,
    gradient: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    textColor: "text-amber-600 dark:text-amber-400",
    category: "Completion",
  },
  flashcard: {
    label: "Flash Cards",
    icon: Flashlight,
    gradient: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    textColor: "text-pink-600 dark:text-pink-400",
    category: "Memory",
  },
} as const

const difficultyConfig = {
  Easy: {
    variant: "secondary" as const,
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400",
    icon: "🟢",
  },
  Medium: {
    variant: "secondary" as const,
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400",
    icon: "🟡",
  },
  Hard: {
    variant: "secondary" as const,
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400",
    icon: "🔴",
  },
} as const

function QuizCardComponent({
  title,
  description,
  questionCount,
  isPublic = false,
  slug,
  quizType,
  estimatedTime,
  completionRate = 0,
  difficulty = "Medium",
  rating = 4.5,
  enrolledCount = 1250,
  isPopular = false,
  isTrending = false,
  isPremium = false,
}: QuizCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)

  const config = quizTypeConfig[quizType] || quizTypeConfig.mcq
  const difficultyStyle = difficultyConfig[difficulty]

  const getButtonContent = () => {
    if (completionRate >= 100) {
      return {
        text: "Review Quiz",
        icon: Trophy,
        variant: "default" as const,
      }
    } else if (completionRate > 0) {
      return {
        text: "Continue Quiz",
        icon: Play,
        variant: "default" as const,
      }
    } else {
      return {
        text: "Start Quiz",
        icon: Zap,
        variant: "default" as const,
      }
    }
  }

  const buttonContent = getButtonContent()
  const ButtonIcon = buttonContent.icon

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorited(!isFavorited)
  }

  const getPerformanceLevel = () => {
    if (completionRate >= 90) return { label: "Excellent", color: "text-emerald-600 dark:text-emerald-400" }
    if (completionRate >= 70) return { label: "Good", color: "text-blue-600 dark:text-blue-400" }
    if (completionRate >= 50) return { label: "Average", color: "text-amber-600 dark:text-amber-400" }
    if (completionRate > 0) return { label: "In Progress", color: "text-purple-600 dark:text-purple-400" }
    return { label: "Not Started", color: "text-muted-foreground" }
  }

  const performance = getPerformanceLevel()

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="h-full group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card className="h-full overflow-hidden flex flex-col relative border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-card">
          {/* Header Section */}
          <div className={cn("relative p-6 pb-4", config.bgColor)}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-lg bg-gradient-to-r text-white shadow-sm", config.gradient)}>
                  <config.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <Badge variant="outline" className={cn("text-xs font-medium", difficultyStyle.className)}>
                    {difficultyStyle.icon} {difficulty}
                  </Badge>
                  <p className={cn("text-xs font-medium", config.textColor)}>{config.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Status Badges */}
                {isTrending && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs border-0">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}
                {isPopular && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                )}
                {isPremium && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs border-0">
                    <Award className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}

                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleFavorite}>
                      <Heart className={cn("mr-2 h-4 w-4", isFavorited && "fill-current text-red-500")} />
                      {isFavorited ? "Remove from favorites" : "Add to favorites"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <CardContent className="flex-1 p-6 pt-2 space-y-4">
            {/* Title and Rating */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{rating}</span>
                  <span className="text-xs text-muted-foreground">({enrolledCount.toLocaleString()})</span>
                </div>
                <span className={cn("text-sm font-medium", performance.color)}>{performance.label}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium">{estimatedTime}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Estimated completion time</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium">{questionCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{questionCount} questions</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium">{Math.round(completionRate)}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Completion progress</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Progress Bar */}
            {completionRate > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs font-medium">{Math.round(completionRate)}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
            )}
          </CardContent>

          <CardFooter className="p-6 pt-0">
            <AsyncNavLink href={`/dashboard/${quizType}/${slug}`} className="w-full">
              <Button className="w-full group/btn" variant={buttonContent.variant}>
                <ButtonIcon className="w-4 h-4 mr-2" />
                {buttonContent.text}
                <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </AsyncNavLink>
          </CardFooter>

          {/* Hover Effect */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 pointer-events-none"
              />
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}

export const QuizCard = memo(QuizCardComponent)
