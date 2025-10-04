/**
 * Enhanced Chapter Progress Component
 * Shows detailed chapter completion status that matches database state
 */

"use client"

import React from "react"
import { CheckCircle, PlayCircle, Clock, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { FullChapterType } from "@/app/types/types"

interface ChapterProgressData {
  chapterId: number
  chapterTitle: string
  chapterOrder: number
  progress: number
  isCompleted: boolean
  timeSpent: number
  lastAccessed: Date | null
  unitId?: number
  unitTitle?: string
}

interface ChapterProgressDisplayProps {
  chapters: FullChapterType[]
  completedChapters: string[]
  currentChapterId?: number
  onChapterClick?: (chapterId: number) => void
  className?: string
  showProgress?: boolean
  showTimeSpent?: boolean
  variant?: 'compact' | 'detailed'
}

export function ChapterProgressDisplay({
  chapters,
  completedChapters,
  currentChapterId,
  onChapterClick,
  className,
  showProgress = true,
  showTimeSpent = false,
  variant = 'detailed'
}: ChapterProgressDisplayProps) {
  
  const getChapterStatus = (chapter: FullChapterType) => {
    const isCompleted = completedChapters.includes(String(chapter.id))
    const isCurrent = currentChapterId === chapter.id
    const isLocked = !(chapter.isFreePreview ?? true) && !isCompleted && !isCurrent
    
    return {
      isCompleted,
      isCurrent,
      isLocked,
      canPlay: (chapter.isFreePreview ?? true) || isCompleted || isCurrent
    }
  }

  const getStatusIcon = (status: ReturnType<typeof getChapterStatus>) => {
    if (status.isCompleted) {
      return <CheckCircle className="h-5 w-5 text-emerald-500" />
    } else if (status.isCurrent) {
      return <PlayCircle className="h-5 w-5 text-blue-500" />
    } else if (status.isLocked) {
      return <Lock className="h-4 w-4 text-muted-foreground" />
    } else {
      return <PlayCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: ReturnType<typeof getChapterStatus>) => {
    if (status.isCompleted) {
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">Completed</Badge>
    } else if (status.isCurrent) {
      return <Badge variant="default" className="bg-blue-100 text-blue-700 text-xs">Current</Badge>
    } else if (status.isLocked) {
      return <Badge variant="outline" className="text-xs">Locked</Badge>
    } else {
      return <Badge variant="outline" className="text-xs">Available</Badge>
    }
  }

  if (variant === 'compact') {
    return (
      <div className={cn("space-y-2", className)}>
        {chapters.map((chapter, index) => {
          const status = getChapterStatus(chapter)
          
          return (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                status.canPlay && "hover:bg-muted/50 cursor-pointer",
                status.isCurrent && "bg-blue-50 border-blue-200",
                status.isCompleted && "bg-emerald-50 border-emerald-200"
              )}
              onClick={() => status.canPlay && onChapterClick?.(chapter.id)}
            >
              {getStatusIcon(status)}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  status.isLocked && "text-muted-foreground"
                )}>
                  {index + 1}. {chapter.title}
                </p>
                {chapter.videoDuration && chapter.videoDuration > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.ceil(chapter.videoDuration)} min
                  </p>
                )}
              </div>
              {getStatusBadge(status)}
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {chapters.map((chapter, index) => {
        const status = getChapterStatus(chapter)
        
        return (
          <motion.div
            key={chapter.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className={cn(
                "transition-all duration-200",
                status.canPlay && "hover:shadow-md cursor-pointer",
                status.isCurrent && "ring-2 ring-blue-500/20 bg-blue-50/50",
                status.isCompleted && "bg-emerald-50/30 border-emerald-200"
              )}
              onClick={() => status.canPlay && onChapterClick?.(chapter.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(status)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className={cn(
                          "font-medium leading-tight",
                          status.isLocked && "text-muted-foreground"
                        )}>
                          {index + 1}. {chapter.title}
                        </h4>
                        {chapter.summary && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {chapter.summary}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {chapter.videoDuration && chapter.videoDuration > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.ceil(chapter.videoDuration)} min
                        </div>
                      )}
                      
                      {showProgress && status.isCompleted && (
                        <div className="flex items-center gap-2">
                          <span>100% complete</span>
                          <div className="w-16">
                            <Progress value={100} className="h-1" />
                          </div>
                        </div>
                      )}
                      
                      {showTimeSpent && status.isCompleted && (
                        <div className="text-emerald-600">
                          ✓ Watched
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

/**
 * Course Progress Summary Component
 * Shows overall course completion statistics
 */
interface CourseProgressSummaryProps {
  totalChapters: number
  completedChapters: string[]
  currentChapterId?: number
  className?: string
}

export function CourseProgressSummary({
  totalChapters,
  completedChapters,
  currentChapterId,
  className
}: CourseProgressSummaryProps) {
  const completedCount = completedChapters.length
  const progressPercentage = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0
  const remainingCount = totalChapters - completedCount
  
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">{progressPercentage}%</h3>
            <p className="text-sm text-muted-foreground">Course Complete</p>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{completedCount} completed</span>
              <span>{remainingCount} remaining</span>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-lg font-semibold text-emerald-600">{completedCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <PlayCircle className="h-4 w-4 text-blue-500" />
                <span className="text-lg font-semibold text-blue-600">{remainingCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
          </div>
          
          {/* Motivational Message */}
          <div className="text-center pt-2">
            {progressPercentage === 100 ? (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                🎉 Course Completed!
              </Badge>
            ) : progressPercentage >= 50 ? (
              <p className="text-sm text-muted-foreground">You're doing great! Keep going!</p>
            ) : progressPercentage > 0 ? (
              <p className="text-sm text-muted-foreground">Great start! Continue learning!</p>
            ) : (
              <p className="text-sm text-muted-foreground">Ready to begin your journey?</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}