"use client"

import React, { useMemo } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Trophy,
  Clock,
  BookOpen,
  Play,
  CheckCircle,
  Target,
  TrendingUp,
  Calendar
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { Loader } from "@/components/loader"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch progress data")
  }
  return response.json()
}

interface CourseProgress {
  id: number
  userId: string
  courseId: number
  progress: number
  completedChapters: number[]
  currentChapterId?: number
  lastAccessedAt: string
  isCompleted?: boolean
  timeSpent?: number
  course?: {
    id: number
    title: string
    slug: string
  }
}

interface ProgressStats {
  totalCourses: number
  completedCourses: number
  inProgressCourses: number
  totalTimeSpent: number
  averageProgress: number
  recentActivity: CourseProgress[]
}

interface ProgressTrackingPanelProps {
  userId?: string
  className?: string
  showDetailedStats?: boolean
}

export const ProgressTrackingPanel = React.memo(function ProgressTrackingPanel({
  userId,
  className,
  showDetailedStats = true
}: ProgressTrackingPanelProps) {
  const cacheKey = "/api/progress/user"
  
  const {
    data,
    error,
    isLoading: loading,
    mutate
  } = useSWR(cacheKey, fetcher, {
    dedupingInterval: 60_000, // 1 minute
    revalidateOnFocus: false,
    revalidateIfStale: true,
    revalidateOnReconnect: true,
  })

  const progressData = data?.progress || []
  
  // Calculate stats from the fetched data
  const stats = useMemo(() => {
    if (!data?.progress) return null
    
    const totalCourses = data.progress.length
    const completedCourses = data.progress.filter((p: CourseProgress) => p.isCompleted).length
    const inProgressCourses = totalCourses - completedCourses
    const totalTimeSpent = data.progress.reduce((sum: number, p: CourseProgress) => sum + (p.timeSpent || 0), 0)
    const averageProgress = totalCourses > 0
      ? data.progress.reduce((sum: number, p: CourseProgress) => sum + p.progress, 0) / totalCourses
      : 0

    const recentActivity = data.progress
      .sort((a: CourseProgress, b: CourseProgress) =>
        new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
      )
      .slice(0, 5)

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalTimeSpent,
      averageProgress,
      recentActivity
    }
  }, [data])

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Loader message="Loading progress..." size="medium" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Error: {error.message || "Failed to load progress"}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => mutate()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      {showDetailedStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalCourses}</p>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.completedCourses}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Play className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.inProgressCourses}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{formatTime(stats.totalTimeSpent)}</p>
                  <p className="text-sm text-muted-foreground">Time Spent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course Progress List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Course Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {progressData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No courses in progress</p>
                  <p className="text-sm">Start learning to see your progress here</p>
                </div>
              ) : (
                progressData.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate mb-1">
                            {course.course?.title || "Unknown Course"}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {course.progress.toFixed(1)}% complete
                            </div>
                            {course.timeSpent && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(course.timeSpent)}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(course.lastAccessedAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {course.isCompleted && (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.location.href = `/dashboard/course/${course.course?.slug}`}
                          >
                            Continue
                          </Button>
                        </div>
                      </div>

                      <Progress value={course.progress} className="h-2" />

                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>
                          {course.completedChapters?.length || 0} chapters completed
                        </span>
                        {course.currentChapterId && (
                          <span>
                            Current: Chapter {course.currentChapterId}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {showDetailedStats && stats?.recentActivity && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {activity.course?.title || "Unknown Course"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.progress.toFixed(1)}% complete • {formatDistanceToNow(new Date(activity.lastAccessedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.location.href = `/dashboard/course/${activity.course?.slug}`}
                  >
                    Continue
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})
