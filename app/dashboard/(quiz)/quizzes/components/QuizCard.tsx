"use client"

import type React from "react"
import { useState, memo, useCallback, useMemo, useEffect, useRef } from "react"
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
import { QUIZ_TYPE_CONFIG } from "./quizTypeConfig"
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

// Using centralized QUIZ_TYPE_CONFIG for consistency

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
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const normalizedType = (quizType || 'mcq').toLowerCase() as keyof typeof QUIZ_TYPE_CONFIG
  const config = QUIZ_TYPE_CONFIG[normalizedType] || QUIZ_TYPE_CONFIG.mcq
  const QuizTypeIcon = config.icon
  // Derive background & border utility classes from pill when needed
  const pillParts = config.pill.split(" ")
  const derivedBg = pillParts.find(p => p.startsWith('bg-')) || 'bg-muted'
  const derivedBorder = pillParts.find(p => p.startsWith('border-')) || 'border-border/50'

  const isTypeActive = useMemo(() => (selectedTypes && selectedTypes.includes(quizType)) || activeFilter === quizType, [selectedTypes, activeFilter, quizType])
  const loading = isNavigating || localLoading

  // Cleanup loading timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [])

  const handleQuizClick = useCallback(async () => {
    if (loading) return
    setLocalLoading(true)
    onNavigationChange?.(true)
    // Safety timeout to clear loading if navigation is interrupted
    loadingTimeoutRef.current = setTimeout(() => {
      setLocalLoading(false)
      onNavigationChange?.(false)
    }, 4000)
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
          "h-full overflow-hidden bg-card border-border/50 hover:border-primary/40 transition-all duration-200 card-hover relative",
          loading && "opacity-70 cursor-progress"
        )} aria-busy={loading} aria-live="polite">
          <div className="aspect-video bg-gradient-to-br from-muted/50 to-muted/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10" />
            
            {/* Loading overlay */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="relative">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/30"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </div>
                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Starting quiz…
                  </motion.span>
                </motion.div>
              </motion.div>
            )}
            
            <div className="absolute top-4 left-4">
              <div className={cn("p-2 rounded-lg border", derivedBg, derivedBorder)}>
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
                  derivedBg,
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
