"use client"

import { useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { createSelector } from "@reduxjs/toolkit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import neo from "@/components/neo/tokens"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

import { useAppSelector, useAppDispatch } from "@/store/hooks"
import type { RootState } from "@/store"
import { removeBookmark, type BookmarkItem, type CourseProgress } from "@/store/slices/course-slice"
import type { FullCourseType, FullChapterType } from "@/app/types/types"

// Lazy load heavy components for better performance
const CourseDetailsQuiz = dynamic(() => import("./CourseQuiz"), { ssr: false })
const CourseAISummary = dynamic(() => import("./CourseSummary"), { ssr: false })
const CertificateGenerator = dynamic(() => import("./CertificateGenerator"), { ssr: false })
import { PDFDownloadLink } from "@react-pdf/renderer"
// Reduced framer-motion usage for performance; prefer CSS transitions for simple UI transitions
import { useAuth } from "@/modules/auth"
import { useNotes } from "@/hooks/use-notes"
import { useBookmarks } from "@/hooks/use-bookmarks"
import GlassDoorLock from "@/components/shared/GlassDoorLock"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import BookmarksPanel from "./BookmarksPanel"
import NotesPanel from "./NotesPanel"

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
          badge: "bg-[var(--color-success)] text-[var(--color-bg)] border border-[var(--color-border)] shadow-[6px_6px_0px_0px_var(--color-border)]",
          icon: Star,
        }
      case "Advanced":
        return {
          badge: "bg-[var(--color-primary)] text-[var(--color-bg)] border border-[var(--color-border)] shadow-[6px_6px_0px_0px_var(--color-border)]",
          icon: Trophy,
        }
      case "Intermediate":
        return {
          badge: "bg-[var(--color-warning)] text-[var(--color-bg)] border border-[var(--color-border)] shadow-[6px_6px_0px_0px_var(--color-border)]",
          icon: Target,
        }
      case "Novice":
        return {
          badge: "bg-[var(--color-accent)] text-[var(--color-bg)] border border-[var(--color-border)] shadow-[6px_6px_0px_0px_var(--color-border)]",
          icon: Zap,
        }
      default:
        return {
          badge: "bg-[var(--color-muted)] text-[var(--color-text)] border border-[var(--color-border)] shadow-[6px_6px_0px_0px_var(--color-border)]",
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
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2 inline-block animate-spin" />
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

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full w-full flex flex-col">
  <TabsList className={cn("sticky top-[var(--course-sticky-offset)] grid w-full grid-cols-4 h-auto bg-neo-background p-2 gap-3 shadow-[4px_4px_0px_0px_var(--neo-border)] overflow-visible backdrop-blur-sm", neo.inner)} style={{ zIndex: 'var(--z-index-sticky)' }}>
          <TabsTrigger
            value="summary"
            className="flex flex-col md:flex-row items-center gap-2 text-xs md:text-sm font-black uppercase h-14 md:h-16 min-h-[56px] leading-none data-[state=active]:bg-neo-border data-[state=active]:text-neo-background data-[state=active]:border data-[state=active]:border-neo-border data-[state=active]:shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all border border-transparent hover:border-neo-border px-3 md:px-4"
          >
            <FileText className="h-5 w-5 md:h-6 md:w-6" />
            <span className="tracking-tight">Summary</span>
          </TabsTrigger>
          <TabsTrigger
            value="quiz"
            className="flex flex-col md:flex-row items-center gap-2 text-xs md:text-sm font-black uppercase h-14 md:h-16 data-[state=active]:bg-neo-border data-[state=active]:text-neo-background data-[state=active]:border data-[state=active]:border-neo-border data-[state=active]:shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all border border-transparent hover:border-neo-border px-3 md:px-4"
          >
            <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
            <span className="tracking-tight">Quiz</span>
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="flex flex-col md:flex-row items-center gap-2 text-xs md:text-sm font-black uppercase h-14 md:h-16 data-[state=active]:bg-neo-border data-[state=active]:text-neo-background data-[state=active]:border data-[state=active]:border-neo-border data-[state=active]:shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all border border-transparent hover:border-neo-border px-3 md:px-4"
          >
            <StickyNote className="h-5 w-5 md:h-6 md:w-6" />
            <span className="tracking-tight">Notes</span>
          </TabsTrigger>
          <TabsTrigger
            value="bookmarks"
            className="flex flex-col md:flex-row items-center gap-2 text-xs md:text-sm font-black uppercase h-14 md:h-16 data-[state=active]:bg-neo-border data-[state=active]:text-neo-background data-[state=active]:border data-[state=active]:border-neo-border data-[state=active]:shadow-[4px_4px_0px_0px_var(--neo-border)] transition-all border border-transparent hover:border-neo-border px-3 md:px-4"
          >
            <BookmarkIcon className="h-5 w-5 md:h-6 md:w-6" />
            <span className="tracking-tight">Bookmarks</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="flex-1 overflow-auto w-full p-0 mt-6">
          {isTabLoading ? (
            <div className="transition-opacity duration-150">
              <TabSkeleton />
            </div>
          ) : (
            <div className="transition-transform transition-opacity duration-200">
              {currentChapter ? (
                <GlassDoorLock
                  isLocked={!canAccessSummary}
                  previewRatio={0.2}
                  reason={!user ? "Sign in to continue learning" : "Upgrade your plan to unlock this content"}
                  className="p-0"
                  blurIntensity={canAccessSummary ? "light" : "medium"}
                >
                  <div className={`p-6 bg-neo-background shadow-[4px_4px_0px_0px_var(--neo-border)] ${neo.inner}`}>
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
                  <div className="text-center space-y-4 transition-transform duration-200">
                    <div className={`w-24 h-24 bg-muted flex items-center justify-center mx-auto ${neo.inner}`}>
                      <FileText className="h-12 w-12 opacity-50" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black mb-3 uppercase">No Chapter Selected</h3>
                      <p className="text-base text-muted-foreground font-bold">
                        Select a chapter from the playlist to view AI-generated summary and insights
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quiz" className="flex-1 overflow-auto w-full p-0 mt-6">
          {currentChapter ? (
            <GlassDoorLock
              isLocked={!canAccessQuiz}
              reason={!user ? "Sign in to continue learning" : "Upgrade your plan to unlock this content"}
              className="p-0"
              blurIntensity={canAccessQuiz ? "light" : "medium"}
            >
                  <div className={`p-6 bg-neo-background shadow-[4px_4px_0px_0px_var(--neo-border)] ${neo.inner}`}>
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
                <div className="text-center space-y-4 transition-transform duration-200">
                <div className={`w-24 h-24 bg-muted flex items-center justify-center mx-auto ${neo.inner}`}>
                  <MessageSquare className="h-12 w-12 opacity-50" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-3 uppercase">No Chapter Selected</h3>
                  <p className="text-base text-muted-foreground font-bold">
                    Select a chapter from the playlist to take interactive quizzes and test your knowledge
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarks" className="flex-1 overflow-auto w-full p-0 mt-6">
          <BookmarksPanel
            bookmarks={bookmarks}
            isAuthenticated={isAuthenticated}
            handleSeekToBookmark={handleSeekToBookmark}
            handleRemoveBookmark={handleRemoveBookmark}
            formatTime={formatTime}
          />
        </TabsContent>

        <TabsContent value="notes" className="flex-1 overflow-auto w-full p-0 mt-6">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
