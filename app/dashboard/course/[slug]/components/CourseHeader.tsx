"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle, 
  Clock, 
  Star, 
  BookOpen, 
  Users, 
  PlayCircle,
  TrendingUp,
  Award,
  ChevronDown
} from "lucide-react"

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
    <motion.header 
      animate={{ 
        height: isCompact ? "auto" : "auto",
        paddingTop: isCompact ? "12px" : "20px",
        paddingBottom: isCompact ? "12px" : "20px"
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "w-full transition-all duration-300 ease-in-out",
        "bg-background/95 backdrop-blur-md border-b border-border/40",
        "shadow-sm"
      )}
    >
      <div className="w-full">
        <div className="flex items-center justify-between gap-6">
          {/* Left section: Course info and progress */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-6">
              {/* Course title and chapter info */}
              <div className="flex-1 min-w-0">
                <motion.div
                  animate={{ 
                    fontSize: isCompact ? "18px" : "24px",
                    lineHeight: isCompact ? "24px" : "32px"
                  }}
                  transition={{ duration: 0.3 }}
                  className="font-bold text-foreground truncate mb-1"
                >
                  {courseTitle}
                </motion.div>
                
                {chapterTitle && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "text-muted-foreground truncate transition-all",
                      isCompact ? "text-sm" : "text-base"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{chapterTitle}</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Course metadata - hidden on very compact mode */}
              {!isCompact && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="hidden lg:flex items-center gap-6 text-sm"
                >
                  {ratingInfo && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{ratingInfo.averageRating.toFixed(1)}</span>
                      </div>
                      <span className="text-muted-foreground">({ratingInfo.ratingCount})</span>
                    </div>
                  )}

                  {instructor && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>By {instructor}</span>
                      </div>
                    </>
                  )}

                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{progress.totalChapters} chapters</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Progress section */}
            <motion.div
              animate={{ 
                marginTop: isCompact ? "8px" : "16px",
                opacity: 1
              }}
              className="flex items-center gap-6"
            >
              {/* Progress bar and stats */}
              <div className="flex items-center gap-4 flex-1 max-w-md">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>{progress.completedCount}/{progress.totalChapters}</span>
                </div>
                
                <div className="flex-1">
                  <Progress 
                    value={progress.progressPercentage} 
                    className={cn(
                      "transition-all duration-300",
                      isCompact ? "h-2" : "h-2.5"
                    )}
                  />
                </div>
                
                <Badge 
                  variant="outline" 
                  className={cn(
                    "bg-primary/10 text-primary border-primary/20 font-semibold",
                    isCompact ? "text-xs px-2 py-1" : "text-sm px-3 py-1"
                  )}
                >
                  {progress.progressPercentage}%
                </Badge>
              </div>

              {/* Achievement indicator */}
              {progress.progressPercentage >= 75 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="hidden md:flex items-center gap-2"
                >
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                    <Award className="h-3 w-3 mr-1" />
                    Almost there!
                  </Badge>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Right section: Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile content toggle */}
            {onContentToggle && (
              <Button 
                variant="outline" 
                size={isCompact ? "sm" : "default"}
                onClick={onContentToggle} 
                className="lg:hidden"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Contents
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            )}

            {/* Custom actions */}
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Compact mode mobile info */}
        {isCompact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 pt-3 border-t border-border/20 lg:hidden"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {ratingInfo && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{ratingInfo.averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({ratingInfo.ratingCount})</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  <span>{progress.totalChapters} chapters</span>
                </div>
              </div>

              {progress.progressPercentage > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="text-primary font-medium text-xs">
                    {progress.progressPercentage >= 100 
                      ? "Completed!" 
                      : `${progress.totalChapters - progress.completedCount} left`}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}