"use client"

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Play, Clock, CheckCircle, BookOpen, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getImageWithFallback, normalizeImageUrl } from '@/utils/image-utils'

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

  const normalized = normalizeImageUrl(courseImage)
  const courseImageUrl = normalized || '/generic-course-improved.svg'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn("mb-6 w-full", className)}
    >
      <Card className="overflow-hidden w-full sm:max-w-3xl mx-auto border-primary/20 bg-gradient-to-br from-primary/5 via-blue-50/50 to-purple-50/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group hover:border-primary/30">
        <CardContent className="p-6 w-full">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Course Thumbnail */}
            <div className="flex-shrink-0 relative">
              <motion.div
                className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-primary/20 to-blue-100 rounded-lg flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-shadow duration-300"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {courseImageUrl ? (
                  <Image
                    src={courseImageUrl}
                    alt={courseTitle}
                    fill
                    className="object-cover rounded-lg group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 80px, 112px"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      // On error, use an improved course SVG fallback
                      target.src = '/generic-course-improved.svg'
                      console.log('ResumeCourseCard image failed to load:', courseImageUrl)
                    }}
                    onLoad={() => console.log('ResumeCourseCard image loaded successfully:', courseImageUrl)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                )}
                {/* Progress overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                  <span className="text-white text-xs font-medium">{progressPercentage}%</span>
                </div>
              </motion.div>
              {/* Progress ring */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm animate-pulse">
                <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                  <div
                    className="w-3 h-3 rounded-full bg-primary"
                    style={{
                      background: `conic-gradient(from 0deg, #3b82f6 ${progressPercentage * 3.6}deg, transparent 0deg)`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Course Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg text-primary truncate group-hover:text-primary/80 transition-colors duration-200">
                    {courseTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Continue: <span className="font-medium text-foreground">{currentChapterTitle}</span>
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge className="ml-4 bg-gradient-to-r from-primary/10 to-blue-100 text-primary hover:from-primary/20 hover:to-blue-200 border-primary/20 font-medium">
                    {progressPercentage}% Complete
                  </Badge>
                </motion.div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Progress value={progressPercentage} className="h-3 bg-gray-200" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-200 rounded-full" style={{ width: `${progressPercentage}%` }} />
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {completedChapters} of {totalChapters} chapters
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.floor(timeSpent / 60)}h {timeSpent % 60}m spent
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
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleResume}
                    className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Continue Learning
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
