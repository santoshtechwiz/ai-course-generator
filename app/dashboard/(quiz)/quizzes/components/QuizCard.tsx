"use client"

import type React from "react"
import { useState, memo, useCallback, useMemo } from "react"
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
  TrendingUp,
  Sparkles,
  CheckCircle,
  RotateCcw,
  ArrowRight,
  Eye,
  BarChart3,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { QuizType } from "@/app/types/quiz-types"
import { CircularProgress } from "@/components/ui/circular-progress"

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
  compact?: boolean
}

const quizTypeConfig = {
  mcq: {
    label: "Multiple Choice",
    icon: Target,
    gradient: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50/80 dark:bg-blue-950/30",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-200/60 dark:border-blue-800/40",
    accentColor: "bg-blue-500",
    shadowColor: "shadow-blue-500/20",
  },
  openended: {
    label: "Open Ended",
    icon: Brain,
    gradient: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-50/80 dark:bg-violet-950/30",
    textColor: "text-violet-700 dark:text-violet-300",
    borderColor: "border-violet-200/60 dark:border-violet-800/40",
    accentColor: "bg-violet-500",
    shadowColor: "shadow-violet-500/20",
  },
  code: {
    label: "Code Challenge",
    icon: Code,
    gradient: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50/80 dark:bg-green-950/30",
    textColor: "text-green-700 dark:text-green-300",
    borderColor: "border-green-200/60 dark:border-green-800/40",
    accentColor: "bg-green-500",
    shadowColor: "shadow-green-500/20",
  },
  blanks: {
    label: "Fill Blanks",
    icon: PenTool,
    gradient: "from-cyan-500 to-teal-500",
    bgColor: "bg-cyan-50/80 dark:bg-cyan-950/30",
    textColor: "text-cyan-700 dark:text-cyan-300",
    borderColor: "border-cyan-200/60 dark:border-cyan-800/40",
    accentColor: "bg-cyan-500",
    shadowColor: "shadow-cyan-500/20",
  },
  flashcard: {
    label: "Flash Cards",
    icon: Flashlight,
    gradient: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-50/80 dark:bg-amber-950/30",
    textColor: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-200/60 dark:border-amber-800/40",
    accentColor: "bg-amber-500",
    shadowColor: "shadow-amber-500/20",
  },
} as const

