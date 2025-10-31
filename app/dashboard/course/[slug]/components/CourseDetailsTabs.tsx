"use client"

import { useState, useCallback, useMemo, useTransition, useEffect, useRef } from "react"
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
  Star,
  PlayCircle,
  StickyNote,
  LucideIcon,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"

import { useAppSelector, useAppDispatch } from "@/store/hooks"
import type { RootState } from "@/store"
import type { FullCourseType, FullChapterType } from "@/app/types/types"

// ⚡ Aggressive lazy loading with prefetching strategy
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
import { BookmarkItem, CourseProgress } from "@/store/slices/course-slice"

// 🎨 Optimized skeleton with reduced repaints
const SkeletonLoader = () => (
  <div className="space-y-4 p-6 bg-[var(--color-bg)]">
    <div className="space-y-2">
      <div className="h-8 w-1/3 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-none shadow-[2px_2px_0_var(--shadow-color)] animate-pulse" />
      <div className="h-4 w-2/3 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-none animate-pulse" />
    </div>
    <div className="space-y-3">
      <div className="h-32 bg-[var(--color-muted)] border-3 border-[var(--color-border)] rounded-none shadow-[3px_3px_0_var(--shadow-color)] animate-pulse" />
      <div className="h-20 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-none animate-pulse" />
      <div className="h-20 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-none animate-pulse" />
    </div>
    <div className="space-y-2">
      {[100, 100, 80].map((width, i) => (
        <div
          key={i}
          className="h-4 bg-[var(--color-muted)] border border-[var(--color-border)] rounded-none animate-pulse"
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
  </div>
)

// ✨ Optimized empty state with reduced motion
const EmptyTabMessage = ({ 
  icon: Icon, 
  title, 
  message 
}: { 
  icon: LucideIcon
  title: string
  message: string 
}) => (
  <div className="h-full flex items-center justify-center p-8">
    <div className="text-center space-y-6 max-w-md">
      <div
        className={cn(
          "w-24 h-24 bg-[var(--color-muted)] border-4 border-[var(--color-border)]",
          "flex items-center justify-center mx-auto rounded-none",
          "shadow-[4px_4px_0_var(--shadow-color)]"
        )}
      >
        <Icon className="h-12 w-12 text-[var(--color-muted-text)]" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-black uppercase tracking-wider text-[var(--color-text)]">
          {title}
        </h3>
        <p className="text-sm font-bold text-[var(--color-muted-text)]">
          {message}
        </p>
      </div>
    </div>
  </div>
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
  const [isPending, startTransition] = useTransition()
  const [mountedTabs, setMountedTabs] = useState(new Set(["summary"]))
  const tabRefs = useRef<Record<string, boolean>>({})

  // ⚡ Prefetch adjacent tabs on hover
  const prefetchTab = useCallback((tabValue: string) => {
    if (!tabRefs.current[tabValue]) {
      tabRefs.current[tabValue] = true
      setMountedTabs(prev => new Set([...prev, tabValue]))
    }
  }, [])

  // 🎯 Optimized tab change with concurrent rendering
  const handleTabChange = useCallback((value: string) => {
    if (value === activeTab) return
    
    startTransition(() => {
      setActiveTab(value)
      setMountedTabs(prev => new Set([...prev, value]))
    })
  }, [activeTab])

  const currentVideoId = useAppSelector((state) => state.course.currentVideoId)
  const { user } = useAuth()
  const { isSubscribed, plan } = useUnifiedSubscription()
  
  // ⚡ Memoize expensive computations
  const { isOwner, isAdmin, isAuthenticated } = useMemo(() => ({
    isOwner: Boolean(user?.id && user.id === course.userId),
    isAdmin: Boolean(user?.isAdmin),
    isAuthenticated: Boolean(user)
  }), [user?.id, user?.isAdmin, course.userId])

  // Feature access
  const summaryAccess = useFeatureAccess("course-videos")
  const quizAccess = useFeatureAccess("quiz-access")

  const { canAccessSummary, canAccessQuiz } = useMemo(() => ({
    canAccessSummary: isOwner || isAdmin || summaryAccess.canAccess,
    canAccessQuiz: isOwner || isAdmin || quizAccess.canAccess
  }), [isOwner, isAdmin, summaryAccess.canAccess, quizAccess.canAccess])

  // ⚡ Ultra-optimized selectors with shallow equality
  const selectBookmarks = useMemo(
    () =>
      createSelector(
        [(state: RootState) => state.course.bookmarks, (state: RootState) => currentVideoId],
        (bookmarks: Record<string, BookmarkItem[]>, videoId: string | null): BookmarkItem[] => {
          return videoId && bookmarks[videoId] ? bookmarks[videoId] : []
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

  // Notes management
  const { notes, deleteNote } = useNotes({
    courseId: course.id,
    chapterId: currentChapter?.id,
    limit: 5,
  })

  const [notesSearchQuery, setNotesSearchQuery] = useState("")
  const [notesFilter, setNotesFilter] = useState<"all" | "recent" | "chapter">("all")

  // ⚡ Optimized filtering with early returns
  const filteredNotes = useMemo(() => {
    if (!notes.length) return []
    
    let filtered = notes
    const query = notesSearchQuery.trim().toLowerCase()

    if (query) {
      filtered = filtered.filter((note: any) => 
        note.note?.toLowerCase().includes(query) || 
        note.chapter?.title?.toLowerCase().includes(query)
      )
    }

    if (notesFilter === "recent") {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
      filtered = filtered.filter((note: any) => new Date(note.createdAt).getTime() > cutoff)
    } else if (notesFilter === "chapter") {
      filtered = filtered.filter((note: any) => note.chapterId === currentChapter?.id)
    }

    return filtered.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [notes, notesSearchQuery, notesFilter, currentChapter?.id])

  const { bookmarks: courseBookmarks } = useBookmarks({
    courseId: course.id,
    chapterId: currentChapter?.id,
  })

  // ⚡ Optimized stats calculation
  const courseStats = useMemo(() => {
    const totalChapters = course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0
    const completedCount = completedChapters.length || courseProgress?.completedChapters?.length || 0
    const progressPercentage = totalChapters ? Math.round((completedCount / totalChapters) * 100) : 0

    const totalDuration = course.courseUnits?.reduce((acc, unit) => 
      acc + unit.chapters.reduce((sum, ch) => sum + (typeof ch.duration === "number" ? ch.duration : 15), 0)
    , 0) || totalChapters * 15

    const completedDuration = course.courseUnits?.reduce((acc, unit) => 
      acc + unit.chapters.reduce((sum, ch) => {
        if (completedChapters.includes(String(ch.id))) {
          return sum + (typeof ch.duration === "number" ? ch.duration : 15)
        }
        return sum
      }, 0)
    , 0) || 0

    const remainingChapters = totalChapters - completedCount
    const estimatedTimeLeft = remainingChapters * (totalDuration / totalChapters)

    const skillLevel = 
      progressPercentage >= 90 ? "Expert" :
      progressPercentage >= 75 ? "Advanced" :
      progressPercentage >= 50 ? "Intermediate" :
      progressPercentage >= 25 ? "Novice" : "Beginner"

    return {
      totalChapters,
      completedChapters: completedCount,
      progressPercentage,
      remainingChapters,
      estimatedTimeLeft,
      totalDuration,
      completedDuration,
      learningStreak: courseProgress?.learningStreak || externalCourseProgress?.learningStreak || 0,
      skillLevel,
      totalBookmarks: bookmarks.length,
      studyTimeThisWeek: externalCourseProgress?.timeSpent || courseProgress?.studyTimeThisWeek || 0,
      averageScore: courseProgress?.averageQuizScore || 0,
      lastActivityDate: externalCourseProgress?.updatedAt || courseProgress?.lastActivityDate || null,
    }
  }, [course.courseUnits, courseProgress, externalCourseProgress, completedChapters, bookmarks.length])

  // ⚡ Memoized utility functions
  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds)) return "0:00"
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

  const handleRemoveBookmark = useCallback((bookmarkId: string) => {
    if (currentVideoId) {
      dispatch(removeBookmark({ videoId: currentVideoId, bookmarkId }))
    }
  }, [currentVideoId, dispatch])

  const handleSeekToBookmark = useCallback((time: number) => {
    onSeekToBookmark?.(time)
  }, [onSeekToBookmark])

  // ⚡ Tab configuration
  const tabs = useMemo(() => [
    { value: "summary", icon: FileText, label: "Summary" },
    { value: "quiz", icon: MessageSquare, label: "Quiz" },
    { value: "notes", icon: StickyNote, label: "Notes" },
    { value: "bookmarks", icon: BookmarkIcon, label: "Bookmarks" },
  ], [])

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange} 
        className="h-full w-full flex flex-col"
      >
        {/* 🎨 Optimized tabs list */}
        <LayoutGroup>
          <TabsList className={cn(
            "grid w-full grid-cols-2 sm:grid-cols-4 h-auto bg-[var(--color-bg)]",
            "p-2 gap-2 sm:gap-3 shadow-[2px_2px_0_var(--shadow-color)]",
            "border-b-4 border-[var(--color-border)] rounded-none"
          )}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.value
              const Icon = tab.icon
              
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  onMouseEnter={() => prefetchTab(tab.value)}
                  className={cn(
                    "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2",
                    "px-2 sm:px-4 py-3 text-xs sm:text-sm font-black uppercase",
                    "h-auto rounded-none border-2 transition-all duration-100",
                    "tracking-wide cursor-pointer",
                    isActive
                      ? "bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-border)] shadow-[3px_3px_0_var(--shadow-color)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-muted)] hover:shadow-[2px_2px_0_var(--shadow-color)]"
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="hidden xs:inline">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 -z-10 bg-[var(--color-primary)] border-2 border-[var(--color-border)] rounded-none"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </LayoutGroup>

        {/* 🎯 Optimized content with conditional mounting */}
        <div className="flex-1 overflow-auto">
          {/* Summary Tab */}
          <TabsContent 
            value="summary" 
            className="w-full p-0 mt-4 sm:mt-6 data-[state=inactive]:hidden"
            forceMount={mountedTabs.has("summary")}
          >
            {currentChapter ? (
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
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent 
            value="quiz" 
            className="w-full p-0 mt-4 sm:mt-6 data-[state=inactive]:hidden"
            forceMount={mountedTabs.has("quiz")}
          >
            {currentChapter ? (
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
                    existingQuiz={currentChapter.questions || null}
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
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent 
            value="bookmarks" 
            className="w-full p-0 mt-4 sm:mt-6 data-[state=inactive]:hidden"
            forceMount={mountedTabs.has("bookmarks")}
          >
            <BookmarksPanel
              bookmarks={bookmarks}
              isAuthenticated={isAuthenticated}
              handleSeekToBookmark={handleSeekToBookmark}
              handleRemoveBookmark={handleRemoveBookmark}
              formatTime={formatTime}
            />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent 
            value="notes" 
            className="w-full p-0 mt-4 sm:mt-6 data-[state=inactive]:hidden"
            forceMount={mountedTabs.has("notes")}
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
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}