"use client"

import { useMemo } from "react"
import type React from "react"
import { useState, memo, useCallback, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import neo from '@/components/neo/tokens'
import { Button } from "@/components/ui/button"
import { Clock, BookOpen, Loader2, Play, Users, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn, getColorClasses } from "@/lib/utils"
import { QUIZ_TYPE_CONFIG } from "./quiz-type-config"
import QuizTypeIllustration from "./QuizTypeIllustrations"
import type { QuizType } from "@/app/types/quiz-types"

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

const getDifficulty = (questionCount: number) => {
  if (questionCount <= 5)
    return {
      label: "BEGINNER",
      color: "bg-[var(--color-success)] text-white",
      bgLight: "bg-[var(--color-success)]/10",
      textColor: "text-[var(--color-success)]"
    }
  if (questionCount <= 15)
    return {
      label: "INTERMEDIATE",
      color: "bg-[var(--color-warning)] text-white",
      bgLight: "bg-[var(--color-warning)]/10",
      textColor: "text-[var(--color-warning)]"
    }
  return {
    label: "ADVANCED",
    color: "bg-[var(--color-destructive)] text-white",
    bgLight: "bg-[var(--color-destructive)]/10",
    textColor: "text-[var(--color-destructive)]"
  }
}

function QuizCardComponent({
  title,
  description,
  questionCount,
  isPublic = true,
  slug,
  quizType,
  estimatedTime,
  completionRate = 0,
  userId,
  currentUserId,
  isNavigating = false,
  onNavigationChange,
}: QuizCardProps) {
  const { buttonPrimary, cardPrimary } = getColorClasses()
  const [isHovered, setIsHovered] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const normalizedType = (quizType || "mcq").toLowerCase() as keyof typeof QUIZ_TYPE_CONFIG
  const config = QUIZ_TYPE_CONFIG[normalizedType] || QUIZ_TYPE_CONFIG.mcq

  const loading = isNavigating || localLoading
  const difficulty = useMemo(() => getDifficulty(questionCount), [questionCount])
  const attemptCount = useMemo(() => Math.floor(Math.random() * 500) + 100, [])

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [])

  const handleQuizClick = useCallback((e: React.MouseEvent) => {
    if (loading) {
      e.preventDefault()
      return
    }
    setLocalLoading(true)
    onNavigationChange?.(true)

    loadingTimeoutRef.current = setTimeout(() => {
      setLocalLoading(false)
      onNavigationChange?.(false)
    }, 3000)
  }, [loading, onNavigationChange])

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  return (
    <Link
      href={`/dashboard/${quizType}/${slug}`}
      className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-none h-full group"
      tabIndex={0}
      aria-label={`Open ${config.label} quiz: ${title}`}
      onClick={handleQuizClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card
        className={cn(
          "relative h-full flex flex-col overflow-hidden cursor-pointer border-3 border-black transition-all duration-200",
          "bg-[var(--color-card)] dark:bg-[var(--color-card)]",
          "shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]",
          "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
          "active:translate-x-[0px] active:translate-y-[0px] active:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)]",
          loading && "opacity-70 cursor-wait pointer-events-none",
        )}
        aria-busy={loading}
        role="article"
        aria-labelledby={`quiz-title-${slug}`}
      >
        {/* Color accent strip */}
        <div className={cn("h-2 border-b-3 border-black", config.bg)} aria-hidden="true" />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center z-20 bg-[var(--color-bg)]/95 dark:bg-[var(--color-bg)]/95">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" strokeWidth={2.5} />
              <span className="text-sm font-black text-[var(--color-text)]">Loading quiz...</span>
            </div>
          </div>
        )}

        {/* Content */}
        <CardContent className="p-5 flex flex-col gap-4 text-left h-full">
          {/* Illustration */}
          <div className="flex justify-center items-center h-24">
            <QuizTypeIllustration type={normalizedType as any} />
          </div>

          {/* Title & Description */}
          <div className="space-y-2 flex-1 min-h-[5rem]">
            <div className="flex items-start justify-between gap-2">
              <h3 
                id={`quiz-title-${slug}`} 
                className="font-black text-lg leading-tight text-[var(--color-text)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors flex-1"
              >
                {title}
              </h3>
              <Badge 
                variant="neutral" 
                className={cn(
                  "px-2 py-0.5 text-xs font-black border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] flex-shrink-0",
                  difficulty.color
                )}
              >
                {difficulty.label}
              </Badge>
            </div>
            <p className="text-sm text-[var(--color-text)]/70 font-medium line-clamp-2 leading-relaxed">
              {description || `Test your ${config.label.toLowerCase()} skills with this interactive quiz`}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] bg-[var(--color-bg)]/50 dark:bg-[var(--color-bg)]/50 transition-all group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px]">
              <Clock className="w-5 h-5 text-[var(--color-text)]/70" strokeWidth={2.5} aria-hidden="true" />
              <span className="text-xs font-black text-[var(--color-text)]">{estimatedTime}</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] bg-[var(--color-bg)]/50 dark:bg-[var(--color-bg)]/50 transition-all group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px]">
              <BookOpen className="w-5 h-5 text-[var(--color-text)]/70" strokeWidth={2.5} aria-hidden="true" />
              <span className="text-xs font-black text-[var(--color-text)]">{questionCount}</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] bg-[var(--color-bg)]/50 dark:bg-[var(--color-bg)]/50 transition-all group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px]">
              <Users className="w-5 h-5 text-[var(--color-text)]/70" strokeWidth={2.5} aria-hidden="true" />
              <span className="text-xs font-black text-[var(--color-text)]">{attemptCount}</span>
            </div>
          </div>

          {/* Completion rate indicator */}
          {completionRate > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text)]/70">
                <span>Your Progress</span>
                <span className="font-black text-[var(--color-text)]">{completionRate}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--color-bg)] border-2 border-black rounded-full overflow-hidden shadow-inner">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", config.bg)}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}

          {/* Start Button */}
          <Button
            variant="default"
            size="lg"
            className={cn(
              "w-full gap-2 text-base font-black border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] transition-all rounded-none",
              "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
              "active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-[0px] disabled:hover:translate-y-[0px]",
              config.bg,
              "text-white"
            )}
            disabled={loading}
            aria-label={loading ? "Loading quiz" : "Start quiz"}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
                <span>Start Quiz</span>
                <ChevronRight 
                  className={cn(
                    "w-5 h-5 ml-auto transition-transform duration-200",
                    isHovered && "translate-x-1"
                  )} 
                  strokeWidth={2.5} 
                  aria-hidden="true" 
                />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}

export const QuizCard = memo(QuizCardComponent, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.slug === nextProps.slug &&
    prevProps.title === nextProps.title &&
    prevProps.questionCount === nextProps.questionCount &&
    prevProps.isNavigating === nextProps.isNavigating &&
    prevProps.completionRate === nextProps.completionRate
  )
})