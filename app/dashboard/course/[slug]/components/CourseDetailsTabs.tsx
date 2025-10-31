"use client"

import { useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { createSelector } from "@reduxjs/toolkit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  FileText,
  MessageSquare,
  Award,
  BookmarkIcon,
  Target,
  Zap,
  Trophy,
  Star,
  PlayCircle,
  StickyNote,
  LucideIcon,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

import { useAppSelector, useAppDispatch } from "@/store/hooks"
import type { RootState } from "@/store"
import { removeBookmark, type BookmarkItem, type CourseProgress } from "@/store/slices/course-slice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"

// Lazy load heavy components for better performance
const CourseDetailsQuiz = dynamic(() => import("./CourseQuiz"), { 
  ssr: false,
  loading: () => <SkeletonLoader />
})
const CourseAISummary = dynamic(() => import("./CourseSummary"), { 
  ssr: false,
  loading: () => <SkeletonLoader />
})
const CertificateGenerator = dynamic(() => import("./CertificateGenerator"), { ssr: false })

import { PDFDownloadLink } from "@react-pdf/renderer"
import { useAuth } from "@/modules/auth"
import { useNotes } from "@/hooks/use-notes"
import { useBookmarks } from "@/hooks/use-bookmarks"
import GlassDoorLock from "@/components/shared/GlassDoorLock"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import BookmarksPanel from "./BookmarksPanel"
import NotesPanel from "./NotesPanel"

// ✨ Improved skeleton loader with brutal theme
const SkeletonLoader = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="space-y-4 p-6 bg-[var(--color-bg)]"
  >
    {/* Header skeleton */}
    <motion.div
      className="space-y-2"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="h-8 w-1/3 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-none shadow-[2px_2px_0_var(--shadow-color)]" />
      <div className="h-4 w-2/3 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-none" />
    </motion.div>

    {/* Content skeleton */}
    <motion.div
      className="space-y-3"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
    >
      <div className="h-32 bg-[var(--color-muted)] border-3 border-[var(--color-border)] rounded-none shadow-[3px_3px_0_var(--shadow-color)]" />
      <div className="h-20 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-none" />
      <div className="h-20 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-none" />
    </motion.div>

    {/* Text skeleton */}
    <motion.div
      className="space-y-2"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-[var(--color-muted)] border border-[var(--color-border)] rounded-none",
            i === 2 && "w-4/5"
          )}
        />
      ))}
    </motion.div>
  </motion.div>
)

