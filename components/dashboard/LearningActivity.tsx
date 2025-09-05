"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  Clock, 
  Play, 
  BookOpen, 
  BarChart3,
  TrendingUp,
  Calendar,
  Target,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LearningActivityProps {
  userId?: string
  className?: string
}

interface ActivityItem {
  id: string
  type: 'course_started' | 'chapter_completed' | 'course_completed' | 'quiz_completed'
  courseTitle: string
  chapterTitle?: string
  timestamp: string
  progress?: number
  timeSpent?: number
}

interface CourseProgress {
  courseId: string
  courseTitle: string
  progressPercentage: number
  completedChapters: number
  totalChapters: number
  lastAccessedAt: string
  timeSpent: number
  streak?: number
}

// Mock data - this would come from your API
const mockRecentActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'chapter_completed',
    courseTitle: 'Advanced React Patterns',
    chapterTitle: 'Understanding Compound Components',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    timeSpent: 25
  },
  {
    id: '2',
    type: 'course_started',
    courseTitle: 'TypeScript Fundamentals',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    type: 'quiz_completed',
    courseTitle: 'JavaScript Essentials',
    chapterTitle: 'Async/Await Quiz',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    progress: 85
  }
]

const mockInProgressCourses: CourseProgress[] = [
  {
    courseId: '1',
    courseTitle: 'Advanced React Patterns',
    progressPercentage: 75,
    completedChapters: 12,
    totalChapters: 16,
    lastAccessedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    timeSpent: 180,
    streak: 5
  },
  {
    courseId: '2',
    courseTitle: 'TypeScript Fundamentals',
    progressPercentage: 40,
    completedChapters: 6,
    totalChapters: 15,
    lastAccessedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    timeSpent: 120,
    streak: 3
  }
]

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'course_started':
      return <Play className="h-4 w-4 text-blue-500" />
    case 'chapter_completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'course_completed':
      return <Award className="h-4 w-4 text-yellow-500" />
    case 'quiz_completed':
      return <Target className="h-4 w-4 text-purple-500" />
    default:
      return <BookOpen className="h-4 w-4 text-gray-500" />
  }
}

const getActivityText = (activity: ActivityItem) => {
  switch (activity.type) {
    case 'course_started':
      return `Started "${activity.courseTitle}"`
    case 'chapter_completed':
      return `Completed "${activity.chapterTitle}" in ${activity.courseTitle}`
    case 'course_completed':
      return `Completed course "${activity.courseTitle}"`
    case 'quiz_completed':
      return `Completed quiz in "${activity.courseTitle}"`
    default:
      return 'Learning activity'
  }
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

export default function LearningActivity({ userId, className }: LearningActivityProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Continue Learning Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Continue Learning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockInProgressCourses.map((course, index) => (
            <motion.div
              key={course.courseId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{course.courseTitle}</h4>
                  <p className="text-sm text-muted-foreground">
                    {course.completedChapters} of {course.totalChapters} chapters completed
                  </p>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {course.progressPercentage}%
                </Badge>
              </div>
              
              <Progress value={course.progressPercentage} className="h-2 mb-3" />
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.floor(course.timeSpent / 60)}h {course.timeSpent % 60}m
                  </span>
                  {course.streak && (
                    <span className="flex items-center gap-1 text-orange-500">
                      🔥 {course.streak} day streak
                    </span>
                  )}
                </div>
                <span>{formatTimeAgo(course.lastAccessedAt)}</span>
              </div>
              
              <Button size="sm" className="w-full mt-3">
                <Play className="h-4 w-4 mr-2" />
                Continue Learning
              </Button>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockRecentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {getActivityText(activity)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                    {activity.timeSpent && (
                      <span className="text-xs text-muted-foreground">
                        • {activity.timeSpent}m spent
                      </span>
                    )}
                    {activity.progress && (
                      <Badge variant="outline" className="text-xs">
                        {activity.progress}%
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">8h 30m</div>
              <div className="text-xs text-muted-foreground">Time Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">12</div>
              <div className="text-xs text-muted-foreground">Chapters Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">3</div>
              <div className="text-xs text-muted-foreground">Quizzes Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">5</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
