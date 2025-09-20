"use client"

import type React from "react"
import { useState, memo, useCallback, useMemo } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Code,
  PenTool,
  Flashlight,
  Clock,
  Star,
  Trophy,
  Zap,
  Target,
  BookOpen,
  ChevronRight,
  Heart,
  Brain,
  TrendingUp,
  Sparkles,
  CheckCircle,
  RotateCcw,
  ArrowRight,
  Eye,
  BarChart3,
  MoreHorizontal,
  Trash2,
  Edit3,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { QuizType } from "@/app/types/quiz-types"
import { CircularProgress } from "@/components/ui/circular-progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
  userId?: string // Quiz owner ID
  currentUserId?: string // Current user ID
  onDelete?: (slug: string, quizType: QuizType) => void
  showActions?: boolean // Whether to show edit/delete actions
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
  userId,
  currentUserId,
  onDelete,
  showActions = false,
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
        className:
          "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 border-0",
        variant: "default" as const,
      }
    }
  }, [completionRate])

  const buttonContent = getButtonContent
  const ButtonIcon = buttonContent.icon

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsFavorited(!isFavorited)
      setHasInteracted(true)
    },
    [isFavorited],
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onDelete?.(slug, quizType)
    },
    [onDelete, slug, quizType],
  )

  // Check if current user is the owner
  const isOwner = userId && currentUserId && userId === currentUserId
  const canShowActions = showActions && isOwner

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
        whileHover={{ y: -8, scale: 1.03 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="h-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleCardInteraction}
        onClick={handleCardInteraction}
      >
        <Card
          className={cn(
            "h-full overflow-hidden flex flex-col relative transition-all duration-500 border-0",
            "group-hover:shadow-2xl hover:shadow-primary/20",
            compact && "@sm:flex-row @sm:items-stretch",
            "backdrop-blur-sm bg-card/90 ring-1 ring-border/30 hover:ring-primary/40",
            "rounded-2xl",
          )}
        >
          <div
            className={cn(
              "absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              "bg-gradient-to-r",
              config.gradient,
              "blur-sm",
            )}
          />

          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br from-transparent via-current to-transparent rounded-2xl",
                config.textColor,
              )}
            />
          </div>

          {/* Header */}
          <CardHeader className={cn("pb-6 relative space-y-4", compact && "@sm:w-1/3 @sm:shrink-0")}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  className={cn("p-4 rounded-2xl bg-gradient-to-br text-white shadow-xl", config.gradient)}
                  whileHover={{ scale: 1.15, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <QuizTypeIcon className="h-7 w-7" />
                </motion.div>
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-bold border-0 px-4 py-2 shadow-sm",
                      difficultyStyle.bg,
                      difficultyStyle.color,
                    )}
                  >
                    <DifficultyIcon className="h-3.5 w-3.5 mr-2" />
                    {difficulty}
                  </Badge>
                  <p className={cn("text-sm font-bold tracking-wide", config.textColor)}>{config.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(isTrending || isPopular) && (
                  <div className="flex gap-2">
                    {isTrending && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-orange-100/90 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200 border border-orange-200/70 dark:border-orange-800/50 px-3 py-1.5 font-semibold shadow-sm"
                      >
                        <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                        Trending
                      </Badge>
                    )}
                    {isPopular && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-rose-100/90 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-200/70 dark:border-rose-800/50 px-3 py-1.5 font-semibold shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Popular
                      </Badge>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-10 w-10 p-0 transition-all duration-300 rounded-full",
                    "md:opacity-60 md:hover:opacity-100 hover:bg-red-50 hover:text-red-600 hover:scale-110",
                    "opacity-0 md:opacity-60",
                    (hasInteracted || isHovered) && "opacity-100",
                  )}
                  onClick={handleFavorite}
                >
                  <Heart
                    className={cn(
                      "h-4.5 w-4.5 transition-all duration-200",
                      isFavorited && "fill-current text-red-500 scale-110",
                    )}
                  />
                </Button>

                {canShowActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-10 w-10 p-0 transition-all duration-300 rounded-full",
                          "md:opacity-60 md:hover:opacity-100 hover:bg-primary/10 hover:text-primary hover:scale-110",
                          "opacity-0 md:opacity-60",
                          (hasInteracted || isHovered) && "opacity-100",
                        )}
                      >
                        <MoreHorizontal className="h-4.5 w-4.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          // TODO: Add edit functionality
                        }}
                      >
                        <Edit3 className="mr-3 h-4 w-4" />
                        Edit Quiz
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-3 h-4 w-4" />
                        Delete Quiz
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className={cn("flex-1 space-y-6 px-8", compact && "@sm:px-6 @sm:py-8")}>
            {/* Title and Rating */}
            <div className="space-y-4">
              <h3 className="font-bold text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300 tracking-tight text-balance">
                {title}
              </h3>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4.5 h-4.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-bold text-foreground">{rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      ({enrolledCount.toLocaleString()} enrolled)
                    </span>
                  </div>
                </div>

                {completionRate > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-primary/15 text-primary border border-primary/30 px-3 py-1.5 font-bold shadow-sm"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    {Math.round(completionRate)}% Done
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed text-pretty">{description}</p>

            <div className="flex items-center justify-between text-sm bg-muted/50 rounded-2xl p-5 border border-border/40 shadow-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <Clock className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-base">{estimatedTime}</div>
                  <div className="text-xs text-muted-foreground font-medium">Duration</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
                  <BookOpen className="w-4.5 h-4.5 text-accent" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-base">{questionCount}</div>
                  <div className="text-xs text-muted-foreground font-medium">Questions</div>
                </div>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            {completionRate > 0 && (
              <div className="flex items-center justify-center">
                <CircularProgress
                  value={completionRate}
                  size={90}
                  strokeWidth={8}
                  label={`${Math.round(completionRate)}%`}
                  sublabel="Complete"
                  className="mb-2"
                />
              </div>
            )}
          </CardContent>

          <CardFooter className={cn("p-8 pt-0", compact && "@sm:p-6 @sm:pt-0 @sm:border-l @sm:border-border/20")}>
            <Button
              className={cn("w-full group/btn font-bold text-base py-6", buttonContent.className)}
              size="lg"
              tabIndex={-1}
            >
              <buttonContent.icon className="w-5 h-5 mr-3 transition-transform group-hover/btn:scale-125" />
              {buttonContent.text}
              <ChevronRight className="w-5 h-5 ml-3 transition-transform group-hover/btn:translate-x-2 group-hover/btn:scale-125" />
            </Button>
          </CardFooter>

          {/* Enhanced Hover Border Effect */}
          <motion.div
            className={cn(
              "absolute inset-0 rounded-2xl border-2 pointer-events-none",
              isHovered ? config.borderColor.replace("border-", "border-") : "border-transparent",
            )}
            animate={isHovered ? { opacity: 0.8 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Enhanced glow effect on hover */}
          <motion.div
            className={cn("absolute inset-0 rounded-2xl pointer-events-none", config.shadowColor)}
            animate={isHovered ? { opacity: 0.4 } : { opacity: 0 }}
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
