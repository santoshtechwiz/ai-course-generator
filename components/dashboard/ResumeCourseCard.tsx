"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Play, Clock, CheckCircle, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResumeCourseCardProps {
  courseTitle: string
  courseSlug: string
  currentChapterTitle: string
  progressPercentage: number
  completedChapters: number
  totalChapters: number
  lastAccessedAt: string
  timeSpent: number
  courseImage?: string
  className?: string
  onResume?: () => void
}

const formatTimeAgo = (timestamp: string) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }
}

export default function ResumeCourseCard({
  courseTitle,
  courseSlug,
  currentChapterTitle,
  progressPercentage,
  completedChapters,
  totalChapters,
  lastAccessedAt,
  timeSpent,
  courseImage,
  className,
  onResume
}: ResumeCourseCardProps) {
  const handleResume = () => {
    if (onResume) {
      onResume()
    } else {
      window.location.href = `/dashboard/course/${courseSlug}`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mb-6", className)}
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Course Thumbnail */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                {courseImage ? (
                  <img 
                    src={courseImage} 
                    alt={courseTitle}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <BookOpen className="h-8 w-8 text-primary" />
                )}
              </div>
            </div>

            {/* Course Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg text-primary truncate">
                    {courseTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Continue: {currentChapterTitle}
                  </p>
                </div>
                <Badge className="ml-4 bg-primary/10 text-primary hover:bg-primary/20">
                  {progressPercentage}% Complete
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <Progress value={progressPercentage} className="h-2" />
                <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                  <span>{completedChapters} of {totalChapters} chapters</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.floor(timeSpent / 60)}h {timeSpent % 60}m
                  </span>
                </div>
              </div>

              {/* Action Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Last activity {formatTimeAgo(lastAccessedAt)}
                  </span>
                </div>
                <Button 
                  onClick={handleResume}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue Learning
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
