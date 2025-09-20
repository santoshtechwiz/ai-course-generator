"use client"

import type React from "react"
import { useState, memo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Code,
  PenTool,
  Flashlight,
  Clock,
  Star,
  Target,
  BookOpen,
  ChevronRight,
  Heart,
  Brain,
  RotateCcw,
  ArrowRight,
  Play,
  MoreHorizontal,
  Edit3,
  Trash2,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { QuizType } from "@/app/types/quiz-types"
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
  },
  Medium: {
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100/80 dark:bg-amber-950/50",
    border: "border-amber-200/60 dark:border-amber-800/40",
  },
  Hard: {
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-100/80 dark:bg-red-950/50",
    border: "border-red-200/60 dark:border-red-800/40",
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

  const config = quizTypeConfig[quizType] || quizTypeConfig.mcq
  const difficultyStyle = difficultyConfig[difficulty]
  const QuizTypeIcon = config.icon

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsFavorited(!isFavorited)
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

  const getButtonIcon = () => {
    if (completionRate >= 100) return RotateCcw
    if (completionRate > 0) return ArrowRight
    return Play
  }

  const getButtonText = () => {
    if (completionRate >= 100) return "Review"
    if (completionRate > 0) return "Continue"
    return "Start"
  }

  const isOwner = userId && currentUserId && userId === currentUserId
  const canShowActions = showActions && isOwner
  const ButtonIcon = getButtonIcon()

  return (
    <Link
      href={`/dashboard/${quizType}/${slug}`}
      className="h-full group block focus:outline-none"
      tabIndex={0}
      aria-label={`Open quiz: ${title}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="h-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Card
          className={cn(
            "h-full overflow-hidden relative transition-all duration-300 border-0",
            "group-hover:shadow-xl hover:shadow-primary/15",
            "backdrop-blur-sm bg-card/95 ring-1 ring-border/20 hover:ring-primary/30",
            "rounded-xl",
          )}
        >
          <div
            className={cn(
              "absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              "bg-gradient-to-r",
              config.gradient,
              "blur-sm -z-10",
            )}
          />

          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white shadow-md", config.gradient)}>
                  <QuizTypeIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors duration-200">
                    {title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={cn("text-xs px-2 py-0.5 border-0", difficultyStyle.bg, difficultyStyle.color)}
                    >
                      {difficulty}
                    </Badge>
                    <span className={cn("text-xs font-medium", config.textColor)}>{config.label}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {(isTrending || isPopular) && <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleFavorite}
                >
                  <Heart className={cn("h-3.5 w-3.5", isFavorited && "fill-current text-red-500")} />
                </Button>

                {canShowActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem>
                        <Edit3 className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>

            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">{estimatedTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="font-medium">{questionCount} questions</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{rating}</span>
              </div>
            </div>

            {completionRate > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-primary">{Math.round(completionRate)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={cn("h-1.5 rounded-full transition-all duration-500", config.accentColor)}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              className={cn(
                "w-full group/btn font-medium text-sm py-2 mt-4",
                completionRate >= 100
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : completionRate > 0
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground",
              )}
              size="sm"
              tabIndex={-1}
            >
              <ButtonIcon className="w-4 h-4 mr-2" />
              {getButtonText()}
              <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}

export const QuizCard = memo(QuizCardComponent)
