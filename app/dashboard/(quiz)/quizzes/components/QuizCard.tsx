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
  Users,
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
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
  const [isButtonHovered, setIsButtonHovered] = useState(false)

  // Enhanced quiz type information with gradients and modern styling
  const quizTypeInfo = {
    mcq: {
      label: "Multiple Choice",
      shortLabel: "MCQ",
      icon: FileQuestion,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
      accent: "text-blue-600 dark:text-blue-400",
      ring: "ring-blue-500/20",
      shadow: "shadow-blue-500/25",
      category: "Knowledge Test",
    },
    openended: {
      label: "Open Ended",
      shortLabel: "Essay",
      icon: AlignJustify,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20",
      accent: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-500/20",
      shadow: "shadow-emerald-500/25",
      category: "Critical Thinking",
    },
    code: {
      label: "Code Challenge",
      shortLabel: "Code",
      icon: Code,
      gradient: "from-purple-500 to-violet-500",
      bgGradient: "from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20",
      accent: "text-purple-600 dark:text-purple-400",
      ring: "ring-purple-500/20",
      shadow: "shadow-purple-500/25",
      category: "Programming",
    },
    blanks: {
      label: "Fill in the Blanks",
      shortLabel: "Blanks",
      icon: PenTool,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
      accent: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500/20",
      shadow: "shadow-amber-500/25",
      category: "Completion",
    },
    flashcard: {
      label: "Flash Cards",
      shortLabel: "Cards",
      icon: Flashlight,
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20",
      accent: "text-pink-600 dark:text-pink-400",
      ring: "ring-pink-500/20",
      shadow: "shadow-pink-500/25",
      category: "Memory",
    },
  }

  const difficultyConfig = {
    Easy: {
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
      icon: "🟢",
    },
    Medium: {
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
      icon: "🟡",
    },
    Hard: {
      color: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
      icon: "🔴",
    },
  }

  const {
    label,
    shortLabel,
    icon: Icon,
    gradient,
    bgGradient,
    accent,
    ring,
    shadow,
    category,
  } = quizTypeInfo[quizType] || quizTypeInfo.mcq
  const difficultyStyle = difficultyConfig[difficulty]

  // Determine button content and styling based on completion
  const getButtonContent = () => {
    if (completionRate >= 100) {
      return {
        text: "Review & Improve",
        icon: Trophy,
        gradient: "from-emerald-500 to-green-600",
        pulse: false,
      }
    } else if (completionRate > 0) {
      return {
        text: "Continue Learning",
        icon: Play,
        gradient: "from-blue-500 to-cyan-600",
        pulse: true,
      }
    } else {
      return {
        text: "Start Your Journey",
        icon: Zap,
        gradient: gradient,
        pulse: true,
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

  // Performance level based on completion rate
  const getPerformanceLevel = () => {
    if (completionRate >= 90) return { label: "Excellent", color: "text-emerald-600", emoji: "🏆" }
    if (completionRate >= 70) return { label: "Good", color: "text-blue-600", emoji: "⭐" }
    if (completionRate >= 50) return { label: "Average", color: "text-amber-600", emoji: "📈" }
    if (completionRate > 0) return { label: "In Progress", color: "text-purple-600", emoji: "🚀" }
    return { label: "Not Started", color: "text-gray-500", emoji: "🎯" }
  }

  const performance = getPerformanceLevel()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{
        duration: 0.4,
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className="h-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          "h-full overflow-hidden flex flex-col relative",
          "border-0 shadow-lg hover:shadow-2xl transition-all duration-500",
          "bg-gradient-to-br from-card via-card to-card/95",
          "backdrop-blur-sm",
          isHovered && `${shadow} ${ring} ring-2`,
          "hover:border-primary/20",
        )}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className={cn("absolute inset-0 bg-gradient-to-br", bgGradient)} />
        </div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
          <div className="flex flex-wrap gap-1.5">
            {isTrending && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg"
              >
                <TrendingUp className="w-3 h-3" />
                Trending
              </motion.div>
            )}
            {isPopular && (
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg"
              >
                <Sparkles className="w-3 h-3" />
                Popular
              </motion.div>
            )}
            {isPremium && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg"
              >
                <Award className="w-3 h-3" />
                Premium
              </motion.div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFavorite}
            className={cn(
              "p-2 rounded-full backdrop-blur-sm transition-all duration-300",
              isFavorited
                ? "bg-red-500/20 text-red-500"
                : "bg-white/20 text-gray-400 hover:text-red-500 hover:bg-red-500/20",
            )}
          >
            <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
          </motion.button>
        </div>

        <CardContent className="p-6 flex-grow space-y-5 relative z-10 pt-16">
          {/* Quiz Type Icon and Category */}
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn("p-3 rounded-xl bg-gradient-to-r shadow-lg", gradient, "text-white")}
            >
              <Icon className="w-6 h-6" />
            </motion.div>

            <div className="text-right">
              <Badge variant="outline" className={cn("text-xs font-medium", difficultyStyle.color)}>
                {difficultyStyle.icon} {difficulty}
              </Badge>
            </div>
          </div>

          {/* Title and Category */}
          <div className="space-y-2">
            <h3 className="font-bold text-xl text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <div className="flex items-center justify-between">
              <span className={cn("text-sm font-semibold", accent)}>{category}</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">{rating}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{description}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{estimatedTime}</span>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{enrolledCount.toLocaleString()}</span>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{questionCount} Questions</span>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Interactive</span>
            </motion.div>
          </div>

          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium">Progress</span>
                <span className="text-xs">{performance.emoji}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-bold", performance.color)}>{performance.label}</span>
                <span className={cn("text-sm font-bold", accent)}>{Math.round(completionRate)}%</span>
              </div>
            </div>

            <div className="relative">
              <Progress value={completionRate} className="h-2 bg-muted/50" />
              <motion.div
                className={cn("absolute inset-0 h-2 rounded-full bg-gradient-to-r opacity-20", gradient)}
                animate={{
                  x: isHovered ? [0, 100, 0] : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-6 pb-6 pt-0 relative z-10">
          <AsyncNavLink href={`/dashboard/${quizType}/${slug}`} className="w-full">
            <Button
              className={cn(
                "w-full h-12 font-bold text-white relative overflow-hidden group/btn",
                "bg-gradient-to-r shadow-lg hover:shadow-xl transition-all duration-300",
                `${buttonContent.gradient}`,
                "hover:scale-[1.02] active:scale-[0.98]",
              )}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: isHovered ? ["-100%", "100%"] : "-100%",
                }}
                transition={{
                  duration: 1.5,
                  repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
                  repeatDelay: 0.5,
                }}
              />

              <div className="flex items-center justify-center gap-2 relative z-10">
                <motion.div
                  animate={
                    buttonContent.pulse
                      ? {
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  <ButtonIcon className="w-5 h-5" />
                </motion.div>
                <span>{buttonContent.text}</span>
                <motion.div
                  animate={{ x: isHovered ? [0, 4, 0] : 0 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </div>
            </Button>
          </AsyncNavLink>
        </CardFooter>

        {/* Hover Glow Effect */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn("absolute -inset-1 bg-gradient-to-r rounded-lg blur-xl opacity-30", gradient)}
              style={{ zIndex: -1 }}
            />
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

export const QuizCard = memo(QuizCardComponent)
