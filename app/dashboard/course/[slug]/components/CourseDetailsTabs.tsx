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
import { useAuth } from "@/modules/auth"

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
  const { user } = useAuth()

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
        [(state: RootState) => state.course.userProgress, () => course.id, () => user?.id || 'guest'],
        (
          userProgressMap: Record<string, Record<string | number, CourseProgress>>,
          courseId: string | number,
          userId: string,
        ): CourseProgress | undefined => {
          return userProgressMap[userId]?.[courseId]
        },
      ),
    [course.id, user?.id],
  )

  const courseProgress = useAppSelector(selectCourseProgress)

  // Enhanced course statistics calculation
  const courseStats = useMemo(() => {
    const totalChapters = course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0
    const completedChapters = courseProgress?.completedChapters?.length || 0
    const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

    const totalDuration = course.courseUnits?.reduce((acc, unit) => {
      return acc + unit.chapters.reduce((chapterAcc, chapter) => {
        return chapterAcc + (typeof chapter.duration === 'number' ? chapter.duration : 15)
      }, 0)
    }, 0) || totalChapters * 15

    const completedDuration = completedChapters * 15
    const remainingChapters = totalChapters - completedChapters
    const estimatedTimeLeft = remainingChapters * 15
    const learningStreak = courseProgress?.learningStreak || 0

    let skillLevel = "Beginner"
    if (progressPercentage >= 90) skillLevel = "Expert"
    else if (progressPercentage >= 75) skillLevel = "Advanced"
    else if (progressPercentage >= 50) skillLevel = "Intermediate"
    else if (progressPercentage >= 25) skillLevel = "Novice"

    const studyTimeThisWeek = courseProgress?.studyTimeThisWeek || 0
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
          badge: "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300 dark:border-purple-800",
          icon: Star,
        }
      case "Advanced":
        return {
          badge: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200 dark:from-emerald-900/30 dark:to-teal-900/30 dark:text-emerald-300 dark:border-emerald-800",
          icon: Trophy,
        }
      case "Intermediate":
        return {
          badge: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-300 dark:border-blue-800",
          icon: Target,
        }
      case "Novice":
        return {
          badge: "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-300 dark:border-amber-800",
          icon: Zap,
        }
      default:
        return {
          badge: "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-200 dark:from-slate-900/30 dark:to-gray-900/30 dark:text-slate-300 dark:border-slate-800",
          icon: PlayCircle,
        }
    }
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
      <div className="space-y-8">
        {/* Main Progress Ring */}
        <div className="flex items-center justify-center">
          <div className="relative w-36 h-36">
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-muted/20"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="6"
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
                <div className="text-3xl font-bold text-foreground">{courseStats.progressPercentage}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border/40 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{courseStats.completedChapters}</div>
                <div className="text-sm text-muted-foreground font-medium">Completed</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border/40 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {formatDuration(courseStats.estimatedTimeLeft)}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Remaining</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border/40 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-orange-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{courseStats.learningStreak}</div>
                <div className="text-sm text-muted-foreground font-medium">Day Streak</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border/40 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-amber-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <BookmarkIcon className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{courseStats.totalBookmarks}</div>
                <div className="text-sm text-muted-foreground font-medium">Bookmarks</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-border/40 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-foreground">Study Time This Week</span>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-primary mb-2">{formatDuration(courseStats.studyTimeThisWeek)}</div>
            <div className="text-sm text-muted-foreground">Keep up the great work!</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card border border-border/40 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-foreground">Quiz Average</span>
              <Star className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-primary mb-2">{courseStats.averageScore}%</div>
            <div className="text-sm text-muted-foreground">
              {courseStats.averageScore >= 80 ? "Excellent!" : courseStats.averageScore >= 60 ? "Good work!" : "Keep practicing!"}
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
          <Badge variant="secondary" className={cn("px-6 py-3 text-base font-semibold", skillStyling.badge)}>
            <SkillIcon className="h-5 w-5 mr-2" />
            {courseStats.skillLevel} Level
          </Badge>
        </motion.div>

        {/* Course Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-card border border-border/40 rounded-xl p-6"
        >
          <h4 className="text-lg font-semibold text-foreground mb-4">Course Progress</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium text-foreground">
                {formatDuration(courseStats.completedDuration)} / {formatDuration(courseStats.totalDuration)}
              </span>
            </div>
            <Progress value={(courseStats.completedDuration / courseStats.totalDuration) * 100} className="h-3" />
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full w-full flex flex-col">
        {/* Enhanced tab navigation with better styling */}
        <TabsList className="grid w-full grid-cols-4 h-auto bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 rounded-none border-b border-border/30 p-3 gap-3">
          <TabsTrigger
            value="summary"
            className="flex items-center gap-3 text-sm font-medium h-16 data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 rounded-xl hover:bg-background/50 group"
          >
            <FileText className="h-5 w-5 group-data-[state=active]:text-primary transition-colors duration-200" />
            <span className="hidden sm:inline font-semibold">Summary</span>
          </TabsTrigger>
          <TabsTrigger
            value="quiz"
            className="flex items-center gap-3 text-sm font-medium h-16 data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 rounded-xl hover:bg-background/50 group"
          >
            <MessageSquare className="h-5 w-5 group-data-[state=active]:text-primary transition-colors duration-200" />
            <span className="hidden sm:inline font-semibold">Quiz</span>
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            className="flex items-center gap-3 text-sm font-medium h-16 data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 rounded-xl hover:bg-background/50 group"
          >
            <BarChart3 className="h-5 w-5 group-data-[state=active]:text-primary transition-colors duration-200" />
            <span className="hidden sm:inline font-semibold">Progress</span>
          </TabsTrigger>
          <TabsTrigger
            value="bookmarks"
            className="flex items-center gap-3 text-sm font-medium h-16 data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 rounded-xl hover:bg-background/50 group"
          >
            <BookmarkIcon className="h-5 w-5 group-data-[state=active]:text-primary transition-colors duration-200" />
            <span className="hidden sm:inline font-semibold">Bookmarks</span>
          </TabsTrigger>
        </TabsList>

  {/* Enhanced tabs content with better spacing */}
  <TabsContent value="summary" className="flex-1 overflow-auto w-full p-0">
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
                <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-10 w-10 opacity-50" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No Chapter Selected</h3>
                  <p className="text-base text-muted-foreground">
                    Select a chapter from the playlist to view AI-generated summary and insights
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </TabsContent>

  <TabsContent value="quiz" className="flex-1 overflow-auto w-full p-0">
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
                <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="h-10 w-10 opacity-50" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No Chapter Selected</h3>
                  <p className="text-base text-muted-foreground">
                    Select a chapter from the playlist to take interactive quizzes and test your knowledge
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </TabsContent>

  <TabsContent value="progress" className="flex-1 overflow-auto w-full p-0">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-3"
            >
              <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Learning Progress
              </h2>
              <p className="text-lg text-muted-foreground">Track your journey through {course.title}</p>
            </motion.div>

            <Card className="border border-border/40 shadow-sm bg-background">
              <CardContent className="p-4">
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
                    <CardContent className="p-8">
                      <div className="flex items-center gap-6">
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
                          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
                            <Trophy className="h-10 w-10 text-primary-foreground" />
                          </div>
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-foreground mb-2">
                            Congratulations! Course Completed!
                          </h3>
                          <p className="text-muted-foreground mb-6 text-lg">
                            You've successfully completed all {courseStats.totalChapters} chapters. Time to celebrate
                            your achievement!
                          </p>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <CertificateButton courseTitle={course.title} />
                            <Button variant="outline" className="bg-transparent" size="lg">
                              <Star className="h-5 w-5 mr-2" />
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
                <Card className="border border-border/40 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <TrendingUp className="h-6 w-6 text-primary" />
                      Learning Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-base">
                          <span className="text-muted-foreground font-medium">Next Milestone</span>
                          <span className="font-semibold">
                            {courseStats.progressPercentage < 25
                              ? "25%"
                              : courseStats.progressPercentage < 50
                                ? "50%"
                                : courseStats.progressPercentage < 75
                                  ? "75%"
                                  : "100%"}
                          </span>
                        </div>
                        <Progress value={courseStats.progressPercentage} className="h-3" />
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">
                          {courseStats.remainingChapters}
                        </div>
                        <div className="text-base text-muted-foreground font-medium">chapters to go</div>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-xl p-6 border border-border/20">
                      <h4 className="text-lg font-semibold text-foreground mb-3">Keep Going!</h4>
                      <p className="text-base text-muted-foreground leading-relaxed">
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

        <TabsContent value="bookmarks" className="flex-1 overflow-auto w-full p-0">
          <Card className="border border-border/40 shadow-sm bg-background">
            <CardHeader className="pb-3 px-4 py-3">
              <CardTitle className="flex items-center gap-3 text-xl">
                <BookmarkIcon className="h-6 w-6 text-primary" />
                Video Bookmarks
              </CardTitle>
              <CardDescription className="text-sm">
                {bookmarks.length > 0
                  ? `${bookmarks.length} bookmark${bookmarks.length !== 1 ? "s" : ""} saved for this video`
                  : "Save important moments while watching to review them later"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              {accessLevels?.isAuthenticated && bookmarks.length > 0 ? (
                <div className="space-y-4">
                  {bookmarks.map((bookmark, index) => (
                    <motion.div
                      key={bookmark.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSeekToBookmark(bookmark.time)}
                      className="group flex items-center justify-between p-6 bg-card border border-border/40 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/30"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold shadow-sm text-lg">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1"
                            >
                              {formatTime(bookmark.time)}
                            </Badge>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors text-lg">
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
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
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookmarkIcon className="h-12 w-12 text-primary/50" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">No bookmarks yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-base leading-relaxed">
                    While watching videos, press 'B' or click the bookmark button to save important moments
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-primary/5 text-primary border-primary/20 text-base px-4 py-2"
                  >
                    Press B to bookmark
                  </Badge>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Sign in to save bookmarks</h3>
                  <p className="text-muted-foreground mb-6 text-base leading-relaxed">
                    Create an account to bookmark important video moments and track your progress
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
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