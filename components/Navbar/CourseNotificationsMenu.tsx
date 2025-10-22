"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, BookOpen, Play, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/modules/auth"
import { useAppSelector } from "@/store/hooks"
import { cn } from "@/lib/utils"
import { useIncompleteQuizzes } from "@/lib/storage"

interface CourseNotificationMenuProps {
  className?: string
}

/**
 * Simple Course Notifications Bell
 * Shows:
 * - Incomplete courses count
 * - Pending quizzes count
 * - Quick links to resume courses/quizzes
 */
export function CourseNotificationsMenu({ className }: CourseNotificationMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { incompleteQuizzes } = useIncompleteQuizzes()

  // Get incomplete courses count from Redux
  const courseProgress = useAppSelector((state) => state.courseProgress.byCourseId)
  
  const incompleteCourses = Object.entries(courseProgress || {})
    .filter(([_, progress]: [string, any]) => progress?.videoProgress && !progress.videoProgress.isCompleted)
    .length

  const totalNotifications = incompleteCourses + (incompleteQuizzes?.length || 0)
  const hasNotifications = totalNotifications > 0

  if (!user) return null

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
        >
          <Bell className="h-4 w-4" />
          
          {/* Notification badge */}
          {hasNotifications && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full"
            >
              {totalNotifications > 9 ? "9+" : totalNotifications}
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Learning Activity
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <AnimatePresence mode="wait">
          {!hasNotifications ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 text-center text-sm text-muted-foreground"
            >
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="font-medium">All caught up! ���</p>
              <p className="text-xs mt-1">No pending courses or quizzes</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-h-96 overflow-y-auto"
            >
              {/* Incomplete Courses */}
              {incompleteCourses > 0 && (
                <div className="px-2 py-2">
                  <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Incomplete Courses ({incompleteCourses})</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(courseProgress || {})
                      .filter(([_, progress]: [string, any]) => progress?.videoProgress && !progress.videoProgress.isCompleted)
                      .slice(0, 3)
                      .map(([courseId, progress]: [string, any]) => (
                        <motion.div
                          key={courseId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="px-2 py-1.5 text-xs rounded hover:bg-accent cursor-pointer"
                          onClick={() => {
                            setIsOpen(false)
                            router.push(`/dashboard/course/${courseId}`)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate font-medium">Resume Lesson</span>
                            <Badge variant="default" className="text-xs">
                              {Math.round((progress.videoProgress.progress || 0) * 100)}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            Chapter: {progress.videoProgress.currentChapterId || "N/A"}
                          </p>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}

              {/* Pending Quizzes */}
              {incompleteQuizzes && incompleteQuizzes.length > 0 && (
                <>
                  {incompleteCourses > 0 && <DropdownMenuSeparator />}
                  <div className="px-2 py-2">
                    <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-muted-foreground">
                      <Play className="h-3.5 w-3.5" />
                      <span>Pending Quizzes ({incompleteQuizzes.length})</span>
                    </div>
                    <div className="space-y-1">
                      {incompleteQuizzes.slice(0, 3).map((quiz: any) => (
                        <motion.div
                          key={`quiz-${quiz.courseId}-${quiz.chapterId}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="px-2 py-1.5 text-xs rounded hover:bg-accent cursor-pointer"
                          onClick={() => {
                            setIsOpen(false)
                            router.push(`/dashboard/course/${quiz.courseId}?quiz=${quiz.chapterId}`)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate font-medium">Quiz #{quiz.chapterId}</span>
                            <Badge variant="default" className="text-xs">
                              Q{quiz.currentQuestionIndex + 1}/10
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Progress: {Math.round((quiz.currentQuestionIndex / 10) * 100)}%
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              setIsOpen(false)
              router.push("/dashboard")
            }}
          >
            View All Courses
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default CourseNotificationsMenu
