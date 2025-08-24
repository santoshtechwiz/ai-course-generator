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
  CheckCircle,
  Calendar,
  Flame,
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
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)

  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)

  // Memoized selectors to prevent unnecessary re-renders
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

  // Enhanced selector for course progress
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

  // Enhanced course statistics calculation
  const courseStats = useMemo(() => {
    const totalChapters = course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0
    const completedChapters = courseProgress?.completedChapters?.length || 0
    const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

    // Calculate total course duration (if available in your data structure)
    const totalDuration =
      course.courseUnits?.reduce((acc, unit) => {
        return (
          acc +
          unit.chapters.reduce((chapterAcc, chapter) => {
            // Assuming chapter has duration property, adjust according to your data structure
            return chapterAcc + (chapter.duration || 15) // fallback to 15 minutes
          }, 0)
        )
      }, 0) || totalChapters * 15

    // Calculate completed duration
    const completedDuration = completedChapters * 15 // This should be calculated from actual completed chapter durations

    // Calculate estimated time to completion
    const remainingChapters = totalChapters - completedChapters
    const estimatedTimeLeft = remainingChapters * 15 // minutes

    // Calculate learning streak (this should come from your actual data)
    const learningStreak = courseProgress?.learningStreak || 0

    // Calculate skill level based on progress with better logic
    let skillLevel = "Beginner"
    if (progressPercentage >= 90) skillLevel = "Expert"
    else if (progressPercentage >= 75) skillLevel = "Advanced"
    else if (progressPercentage >= 50) skillLevel = "Intermediate"
    else if (progressPercentage >= 25) skillLevel = "Novice"

    // Calculate study time this week
    const studyTimeThisWeek = courseProgress?.studyTimeThisWeek || 0

    // Calculate average score from completed quizzes
    const averageScore = courseProgress?.averageQuizScore || 0

    return {
      totalChapters,
      completedChapters,
      progressPercentage,
      remainingChapters,
      estimatedTimeLeft,
      totalDuration,
      completedDuration,
      learningStreak,
      skillLevel,
      totalBookmarks: bookmarks.length,
      studyTimeThisWeek,
      averageScore,
      lastActivityDate: courseProgress?.lastActivityDate || null,
    }
  }, [course.courseUnits, courseProgress, bookmarks.length])

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

  // Get skill level styling
  const getSkillLevelStyling = (level: string) => {
    switch (level) {
      case "Expert":
        return {
          badge:
            "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300 dark:border-purple-800",
          icon: Star,
        }
      case "Advanced":
        return {
          badge:
            "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200 dark:from-emerald-900/30 dark:to-teal-900/30 dark:text-emerald-300 dark:border-emerald-800",
          icon: Trophy,
        }
      case "Intermediate":
        return {
          badge:
            "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-300 dark:border-blue-800",
          icon: Target,
        }
      case "Novice":
        return {
          badge:
            "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-300 dark:border-amber-800",
          icon: Zap,
        }
      default:
        return {
          badge:
            "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-200 dark:from-slate-900/30 dark:to-gray-900/30 dark:text-slate-300 dark:border-slate-800",
          icon: PlayCircle,
        }
    }
  }

  const tabVariants = {
    inactive: {
      scale: 1,
      y: 0,
      backgroundColor: "transparent",
      transition: { duration: 0.2, ease: "easeOut" },
    },
    active: {
      scale: 1.02,
      y: -2,
      backgroundColor: "hsl(var(--background))",
      transition: { duration: 0.2, ease: "easeOut" },
    },
    hover: {
      scale: 1.01,
      y: -1,
      transition: { duration: 0.15, ease: "easeOut" },
    },
  }

  const iconVariants = {
    inactive: {
      rotate: 0,
      scale: 1,
      transition: { duration: 0.2, ease: "easeOut" },
    },
    active: {
      rotate: 5,
      scale: 1.1,
      transition: { duration: 0.2, ease: "easeOut" },
    },
    hover: {
      rotate: 2,
      scale: 1.05,
      transition: { duration: 0.15, ease: "easeOut" },
    },
  }

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
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg transition-all duration-200"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
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

  const ProgressVisualization = () => {
    const skillStyling = getSkillLevelStyling(courseStats.skillLevel)
    const SkillIcon = skillStyling.icon

    return (
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
                <div className="text-2xl font-bold text-foreground">{courseStats.progressPercentage}%</div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{courseStats.completedChapters}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{formatDuration(courseStats.estimatedTimeLeft)}</div>
                <div className="text-sm text-muted-foreground">Remaining</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{courseStats.learningStreak}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                <BookmarkIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{courseStats.totalBookmarks}</div>
                <div className="text-sm text-muted-foreground">Bookmarks</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Study Time This Week</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-primary">{formatDuration(courseStats.studyTimeThisWeek)}</div>
            <div className="text-sm text-muted-foreground">Keep up the great work!</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Quiz Average</span>
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-primary">{courseStats.averageScore}%</div>
            <div className="text-sm text-muted-foreground">
              {courseStats.averageScore >= 80
                ? "Excellent!"
                : courseStats.averageScore >= 60
                  ? "Good work!"
                  : "Keep practicing!"}
            </div>
          </motion.div>
        </div>

        {/* Skill Level Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <Badge variant="secondary" className={cn("px-4 py-2 text-sm font-medium", skillStyling.badge)}>
            <SkillIcon className="h-4 w-4 mr-1" />
            {courseStats.skillLevel} Level
          </Badge>
        </motion.div>

        {/* Time Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-card border rounded-lg p-4"
        >
          <h4 className="font-medium text-foreground mb-3">Course Progress</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium text-foreground">
                {formatDuration(courseStats.completedDuration)} / {formatDuration(courseStats.totalDuration)}
              </span>
            </div>
            <Progress value={(courseStats.completedDuration / courseStats.totalDuration) * 100} className="h-2" />
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full w-full flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-4 h-18 bg-gradient-to-r from-muted/30 via-muted/40 to-muted/30 rounded-xl flex-shrink-0 border border-border/40 p-2 backdrop-blur-sm shadow-inner">
          {[
            { value: "summary", icon: FileText, label: "Summary", color: "from-blue-500/10 to-blue-600/20" },
            { value: "quiz", icon: MessageSquare, label: "Quiz", color: "from-green-500/10 to-green-600/20" },
            { value: "progress", icon: BarChart3, label: "Progress", color: "from-purple-500/10 to-purple-600/20" },
            { value: "bookmarks", icon: BookmarkIcon, label: "Bookmarks", color: "from-amber-500/10 to-amber-600/20" },
          ].map(({ value, icon: Icon, label, color }) => (
            <TabsTrigger
              key={value}
              value={value}
              onMouseEnter={() => setHoveredTab(value)}
              onMouseLeave={() => setHoveredTab(null)}
              className="relative flex items-center gap-3 text-sm h-14 data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-border/50 transition-all rounded-xl font-medium overflow-hidden group px-4"
            >
              <motion.div
                variants={tabVariants}
                animate={activeTab === value ? "active" : hoveredTab === value ? "hover" : "inactive"}
                className="absolute inset-0 rounded-xl"
              />
              <motion.div
                variants={iconVariants}
                animate={activeTab === value ? "active" : hoveredTab === value ? "hover" : "inactive"}
                className={cn(
                  "relative z-10 p-2 rounded-lg transition-all duration-200",
                  activeTab === value ? `bg-gradient-to-br ${color} shadow-sm` : "bg-transparent",
                )}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              <span className="hidden sm:inline relative z-10 font-medium">{label}</span>

              {activeTab === value && (
                <motion.div
                  layoutId="activeTabGlow"
                  className={cn("absolute inset-0 rounded-xl", `bg-gradient-to-br ${color}`)}
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent key={activeTab} value="summary" className="h-full overflow-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 h-full"
            >
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
                    className="text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500/15 to-blue-600/25 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                      <FileText className="h-10 w-10 text-blue-500" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-foreground">No Chapter Selected</h3>
                      <p className="text-sm max-w-sm text-muted-foreground/90 leading-relaxed">
                        Select a chapter from the playlist to view AI-generated summary and insights
                      </p>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent key={activeTab} value="quiz" className="h-full overflow-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 h-full"
            >
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
                    className="text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500/15 to-green-600/25 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                      <MessageSquare className="h-10 w-10 text-green-500" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-foreground">No Chapter Selected</h3>
                      <p className="text-sm max-w-sm text-muted-foreground/90 leading-relaxed">
                        Select a chapter from the playlist to take interactive quizzes and test your knowledge
                      </p>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent key={activeTab} value="progress" className="h-full overflow-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-3"
              >
                <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  Learning Progress
                </h2>
                <p className="text-muted-foreground/90 leading-relaxed">Track your journey through {course.title}</p>
              </motion.div>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card/98 to-card/95 ring-1 ring-border/10">
                <CardContent className="p-8">
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
                    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 relative">
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
                            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
                              <Trophy className="h-8 w-8 text-primary-foreground" />
                            </div>
                          </motion.div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-foreground mb-1">
                              Congratulations! Course Completed!
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              You've successfully completed all {courseStats.totalChapters} chapters. Time to celebrate
                              your achievement!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <CertificateButton courseTitle={course.title} />
                              <Button variant="outline" className="bg-transparent">
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
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card/98 to-card/95 ring-1 ring-border/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-primary" />
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
                          <div className="text-2xl font-bold text-primary">{courseStats.remainingChapters}</div>
                          <div className="text-sm text-muted-foreground">chapters to go</div>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-4 border">
                        <h4 className="font-medium text-foreground mb-2">Keep Going!</h4>
                        <p className="text-sm text-muted-foreground">
                          You're making great progress! At your current pace, you'll complete this course in
                          approximately {formatDuration(courseStats.estimatedTimeLeft)}.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent key={activeTab} value="bookmarks" className="h-full overflow-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card/98 to-card/95 ring-1 ring-border/10">
                <CardHeader className="pb-6 pt-8 px-8">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-br from-amber-500/15 to-amber-600/25 rounded-xl">
                      <BookmarkIcon className="h-6 w-6 text-amber-500" />
                    </div>
                    <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      Video Bookmarks
                    </span>
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {bookmarks.length > 0
                      ? `${bookmarks.length} bookmark${bookmarks.length !== 1 ? "s" : ""} saved for this video`
                      : "Save important moments while watching to review them later"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-8 pb-8">
                  {accessLevels?.isAuthenticated && bookmarks.length > 0 ? (
                    <div className="space-y-4">
                      {bookmarks.map((bookmark, index) => (
                        <motion.div
                          key={bookmark.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleSeekToBookmark(bookmark.time)}
                          className="group flex items-center justify-between p-6 bg-gradient-to-r from-background via-background/95 to-muted/30 border border-border/40 rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/40 hover:from-primary/8 hover:to-primary/15 hover:scale-[1.02]"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary/15 to-primary/25 rounded-2xl flex items-center justify-center text-primary font-bold shadow-lg text-lg">
                              {index + 1}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant="secondary"
                                  className="bg-primary/15 text-primary border-primary/30 px-3 py-1 text-sm font-medium"
                                >
                                  {formatTime(bookmark.time)}
                                </Badge>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors text-base">
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
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/15 hover:text-destructive rounded-xl px-4 py-2"
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
                      className="text-center py-16"
                    >
                      <div className="w-24 h-24 bg-gradient-to-br from-amber-500/15 to-amber-600/25 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <BookmarkIcon className="h-12 w-12 text-amber-500" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-foreground">No bookmarks yet</h3>
                        <p className="text-muted-foreground/90 mb-6 max-w-sm mx-auto leading-relaxed">
                          While watching videos, press 'B' or click the bookmark button to save important moments
                        </p>
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary border-primary/30 px-4 py-2 text-sm font-medium"
                        >
                          Press B to bookmark
                        </Badge>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-16"
                    >
                      <div className="w-24 h-24 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Lock className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-foreground">Sign in to save bookmarks</h3>
                        <p className="text-muted-foreground/90 mb-6 leading-relaxed">
                          Create an account to bookmark important video moments and track your progress
                        </p>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium">
                          Sign In
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  )
}
