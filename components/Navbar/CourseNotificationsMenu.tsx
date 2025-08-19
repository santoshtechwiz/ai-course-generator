"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Bell, BookOpen, Play, Clock, CheckCircle, AlertCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/modules/auth"
import { useAppSelector } from "@/store/hooks"
import { makeSelectCourseProgressById } from "@/store/slices/courseProgress-slice"
import { cn } from "@/lib/utils"

interface CourseNotification {
  id: string
  type: 'incomplete_course' | 'pending_quiz' | 'course_reminder'
  title: string
  description: string
  courseId: string
  courseSlug: string
  chapterId?: string
  quizId?: string
  progress: number
  lastAccessed: Date
  priority: 'high' | 'medium' | 'low'
}

interface CourseData {
  id: string
  slug: string
  title: string
  description?: string
}

interface CourseNotificationsMenuProps {
  className?: string
}

// Hook to fetch course data
const useCourseData = (courseIds: string[], shouldFetch: boolean) => {
  const [courseData, setCourseData] = useState<Record<string, CourseData>>({})
  const [loading, setLoading] = useState(false)

  const fetchCourseData = useCallback(async () => {
    if (courseIds.length === 0) return
    setLoading(true)
    try {
      const response = await fetch('/api/courses/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseIds }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (result.success && result.data) {
        setCourseData(result.data)
      } else {
        console.warn('Invalid course data response:', result)
      }
    } catch (error) {
      console.error('Failed to fetch course data:', error)
      setCourseData({})
    } finally {
      setLoading(false)
    }
  }, [courseIds])

  useEffect(() => {
    if (shouldFetch) {
      fetchCourseData()
    }
  }, [shouldFetch, fetchCourseData])

  return { courseData, loading, fetchCourseData }
}

