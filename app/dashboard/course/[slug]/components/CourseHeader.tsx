"use client"

import React from 'react'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, Star } from "lucide-react"

interface CourseHeaderProps {
  courseTitle: string
  chapterTitle?: string
  isCompact: boolean
  progress: {
    completedCount: number
    totalChapters: number
    progressPercentage: number
  }
  ratingInfo?: {
    averageRating: number
    ratingCount: number
  }
  instructor?: string
  onShareClick?: () => void
  onContentToggle?: () => void
  actions?: React.ReactNode
}

export function CourseHeader({
  courseTitle,
  chapterTitle,
  isCompact,
  progress,
  ratingInfo,
  instructor,
  onContentToggle,
  actions,
}: CourseHeaderProps) {
  return (
    <header className={cn(
      "w-full sticky top-0 z-50 transition-all shadow-sm border-b", 
      isCompact 
        ? "bg-background/95 backdrop-blur-sm py-2 text-foreground" 
        : "bg-background py-3 text-foreground"
    )}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
        <div className={cn("flex items-center gap-4 min-w-0 transition-all", 
          isCompact ? "text-sm" : "text-base"
        )}>
          <div className="flex-shrink-0 min-w-0">
            <div className="font-semibold truncate">{courseTitle}</div>
            {chapterTitle && (
              <div className="text-xs text-muted-foreground hidden md:block truncate">
                {chapterTitle}
              </div>
            )}
          </div>

          {!isCompact && instructor && (
            <div className="hidden md:block text-xs text-muted-foreground">
              Instructor: <span className="font-medium">{instructor}</span>
            </div>
          )}

          {ratingInfo && !isCompact && (
            <div className="hidden md:flex items-center gap-1 text-xs">
              <div className="flex items-center">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 font-medium">{ratingInfo.averageRating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">({ratingInfo.ratingCount})</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-3 ml-4">
            <div className="text-xs font-medium">{progress.completedCount}/{progress.totalChapters} completed</div>
            <div className="w-48">
              <Progress value={progress.progressPercentage} className="h-2 rounded-full" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> 
            <span>{progress.progressPercentage}%</span>
          </Badge>
          
          {onContentToggle && (
            <Button variant="outline" size="sm" onClick={onContentToggle} className="md:hidden">
              Contents
            </Button>
          )}
          
          {actions}
        </div>
      </div>
    </header>
  )
}
