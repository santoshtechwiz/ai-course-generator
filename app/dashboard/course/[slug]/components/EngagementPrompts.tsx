"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  Play, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Target,
  Zap,
  Star,
  ChevronRight,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getSafeQuizHref } from '@/utils/navigation'

interface EngagementPrompt {
  id: string
  type: 'chapter_complete' | 'quiz_suggestion' | 'motivational' | 'streak_reminder'
  title: string
  message: string
  action?: {
    label: string
    href: string
    icon: React.ReactNode
  }
  priority: 'high' | 'medium' | 'low'
  expiresAt?: Date
}

interface EngagementPromptsProps {
  courseId: string
  currentChapterId?: string
  completedChapters: string[]
  totalChapters: number
  onDismiss?: (promptId: string) => void
  className?: string
}

const motivationalMessages = [
  {
    title: "Great Progress! 🎉",
    message: "You're building momentum. Keep going strong!",
    icon: <TrendingUp className="h-5 w-5" />
  },
  {
    title: "Knowledge is Power! ⚡",
    message: "Every chapter completed brings you closer to mastery.",
    icon: <Zap className="h-5 w-5" />
  },
  {
    title: "You're Crushing It! 💪",
    message: "Your dedication to learning is inspiring.",
    icon: <Target className="h-5 w-5" />
  },
  {
    title: "Learning Champion! 🏆",
    message: "You're making excellent progress on your learning journey.",
    icon: <Award className="h-5 w-5" />
  }
]

const nextActionSuggestions = [
  {
    type: 'quiz' as const,
    title: "Test Your Knowledge",
    message: "Take a quiz to reinforce what you've learned",
    icon: <BookOpen className="h-5 w-5" />,
    action: "Take Quiz"
  },
  {
    type: 'next_chapter' as const,
    title: "Continue Learning",
    message: "Move to the next chapter to keep the momentum going",
    icon: <Play className="h-5 w-5" />,
    action: "Next Chapter"
  },
  {
    type: 'review' as const,
    title: "Review & Reflect",
    message: "Go back and review key concepts from this chapter",
    icon: <Star className="h-5 w-5" />,
    action: "Review Chapter"
  }
]