export default function CourseNotificationsMenu({ className }: CourseNotificationsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<CourseNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  // Get all course progress from Redux
  const courseProgress = useAppSelector((state) => state.courseProgress.byCourseId)

  // Get course IDs for fetching course data
  const courseIds = useMemo(() => {
    if (!courseProgress) return []
    return Object.keys(courseProgress).filter(courseId => {
      const progress = courseProgress[courseId]
      return progress && !progress.isCourseCompleted
    })
  }, [courseProgress])

  // Fetch course data only when dropdown is opened
  const { courseData, loading: courseDataLoading, fetchCourseData } = useCourseData(courseIds, false)

  // Generate notifications from course progress
  const generateNotifications = useCallback(() => {
    if (!user || !courseProgress) return []

    const notifications: CourseNotification[] = []
    const now = Date.now()
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

    Object.entries(courseProgress).forEach(([courseId, progress]) => {
      // Skip if course is completed
      if (progress.isCourseCompleted) return

      // Calculate progress percentage (this would need to be calculated based on total chapters)
      const progressPercentage = progress.completedLectures.length > 0 ? 
        (progress.completedLectures.length / 10) * 100 : 0 // Assuming 10 chapters per course

      // Check if course was accessed recently
      const lastAccessed = progress.lastUpdatedAt ? new Date(progress.lastUpdatedAt) : new Date(oneWeekAgo)
      const isRecentlyAccessed = progress.lastUpdatedAt && progress.lastUpdatedAt > oneWeekAgo

      if (progressPercentage < 100) {
        // Get course data from the fetched course data
        const courseInfo = courseData[courseId]
        
        // Only create notification if we have course data or if it's still loading
        if (courseInfo || courseDataLoading) {
          const courseSlug = courseInfo?.slug || `course-${courseId}`
          const courseTitle = courseInfo?.title || `Course ${courseId}`
          
          notifications.push({
            id: `course-${courseId}`,
            type: 'incomplete_course',
            title: `Continue Learning: ${courseTitle}`,
            description: `You're ${Math.round(progressPercentage)}% through this course`,
            courseId,
            courseSlug: courseSlug,
            chapterId: progress.lastLectureId || undefined,
            progress: progressPercentage,
            lastAccessed,
            priority: isRecentlyAccessed ? 'high' : 'medium'
          })
        }
      }

      // Add quiz notifications (this would come from quiz progress data)
      // For now, we'll add a placeholder
      if (progressPercentage > 50 && progressPercentage < 100) {
        const courseInfo = courseData[courseId]
        
        // Only create quiz notification if we have course data
        if (courseInfo) {
          const courseSlug = courseInfo.slug
          const courseTitle = courseInfo.title
          
          notifications.push({
            id: `quiz-${courseId}`,
            type: 'pending_quiz',
            title: `Take Quiz: ${courseTitle}`,
            description: `Test your knowledge with the course quiz`,
            courseId,
            courseSlug: courseSlug,
            quizId: `quiz-${courseId}`,
            progress: progressPercentage,
            lastAccessed,
            priority: 'high'
          })
        }
      }
    })

    // Sort by priority and last accessed
    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.lastAccessed.getTime() - a.lastAccessed.getTime()
    })
  }, [user, courseProgress, courseData, courseDataLoading])

  // Update notifications when course progress changes
  useEffect(() => {
    const newNotifications = generateNotifications()
    setNotifications(newNotifications)
    setUnreadCount(newNotifications.filter(n => n.priority === 'high').length)
  }, [generateNotifications])

  // Handle notification click
  const handleNotificationClick = useCallback((notification: CourseNotification) => {
    setIsOpen(false)
    
    try {
      switch (notification.type) {
        case 'incomplete_course':
          // Navigate to course with specific chapter if available
          if (notification.chapterId && notification.courseSlug) {
            router.push(`/dashboard/course/${notification.courseSlug}?chapter=${notification.chapterId}`)
          } else if (notification.courseSlug) {
            router.push(`/dashboard/course/${notification.courseSlug}`)
          } else {
            console.warn('Missing course slug for notification:', notification)
            router.push('/dashboard/courses')
          }
          break
        case 'pending_quiz':
          if (notification.quizId) {
            router.push(`/dashboard/quiz/${notification.quizId}`)
          } else {
            console.warn('Missing quiz ID for notification:', notification)
            router.push('/dashboard/quizzes')
          }
          break
        case 'course_reminder':
          // Navigate to course with specific chapter if available
          if (notification.chapterId && notification.courseSlug) {
            router.push(`/dashboard/course/${notification.courseSlug}?chapter=${notification.chapterId}`)
          } else if (notification.courseSlug) {
            router.push(`/dashboard/course/${notification.courseSlug}`)
          } else {
            console.warn('Missing course slug for notification:', notification)
            router.push('/dashboard/courses')
          }
          break
        default:
          console.warn('Unknown notification type:', notification.type)
          router.push('/dashboard/courses')
      }
    } catch (error) {
      console.error('Error navigating to notification:', error)
      // Fallback to courses page
      router.push('/dashboard/courses')
    }
  }, [router])

  // Get notification icon
  const getNotificationIcon = (type: CourseNotification['type']) => {
    switch (type) {
      case 'incomplete_course':
        return <BookOpen className="h-4 w-4" />
      case 'pending_quiz':
        return <Play className="h-4 w-4" />
      case 'course_reminder':
        return <Clock className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  // Get notification color
  const getNotificationColor = (priority: CourseNotification['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400'
      case 'medium':
        return 'text-orange-600 dark:text-orange-400'
      case 'low':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-muted-foreground'
    }
  }



  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-300",
            className
          )}
          onClick={() => {
            setIsOpen(true)
            fetchCourseData()
          }}
        >
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute -top-1 -right-1"
              >
                <Badge
                  variant="destructive"
                  className="h-5 min-w-5 flex items-center justify-center rounded-full px-1 text-[10px] font-medium"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
          <span className="sr-only">Course Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className="w-96 rounded-xl p-2 shadow-lg border border-border/50 backdrop-blur-sm bg-background/95"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Learning Progress</p>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Continue where you left off
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <AnimatePresence>
          {courseDataLoading ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 text-center"
            >
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Loading...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Fetching your course progress
              </p>
            </motion.div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 text-center"
            >
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No pending courses or quizzes
              </p>
            </motion.div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-1">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DropdownMenuItem
                    className="cursor-pointer flex flex-col items-start p-3 hover:bg-accent rounded-lg transition-colors duration-200"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex w-full items-start gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0",
                        getNotificationColor(notification.priority)
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm line-clamp-1">
                            {notification.title}
                          </span>
                          {notification.priority === 'high' && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              High
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {notification.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                                style={{ width: `${notification.progress}%` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${notification.progress}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(notification.progress)}%
                            </span>
                          </div>
                          
                          <span className="text-xs text-muted-foreground">
                            {notification.lastAccessed.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setIsOpen(false)
                  router.push('/dashboard/courses')
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                View All Courses
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}