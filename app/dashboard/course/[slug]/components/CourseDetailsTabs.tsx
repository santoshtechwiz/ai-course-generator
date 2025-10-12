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
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Filter,
  BookOpen,
  Tag
} from "lucide-react"
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
  StickyNote,
  Edit3,
  Trash2,
  Plus,
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
import GlassDoorLock from '@/components/shared/GlassDoorLock'
import { useFeatureAccess } from "@/hooks/useFeatureAccess"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"

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
  const [notesSearchQuery, setNotesSearchQuery] = useState("")
  const [notesFilter, setNotesFilter] = useState<"all" | "recent" | "chapter">("all")

  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const { user } = useAuth()
  const { isSubscribed, plan } = useUnifiedSubscription()
  const isOwner = Boolean(user?.id && user.id === course.userId)
  const isAdmin = Boolean(user?.isAdmin)
  const isAuthenticated = Boolean(user)
  
  // Feature access for Summary and Quiz tabs
  const summaryAccess = useFeatureAccess('course-videos')
  const quizAccess = useFeatureAccess('quiz-access')

  // Determine if user can access tabs (owners and admins bypass restrictions)
  const canAccessSummary = isOwner || isAdmin || summaryAccess.canAccess
  const canAccessQuiz = isOwner || isAdmin || quizAccess.canAccess
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[CourseDetailsTabs] Feature Access:', {
      plan,
      isOwner,
      isAdmin,
      isSubscribed,
      summaryAccess: { canAccess: summaryAccess.canAccess, reason: summaryAccess.reason },
      quizAccess: { canAccess: quizAccess.canAccess, reason: quizAccess.reason },
      canAccessSummary,
      canAccessQuiz
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

  // Notes and bookmarks hooks
  const {
    notes,
    deleteNote
  } = useNotes({
    courseId: course.id,
    chapterId: currentChapter?.id,
    limit: 5 // Limit to 5 notes
  })

  // Filtered and searched notes
  const filteredNotes = useMemo(() => {
    let filtered = notes

    // Apply search filter
    if (notesSearchQuery.trim()) {
      const query = notesSearchQuery.toLowerCase()
      filtered = filtered.filter((note: any) =>
        note.note?.toLowerCase().includes(query) ||
        note.chapter?.title?.toLowerCase().includes(query)
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

  const {
    bookmarks: courseBookmarks,
  } = useBookmarks({
    courseId: course.id,
    chapterId: currentChapter?.id
  })

  // Enhanced course statistics calculation - use external data if available
  const courseStats = useMemo(() => {
    const totalChapters = course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0
    // Use external completed chapters data if available, otherwise fall back to redux
    const completedCount = completedChapters.length > 0
      ? completedChapters.length
      : (courseProgress?.completedChapters?.length || 0)
    const progressPercentage = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0

    // Calculate actual total duration from chapter data
    const totalDuration = course.courseUnits?.reduce((acc, unit) => {
      return acc + unit.chapters.reduce((chapterAcc, chapter) => {
        // Use duration if available, otherwise fallback to default of 15 minutes
        const chapterDuration = (typeof chapter.duration === 'number' ? chapter.duration : 15)
        return chapterAcc + chapterDuration
      }, 0)
    }, 0) || totalChapters * 15

    // Calculate completed duration based on actual completed chapters
    const completedDuration = course.courseUnits?.reduce((acc, unit) => {
      return acc + unit.chapters.reduce((chapterAcc, chapter) => {
        const chapterId = String(chapter.id)
        if (completedChapters.includes(chapterId)) {
          const chapterDuration = (typeof chapter.duration === 'number' ? chapter.duration : 15)
          return chapterAcc + chapterDuration
        }
        return chapterAcc
      }, 0)
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
        {/* Main Progress Ring with enhanced interactivity */}
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40 group cursor-pointer">
            <svg className="w-40 h-40 transform -rotate-90 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-muted/20"
              />
              {/* Progress circle with gradient */}
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 50 * (1 - courseStats.progressPercentage / 100),
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="drop-shadow-sm"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center group-hover:scale-105 transition-transform duration-300">
                <div className="text-4xl font-bold text-foreground mb-1">{courseStats.progressPercentage}%</div>
                <div className="text-sm text-muted-foreground font-medium">Complete</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {courseStats.completedChapters}/{courseStats.totalChapters} chapters
                </div>
              </div>
            </div>
            {/* Animated pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>

        {/* Enhanced Progress Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:border-primary/30 group cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground group-hover:text-green-600 transition-colors duration-300">
                  {courseStats.completedChapters}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Completed</div>
                <div className="text-xs text-muted-foreground mt-1">Chapters done</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:border-blue-500/30 group cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground group-hover:text-blue-600 transition-colors duration-300">
                  {formatDuration(courseStats.estimatedTimeLeft)}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Remaining</div>
                <div className="text-xs text-muted-foreground mt-1">Time to finish</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 hover:border-orange-500/30 group cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground group-hover:text-orange-600 transition-colors duration-300">
                  {courseStats.learningStreak}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Day Streak</div>
                <div className="text-xs text-muted-foreground mt-1">Keep it up!</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 hover:border-amber-500/30 group cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BookmarkIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground group-hover:text-amber-600 transition-colors duration-300">
                  {courseStats.totalBookmarks}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Bookmarks</div>
                <div className="text-xs text-muted-foreground mt-1">Saved items</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:border-primary/30 group cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                Study Time This Week
              </span>
              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary mb-2 group-hover:scale-105 transition-transform duration-300">
              {formatDuration(courseStats.studyTimeThisWeek)}
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-300">
              Keep up the great work!
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 hover:border-amber-500/30 group cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-foreground group-hover:text-amber-600 transition-colors duration-300">
                Quiz Average
              </span>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-amber-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-600 mb-2 group-hover:scale-105 transition-transform duration-300">
              {courseStats.averageScore}%
            </div>
            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-300">
              {courseStats.averageScore >= 80 ? "Excellent!" : courseStats.averageScore >= 60 ? "Good work!" : "Keep practicing!"}
            </div>
          </motion.div>
        </div>

        {/* Enhanced Skill Level Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <Badge
            variant="secondary"
            className={cn(
              "px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group",
              skillStyling.badge
            )}
          >
            <SkillIcon className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
            {courseStats.skillLevel} Level
            <motion.div
              className="ml-2 inline-block"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              {courseStats.skillLevel === "Expert" ? "🏆" : courseStats.skillLevel === "Advanced" ? "⭐" : "🎯"}
            </motion.div>
          </Badge>
        </motion.div>

        {/* Enhanced Course Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:border-primary/30"
        >
          <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Course Progress
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Completed</span>
              <span className="font-bold text-foreground">
                {formatDuration(courseStats.completedDuration)} / {formatDuration(courseStats.totalDuration)}
              </span>
            </div>
            <div className="relative">
              <Progress
                value={(courseStats.completedDuration / courseStats.totalDuration) * 100}
                className="h-4 bg-muted/30"
              />
              <motion.div
                className="absolute top-0 left-0 h-4 bg-gradient-to-r from-primary to-primary/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(courseStats.completedDuration / courseStats.totalDuration) * 100}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.9 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-full"></div>
              </motion.div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="font-medium text-primary">
                {Math.round((courseStats.completedDuration / courseStats.totalDuration) * 100)}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full w-full flex flex-col">
        {/* Enhanced tab navigation with sticky positioning */}
        <TabsList className="sticky top-0 z-10 grid w-full grid-cols-4 h-auto bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/30 p-2 md:p-3 gap-1 md:gap-3 shadow-sm">
          <TabsTrigger
            value="summary"
            className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-xs md:text-sm font-medium h-12 md:h-16 data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 rounded-xl hover:bg-background/50 group px-2 md:px-4"
          >
            <FileText className="h-4 w-4 md:h-5 md:w-5 group-data-[state=active]:text-primary transition-colors duration-200" />
            <span className="font-semibold">Summary</span>
          </TabsTrigger>
    {/* Quiz tab - always visible, access is visually handled by GlassDoorLock */}
          <TabsTrigger
            value="quiz"
            className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-xs md:text-sm font-medium h-12 md:h-16 data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 rounded-xl hover:bg-background/50 group px-2 md:px-4"
          >
            <MessageSquare className="h-4 w-4 md:h-5 md:w-5 group-data-[state=active]:text-primary transition-colors duration-200" />
            <span className="font-semibold">Quiz</span>
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-xs md:text-sm font-medium h-12 md:h-16 data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 rounded-xl hover:bg-background/50 group px-2 md:px-4"
          >
            <StickyNote className="h-4 w-4 md:h-5 md:w-5 group-data-[state=active]:text-primary transition-colors duration-200" />
            <span className="font-semibold">Notes</span>
          </TabsTrigger>
          <TabsTrigger
            value="bookmarks"
            className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-xs md:text-sm font-medium h-12 md:h-16 data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:border data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 rounded-xl hover:bg-background/50 group px-2 md:px-4"
          >
            <BookmarkIcon className="h-4 w-4 md:h-5 md:w-5 group-data-[state=active]:text-primary transition-colors duration-200" />
            <span className="font-semibold">Bookmarks</span>
          </TabsTrigger>
        </TabsList>

        {/* Enhanced tabs content with better spacing */}
        <TabsContent value="summary" className="flex-1 overflow-auto w-full p-0">
          {/* GlassDoorLock handles authentication and subscription visually */}
          {currentChapter ? (
            <GlassDoorLock
              isLocked={!canAccessSummary}
               previewRatio={0.2} // show top 20%
              reason={!user ? 'Sign in to continue learning' : 'Upgrade your plan to unlock this content'}
              className="p-0"
              blurIntensity={canAccessSummary ? 'light' : 'medium'}
            >
              <div className="p-4">
                <CourseAISummary
                  chapterId={currentChapter.id}
                  name={currentChapter.title || currentChapter.name || "Chapter Summary"}
                  existingSummary={currentChapter.summary || null}
                  isAdmin={isAdmin}
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
          {/* GlassDoorLock handles authentication and subscription visually */}
          {currentChapter ? (
            <GlassDoorLock
              isLocked={!canAccessQuiz}
              reason={!user ? 'Sign in to continue learning' : 'Upgrade your plan to unlock this content'}
              className="p-0"
              blurIntensity={canAccessQuiz ? 'light' : 'medium'}
            >
              <div className="p-4">
                <CourseDetailsQuiz
                  key={currentChapter.id}
                  course={course}
                  chapter={currentChapter}
                  accessLevels={{
                    isAuthenticated,
                    isSubscribed: Boolean(isSubscribed || (currentChapter as any)?.isFreeQuiz === true),
                    isAdmin
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
                  : "Press 'B' while watching to bookmark important moments"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              {isAuthenticated && bookmarks.length > 0 ? (
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
              ) : isAuthenticated ? (
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

        <TabsContent value="notes" className="flex-1 overflow-auto w-full p-0">
          <Card className="border border-border/40 shadow-sm bg-background">
            <CardHeader className="pb-3 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <StickyNote className="h-6 w-6 text-primary" />
                    Course Notes
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {filteredNotes.length > 0
                      ? `${filteredNotes.length} note${filteredNotes.length !== 1 ? "s" : ""} ${notesSearchQuery || notesFilter !== "all" ? "found" : "saved for this course"}`
                      : "Keep track of important insights and key learnings"}
                  </CardDescription>
                </div>
                {isAuthenticated && (
                  <NoteModal
                    courseId={course.id}
                    chapterId={currentChapter?.id}
                    trigger={
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    }
                  />
                )}
              </div>

              {/* Search and Filter Controls */}
              {isAuthenticated && notes.length > 0 && (
                <div className="flex items-center gap-3 mt-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notes..."
                      value={notesSearchQuery}
                      onChange={(e) => setNotesSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={notesFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNotesFilter("all")}
                      className="text-xs"
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      All
                    </Button>
                    <Button
                      variant={notesFilter === "recent" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNotesFilter("recent")}
                      className="text-xs"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Recent
                    </Button>
                    <Button
                      variant={notesFilter === "chapter" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNotesFilter("chapter")}
                      className="text-xs"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      This Chapter
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              {isAuthenticated && filteredNotes.length > 0 ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {filteredNotes.map((note: Bookmark & {
                      course?: { id: number; title: string; slug: string } | null;
                      chapter?: { id: number; title: string } | null;
                    }, index: number) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group p-6 bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:border-primary/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <StickyNote className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                  {note.chapter && (
                                    <>
                                      <Separator orientation="vertical" className="h-4" />
                                      <BookOpen className="h-4 w-4" />
                                      <span className="truncate font-medium">{note.chapter.title}</span>
                                    </>
                                  )}
                                </div>
                                {(note as any).timestamp && (
                                  <div className="flex items-center gap-1 text-xs text-primary">
                                    <PlayCircle className="h-3 w-3" />
                                    <span>at {Math.floor((note as any).timestamp / 60)}:{((note as any).timestamp % 60).toString().padStart(2, '0')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="bg-muted/20 rounded-lg p-4 border border-border/20 group-hover:bg-muted/30 transition-colors duration-300">
                              <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                                {note.note}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <NoteModal
                              courseId={course.id}
                              chapterId={currentChapter?.id}
                              existingNote={note}
                              trigger={
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:text-blue-600">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <DeleteNoteDialog
                              noteId={note.id.toString()}
                              noteContent={note.note || ''}
                              onDelete={deleteNote}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              ) : isAuthenticated ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-muted/30 to-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <StickyNote className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {notesSearchQuery || notesFilter !== "all" ? "No notes found" : "No notes yet"}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-base leading-relaxed">
                    {notesSearchQuery || notesFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Start taking notes to capture important insights and key learnings from this course"
                    }
                  </p>
                  {(!notesSearchQuery && notesFilter === "all") && (
                    <NoteModal
                      courseId={course.id}
                      chapterId={currentChapter?.id}
                      trigger={
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                          <StickyNote className="h-5 w-5 mr-2" />
                          Create Your First Note
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
                  <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Sign in to take notes</h3>
                  <p className="text-muted-foreground mb-6 text-base leading-relaxed">
                    Create an account to save notes and track your learning progress
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