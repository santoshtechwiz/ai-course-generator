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
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  Heart,
  MoreVertical,
  Users,
  Brain,
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
    icon: Target,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
    category: "Knowledge Test",
  },
  openended: {
    label: "Open Ended",
    icon: Brain,
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20",
    textColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-200 dark:border-violet-800",
    category: "Critical Thinking",
  },
  code: {
    label: "Code Challenge",
    icon: Code,
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
    textColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
    category: "Programming",
  },
  blanks: {
    label: "Fill in the Blanks",
    icon: PenTool,
    gradient: "from-cyan-500 to-teal-500",
    bgGradient: "bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20",
    textColor: "text-cyan-600 dark:text-cyan-400",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    category: "Completion",
  },
  flashcard: {
    label: "Flash Cards",
    icon: Flashlight,
    gradient: "from-orange-500 to-red-500",
    bgGradient: "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20",
    textColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800",
    category: "Memory",
  },
} as const

const difficultyConfig = {
  Easy: {
    variant: "secondary" as const,
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    icon: "🟢",
  },
  Medium: {
    variant: "secondary" as const,
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    icon: "🟡",
  },
  Hard: {
    variant: "secondary" as const,
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
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
        className: "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700",
      }
    } else if (completionRate > 0) {
      return {
        text: "Continue Quiz",
        icon: Play,
        variant: "default" as const,
        className: "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700",
      }
    } else {
      return {
        text: "Start Quiz",
        icon: Zap,
        variant: "default" as const,
        className: "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
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
    if (completionRate >= 90)
      return {
        label: "Excellent",
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-100 dark:bg-emerald-950/30",
      }
    if (completionRate >= 70)
      return {
        label: "Good",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-950/30",
      }
    if (completionRate >= 50)
      return {
        label: "Average",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-100 dark:bg-amber-950/30",
      }
    if (completionRate > 0)
      return {
        label: "In Progress",
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-100 dark:bg-purple-950/30",
      }
    return {
      label: "Not Started",
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
    }
  }

  const performance = getPerformanceLevel()

  return (
    <TooltipProvider>
      <AsyncNavLink href={`/dashboard/${quizType}/${slug}`} className="h-full group block focus:outline-none" tabIndex={0} aria-label={`Open quiz: ${title}`}
        style={{ textDecoration: "none" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="h-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Card
            className={cn(
              "h-full overflow-hidden flex flex-col relative shadow-lg hover:shadow-xl transition-all duration-300 border-0",
              config.bgGradient,
              "backdrop-blur-sm",
            )}
          >
          {/* Enhanced Header Section */}
          <CardHeader className="pb-4 relative">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <config.icon className="w-full h-full" />
            </div>

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <motion.div
                  className={cn("p-3 rounded-xl bg-gradient-to-r text-white shadow-lg", config.gradient)}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <config.icon className="h-6 w-6" />
                </motion.div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-xs font-medium border-2", difficultyStyle.className)}>
                      <span className="mr-1">{difficultyStyle.icon}</span>
                      {difficulty}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {config.category}
                    </Badge>
                  </div>
                  <p className={cn("text-sm font-semibold", config.textColor)}>{config.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Status Badges */}
                <AnimatePresence>
                  {isTrending && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs border-0">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Hot
                      </Badge>
                    </motion.div>
                  )}
                  {isPopular && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs border-0">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    </motion.div>
                  )}
                  {isPremium && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs border-0">
                        <Award className="w-3 h-3 mr-1" />
                        Pro
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-70 hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleFavorite}>
                      <Heart className={cn("mr-2 h-4 w-4", isFavorited && "fill-current text-red-500")} />
                      {isFavorited ? "Remove from favorites" : "Add to favorites"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 space-y-4 px-6">
            {/* Title and Rating */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors flex-1">
                  {title}
                </h3>
                <div
                  className={cn("px-2 py-1 rounded-full text-xs font-medium", performance.bgColor, performance.color)}
                >
                  {performance.label}
                </div>
              </div>

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
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className="flex items-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-black/30 transition-all cursor-help border border-white/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-xs font-bold text-foreground">{estimatedTime}</div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Estimated completion time</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className="flex items-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-black/30 transition-all cursor-help border border-white/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-foreground">{questionCount}</div>
                      <div className="text-xs text-muted-foreground">Questions</div>
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{questionCount} questions total</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className="flex items-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-black/30 transition-all cursor-help border border-white/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Target className="w-4 h-4 text-violet-600" />
                    <div>
                      <div className="text-xs font-bold text-foreground">{Math.round(completionRate)}%</div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your completion progress</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Enhanced Progress Bar */}
            {completionRate > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Your Progress</span>
                  <span className="text-xs font-bold text-primary">{Math.round(completionRate)}%</span>
                </div>
                <div className="relative">
                  <Progress value={completionRate} className="h-2" />
                  <motion.div
                    className={cn("absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r", config.gradient)}
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-6 pt-0">
            <Button className={cn("w-full group/btn relative overflow-hidden", buttonContent.className)} size="lg" tabIndex={-1}>
              <ButtonIcon className="w-4 h-4 mr-2" />
              {buttonContent.text}
              <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />

              {/* Button shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                  repeatDelay: 3,
                }}
              />
            </Button>
          </CardFooter>

          {/* Enhanced Hover Effect */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none rounded-lg"
              />
            )}
          </AnimatePresence>

          {/* Subtle Border Animation */}
          <motion.div
            className={cn("absolute inset-0 rounded-lg border-2", isHovered ? config.borderColor : "border-transparent")}
            animate={isHovered ? { boxShadow: "0 0 0 4px rgba(0,0,0,0.08)" } : { boxShadow: "0 0 0 0px rgba(0,0,0,0)" }}
            transition={{ duration: 0.5 }}
          />
          </Card>
        </motion.div>
      </AsyncNavLink>
    </TooltipProvider>
  )
}

export const QuizCard = memo(QuizCardComponent)