export const EngagementPrompts: React.FC<EngagementPromptsProps> = ({
  courseId,
  currentChapterId,
  completedChapters,
  totalChapters,
  onDismiss,
  className
}) => {
  const [prompts, setPrompts] = useState<EngagementPrompt[]>([])
  const [visiblePrompts, setVisiblePrompts] = useState<EngagementPrompt[]>([])
  const router = useRouter()

  // Calculate progress
  const progressPercentage = totalChapters > 0 ? (completedChapters.length / totalChapters) * 100 : 0
  const isCourseCompleted = progressPercentage >= 100

  // Generate engagement prompts
  const generatePrompts = useCallback(() => {
    const newPrompts: EngagementPrompt[] = []

    // Chapter completion prompt
    if (currentChapterId && completedChapters.includes(currentChapterId)) {
      const randomMotivational = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
      
      newPrompts.push({
        id: `chapter-complete-${currentChapterId}`,
        type: 'chapter_complete',
        title: randomMotivational.title,
        message: randomMotivational.message,
        priority: 'high',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      })

      // Suggest next action
      if (!isCourseCompleted) {
        const nextSuggestion = nextActionSuggestions[Math.floor(Math.random() * nextActionSuggestions.length)]
        
        newPrompts.push({
          id: `next-action-${currentChapterId}`,
          type: 'quiz_suggestion',
          title: nextSuggestion.title,
          message: nextSuggestion.message,
          action: {
            label: nextSuggestion.action,
    href: nextSuggestion.type === 'quiz' ? `/dashboard/quizzes` : 
      nextSuggestion.type === 'next_chapter' ? `/dashboard/course/${courseId}` : 
      `/dashboard/course/${courseId}/review`,
            icon: nextSuggestion.icon
          },
          priority: 'medium',
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
        })
      }
    }

    // Progress milestone prompts
    if (progressPercentage >= 25 && progressPercentage < 30) {
      newPrompts.push({
        id: 'milestone-25',
        type: 'motivational',
        title: "Quarter Way There! 🎯",
        message: "You've completed 25% of the course. Excellent progress!",
        priority: 'medium',
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
      })
    }

    if (progressPercentage >= 50 && progressPercentage < 55) {
      newPrompts.push({
        id: 'milestone-50',
        type: 'motivational',
        title: "Halfway Point! 🎉",
        message: "You're 50% through the course. You're doing amazing!",
        priority: 'high',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      })
    }

    if (progressPercentage >= 75 && progressPercentage < 80) {
      newPrompts.push({
        id: 'milestone-75',
        type: 'motivational',
        title: "Almost There! 🚀",
        message: "You're 75% through the course. The finish line is in sight!",
        priority: 'high',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      })
    }

    // Course completion celebration
    if (isCourseCompleted) {
      newPrompts.push({
        id: 'course-complete',
        type: 'motivational',
        title: "Course Completed! 🏆",
        message: "Congratulations! You've successfully completed this course.",
        action: {
          label: "Get Certificate",
          href: `/dashboard/course/${courseId}/certificate`,
          icon: <Award className="h-5 w-5" />
        },
        priority: 'high',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      })
    }

    return newPrompts
  }, [courseId, currentChapterId, completedChapters, totalChapters, progressPercentage, isCourseCompleted])

  // Update prompts when dependencies change
  useEffect(() => {
    const newPrompts = generatePrompts()
    setPrompts(prev => {
      // Merge new prompts with existing ones, avoiding duplicates
      const existingIds = new Set(prev.map(p => p.id))
      const uniqueNewPrompts = newPrompts.filter(p => !existingIds.has(p.id))
      return [...prev, ...uniqueNewPrompts]
    })
  }, [generatePrompts])

  // Filter visible prompts (not expired, not dismissed)
  useEffect(() => {
    const now = new Date()
    const visible = prompts.filter(prompt => {
      if (prompt.expiresAt && prompt.expiresAt < now) return false
      return true
    }).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }).slice(0, 3) // Show max 3 prompts

    setVisiblePrompts(visible)
  }, [prompts])

  // Handle prompt dismissal
  const handleDismiss = useCallback((promptId: string) => {
    setPrompts(prev => prev.filter(p => p.id !== promptId))
    onDismiss?.(promptId)
  }, [onDismiss])

  // Handle action click
  const handleActionClick = useCallback((href: string) => {
    router.push(href)
  }, [router])

  // Get prompt styling
  const getPromptStyling = (type: EngagementPrompt['type'], priority: EngagementPrompt['priority']) => {
    const baseClasses = "relative overflow-hidden"
    
    switch (type) {
      case 'chapter_complete':
        return cn(
          baseClasses,
          "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
          "border border-green-200 dark:border-green-800"
        )
      case 'quiz_suggestion':
        return cn(
          baseClasses,
          "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20",
          "border border-blue-200 dark:border-blue-800"
        )
      case 'motivational':
        return cn(
          baseClasses,
          "bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20",
          "border border-orange-200 dark:border-orange-800"
        )
      default:
        return cn(
          baseClasses,
          "bg-card border border-border"
        )
    }
  }

  if (visiblePrompts.length === 0) return null

  return (
    <div className={cn("space-y-3", className)}>
      <AnimatePresence>
        {visiblePrompts.map((prompt, index) => (
          <motion.div
            key={prompt.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.1,
              ease: "easeOut"
            }}
          >
            <Card className={getPromptStyling(prompt.type, prompt.priority)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Simple icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-md bg-muted/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Text-first content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-sm truncate">{prompt.title}</h3>
                        {prompt.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">New</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        aria-label={`Dismiss prompt ${prompt.title}`}
                        onClick={() => handleDismiss(prompt.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{prompt.message}</p>

                    <div className="flex items-center gap-2">
                      {prompt.action ? (
                        // Use safe hrefs for quiz actions
                        (() => {
                          const href = prompt.action?.href ?? '/dashboard/quizzes'
                          return (
                            <Button
                              size="sm"
                              onClick={() => handleActionClick(href)}
                              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-95"
                              aria-label={prompt.action?.label || 'Take action'}
                            >
                              {prompt.action.icon}
                              <span className="text-sm">{prompt.action.label}</span>
                            </Button>
                          )
                        })()
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDismiss(prompt.id)}
                        >
                          Dismiss
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default EngagementPrompts