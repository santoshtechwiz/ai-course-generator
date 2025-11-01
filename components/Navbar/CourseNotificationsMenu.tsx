"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell, BookOpen, Play, CheckCircle, ArrowRight } from "lucide-react"
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
}

export function CourseNotificationsMenu({ className }: CourseNotificationMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { incompleteQuizzes } = useIncompleteQuizzes()

  const courseProgress = useAppSelector((state) => state.courseProgress.byCourseId)

  const incompleteCourses = useMemo(() => {
    return Object.entries(courseProgress || {})
      .filter(([_, progress]: [string, any]) => progress?.videoProgress && !progress.videoProgress.isCompleted)
      .length
  }, [courseProgress])

  const totalNotifications = useMemo(() => {
    return incompleteCourses + (incompleteQuizzes?.length || 0)
  }, [incompleteCourses, incompleteQuizzes])

  const hasNotifications = totalNotifications > 0

  const handleCourseClick = useCallback((courseId: string) => {
    setIsOpen(false)
    router.push(`/dashboard/course/${courseId}`)
  }, [router])

  const handleQuizClick = useCallback((courseId: string, chapterId: string) => {
    setIsOpen(false)
    router.push(`/dashboard/course/${courseId}?quiz=${chapterId}`)
  }, [router])

  const handleViewAllCourses = useCallback(() => {
    setIsOpen(false)
    router.push("/dashboard")
  }, [router])

  if (!user) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label="Course notifications"
            className={cn(
              "relative h-10 w-10 border-3 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none",
              "shadow-[2px_2px_0_var(--shadow-color)]",
              "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--shadow-color)]",
              "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--shadow-color)]",
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
              className
            )}
          >
            <Bell className="h-5 w-5" />

            {hasNotifications && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={cn(
                  "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center",
                  "border-2 border-[var(--color-border)] rounded-none",
                  "bg-[var(--color-error)] text-white text-xs font-black",
                  "shadow-[1px_1px_0_var(--shadow-color)]"
                )}
              >
                {totalNotifications > 9 ? "9+" : totalNotifications}
              </motion.span>
            )}
          </Button>
        </motion.div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          "w-[90vw] sm:w-96 p-0 rounded-none",
          "border-4 border-[var(--color-border)] bg-[var(--color-card)]",
          "shadow-[4px_4px_0_var(--shadow-color)]",
          "z-[99]"
        )}
      >
        {/* Header */}
        <DropdownMenuLabel className="flex items-center gap-2 p-4 border-b-4 border-[var(--color-border)] bg-[var(--color-bg)] font-black text-sm uppercase tracking-wider">
          <Bell className="h-5 w-5 flex-shrink-0" />
          Learning Activity
        </DropdownMenuLabel>

        {/* Content */}
        <AnimatePresence mode="wait">
          {!hasNotifications ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-8 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-[var(--color-success)]" />
              </motion.div>
              <p className="font-black text-base mb-1 text-[var(--color-text)]">All caught up! 🎉</p>
              <p className="text-xs text-[var(--color-muted)]">No pending courses or quizzes</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-h-[60vh] overflow-y-auto"
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Incomplete Courses Section */}
                {incompleteCourses > 0 && (
                  <div className="p-3">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">
                      <BookOpen className="h-4 w-4 flex-shrink-0" />
                      <span>Incomplete Courses ({incompleteCourses})</span>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(courseProgress || {})
                        .filter(([_, progress]: [string, any]) => progress?.videoProgress && !progress.videoProgress.isCompleted)
                        .slice(0, 3)
                        .map(([courseId, progress]: [string, any]) => (
                          <motion.div
                            key={courseId}
                            variants={itemVariants}
                            onClick={() => handleCourseClick(courseId)}
                            className={cn(
                              "p-3 border-3 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none",
                              "shadow-[2px_2px_0_var(--shadow-color)] cursor-pointer",
                              "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--shadow-color)]",
                              "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--shadow-color)]",
                              "transition-all duration-150 group"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="truncate font-black text-sm text-[var(--color-text)]">
                                Resume Lesson
                              </span>
                              <Badge
                                className={cn(
                                  "text-xs font-black border-2 border-[var(--color-border)]",
                                  "bg-[var(--color-primary)] text-[var(--color-text)]",
                                  "shadow-[1px_1px_0_var(--shadow-color)] rounded-none px-2 py-0.5 flex-shrink-0"
                                )}
                              >
                                {Math.round((progress.videoProgress.progress || 0) * 100)}%
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-[var(--color-muted)] truncate">
                                Chapter: {progress.videoProgress.currentChapterId || "N/A"}
                              </p>
                              <ArrowRight className="h-3 w-3 flex-shrink-0 text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {incompleteCourses > 0 && incompleteQuizzes && incompleteQuizzes.length > 0 && (
                  <div className="h-0 border-t-3 border-[var(--color-border)]" />
                )}

                {/* Pending Quizzes Section */}
                {incompleteQuizzes && incompleteQuizzes.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">
                      <Play className="h-4 w-4 flex-shrink-0" />
                      <span>Pending Quizzes ({incompleteQuizzes.length})</span>
                    </div>

                    <div className="space-y-2">
                      {incompleteQuizzes.slice(0, 3).map((quiz: any) => (
                        <motion.div
                          key={`quiz-${quiz.courseId}-${quiz.chapterId}`}
                          variants={itemVariants}
                          onClick={() => handleQuizClick(quiz.courseId, quiz.chapterId)}
                          className={cn(
                            "p-3 border-3 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none",
                            "shadow-[2px_2px_0_var(--shadow-color)] cursor-pointer",
                            "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--shadow-color)]",
                            "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--shadow-color)]",
                            "transition-all duration-150 group"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="truncate font-black text-sm text-[var(--color-text)]">
                              Quiz #{quiz.chapterId}
                            </span>
                            <Badge
                              className={cn(
                                "text-xs font-black border-2 border-[var(--color-border)]",
                                "bg-[var(--color-accent)] text-[var(--color-text)]",
                                "shadow-[1px_1px_0_var(--shadow-color)] rounded-none px-2 py-0.5 flex-shrink-0"
                              )}
                            >
                              Q{quiz.currentQuestionIndex + 1}/10
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-[var(--color-muted)]">
                              Progress: {Math.round((quiz.currentQuestionIndex / 10) * 100)}%
                            </p>
                            <ArrowRight className="h-3 w-3 flex-shrink-0 text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="border-t-4 border-[var(--color-border)]">
          <motion.div
            className="p-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              className={cn(
                "w-full text-sm font-black uppercase tracking-wider rounded-none",
                "border-3 border-[var(--color-border)] bg-[var(--color-bg)]",
                "shadow-[2px_2px_0_var(--shadow-color)]",
                "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--shadow-color)]",
                "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--shadow-color)]",
                "transition-all duration-150 text-[var(--color-text)]"
              )}
              onClick={handleViewAllCourses}
            >
              View All Courses
            </Button>
          </motion.div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default CourseNotificationsMenu