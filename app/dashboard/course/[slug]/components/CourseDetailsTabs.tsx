"use client"

import { useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { createSelector } from "@reduxjs/toolkit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  MessageSquare,
  Award,
  TrendingUp,
  BookmarkIcon,
  Clock,
  Target,
  Zap,
  Trophy,
  Star,
  PlayCircle,
  CheckCircle,
  Calendar,
  Flame,
  StickyNote,
  Edit3,
  Plus,
  Lock,
  Search,
} from "lucide-react"

import { useAppSelector, useAppDispatch } from "@/store/hooks"
import type { RootState } from "@/store"
import { removeBookmark, type BookmarkItem, type CourseProgress } from "@/store/slices/course-slice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"

// Lazy load heavy components for better performance
const CourseDetailsQuiz = dynamic(() => import("./CourseQuiz"), { ssr: false })
const CourseAISummary = dynamic(() => import("./CourseSummary"), { ssr: false })
const CertificateGenerator = dynamic(() => import("./CertificateGenerator"), { ssr: false })
import { PDFDownloadLink } from "@react-pdf/renderer"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/modules/auth"
import { NoteModal } from "./modals/NoteModal"
import { DeleteNoteDialog } from "./modals/DeleteNoteDialog"
import { useNotes } from "@/hooks/use-notes"
import { useBookmarks } from "@/hooks/use-bookmarks"
import type { Bookmark } from "@prisma/client"
import GlassDoorLock from "@/components/shared/GlassDoorLock"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"

// ✨ Skeleton loader component for smooth tab transitions
const TabSkeleton = () => (
  <div className="space-y-6 p-4 animate-pulse">
    <div className="space-y-3">
      <div className="h-6 bg-muted rounded-lg w-1/3"></div>
      <div className="h-4 bg-muted rounded w-2/3"></div>
    </div>
    <div className="space-y-3">
      <div className="h-32 bg-muted rounded-lg"></div>
      <div className="h-24 bg-muted rounded-lg"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-full"></div>
      <div className="h-4 bg-muted rounded w-5/6"></div>
      <div className="h-4 bg-muted rounded w-4/6"></div>
    </div>
  </div>
)

interface CourseDetailsTabsProps {
  course: FullCourseType
  currentChapter?: FullChapterType
  onSeekToBookmark?: (time: number, title?: string) => void
  completedChapters?: string[] // Add completed chapters prop
  courseProgress?: any // Add course progress data
}

