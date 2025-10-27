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

export function CourseNotificationsMenu({ className }: CourseNotificationMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { incompleteQuizzes } = useIncompleteQuizzes()

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
            "relative h-10 w-10 border-0 bg-transparent hover:bg-[var(--color-muted)]",
            "transition-all duration-150 active:scale-95",
            className
          )}
        >
          <Bell className="h-5 w-5" />
          
          {hasNotifications && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center border-4 border-[var(--color-border)] bg-[var(--color-error)] text-white text-xs font-black shadow-[2px_2px_0_var(--shadow-color)]"
            >
              {totalNotifications > 9 ? "9+" : totalNotifications}
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-80 border-6 border-[var(--color-border)] bg-[var(--color-card)] shadow-[8px_8px_0_var(--shadow-color)] rounded-none p-0"
      >
        <DropdownMenuLabel className="flex items-center gap-2 p-4 border-b-6 border-[var(--color-border)] bg-[var(--color-bg)] font-black text-base uppercase tracking-wider">
          <Bell className="h-5 w-5" />
          Learning Activity
        </DropdownMenuLabel>

        <AnimatePresence mode="wait">
          {!hasNotifications ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 text-center"
            >
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-[var(--color-success)]" />
              <p className="font-black text-lg mb-1">All caught up! 🎉</p>
              <p className="text-sm text-[var(--color-text)] opacity-70">No pending courses or quizzes</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-h-96 overflow-y-auto"
            >
              {incompleteCourses > 0 && (
                <div className="p-3">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wider opacity-70">
                    <BookOpen className="h-4 w-4" />
                    <span>Incomplete Courses ({incompleteCourses})</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(courseProgress || {})
                      .filter(([_, progress]: [string, any]) => progress?.videoProgress && !progress.videoProgress.isCompleted)
                      .slice(0, 3)
                      .map(([courseId, progress]: [string, any]) => (
                        <motion.div
                          key={courseId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 border-4 border-[var(--color-border)] bg-[var(--color-bg)] shadow-[3px_3px_0_var(--shadow-color)] cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--shadow-color)] transition-all duration-150"
                          onClick={() => {
                            setIsOpen(false)
                            router.push(`/dashboard/course/${courseId}`)
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="truncate font-black text-sm">Resume Lesson</span>
                            <Badge 
                              variant="default" 
                              className="text-xs font-black border-3 border-[var(--color-border)] bg-[var(--color-primary)] text-white shadow-[2px_2px_0_var(--shadow-color)] rounded-none px-2 py-1"
                            >
                              {Math.round((progress.videoProgress.progress || 0) * 100)}%
                            </Badge>
                          </div>
                          <p className="text-xs opacity-70 truncate">
                            Chapter: {progress.videoProgress.currentChapterId || "N/A"}
                          </p>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}

              {incompleteQuizzes && incompleteQuizzes.length > 0 && (
                <>
                  {incompleteCourses > 0 && (
                    <div className="h-0 border-t-4 border-[var(--color-border)]" />
                  )}
                  <div className="p-3">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wider opacity-70">
                      <Play className="h-4 w-4" />
                      <span>Pending Quizzes ({incompleteQuizzes.length})</span>
                    </div>
                    <div className="space-y-2">
                      {incompleteQuizzes.slice(0, 3).map((quiz: any) => (
                        <motion.div
                          key={`quiz-${quiz.courseId}-${quiz.chapterId}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 border-4 border-[var(--color-border)] bg-[var(--color-bg)] shadow-[3px_3px_0_var(--shadow-color)] cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--shadow-color)] transition-all duration-150"
                          onClick={() => {
                            setIsOpen(false)
                            router.push(`/dashboard/course/${quiz.courseId}?quiz=${quiz.chapterId}`)
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="truncate font-black text-sm">Quiz #{quiz.chapterId}</span>
                            <Badge 
                              variant="default" 
                              className="text-xs font-black border-3 border-[var(--color-border)] bg-[var(--color-accent)] text-white shadow-[2px_2px_0_var(--shadow-color)] rounded-none px-2 py-1"
                            >
                              Q{quiz.currentQuestionIndex + 1}/10
                            </Badge>
                          </div>
                          <p className="text-xs opacity-70">
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

        <div className="h-0 border-t-6 border-[var(--color-border)]" />
        <div className="p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sm font-black uppercase tracking-wider border-4 border-[var(--color-border)] bg-[var(--color-bg)] shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_var(--shadow-color)] transition-all duration-150 rounded-none"
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