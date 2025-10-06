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
  Bookmark,
  Users,
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

// SVG Pattern Component for visual interest
const QuizPattern = ({ type }: { type: string }) => {
  const patterns: Record<string, JSX.Element> = {
    mcq: (
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="mcq-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="2" fill="currentColor" />
            <circle cx="5" cy="5" r="1" fill="currentColor" opacity="0.5" />
            <circle cx="35" cy="35" r="1" fill="currentColor" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mcq-pattern)" />
      </svg>
    ),
    code: (
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="code-pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M5,15 L10,10 L10,20 Z" fill="currentColor" opacity="0.3" />
            <path d="M25,15 L20,10 L20,20 Z" fill="currentColor" opacity="0.3" />
            <rect x="12" y="14" width="6" height="2" fill="currentColor" opacity="0.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#code-pattern)" />
      </svg>
    ),
    flashcard: (
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="flashcard-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect x="10" y="10" width="30" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            <rect x="12" y="12" width="26" height="16" rx="1" fill="currentColor" opacity="0.1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#flashcard-pattern)" />
      </svg>
    ),
    openended: (
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="openended-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M5,10 L35,10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <path d="M5,20 L35,20" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <path d="M5,30 L25,30" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#openended-pattern)" />
      </svg>
    ),
    blanks: (
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="blanks-pattern" x="0" y="0" width="60" height="30" patternUnits="userSpaceOnUse">
            <text x="5" y="20" fontSize="12" fill="currentColor" opacity="0.2">___</text>
            <text x="35" y="20" fontSize="12" fill="currentColor" opacity="0.2">___</text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blanks-pattern)" />
      </svg>
    ),
  }
  return patterns[type] || patterns.mcq
}

// Difficulty configuration
const getDifficulty = (questionCount: number) => {
  if (questionCount <= 5) return 'Beginner'
  if (questionCount <= 15) return 'Intermediate'
  return 'Advanced'
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
  const [isBookmarked, setIsBookmarked] = useState(false)
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
  const difficulty = getDifficulty(questionCount)
  const isPopular = questionCount >= 10
  const attemptCount = Math.floor(Math.random() * 500) + 100 // Mock data - replace with real data

  const handleBookmarkClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsBookmarked(!isBookmarked)
  }, [isBookmarked])

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
          "h-full overflow-hidden bg-card border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 relative",
          "group-hover:-translate-y-1",
          loading && "opacity-70 cursor-progress"
        )} aria-busy={loading} aria-live="polite">
          {/* Compact header with patterns and gradients */}
          <div className="h-32 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/10 relative overflow-hidden border-b border-border/30">
            {/* Subtle type-specific gradient overlay */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-[0.08]",
              normalizedType === 'mcq' && "from-blue-500/20 to-blue-600/10",
              normalizedType === 'code' && "from-purple-500/20 to-purple-600/10",
              normalizedType === 'flashcard' && "from-green-500/20 to-green-600/10",
              normalizedType === 'openended' && "from-orange-500/20 to-orange-600/10",
              normalizedType === 'blanks' && "from-teal-500/20 to-teal-600/10"
            )} />
            
            {/* SVG Pattern */}
            <QuizPattern type={normalizedType} />
            
            {/* Subtle shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
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
            
            {/* Top badges row - compact */}
            <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-10">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Quiz type icon badge with glow */}
                <motion.div 
                  className={cn("p-1.5 rounded-lg border backdrop-blur-sm shadow-md", derivedBg, derivedBorder)}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <QuizTypeIcon className={cn("h-4 w-4", config.color)} />
                </motion.div>
                
                {/* Difficulty badge */}
                <Badge 
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 backdrop-blur-sm border font-medium shadow-sm",
                    difficulty === 'Beginner' && "bg-green-50/90 dark:bg-green-950/90 text-green-700 dark:text-green-300 border-green-200/50",
                    difficulty === 'Intermediate' && "bg-amber-50/90 dark:bg-amber-950/90 text-amber-700 dark:text-amber-300 border-amber-200/50",
                    difficulty === 'Advanced' && "bg-rose-50/90 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border-rose-200/50"
                  )}
                >
                  {difficulty}
                </Badge>
                
                {/* Popular badge */}
                {isPopular && (
                  <Badge 
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 text-orange-700 dark:text-orange-300 border-orange-200/50 backdrop-blur-sm shadow-sm font-medium"
                  >
                    🔥
                  </Badge>
                )}
              </div>
              
              {/* Bookmark button */}
              <motion.button
                onClick={handleBookmarkClick}
                className={cn(
                  "p-1.5 rounded-lg backdrop-blur-sm border transition-all opacity-0 group-hover:opacity-100",
                  isBookmarked 
                    ? "bg-primary/90 border-primary text-primary-foreground shadow-lg" 
                    : "bg-background/80 border-border/50 text-muted-foreground hover:text-foreground hover:bg-background/90"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark quiz"}
              >
                <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
              </motion.button>
            </div>
            
            {/* Centered icon with glow effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative">
                <QuizTypeIcon className={cn("w-16 h-16 opacity-[0.06] dark:opacity-[0.08]", config.color)} />
                <div className={cn(
                  "absolute inset-0 blur-2xl opacity-[0.15]",
                  normalizedType === 'mcq' && "bg-blue-500/30",
                  normalizedType === 'code' && "bg-purple-500/30",
                  normalizedType === 'flashcard' && "bg-green-500/30",
                  normalizedType === 'openended' && "bg-orange-500/30",
                  normalizedType === 'blanks' && "bg-teal-500/30"
                )} />
              </div>
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

          <CardContent className="p-4 space-y-3">
            {/* Title and description */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                Test your {config.label.toLowerCase()} skills with {questionCount} questions
              </p>
            </div>

            {/* Compact inline metadata */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground py-2 border-y border-border/30">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">{estimatedTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="font-medium">{questionCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span className="font-medium">{attemptCount}</span>
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

            {/* Bottom section with rating and CTA */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Star rating */}
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold">4.5</span>
                  <span className="text-xs text-muted-foreground">(128)</span>
                </div>
                
                {/* Visibility badge */}
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] py-0.5 px-2 rounded-md font-medium",
                    isPublic 
                      ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200/50" 
                      : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/50"
                  )}
                  aria-label={isPublic ? "Public quiz" : "Private quiz"}
                >
                  {isPublic ? "Public" : "Private"}
                </Badge>
              </div>
              
              {/* Start button on hover */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1 text-xs h-7 bg-primary hover:bg-primary/90 shadow-sm"
                  tabIndex={-1}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Start</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}

export const QuizCard = memo(QuizCardComponent) as React.NamedExoticComponent<QuizCardProps>