const difficultyConfig = {
  Easy: { 
    color: "text-emerald-700 dark:text-emerald-300", 
    bg: "bg-emerald-100/80 dark:bg-emerald-950/50",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
    icon: CheckCircle,
  },
  Medium: { 
    color: "text-amber-700 dark:text-amber-300", 
    bg: "bg-amber-100/80 dark:bg-amber-950/50",
    border: "border-amber-200/60 dark:border-amber-800/40",
    icon: BarChart3,
  },
  Hard: { 
    color: "text-red-700 dark:text-red-300", 
    bg: "bg-red-100/80 dark:bg-red-950/50",
    border: "border-red-200/60 dark:border-red-800/40",
    icon: Trophy,
  },
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
  compact = false,
}: QuizCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const config = quizTypeConfig[quizType] || quizTypeConfig.mcq
  const difficultyStyle = difficultyConfig[difficulty]
  const DifficultyIcon = difficultyStyle.icon
  const QuizTypeIcon = config.icon

  // Memoize handlers to prevent unnecessary re-renders
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const handleCardInteraction = useCallback(() => {
    setHasInteracted(true)
  }, [])

  const getButtonContent = useMemo(() => {
    if (completionRate >= 100) {
      return { 
        text: "Review Quiz", 
        icon: RotateCcw, 
        className: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 border-0",
        variant: "default" as const,
      }
    } else if (completionRate > 0) {
      return { 
        text: "Continue Quiz", 
        icon: ArrowRight, 
        className: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 border-0",
        variant: "default" as const,
      }
    } else {
      return { 
        text: "Start Quiz", 
        icon: Zap, 
        className: "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 border-0",
        variant: "default" as const,
      }
    }
  }, [completionRate])

  const buttonContent = getButtonContent
  const ButtonIcon = buttonContent.icon

  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorited(!isFavorited)
    setHasInteracted(true)
  }, [isFavorited])

  return (
    <Link
      href={`/dashboard/${quizType}/${slug}`}
      className={cn("h-full group block focus:outline-none", compact && "@container")}
      tabIndex={0}
      aria-label={`Open quiz: ${title}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="h-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleCardInteraction}
        onClick={handleCardInteraction}
      >
        <Card
          className={cn(
            "h-full overflow-hidden flex flex-col relative transition-all duration-300 border-0",
            config.bgColor,
            "group-hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10",
            config.shadowColor,
            compact && "@sm:flex-row @sm:items-stretch",
            "backdrop-blur-sm bg-white/80 dark:bg-gray-900/80",
          )}
        >
          {/* Enhanced gradient border accent */}
          <div className={cn("absolute inset-0 pointer-events-none rounded-xl", "[mask-image:linear-gradient(black,transparent)]")}>
            <div className={cn("absolute inset-0 rounded-xl border-2 opacity-20 group-hover:opacity-40 transition-opacity duration-300", config.borderColor)} />
          </div>

          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-current to-transparent" />
          </div>

          {/* Header */}
          <CardHeader className={cn("pb-6 relative space-y-4", compact && "@sm:w-1/3 @sm:shrink-0")}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  className={cn("p-3.5 rounded-2xl bg-gradient-to-r text-white shadow-xl", config.gradient, config.shadowColor)}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <QuizTypeIcon className="h-6 w-6" />
                </motion.div>
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-semibold border-0 px-3 py-1.5", difficultyStyle.bg, difficultyStyle.color, difficultyStyle.border)}
                  >
                    <DifficultyIcon className="h-3 w-3 mr-1.5" />
                    {difficulty}
                  </Badge>
                  <p className={cn("text-sm font-semibold tracking-wide", config.textColor)}>{config.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(isTrending || isPopular) && (
                  <div className="flex gap-2">
                    {isTrending && (
                      <Badge variant="secondary" className="text-xs bg-orange-100/80 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40 px-2.5 py-1">
                        <TrendingUp className="h-3 w-3 mr-1.5" />
                        Trending
                      </Badge>
                    )}
                    {isPopular && (
                      <Badge variant="secondary" className="text-xs bg-rose-100/80 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 px-2.5 py-1">
                        <Sparkles className="h-3 w-3 mr-1.5" />
                        Popular
                      </Badge>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 w-9 p-0 transition-all duration-300 rounded-full",
                    "md:opacity-60 md:hover:opacity-100 hover:bg-primary/10 hover:text-primary hover:scale-110",
                    "opacity-0 md:opacity-60",
                    (hasInteracted || isHovered) && "opacity-100"
                  )}
                  onClick={handleFavorite}
                >
                  <Heart className={cn("h-4 w-4 transition-all duration-200", isFavorited && "fill-current text-red-500 scale-110")} />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className={cn("flex-1 space-y-5 px-7", compact && "@sm:px-5 @sm:py-7")}>
            {/* Title and Rating */}
            <div className="space-y-4">
              <h3 className="font-bold text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300 tracking-tight">
                {title}
              </h3>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-bold text-foreground">{rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">({enrolledCount.toLocaleString()} enrolled)</span>
                  </div>
                </div>

                {completionRate > 0 && (
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 font-semibold">
                    <Eye className="h-3 w-3 mr-1.5" />
                    {Math.round(completionRate)}% Done
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>

            {/* Enhanced Stats */}
            <div className="flex items-center justify-between text-sm bg-muted/40 rounded-xl p-4 border border-border/30">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="p-2 rounded-lg bg-accent/60 border border-border/20">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{estimatedTime}</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="p-2 rounded-lg bg-accent/60 border border-border/20">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{questionCount}</div>
                  <div className="text-xs text-muted-foreground">Questions</div>
                </div>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            {completionRate > 0 && (
              <div className="flex items-center justify-center">
                <CircularProgress
                  value={completionRate}
                  size={80}
                  strokeWidth={6}
                  label={`${Math.round(completionRate)}%`}
                  sublabel="Complete"
                  className="mb-2"
                />
              </div>
            )}
          </CardContent>

          <CardFooter className={cn("p-7 pt-0", compact && "@sm:p-5 @sm:pt-0 @sm:border-l @sm:border-white/10")}>
            <Button className={cn("w-full group/btn font-semibold", buttonContent.className)} size="lg" tabIndex={-1}>
              <buttonContent.icon className="w-5 h-5 mr-2 transition-transform group-hover/btn:scale-110" />
              {buttonContent.text}
              <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover/btn:translate-x-1 group-hover/btn:scale-110" />
            </Button>
          </CardFooter>

          {/* Enhanced Hover Border Effect */}
          <motion.div
            className={cn(
              "absolute inset-0 rounded-xl border-2 pointer-events-none",
              isHovered ? config.borderColor.replace('border-', 'border-') : "border-transparent",
            )}
            animate={isHovered ? { opacity: 0.6 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Subtle glow effect on hover */}
          <motion.div
            className={cn("absolute inset-0 rounded-xl pointer-events-none", config.shadowColor)}
            animate={isHovered ? { opacity: 0.3 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </Card>
      </motion.div>
  </Link>
  )
}

export const QuizCard = memo(QuizCardComponent, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description &&
    prevProps.questionCount === nextProps.questionCount &&
    prevProps.slug === nextProps.slug &&
    prevProps.quizType === nextProps.quizType &&
    prevProps.estimatedTime === nextProps.estimatedTime &&
    prevProps.completionRate === nextProps.completionRate &&
    prevProps.difficulty === nextProps.difficulty &&
    prevProps.rating === nextProps.rating &&
    prevProps.enrolledCount === nextProps.enrolledCount &&
    prevProps.isPopular === nextProps.isPopular &&
    prevProps.isTrending === nextProps.isTrending &&
    prevProps.compact === nextProps.compact
  )
})
