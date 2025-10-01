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
  Brain,
  ExternalLink,
  Loader2,
  Play,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { QuizType } from "@/app/types/quiz-types"
// ...existing code...

interface QuizCardProps {
  title: string
  description: string
  questionCount: number
  isPublic?: boolean
  onTypeClick?: (type: QuizType) => void
  selectedTypes?: QuizType[]
  activeFilter?: string
  slug: string
  quizType: QuizType
  estimatedTime: string
  completionRate?: number
  compact?: boolean
  userId?: string
  currentUserId?: string
  onDelete?: (slug: string, quizType: QuizType) => void
  showActions?: boolean
  isNavigating?: boolean
  onNavigationChange?: (loading: boolean) => void
}

const quizTypeConfig = {
  mcq: {
    label: "Multiple Choice",
    icon: Target,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  openended: {
    label: "Open Ended",
    icon: Brain,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  code: {
    label: "Code Challenge",
    icon: Code,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  blanks: {
    label: "Fill Blanks",
    icon: PenTool,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  flashcard: {
    label: "Flash Cards",
    icon: Flashlight,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
} as const

function QuizCardComponent({
  title,
  description,
  questionCount,
  isPublic = true,
  onTypeClick,
  selectedTypes = [],
  activeFilter,
  slug,
  quizType,
  estimatedTime,
  completionRate = 0,
  compact = false,
  userId,
  currentUserId,
  onDelete,
  showActions = false,
  isNavigating = false,
  onNavigationChange,
}: QuizCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)

  const config = quizTypeConfig[quizType as keyof typeof quizTypeConfig] || quizTypeConfig.mcq
  const QuizTypeIcon = config.icon

  const isTypeActive = (selectedTypes && selectedTypes.includes(quizType)) || activeFilter === quizType
  const loading = isNavigating || localLoading

  const handleQuizClick = useCallback(async () => {
    if (loading) return
    
    setLocalLoading(true)
    onNavigationChange?.(true)
    
    // Add a small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Navigation will be handled by Link component
    // Reset loading state after navigation
    setTimeout(() => {
      setLocalLoading(false)
      onNavigationChange?.(false)
    }, 1000)
  }, [loading, onNavigationChange])

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onDelete?.(slug, quizType)
    },
    [onDelete, slug, quizType],
  )

  const isOwner = userId && currentUserId && String(userId) === String(currentUserId)
  const canShowActions = showActions && isOwner

  return (
    <Link
      href={`/dashboard/${quizType}/${slug}`}
      className="h-full group block focus:outline-none focus-ring"
      tabIndex={0}
      aria-label={`Open quiz: ${title}`}
      onClick={handleQuizClick}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: loading ? 0 : -2 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="h-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Card className={cn(
          "h-full overflow-hidden bg-card border-border/50 hover:border-border transition-all duration-200 card-hover",
          loading && "opacity-70 cursor-not-allowed"
        )}>
          <div className="aspect-video bg-gradient-to-br from-muted/50 to-muted/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10" />
            
            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Starting Quiz...</span>
                </div>
              </div>
            )}
            
            <div className="absolute top-4 left-4">
              <div className={cn("p-2 rounded-lg", config.bg, config.border, "border")}>
                <QuizTypeIcon className={cn("h-5 w-5", config.color)} />
              </div>
            </div>
            {/* Centered contextual faded icon for quick visual scanning */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <QuizTypeIcon className={cn("w-20 h-20 opacity-10", config.color)} />
            </div>
            <div className="absolute bottom-4 left-4">
              {/* Quiz type badge uses the quizTypeConfig accent colors and is clickable to filter */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onTypeClick?.(quizType)
                }}
                aria-label={`Filter by ${config.label}`}
                className={cn(
                  "text-xs py-1 px-2 rounded-md backdrop-blur-sm cursor-pointer transition-shadow",
                  config.bg,
                  isTypeActive ? "ring-2 ring-offset-1 shadow-md" : "",
                )}
              >
                <Badge
                  variant="secondary"
                  className={cn("p-0", config.color, isTypeActive ? "font-semibold text-primary" : "")}
                >
                  {config.label}
                </Badge>
              </button>
            </div>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                Get started with {config.label.toLowerCase()} and test your knowledge.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{estimatedTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{questionCount} questions</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span>4.5</span>
              </div>
            </div>

            {completionRate > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{Math.round(completionRate)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {/* Visibility badge: green for public, gray for private */}
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs py-1 px-2 rounded-md",
                    isPublic ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700",
                  )}
                  aria-label={isPublic ? "Public quiz" : "Private quiz"}
                >
                  {isPublic ? "Public" : "Private"}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                tabIndex={-1}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}

export const QuizCard = memo(QuizCardComponent) as React.NamedExoticComponent<QuizCardProps>
