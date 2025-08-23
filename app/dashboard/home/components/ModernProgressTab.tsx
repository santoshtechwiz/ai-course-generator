"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  PlayCircle,
  Star,
  Zap
} from "lucide-react"
import type { DashboardUser, UserStats } from "@/app/types/types"
import { cn } from "@/lib/utils"

interface ModernProgressTabProps {
  userData: DashboardUser
  userStats: UserStats
}

interface ProgressMetrics {
  totalCourses: number
  completedCourses: number
  totalChapters: number
  completedChapters: number
  totalWatchTime: number
  averageScore: number
  streakDays: number
  recentActivity: Array<{
    courseId: string | number
    courseName: string
    progress: number
    lastAccessed: string
  }>
}

// Extended types for proper progress tracking
interface ExtendedCourseProgress {
  id: string | number
  userId: string
  courseId: number
  currentChapterId: number
  completedChapters: string | number[]
  progress: number
  timeSpent?: number
  watchTime?: number
  isCompleted: boolean
  lastAccessedAt: string
}

interface ExtendedCourse {
  id: string | number
  title: string
  description?: string
  image?: string
  chapters?: Array<{ id: string | number; title: string }>
  units?: Array<{ id: string | number; title: string }>
}

const ModernProgressTab: React.FC<ModernProgressTabProps> = ({ userData, userStats }) => {
  // Calculate comprehensive progress metrics
  const progressMetrics = useMemo((): ProgressMetrics => {
    const courses = userData?.courses || []
    const courseProgress = userData?.courseProgress || []
    
    // Cast to extended types for better type safety
    const extendedCourses = courses as ExtendedCourse[]
    const extendedProgress = courseProgress as any[] // Temporary cast for Prisma types
    
    // Calculate total and completed courses
    const totalCourses = extendedCourses.length
    const completedCourses = extendedProgress.filter(cp => cp.isCompleted).length
    
    // Calculate total and completed chapters (estimate 5 chapters per course if not available)
    const totalChapters = extendedCourses.reduce((sum, course) => {
      return sum + (course.chapters?.length || course.units?.length || 5) // Default to 5 chapters
    }, 0)
    
    const completedChapters = extendedProgress.reduce((sum, cp) => {
      if (typeof cp.completedChapters === 'string') {
        try {
          const completed = JSON.parse(cp.completedChapters)
          return sum + (Array.isArray(completed) ? completed.length : 0)
        } catch {
          return sum
        }
      }
      if (Array.isArray(cp.completedChapters)) {
        return sum + cp.completedChapters.length
      }
      // Fallback: estimate based on progress percentage
      const estimatedCompleted = Math.floor((cp.progress || 0) / 100 * 5) // Assume 5 chapters
      return sum + estimatedCompleted
    }, 0)
    
    // Calculate total watch time (timeSpent is in minutes from Prisma schema)
    const totalWatchTime = extendedProgress.reduce((sum, cp) => {
      return sum + (cp.timeSpent || cp.watchTime || 0)
    }, 0)
    
    // Get recent activity
    const recentActivity = extendedProgress
      .map(cp => {
        const course = extendedCourses.find(c => String(c.id) === String(cp.courseId || cp.course?.id))
        return {
          courseId: cp.courseId || cp.course?.id || 'unknown',
          courseName: course?.title || cp.course?.title || `Course ${cp.courseId || cp.course?.id || 'Unknown'}`,
          progress: cp.progress || 0,
          lastAccessed: cp.lastAccessedAt || new Date().toISOString()
        }
      })
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
      .slice(0, 5)
    
    return {
      totalCourses,
      completedCourses,
      totalChapters,
      completedChapters,
      totalWatchTime,
      averageScore: userStats?.averageScore || 0,
      streakDays: userData?.streakDays || 0,
      recentActivity
    }
  }, [userData, userStats])

  // Calculate overall progress percentage
  const overallProgress = useMemo(() => {
    if (progressMetrics.totalChapters === 0) return 0
    return Math.round((progressMetrics.completedChapters / progressMetrics.totalChapters) * 100)
  }, [progressMetrics.totalChapters, progressMetrics.completedChapters])

  // Format time display
  const formatWatchTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Progress stats cards
  const statsCards = [
    {
      title: "Overall Progress",
      value: `${overallProgress}%`,
      icon: <Target className="h-5 w-5" />,
      color: "bg-primary/10 text-primary",
      progress: overallProgress,
      subtitle: `${progressMetrics.completedChapters} of ${progressMetrics.totalChapters} chapters`
    },
    {
      title: "Courses Completed",
      value: `${progressMetrics.completedCourses}`,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "bg-green-500/10 text-green-600",
      progress: progressMetrics.totalCourses > 0 ? (progressMetrics.completedCourses / progressMetrics.totalCourses) * 100 : 0,
      subtitle: `${progressMetrics.totalCourses} total courses`
    },
    {
      title: "Watch Time",
      value: formatWatchTime(progressMetrics.totalWatchTime),
      icon: <Clock className="h-5 w-5" />,
      color: "bg-blue-500/10 text-blue-600",
      progress: Math.min((progressMetrics.totalWatchTime / 1000) * 100, 100), // Scale to meaningful progress
      subtitle: "Total learning time"
    },
    {
      title: "Average Score",
      value: `${Math.round(progressMetrics.averageScore)}%`,
      icon: <Trophy className="h-5 w-5" />,
      color: "bg-amber-500/10 text-amber-600",
      progress: progressMetrics.averageScore,
      subtitle: "Quiz performance"
    },
    {
      title: "Learning Streak",
      value: `${progressMetrics.streakDays}`,
      icon: <Zap className="h-5 w-5" />,
      color: "bg-purple-500/10 text-purple-600",
      progress: Math.min(progressMetrics.streakDays * 10, 100), // Scale streak to progress bar
      subtitle: "Days in a row"
    },
    {
      title: "Active Courses",
      value: `${progressMetrics.recentActivity.length}`,
      icon: <PlayCircle className="h-5 w-5" />,
      color: "bg-pink-500/10 text-pink-600",
      progress: progressMetrics.totalCourses > 0 ? (progressMetrics.recentActivity.length / progressMetrics.totalCourses) * 100 : 0,
      subtitle: "Currently learning"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={cn("p-2 rounded-lg", stat.color)}>
                    {stat.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.subtitle}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stat.title}</span>
                    <span className="text-muted-foreground">{Math.round(stat.progress)}%</span>
                  </div>
                  <Progress value={stat.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Learning Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Learning Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressMetrics.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {progressMetrics.recentActivity.map((activity, index) => (
                  <motion.div
                    key={`${activity.courseId}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <div>
                        <h4 className="font-medium">{activity.courseName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Last accessed {new Date(activity.lastAccessed).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">{Math.round(activity.progress)}%</div>
                        <div className="text-xs text-muted-foreground">Complete</div>
                      </div>
                      <div className="w-16">
                        <Progress value={activity.progress} className="h-2" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent learning activity</p>
                <p className="text-sm">Start a course to see your progress here!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Learning Goals and Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Learning Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Learning Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Complete 5 chapters this week</span>
                <Badge variant={progressMetrics.completedChapters >= 5 ? "default" : "secondary"}>
                  {Math.min(progressMetrics.completedChapters, 5)}/5
                </Badge>
              </div>
              <Progress value={Math.min((progressMetrics.completedChapters / 5) * 100, 100)} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Maintain 7-day streak</span>
                <Badge variant={progressMetrics.streakDays >= 7 ? "default" : "secondary"}>
                  {Math.min(progressMetrics.streakDays, 7)}/7
                </Badge>
              </div>
              <Progress value={Math.min((progressMetrics.streakDays / 7) * 100, 100)} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Achieve 80% average score</span>
                <Badge variant={progressMetrics.averageScore >= 80 ? "default" : "secondary"}>
                  {Math.round(progressMetrics.averageScore)}%
                </Badge>
              </div>
              <Progress value={Math.min(progressMetrics.averageScore, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <PlayCircle className="h-4 w-4 mr-2" />
              Continue Last Course
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse All Courses
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Trophy className="h-4 w-4 mr-2" />
              Take a Quiz
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Detailed Stats
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default ModernProgressTab
