"use client"

import { useState, useCallback, useMemo } from "react"
import { createSelector } from "@reduxjs/toolkit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  MessageSquare,
  BarChart3,
  Award,
  TrendingUp,
  BookmarkIcon,
  Clock,
  Target,
  Zap,
  Trophy,
  Star,
  PlayCircle,
  Lock,
} from "lucide-react"

import { useAppSelector, useAppDispatch } from "@/store/hooks"
import type { RootState } from "@/store"
import { removeBookmark, type BookmarkItem, type CourseProgress } from "@/store/slices/course-slice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"
import CourseDetailsQuiz from "./CourseQuiz"
import CourseAISummary from "./CourseSummary"
import CertificateGenerator from "./CertificateGenerator"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export interface AccessLevels {
  isSubscribed: boolean
  isAuthenticated: boolean
  isAdmin: boolean
}

interface CourseDetailsTabsProps {
  course: FullCourseType
  currentChapter?: FullChapterType
  accessLevels?: AccessLevels
  onSeekToBookmark?: (time: number, title?: string) => void
}

export default function CourseDetailsTabs({
  course,
  currentChapter,
  accessLevels,
  onSeekToBookmark,
}: CourseDetailsTabsProps) {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState("summary")

  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)

  // Memoized selectors to prevent unnecessary re-renders caused by new object references
  const selectBookmarks = useMemo(
    () =>
      createSelector(
        [(state: RootState) => state.course.bookmarks, (state: RootState) => currentVideoId],
        (bookmarks: Record<string, BookmarkItem[]>, videoId: string | null): BookmarkItem[] => {
          if (!videoId || !bookmarks[videoId]) {
            return []
          }
          return bookmarks[videoId]
        },
      ),
    [currentVideoId],
  )

  const bookmarks = useAppSelector(selectBookmarks)

  // Create memoized selector for course progress to prevent unnecessary re-renders
  const selectCourseProgress = useMemo(
    () =>
      createSelector(
        [(state: RootState) => state.course.courseProgress, () => course.id],
        (
          courseProgressMap: Record<string | number, CourseProgress>,
          courseId: string | number,
        ): CourseProgress | undefined => {
          return courseProgressMap[courseId]
        },
      ),
    [course.id],
  )

  const courseProgress = useAppSelector(selectCourseProgress)

  const courseStats = useMemo(() => {
    const totalChapters = course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0
    const completedChapters = courseProgress?.completedChapters?.length || 0
    const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

    // Calculate estimated time to completion
    const averageChapterTime = 15 // minutes
    const remainingChapters = totalChapters - completedChapters
    const estimatedTimeLeft = remainingChapters * averageChapterTime

    // Calculate learning streak
    const learningStreak = 5 // This would come from actual data

    // Calculate skill level based on progress
    let skillLevel = "Beginner"
    if (progressPercentage >= 75) skillLevel = "Advanced"
    else if (progressPercentage >= 50) skillLevel = "Intermediate"
    else if (progressPercentage >= 25) skillLevel = "Novice"

    return {
      totalChapters,
      completedChapters,
      progressPercentage,
      remainingChapters,
      estimatedTimeLeft,
      learningStreak,
      skillLevel,
      totalBookmarks: bookmarks.length,
    }
  }, [course.courseUnits, courseProgress?.completedChapters, bookmarks.length])

  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds)) return "0:00"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`
  }, [])

  const formatDuration = useCallback((minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }, [])

  const handleRemoveBookmark = useCallback(
    (bookmarkId: string) => {
      if (currentVideoId) {
        dispatch(removeBookmark({ videoId: currentVideoId, bookmarkId }))
      }
    },
    [currentVideoId, dispatch],
  )

  const handleSeekToBookmark = useCallback(
    (time: number) => {
      if (onSeekToBookmark) {
        onSeekToBookmark(time)
      }
    },
    [onSeekToBookmark],
  )

  function CertificateButton({ courseTitle }: { courseTitle: string }) {
    const safeCourse = courseTitle?.trim() || "Course"
    const fileName = `${safeCourse.replace(/\s+/g, "_")}_Certificate.pdf`
    return (
      <PDFDownloadLink
        document={<CertificateGenerator courseName={safeCourse} userName={undefined} />}
        fileName={fileName}
        className="w-full"
      >
        {({ loading }) => (
          <Button
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                Preparing...
              </>
            ) : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Download Certificate
              </>
            )}
          </Button>
        )}
      </PDFDownloadLink>
    )
  }

  const ProgressVisualization = () => (
    <div className="space-y-6">
      {/* Main Progress Ring */}
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted/30"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="50"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="text-primary"
              strokeDasharray={`${2 * Math.PI * 50}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 50 * (1 - courseStats.progressPercentage / 100),
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{courseStats.progressPercentage}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Milestones */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 p-4 rounded-xl border border-blue-200/50 dark:border-blue-800/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{courseStats.completedChapters}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Chapters Done</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 p-4 rounded-xl border border-green-200/50 dark:border-green-800/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-green-900 dark:text-green-100">
                {formatDuration(courseStats.estimatedTimeLeft)}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Time Left</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 p-4 rounded-xl border border-purple-200/50 dark:border-purple-800/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">{courseStats.learningStreak}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Day Streak</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 p-4 rounded-xl border border-orange-200/50 dark:border-orange-800/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <BookmarkIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-orange-900 dark:text-orange-100">{courseStats.totalBookmarks}</div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Bookmarks</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Skill Level Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <Badge
          variant="secondary"
          className={cn(
            "px-4 py-2 text-sm font-medium",
            courseStats.skillLevel === "Advanced" &&
              "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
            courseStats.skillLevel === "Intermediate" &&
              "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
            courseStats.skillLevel === "Novice" &&
              "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
            courseStats.skillLevel === "Beginner" &&
              "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800",
          )}
        >
          {courseStats.skillLevel === "Advanced" && <Star className="h-4 w-4 mr-1" />}
          {courseStats.skillLevel === "Intermediate" && <Trophy className="h-4 w-4 mr-1" />}
          {courseStats.skillLevel === "Novice" && <Target className="h-4 w-4 mr-1" />}
          {courseStats.skillLevel === "Beginner" && <PlayCircle className="h-4 w-4 mr-1" />}
          {courseStats.skillLevel} Level
        </Badge>
      </motion.div>
    </div>
  )

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full w-full flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-4 h-16 bg-muted/30 rounded-none flex-shrink-0 border-b border-border/30 p-1">
          <TabsTrigger
            value="summary"
            className="flex items-center gap-2 text-sm h-12 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/40 transition-all rounded-lg font-medium"
          >
            <FileText className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Summary</span>
          </TabsTrigger>
          <TabsTrigger
            value="quiz"
            className="flex items-center gap-2 text-sm h-12 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/40 transition-all rounded-lg font-medium"
          >
            <MessageSquare className="h-4 w-4 text-purple-500" />
            <span className="hidden sm:inline">Quiz</span>
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            className="flex items-center gap-2 text-sm h-12 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/40 transition-all rounded-lg font-medium"
          >
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Progress</span>
          </TabsTrigger>
          <TabsTrigger
            value="bookmarks"
            className="flex items-center gap-2 text-sm h-12 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/40 transition-all rounded-lg font-medium"
          >
            <BookmarkIcon className="h-4 w-4 text-amber-600" />
            <span className="hidden sm:inline">Bookmarks</span>
          </TabsTrigger>
        </TabsList>

        {/* Tabs Content */}
        <TabsContent value="summary" className="h-full overflow-auto p-4">
          {currentChapter ? (
            <CourseAISummary
              chapterId={currentChapter.id}
              name={currentChapter.title || currentChapter.name || "Chapter Summary"}
              existingSummary={currentChapter.summary || null}
              hasAccess={Boolean(accessLevels?.isSubscribed || currentChapter?.isFree)}
              isAdmin={accessLevels?.isAdmin}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 opacity-50" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">No Chapter Selected</h3>
                  <p className="text-sm max-w-sm">
                    Select a chapter from the playlist to view AI-generated summary and insights
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quiz" className="h-full overflow-auto p-4">
          {currentChapter ? (
            <CourseDetailsQuiz
              key={currentChapter.id}
              course={course}
              chapter={currentChapter}
              accessLevels={{
                ...accessLevels!,
                isSubscribed: Boolean(accessLevels?.isSubscribed || (currentChapter as any)?.isFreeQuiz === true),
              }}
              isPublicCourse={course.isPublic || false}
              chapterId={currentChapter.id.toString()}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="h-8 w-8 opacity-50" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">No Chapter Selected</h3>
                  <p className="text-sm max-w-sm">
                    Select a chapter from the playlist to take interactive quizzes and test your knowledge
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="h-full overflow-auto p-4">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2"
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Learning Progress
              </h2>
              <p className="text-muted-foreground">Track your journey through {course.title}</p>
            </motion.div>

            <Card className="border-none shadow-lg bg-gradient-to-br from-background to-muted/20">
              <CardContent className="p-6">
                <ProgressVisualization />
              </CardContent>
            </Card>

            <AnimatePresence>
              {courseStats.progressPercentage === 100 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 animate-pulse" />
                  <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 relative">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <motion.div
                          animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                            <Trophy className="h-8 w-8 text-white" />
                          </div>
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-1">
                            Congratulations! Course Completed!
                          </h3>
                          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                            You've successfully completed all {courseStats.totalChapters} chapters. Time to celebrate
                            your achievement!
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <CertificateButton courseTitle={course.title} />
                            <Button
                              variant="outline"
                              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/20 bg-transparent"
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Share Achievement
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {courseStats.progressPercentage > 0 && courseStats.progressPercentage < 100 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Learning Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Next Milestone</span>
                          <span className="font-medium">
                            {courseStats.progressPercentage < 25
                              ? "25%"
                              : courseStats.progressPercentage < 50
                                ? "50%"
                                : courseStats.progressPercentage < 75
                                  ? "75%"
                                  : "100%"}
                          </span>
                        </div>
                        <Progress value={courseStats.progressPercentage} className="h-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {courseStats.remainingChapters}
                        </div>
                        <div className="text-sm text-muted-foreground">chapters to go</div>
                      </div>
                    </div>

                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Keep Going!</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        You're making great progress! At your current pace, you'll complete this course in approximately{" "}
                        {formatDuration(courseStats.estimatedTimeLeft)}.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookmarks" className="h-full overflow-auto p-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookmarkIcon className="h-5 w-5 text-amber-500" />
                Video Bookmarks
              </CardTitle>
              <CardDescription>
                {bookmarks.length > 0
                  ? `${bookmarks.length} bookmark${bookmarks.length !== 1 ? "s" : ""} saved for this video`
                  : "Save important moments while watching to review them later"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {accessLevels?.isAuthenticated && bookmarks.length > 0 ? (
                <div className="space-y-3">
                  {bookmarks.map((bookmark, index) => (
                    <motion.div
                      key={bookmark.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSeekToBookmark(bookmark.time)}
                      className="group flex items-center justify-between p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg cursor-pointer hover:from-amber-100/50 hover:to-orange-100/50 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-all duration-200 border border-amber-200/50 dark:border-amber-800/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                            >
                              {formatTime(bookmark.time)}
                            </Badge>
                            <Clock className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <p className="font-medium text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                            {bookmark.title}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveBookmark(bookmark.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      >
                        Remove
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : accessLevels?.isAuthenticated ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookmarkIcon className="h-10 w-10 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No bookmarks yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                    While watching videos, press 'B' or click the bookmark button to save important moments
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
                  >
                    Press B to bookmark
                  </Badge>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Sign in to save bookmarks</h3>
                  <p className="text-muted-foreground mb-4">
                    Create an account to bookmark important video moments and track your progress
                  </p>
                  <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                    Sign In
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