export default function CourseDetailsTabs({
  course,
  currentChapter,
  onSeekToBookmark,
  completedChapters = [], // Default to empty array
  courseProgress: externalCourseProgress, // Rename to avoid conflict
}: CourseDetailsTabsProps) {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState("summary")
  const [isTabLoading, setIsTabLoading] = useState(false) // ✨ Loading state for smooth transitions
  const [notesSearchQuery, setNotesSearchQuery] = useState("")
  const [notesFilter, setNotesFilter] = useState<"all" | "recent" | "chapter">("all")

  // ✨ Handle tab change with loading transition
  const handleTabChange = (value: string) => {
    if (value === activeTab) return // Don't reload same tab
    setIsTabLoading(true)
    setActiveTab(value)
    // Short delay for smooth skeleton transition
    setTimeout(() => setIsTabLoading(false), 200)
  }

  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const { user } = useAuth()
  const { isSubscribed, plan } = useUnifiedSubscription()
  const isOwner = Boolean(user?.id && user.id === course.userId)
  const isAdmin = Boolean(user?.isAdmin)
  const isAuthenticated = Boolean(user)

  // Feature access for Summary and Quiz tabs
  const summaryAccess = useFeatureAccess("course-videos")
  const quizAccess = useFeatureAccess("quiz-access")

  // Determine if user can access tabs (owners and admins bypass restrictions)
  const canAccessSummary = isOwner || isAdmin || summaryAccess.canAccess
  const canAccessQuiz = isOwner || isAdmin || quizAccess.canAccess

  // Debug logging
  if (process.env.NODE_ENV === "development") {
    console.log("[CourseDetailsTabs] Feature Access:", {
      plan,
      isOwner,
      isAdmin,
      isSubscribed,
      summaryAccess: { canAccess: summaryAccess.canAccess, reason: summaryAccess.reason },
      quizAccess: { canAccess: quizAccess.canAccess, reason: quizAccess.reason },
      canAccessSummary,
      canAccessQuiz,
    })
  }

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
        [(state: RootState) => state.course.userProgress, () => course.id, () => user?.id || "guest"],
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

  // Notes and bookmarks hooks
  const { notes, deleteNote } = useNotes({
    courseId: course.id,
    chapterId: currentChapter?.id,
    limit: 5, // Limit to 5 notes
  })

  // Filtered and searched notes
  const filteredNotes = useMemo(() => {
    let filtered = notes

    // Apply search filter
    if (notesSearchQuery.trim()) {
      const query = notesSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (note: any) => note.note?.toLowerCase().includes(query) || note.chapter?.title?.toLowerCase().includes(query),
      )
    }

    // Apply category filter
    switch (notesFilter) {
      case "recent":
        // Show notes from last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        filtered = filtered.filter((note: any) => new Date(note.createdAt) > sevenDaysAgo)
        break
      case "chapter":
        // Show only current chapter notes
        filtered = filtered.filter((note: any) => note.chapterId === currentChapter?.id)
        break
      default:
        // Show all notes
        break
    }

    // Sort by creation date (newest first)
    return filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notes, notesSearchQuery, notesFilter, currentChapter?.id])

  const { bookmarks: courseBookmarks } = useBookmarks({
    courseId: course.id,
    chapterId: currentChapter?.id,
  })

  // Enhanced course statistics calculation - use external data if available
  const courseStats = useMemo(() => {
    const totalChapters = course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0
    // Use external completed chapters data if available, otherwise fall back to redux
    const completedCount =
      completedChapters.length > 0 ? completedChapters.length : courseProgress?.completedChapters?.length || 0
    const progressPercentage = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0

    // Calculate actual total duration from chapter data
    const totalDuration =
      course.courseUnits?.reduce((acc, unit) => {
        return (
          acc +
          unit.chapters.reduce((chapterAcc, chapter) => {
            // Use duration if available, otherwise fallback to default of 15 minutes
            const chapterDuration = typeof chapter.duration === "number" ? chapter.duration : 15
            return chapterAcc + chapterDuration
          }, 0)
        )
      }, 0) || totalChapters * 15

    // Calculate completed duration based on actual completed chapters
    const completedDuration =
      course.courseUnits?.reduce((acc, unit) => {
        return (
          acc +
          unit.chapters.reduce((chapterAcc, chapter) => {
            const chapterId = String(chapter.id)
            if (completedChapters.includes(chapterId)) {
              const chapterDuration = typeof chapter.duration === "number" ? chapter.duration : 15
              return chapterAcc + chapterDuration
            }
            return chapterAcc
          }, 0)
        )
      }, 0) || 0

    const remainingChapters = totalChapters - completedCount
    // Estimate remaining time based on average chapter duration
    const avgChapterDuration = totalDuration / totalChapters
    const estimatedTimeLeft = remainingChapters * avgChapterDuration

    // Fix learning streak calculation - use proper field
    const learningStreak = courseProgress?.learningStreak || externalCourseProgress?.learningStreak || 0

    let skillLevel = "Beginner"
    if (progressPercentage >= 90) skillLevel = "Expert"
    else if (progressPercentage >= 75) skillLevel = "Advanced"
    else if (progressPercentage >= 50) skillLevel = "Intermediate"
    else if (progressPercentage >= 25) skillLevel = "Novice"

    const studyTimeThisWeek = externalCourseProgress?.timeSpent || courseProgress?.studyTimeThisWeek || 0
    const averageScore = courseProgress?.averageQuizScore || 0

    return {
      totalChapters,
      completedChapters: completedCount,
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
      lastActivityDate: externalCourseProgress?.updatedAt || courseProgress?.lastActivityDate || null,
    }
  }, [course.courseUnits, courseProgress, externalCourseProgress, completedChapters.length, bookmarks.length])

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

  const getSkillLevelStyling = (level: string) => {
    switch (level) {
      case "Expert":
        return {
          badge: "bg-accent text-foreground border-4 border-foreground shadow-[6px_6px_0px_0px] shadow-foreground",
          icon: Star,
        }
      case "Advanced":
        return {
          badge: "bg-chart-1 text-foreground border-4 border-foreground shadow-[6px_6px_0px_0px] shadow-foreground",
          icon: Trophy,
        }
      case "Intermediate":
        return {
          badge: "bg-chart-3 text-foreground border-4 border-foreground shadow-[6px_6px_0px_0px] shadow-foreground",
          icon: Target,
        }
      case "Novice":
        return {
          badge: "bg-chart-2 text-foreground border-4 border-foreground shadow-[6px_6px_0px_0px] shadow-foreground",
          icon: Zap,
        }
      default:
        return {
          badge: "bg-muted text-foreground border-4 border-foreground shadow-[6px_6px_0px_0px] shadow-foreground",
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
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48 border-4 border-foreground bg-background shadow-[8px_8px_0px_0px] shadow-foreground">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="butt"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 50 * (1 - courseStats.progressPercentage / 100),
                }}
                transition={{ duration: 1, ease: "linear" }}
                className="text-foreground"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-black text-foreground">{courseStats.progressPercentage}%</div>
                <div className="text-sm font-bold text-foreground uppercase mt-1">Complete</div>
                <div className="text-xs font-bold text-muted-foreground mt-1">
                  {courseStats.completedChapters}/{courseStats.totalChapters}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-chart-1 border-4 border-foreground p-4 shadow-[4px_4px_0px_0px] shadow-foreground hover:shadow-[6px_6px_0px_0px] hover:shadow-foreground transition-shadow"
          >
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 bg-background border-4 border-foreground flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-foreground" />
              </div>
              <div className="text-3xl font-black text-foreground">{courseStats.completedChapters}</div>
              <div className="text-xs font-black text-foreground uppercase">Completed</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-chart-3 border-4 border-foreground p-4 shadow-[4px_4px_0px_0px] shadow-foreground hover:shadow-[6px_6px_0px_0px] hover:shadow-foreground transition-shadow"
          >
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 bg-background border-4 border-foreground flex items-center justify-center">
                <Clock className="h-6 w-6 text-foreground" />
              </div>
              <div className="text-3xl font-black text-foreground">{formatDuration(courseStats.estimatedTimeLeft)}</div>
              <div className="text-xs font-black text-foreground uppercase">Remaining</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-chart-2 border-4 border-foreground p-4 shadow-[4px_4px_0px_0px] shadow-foreground hover:shadow-[6px_6px_0px_0px] hover:shadow-foreground transition-shadow"
          >
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 bg-background border-4 border-foreground flex items-center justify-center">
                <Flame className="h-6 w-6 text-foreground" />
              </div>
              <div className="text-3xl font-black text-foreground">{courseStats.learningStreak}</div>
              <div className="text-xs font-black text-foreground uppercase">Day Streak</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-chart-4 border-4 border-foreground p-4 shadow-[4px_4px_0px_0px] shadow-foreground hover:shadow-[6px_6px_0px_0px] hover:shadow-foreground transition-shadow"
          >
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 bg-background border-4 border-foreground flex items-center justify-center">
                <BookmarkIcon className="h-6 w-6 text-foreground" />
              </div>
              <div className="text-3xl font-black text-foreground">{courseStats.totalBookmarks}</div>
              <div className="text-xs font-black text-foreground uppercase">Bookmarks</div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-background border-4 border-foreground p-6 shadow-[4px_4px_0px_0px] shadow-foreground hover:shadow-[6px_6px_0px_0px] hover:shadow-foreground transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-black text-foreground uppercase">Study Time This Week</span>
              <div className="w-10 h-10 bg-foreground border-4 border-foreground flex items-center justify-center">
                <Calendar className="h-5 w-5 text-background" />
              </div>
            </div>
            <div className="text-4xl font-black text-foreground mb-2">
              {formatDuration(courseStats.studyTimeThisWeek)}
            </div>
            <div className="text-sm font-bold text-muted-foreground uppercase">Keep it up!</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-background border-4 border-foreground p-6 shadow-[4px_4px_0px_0px] shadow-foreground hover:shadow-[6px_6px_0px_0px] hover:shadow-foreground transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-black text-foreground uppercase">Quiz Average</span>
              <div className="w-10 h-10 bg-foreground border-4 border-foreground flex items-center justify-center">
                <Star className="h-5 w-5 text-background" />
              </div>
            </div>
            <div className="text-4xl font-black text-foreground mb-2">{courseStats.averageScore}%</div>
            <div className="text-sm font-bold text-muted-foreground uppercase">
              {courseStats.averageScore >= 80
                ? "Excellent!"
                : courseStats.averageScore >= 60
                  ? "Good work!"
                  : "Keep practicing!"}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <Badge
            variant="default"
            className={cn(
              "px-8 py-4 text-lg font-black uppercase tracking-wider hover:shadow-[8px_8px_0px_0px] hover:shadow-foreground transition-shadow cursor-pointer",
              skillStyling.badge,
            )}
          >
            <SkillIcon className="h-6 w-6 mr-3" />
            {courseStats.skillLevel} Level
          </Badge>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-background border-4 border-foreground p-6 shadow-[4px_4px_0px_0px] shadow-foreground"
        >
          <h4 className="text-lg font-black text-foreground mb-4 flex items-center gap-2 uppercase">
            <TrendingUp className="h-5 w-5 text-foreground" />
            Course Progress
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-foreground uppercase">Completed</span>
              <span className="font-black text-foreground">
                {formatDuration(courseStats.completedDuration)} / {formatDuration(courseStats.totalDuration)}
              </span>
            </div>
            <div className="relative h-6 bg-muted border-4 border-foreground">
              <motion.div
                className="absolute top-0 left-0 h-full bg-foreground"
                initial={{ width: 0 }}
                animate={{ width: `${(courseStats.completedDuration / courseStats.totalDuration) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>
            <div className="flex justify-between text-xs font-black text-foreground uppercase">
              <span>0%</span>
              <span>{Math.round((courseStats.completedDuration / courseStats.totalDuration) * 100)}%</span>
              <span>100%</span>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full w-full flex flex-col">
        <TabsList className="sticky top-0 z-10 grid w-full grid-cols-4 h-auto bg-neo-background border-4 border-neo-border p-2 gap-3 shadow-[4px_4px_0px_0px_var(--neo-border)]">
          <TabsTrigger
            value="summary"
            className="flex flex-col md:flex-row items-center gap-2 text-xs md:text-sm font-black uppercase h-14 md:h-16 data-[state=active]:bg-neo-border data-[state=active]:text-neo-background data-[state=active]:border-4 data-[state=active]:border-neo-border data-[state=active]:shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all border-4 border-transparent hover:border-neo-border px-3 md:px-4"
          >
            <FileText className="h-5 w-5 md:h-6 md:w-6" />
            <span className="tracking-tight">Summary</span>
          </TabsTrigger>
          <TabsTrigger
            value="quiz"
            className="flex flex-col md:flex-row items-center gap-2 text-xs md:text-sm font-black uppercase h-14 md:h-16 data-[state=active]:bg-neo-border data-[state=active]:text-neo-background data-[state=active]:border-4 data-[state=active]:border-neo-border data-[state=active]:shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all border-4 border-transparent hover:border-neo-border px-3 md:px-4"
          >
            <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
            <span className="tracking-tight">Quiz</span>
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="flex flex-col md:flex-row items-center gap-2 text-xs md:text-sm font-black uppercase h-14 md:h-16 data-[state=active]:bg-neo-border data-[state=active]:text-neo-background data-[state=active]:border-4 data-[state=active]:border-neo-border data-[state=active]:shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all border-4 border-transparent hover:border-neo-border px-3 md:px-4"
          >
            <StickyNote className="h-5 w-5 md:h-6 md:w-6" />
            <span className="tracking-tight">Notes</span>
          </TabsTrigger>
          <TabsTrigger
            value="bookmarks"
            className="flex flex-col md:flex-row items-center gap-2 text-xs md:text-sm font-black uppercase h-14 md:h-16 data-[state=active]:bg-neo-border data-[state=active]:text-neo-background data-[state=active]:border-4 data-[state=active]:border-neo-border data-[state=active]:shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all border-4 border-transparent hover:border-neo-border px-3 md:px-4"
          >
            <BookmarkIcon className="h-5 w-5 md:h-6 md:w-6" />
            <span className="tracking-tight">Bookmarks</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="flex-1 overflow-auto w-full p-0 mt-6">
          <AnimatePresence mode="wait">
            {isTabLoading ? (
              <motion.div
                key="summary-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <TabSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="summary-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {currentChapter ? (
                  <GlassDoorLock
                    isLocked={!canAccessSummary}
                    previewRatio={0.2}
                    reason={!user ? "Sign in to continue learning" : "Upgrade your plan to unlock this content"}
                    className="p-0"
                    blurIntensity={canAccessSummary ? "light" : "medium"}
                  >
                    <div className="p-6 border-4 border-neo-border bg-neo-background shadow-[4px_4px_0px_0px_var(--neo-border)]">
                      <CourseAISummary
                        chapterId={currentChapter.id}
                        name={currentChapter.title || currentChapter.name || "Chapter Summary"}
                        existingSummary={currentChapter.summary || null}
                        isAdmin={isAdmin}
                      />
                    </div>
                  </GlassDoorLock>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground p-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-4"
                    >
                      <div className="w-24 h-24 bg-muted border-4 border-neo-border flex items-center justify-center mx-auto">
                        <FileText className="h-12 w-12 opacity-50" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black mb-3 uppercase">No Chapter Selected</h3>
                        <p className="text-base text-muted-foreground font-bold">
                          Select a chapter from the playlist to view AI-generated summary and insights
                        </p>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="quiz" className="flex-1 overflow-auto w-full p-0 mt-6">
          {currentChapter ? (
            <GlassDoorLock
              isLocked={!canAccessQuiz}
              reason={!user ? "Sign in to continue learning" : "Upgrade your plan to unlock this content"}
              className="p-0"
              blurIntensity={canAccessQuiz ? "light" : "medium"}
            >
              <div className="p-6 border-4 border-neo-border bg-neo-background shadow-[4px_4px_0px_0px_var(--neo-border)]">
                <CourseDetailsQuiz
                  key={currentChapter.id}
                  course={course}
                  chapter={currentChapter}
                  accessLevels={{
                    isAuthenticated,
                    isSubscribed: Boolean(isSubscribed || (currentChapter as any)?.isFreeQuiz === true),
                    isAdmin,
                  }}
                  isPublicCourse={course.isPublic || false}
                  chapterId={currentChapter.id.toString()}
                />
              </div>
            </GlassDoorLock>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-24 h-24 bg-muted border-4 border-neo-border flex items-center justify-center mx-auto">
                  <MessageSquare className="h-12 w-12 opacity-50" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-3 uppercase">No Chapter Selected</h3>
                  <p className="text-base text-muted-foreground font-bold">
                    Select a chapter from the playlist to take interactive quizzes and test your knowledge
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarks" className="flex-1 overflow-auto w-full p-0 mt-6">
          <Card className="border-4 border-neo-border shadow-[6px_6px_0px_0px_var(--neo-border)] bg-neo-background">
            <CardHeader className="pb-4 px-6 py-6 border-b-4 border-neo-border">
              <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                <BookmarkIcon className="h-7 w-7 text-foreground" />
                Video Bookmarks
              </CardTitle>
              <CardDescription className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                {bookmarks.length > 0
                  ? `${bookmarks.length} bookmark${bookmarks.length !== 1 ? "s" : ""} saved`
                  : "Press 'B' to bookmark moments"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6 pt-6">
              {isAuthenticated && bookmarks.length > 0 ? (
                <div className="space-y-4">
                  {bookmarks.map((bookmark, index) => (
                    <motion.div
                      key={bookmark.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSeekToBookmark(bookmark.time)}
                      className="group flex items-center justify-between p-5 bg-neo-background border-4 border-neo-border cursor-pointer hover:shadow-[6px_6px_0px_0px_var(--neo-border)] transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-neo-border flex items-center justify-center text-neo-background font-black text-xl border-4 border-neo-border">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge
                              variant="default"
                              className="bg-yellow-300 text-black border-4 border-neo-border text-base px-3 py-1 font-black uppercase"
                            >
                              {formatTime(bookmark.time)}
                            </Badge>
                          </div>
                          <p className="font-black text-foreground text-lg uppercase tracking-tight">
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity border-4 border-neo-border hover:bg-red-500 hover:text-white font-black uppercase"
                      >
                        Remove
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : isAuthenticated ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-28 h-28 bg-muted border-4 border-neo-border flex items-center justify-center mx-auto mb-8">
                    <BookmarkIcon className="h-14 w-14 text-foreground" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">No bookmarks yet</h3>
                  <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-base font-bold">
                    Press 'B' while watching to save important moments
                  </p>
                  <Badge
                    variant="default"
                    className="bg-neo-border text-neo-background border-4 border-neo-border text-lg px-6 py-3 font-black uppercase"
                  >
                    Press B
                  </Badge>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-28 h-28 bg-muted border-4 border-neo-border flex items-center justify-center mx-auto mb-8">
                    <Lock className="h-14 w-14 text-foreground" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Sign in required</h3>
                  <p className="text-muted-foreground mb-8 text-base font-bold">Create an account to save bookmarks</p>
                  <Button
                    className="bg-neo-border text-neo-background border-4 border-neo-border hover:shadow-[6px_6px_0px_0px_var(--neo-border)] font-black uppercase text-lg px-8 py-6"
                    size="lg"
                  >
                    Sign In
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="flex-1 overflow-auto w-full p-0 mt-6">
          <Card className="border-4 border-neo-border shadow-[6px_6px_0px_0px_var(--neo-border)] bg-neo-background">
            <CardHeader className="pb-4 px-6 py-6 border-b-4 border-neo-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                    <StickyNote className="h-7 w-7 text-foreground" />
                    Course Notes
                  </CardTitle>
                  <CardDescription className="text-sm font-bold text-muted-foreground uppercase tracking-tight mt-2">
                    {filteredNotes.length > 0
                      ? `${filteredNotes.length} note${filteredNotes.length !== 1 ? "s" : ""} ${notesSearchQuery || notesFilter !== "all" ? "found" : "saved"}`
                      : "Track important insights"}
                  </CardDescription>
                </div>
                {isAuthenticated && (
                  <NoteModal
                    courseId={course.id}
                    chapterId={currentChapter?.id}
                    trigger={
                      <Button
                        size="lg"
                        className="bg-neo-border text-neo-background border-4 border-neo-border hover:shadow-[6px_6px_0px_0px_var(--neo-border)] font-black uppercase px-6"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Note
                      </Button>
                    }
                  />
                )}
              </div>

              {isAuthenticated && notes.length > 0 && (
                <div className="flex items-center gap-3 mt-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground" />
                    <Input
                      placeholder="Search notes..."
                      value={notesSearchQuery}
                      onChange={(e) => setNotesSearchQuery(e.target.value)}
                      className="pl-12 border-4 border-neo-border font-bold h-12 text-base"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={notesFilter === "all" ? "default" : "outline"}
                      size="lg"
                      onClick={() => setNotesFilter("all")}
                      className="text-sm font-black uppercase border-4 border-neo-border"
                    >
                      All
                    </Button>
                    <Button
                      variant={notesFilter === "recent" ? "default" : "outline"}
                      size="lg"
                      onClick={() => setNotesFilter("recent")}
                      className="text-sm font-black uppercase border-4 border-neo-border"
                    >
                      Recent
                    </Button>
                    <Button
                      variant={notesFilter === "chapter" ? "default" : "outline"}
                      size="lg"
                      onClick={() => setNotesFilter("chapter")}
                      className="text-sm font-black uppercase border-4 border-neo-border"
                    >
                      Chapter
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6 pt-6">
              {isAuthenticated && filteredNotes.length > 0 ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {filteredNotes.map(
                      (
                        note: Bookmark & {
                          course?: { id: number; title: string; slug: string } | null
                          chapter?: { id: number; title: string } | null
                        },
                        index: number,
                      ) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group p-5 bg-neo-background border-4 border-neo-border hover:shadow-[6px_6px_0px_0px_var(--neo-border)] transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-green-300 border-4 border-neo-border flex items-center justify-center">
                                  <StickyNote className="h-6 w-6 text-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 text-sm font-black text-foreground mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span className="uppercase">{new Date(note.createdAt).toLocaleDateString()}</span>
                                    {note.chapter && (
                                      <>
                                        <Separator orientation="vertical" className="h-4 bg-neo-border" />
                                        <span className="truncate uppercase">{note.chapter.title}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="bg-yellow-100 border-4 border-neo-border p-4">
                                <p className="text-foreground whitespace-pre-wrap text-base font-bold">{note.note}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <NoteModal
                                courseId={course.id}
                                chapterId={currentChapter?.id}
                                existingNote={note}
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 w-10 p-0 border-4 border-neo-border hover:bg-blue-300 font-black"
                                  >
                                    <Edit3 className="h-5 w-5" />
                                  </Button>
                                }
                              />
                              <DeleteNoteDialog
                                noteId={note.id.toString()}
                                noteContent={note.note || ""}
                                onDelete={deleteNote}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ),
                    )}
                  </div>
                </ScrollArea>
              ) : isAuthenticated ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-28 h-28 bg-muted border-4 border-neo-border flex items-center justify-center mx-auto mb-8">
                    <StickyNote className="h-14 w-14 text-foreground" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">
                    {notesSearchQuery || notesFilter !== "all" ? "No notes found" : "No notes yet"}
                  </h3>
                  <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-base font-bold">
                    {notesSearchQuery || notesFilter !== "all"
                      ? "Try adjusting your search"
                      : "Start taking notes to capture insights"}
                  </p>
                  {!notesSearchQuery && notesFilter === "all" && (
                    <NoteModal
                      courseId={course.id}
                      chapterId={currentChapter?.id}
                      trigger={
                        <Button
                          className="bg-neo-border text-neo-background border-4 border-neo-border hover:shadow-[6px_6px_0px_0px_var(--neo-border)] font-black uppercase text-lg px-8 py-6"
                          size="lg"
                        >
                          <StickyNote className="h-6 w-6 mr-3" />
                          Create Note
                        </Button>
                      }
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-28 h-28 bg-muted border-4 border-neo-border flex items-center justify-center mx-auto mb-8">
                    <Lock className="h-14 w-14 text-foreground" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Sign in required</h3>
                  <p className="text-muted-foreground mb-8 text-base font-bold">Create an account to save notes</p>
                  <Button
                    className="bg-neo-border text-neo-background border-4 border-neo-border hover:shadow-[6px_6px_0px_0px_var(--neo-border)] font-black uppercase text-lg px-8 py-6"
                    size="lg"
                  >
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