// ✨ Empty state component with brutal design
const EmptyTabMessage = ({ 
  icon: Icon, 
  title, 
  message 
}: { 
  icon: LucideIcon
  title: string
  message: string 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="h-full flex items-center justify-center p-8"
  >
    <div className="text-center space-y-6 max-w-md">
      <motion.div
        className={cn(
          "w-24 h-24 bg-[var(--color-muted)] border-4 border-[var(--color-border)]",
          "flex items-center justify-center mx-auto rounded-none",
          "shadow-[4px_4px_0_var(--shadow-color)]"
        )}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Icon className="h-12 w-12 text-[var(--color-muted-text)]" />
      </motion.div>

      <div className="space-y-2">
        <h3 className="text-xl font-black uppercase tracking-wider text-[var(--color-text)]">
          {title}
        </h3>
        <p className="text-sm font-bold text-[var(--color-muted-text)]">
          {message}
        </p>
      </div>
    </div>
  </motion.div>
)

interface CourseDetailsTabsProps {
  course: FullCourseType
  currentChapter?: FullChapterType
  onSeekToBookmark?: (time: number, title?: string) => void
  completedChapters?: string[]
  courseProgress?: any
}

export default function CourseDetailsTabs({
  course,
  currentChapter,
  onSeekToBookmark,
  completedChapters = [],
  courseProgress: externalCourseProgress,
}: CourseDetailsTabsProps) {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState("summary")
  const [isTabTransitioning, setIsTabTransitioning] = useState(false)

  // ✨ Smooth tab transitions
  const handleTabChange = (value: string) => {
    if (value === activeTab) return
    setIsTabTransitioning(true)
    setTimeout(() => {
      setActiveTab(value)
      setIsTabTransitioning(false)
    }, 150)
  }

  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const { user } = useAuth()
  const { isSubscribed, plan } = useUnifiedSubscription()
  const isOwner = Boolean(user?.id && user.id === course.userId)
  const isAdmin = Boolean(user?.isAdmin)
  const isAuthenticated = Boolean(user)

  // Feature access for tabs
  const summaryAccess = useFeatureAccess("course-videos")
  const quizAccess = useFeatureAccess("quiz-access")

  const canAccessSummary = isOwner || isAdmin || summaryAccess.canAccess
  const canAccessQuiz = isOwner || isAdmin || quizAccess.canAccess

  if (process.env.NODE_ENV === "development") {
    console.log("[CourseDetailsTabs] Feature Access:", {
      plan,
      isOwner,
      isAdmin,
      isSubscribed,
      canAccessSummary,
      canAccessQuiz,
    })
  }

  // Memoized selectors
  const selectBookmarks = useMemo(
    () =>
      createSelector(
        [(state: RootState) => state.course.bookmarks, (state: RootState) => currentVideoId],
        (bookmarks: Record<string, BookmarkItem[]>, videoId: string | null): BookmarkItem[] => {
          if (!videoId || !bookmarks[videoId]) return []
          return bookmarks[videoId]
        },
      ),
    [currentVideoId],
  )

  const bookmarks = useAppSelector(selectBookmarks)

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

  // Notes and bookmarks
  const { notes, deleteNote } = useNotes({
    courseId: course.id,
    chapterId: currentChapter?.id,
    limit: 5,
  })

  // Filtered and searched notes
  const filteredNotes = useMemo(() => {
    let filtered = notes

    if (notesSearchQuery.trim()) {
      const query = notesSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (note: any) => note.note?.toLowerCase().includes(query) || note.chapter?.title?.toLowerCase().includes(query),
      )
    }

    switch (notesFilter) {
      case "recent":
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        filtered = filtered.filter((note: any) => new Date(note.createdAt) > sevenDaysAgo)
        break
      case "chapter":
        filtered = filtered.filter((note: any) => note.chapterId === currentChapter?.id)
        break
      default:
        break
    }

    return filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notes, notesSearchQuery, notesFilter, currentChapter?.id])

  const { bookmarks: courseBookmarks } = useBookmarks({
    courseId: course.id,
    chapterId: currentChapter?.id,
  })

  // Course statistics
  const courseStats = useMemo(() => {
    const totalChapters = course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0
    const completedCount =
      completedChapters.length > 0 ? completedChapters.length : courseProgress?.completedChapters?.length || 0
    const progressPercentage = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0

    const totalDuration =
      course.courseUnits?.reduce((acc, unit) => {
        return (
          acc +
          unit.chapters.reduce((chapterAcc, chapter) => {
            const chapterDuration = typeof chapter.duration === "number" ? chapter.duration : 15
            return chapterAcc + chapterDuration
          }, 0)
        )
      }, 0) || totalChapters * 15

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
    const avgChapterDuration = totalDuration / totalChapters
    const estimatedTimeLeft = remainingChapters * avgChapterDuration

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

  const [notesSearchQuery, setNotesSearchQuery] = useState("")
  const [notesFilter, setNotesFilter] = useState<"all" | "recent" | "chapter">("all")

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
    const baseClasses = "border-2 border-[var(--color-border)] font-black rounded-none px-3 py-1 uppercase text-xs shadow-[2px_2px_0_var(--shadow-color)]"
    
    switch (level) {
      case "Expert":
        return {
          badge: cn(baseClasses, "bg-[var(--color-success)] text-[var(--color-bg)]"),
          icon: Star,
        }
      case "Advanced":
        return {
          badge: cn(baseClasses, "bg-[var(--color-primary)] text-[var(--color-bg)]"),
          icon: Trophy,
        }
      case "Intermediate":
        return {
          badge: cn(baseClasses, "bg-[var(--color-warning)] text-[var(--color-bg)]"),
          icon: Target,
        }
      case "Novice":
        return {
          badge: cn(baseClasses, "bg-[var(--color-accent)] text-[var(--color-bg)]"),
          icon: Zap,
        }
      default:
        return {
          badge: cn(baseClasses, "bg-[var(--color-muted)] text-[var(--color-text)]"),
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
          <motion.div
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            <Button
              disabled={loading}
              className={cn(
                "w-full font-black uppercase tracking-wider rounded-none",
                "border-3 border-[var(--color-border)]",
                "bg-[var(--color-primary)] text-[var(--color-text)]",
                "shadow-[3px_3px_0_var(--shadow-color)]",
                "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--shadow-color)]",
                "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--shadow-color)]",
                "transition-all duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Download Certificate
                </>
              )}
            </Button>
          </motion.div>
        )}
      </PDFDownloadLink>
    )
  }

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange} 
        className="h-full w-full flex flex-col"
      >
        {/* Tabs List */}
        <TabsList className={cn(
          "grid w-full grid-cols-2 sm:grid-cols-4 h-auto bg-[var(--color-bg)]",
          "p-2 gap-2 sm:gap-3 shadow-[2px_2px_0_var(--shadow-color)]",
          "border-b-4 border-[var(--color-border)] rounded-none"
        )}>
          {[
            { value: "summary", icon: FileText, label: "Summary" },
            { value: "quiz", icon: MessageSquare, label: "Quiz" },
            { value: "notes", icon: StickyNote, label: "Notes" },
            { value: "bookmarks", icon: BookmarkIcon, label: "Bookmarks" },
          ].map((tab) => {
            const isActive = activeTab === tab.value
            const Icon = tab.icon
            
            return (
              <motion.div key={tab.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <TabsTrigger
                  value={tab.value}
                  className={cn(
                    "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2",
                    "px-2 sm:px-4 py-3 text-xs sm:text-sm font-black uppercase",
                    "h-auto rounded-none border-2 transition-all duration-150",
                    "tracking-wide",
                    isActive
                      ? "bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-border)] shadow-[3px_3px_0_var(--shadow-color)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-muted)] hover:shadow-[2px_2px_0_var(--shadow-color)]"
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="hidden xs:inline">{tab.label}</span>
                </TabsTrigger>
              </motion.div>
            )
          })}
        </TabsList>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {/* Summary Tab */}
          <TabsContent 
            key="summary"
            value="summary" 
            className="flex-1 overflow-auto w-full p-0 mt-4 sm:mt-6"
            forceMount={activeTab === "summary"}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isTabTransitioning ? 0 : 1 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {isTabTransitioning ? (
                <SkeletonLoader />
              ) : currentChapter ? (
                <GlassDoorLock
                  isLocked={!canAccessSummary}
                  previewRatio={0.2}
                  reason={!user ? "Sign in to continue learning" : "Upgrade your plan to unlock this content"}
                  className="p-0"
                  blurIntensity={canAccessSummary ? "light" : "medium"}
                >
                  <div className={cn(
                    "p-4 sm:p-6 bg-[var(--color-bg)]",
                    "border-3 border-[var(--color-border)] rounded-none",
                    "shadow-[3px_3px_0_var(--shadow-color)]"
                  )}>
                    <CourseAISummary
                      chapterId={currentChapter.id}
                      name={currentChapter.title || currentChapter.name || "Chapter Summary"}
                      existingSummary={currentChapter.summary || null}
                      isAdmin={isAdmin}
                    />
                  </div>
                </GlassDoorLock>
              ) : (
                <EmptyTabMessage 
                  icon={FileText} 
                  title="No Chapter Selected" 
                  message="Select a chapter from the playlist to view AI-generated summary and insights" 
                />
              )}
            </motion.div>
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent 
            key="quiz"
            value="quiz" 
            className="flex-1 overflow-auto w-full p-0 mt-4 sm:mt-6"
            forceMount={activeTab === "quiz"}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isTabTransitioning ? 0 : 1 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {isTabTransitioning ? (
                <SkeletonLoader />
              ) : currentChapter ? (
                <GlassDoorLock
                  isLocked={!canAccessQuiz}
                  reason={!user ? "Sign in to continue learning" : "Upgrade your plan to unlock this content"}
                  className="p-0"
                  blurIntensity={canAccessQuiz ? "light" : "medium"}
                >
                  <div className={cn(
                    "p-4 sm:p-6 bg-[var(--color-bg)]",
                    "border-3 border-[var(--color-border)] rounded-none",
                    "shadow-[3px_3px_0_var(--shadow-color)]"
                  )}>
                    <CourseDetailsQuiz
                      key={currentChapter.id}
                      course={course}
                      chapter={currentChapter}
                      accessLevels={{
                        isAuthenticated,
                        isSubscribed: Boolean(isSubscribed || (currentChapter as any)?.isFreeQuiz),
                        isAdmin,
                      }}
                      isPublicCourse={course.isPublic || false}
                      chapterId={currentChapter.id.toString()}
                    />
                  </div>
                </GlassDoorLock>
              ) : (
                <EmptyTabMessage 
                  icon={MessageSquare} 
                  title="No Chapter Selected" 
                  message="Select a chapter from the playlist to take interactive quizzes and test your knowledge" 
                />
              )}
            </motion.div>
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent 
            key="bookmarks"
            value="bookmarks" 
            className="flex-1 overflow-auto w-full p-0 mt-4 sm:mt-6"
            forceMount={activeTab === "bookmarks"}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isTabTransitioning ? 0 : 1 }}
              transition={{ duration: 0.15 }}
            >
              <BookmarksPanel
                bookmarks={bookmarks}
                isAuthenticated={isAuthenticated}
                handleSeekToBookmark={handleSeekToBookmark}
                handleRemoveBookmark={handleRemoveBookmark}
                formatTime={formatTime}
              />
            </motion.div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent 
            key="notes"
            value="notes" 
            className="flex-1 overflow-auto w-full p-0 mt-4 sm:mt-6"
            forceMount={activeTab === "notes"}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isTabTransitioning ? 0 : 1 }}
              transition={{ duration: 0.15 }}
            >
              <NotesPanel
                filteredNotes={filteredNotes}
                isAuthenticated={isAuthenticated}
                notesSearchQuery={notesSearchQuery}
                setNotesSearchQuery={setNotesSearchQuery}
                notesFilter={notesFilter}
                setNotesFilter={setNotesFilter}
                deleteNote={deleteNote}
                courseId={course.id}
                currentChapterId={currentChapter?.id}
              />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  )
}