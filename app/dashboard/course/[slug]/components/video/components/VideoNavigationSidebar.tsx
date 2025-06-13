"use client"

import React from "react"
import { useMemo, useState, useCallback } from "react"
import { signIn } from "next-auth/react"
import { CheckCircle, Clock, Lock, ChevronRight, Circle, PlayCircle, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/tailwindUtils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
// Fix type import path
import { FullCourseType, FullChapterType } from "@/app/types/course-types"
// Use our CourseProgress type instead of Prisma's
import type { CourseProgress } from "@/app/types/course-types"

interface VideoNavigationSidebarProps {
  course: FullCourseType
  currentChapter?: FullChapterType | null
  courseId: string | number
  onChapterSelect: (chapter: FullChapterType) => void // Updated type to match implementation
  currentVideoId: string
  isAuthenticated: boolean
  progress: CourseProgress | null
  completedChapters: (number | string)[] // Updated to allow both number and string IDs
  nextVideoId?: string
  prevVideoId?: string
  videoDurations?: Record<string, number>
  formatDuration?: (seconds: number) => string
  courseStats?: {
    completedCount: number
    totalChapters: number
    progressPercentage: number
  }
}

// Add proper return type
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "--:--"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Memoized chapter item component for better performance
const ChapterItem = React.memo(
  ({
    chapter,
    isActive,
    isCompleted,
    isLocked,
    isNextVideo,
    onChapterClick,
  }: {
    chapter: FullChapterType
    isActive: boolean
    isCompleted: boolean
    isLocked: boolean
    isNextVideo: boolean
    onChapterClick: (chapter: FullChapterType) => void
  }) => (
    <li>
      <div
        className={cn(
          "border-l-2 border-transparent transition-all",
          isActive ? "border-l-primary bg-accent/50" : "hover:border-l-primary/30",
        )}
      >
        <button
          className={cn(
            "flex items-center w-full px-5 py-3 text-sm transition-colors text-left",
            isActive ? "text-foreground font-medium" : "text-muted-foreground",
            "hover:text-foreground group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            isLocked && "opacity-70 cursor-not-allowed",
          )}
          onClick={() => !isLocked && onChapterClick(chapter)}
          disabled={isLocked}
          aria-current={isActive ? "page" : undefined}
          aria-label={`${chapter.title || "Untitled Chapter"}${isCompleted ? " (completed)" : ""}${isActive ? " (currently playing)" : ""}${isLocked ? " (locked)" : ""}`}
          tabIndex={isLocked ? -1 : 0}
        >
          {/* Status Icon */}
          <div
            className={cn(
              "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3.5",
              isActive ? "text-primary" : isCompleted ? "text-green-500" : "text-muted-foreground",
            )}
          >
            {isCompleted ? (
              <CheckCircle className="h-5 w-5 fill-green-500/20" aria-hidden="true" />
            ) : isLocked ? (
              <Lock className="h-4 w-4" aria-hidden="true" />
            ) : isActive ? (
              <PlayCircle className="h-5 w-5 fill-primary/20" aria-hidden="true" />
            ) : (
              <Circle className="h-5 w-5" aria-hidden="true" />
            )}
          </div>

          {/* Chapter Info */}
          <div className="flex flex-col items-start text-left flex-1 min-w-0">
            <span className={cn("line-clamp-2 leading-tight break-words", isActive && "font-medium text-foreground")}>
              {chapter.title || "Untitled Chapter"}
            </span>

            {/* Chapter metadata */}
            <div className="flex items-center gap-2 mt-1 text-xs">
              {chapter.duration && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {chapter.duration}
                </span>
              )}

              <div className="flex items-center gap-1">
                {isNextVideo && (
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 h-4 bg-primary/10 text-primary border-primary/20"
                  >
                    Next
                  </Badge>
                )}

                {chapter.isFree && (
                  <Badge variant="outline" className="text-[10px] py-0 h-4">
                    Free
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Navigation arrow */}
          <ChevronRight
            className={cn(
              "ml-2 h-4 w-4 text-muted-foreground/70 transition-opacity flex-shrink-0",
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-70",
            )}
            aria-hidden="true"
          />
        </button>
      </div>
    </li>
  ),
)

ChapterItem.displayName = "ChapterItem"

// Mobile Sidebar Component
function MobileSidebar({
  children,
  course,
  courseProgress,
  completedCount,
  totalChapters,
}: {
  children: React.ReactNode
  course: FullCourseType
  courseProgress: number
  completedCount: number
  totalChapters: number
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden fixed top-4 left-4 z-50 bg-background/95 backdrop-blur-sm"
          aria-label="Open course navigation"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left line-clamp-2">{course?.title || "Course Content"}</SheetTitle>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-primary/80" />
              <span>
                {completedCount} of {totalChapters} completed
              </span>
            </span>
            <span className="text-muted-foreground font-medium">{courseProgress}%</span>
          </div>
          <Progress value={courseProgress} className="h-1.5 mt-2" aria-label={`Course progress: ${courseProgress}%`} />
        </SheetHeader>
        <div className="flex-1 overflow-hidden">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

// Desktop Sidebar Component
function DesktopSidebar({
  children,
  course,
  courseProgress,
  completedCount,
  totalChapters,
}: {
  children: React.ReactNode
  course: FullCourseType
  courseProgress: number
  completedCount: number
  totalChapters: number
}) {
  return (
    <div className="hidden lg:flex flex-col h-full bg-background border-r">
      {/* Header section with course title and progress */}
      <div className="p-5 sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <h2 className="text-lg font-medium leading-none line-clamp-2 mb-3">{course?.title || "Course Content"}</h2>

        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-primary/80" />
            <span>
              {completedCount} of {totalChapters} completed
            </span>
          </span>
          <span className="text-muted-foreground font-medium">{courseProgress}%</span>
        </div>

        <Progress value={courseProgress} className="h-1.5" aria-label={`Course progress: ${courseProgress}%`} />
      </div>

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

export default function VideoNavigationSidebar({
  course,
  currentChapter,
  courseId,
  onChapterSelect,
  currentVideoId,
  isAuthenticated,
  progress,
  completedChapters = [], // Default to empty array for safety
  nextVideoId,
  videoDurations = {},
  formatDuration: formatDurationProp,
  courseStats,
}: VideoNavigationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Use the provided formatDuration function or fallback to the local implementation
  const formatDurationFn = useCallback(
    (seconds: number): string => {
      if (formatDurationProp) return formatDurationProp(seconds)
      return formatDuration(seconds)
    },
    [formatDurationProp],
  )

  // Memoize effective progress to prevent recalculation
  const effectiveProgress = useMemo(() => {
    if (!course) {
      return {
        id: 0,
        userId: "",
        courseId: 0,
        progress: 0,
        completedChapters: [],
        currentChapterId: currentChapter?.id || undefined,
      }
    }

    return (
      progress || {
        id: 0,
        userId: "",
        courseId: typeof course.id === "string" ? Number.parseInt(course.id) : course.id || 0,
        progress: 0,
        completedChapters: [],
        currentChapterId: currentChapter?.id || undefined,
      }
    )
  }, [progress, course, currentChapter?.id])

  // Memoize total chapters calculation
  const totalChapters = useMemo(() => {
    if (!course?.courseUnits) return 0
    return course.courseUnits.reduce((acc, unit) => acc + (unit?.chapters?.length || 0), 0)
  }, [course?.courseUnits])

  // Ensure completedCount uses the completedChapters with safe access
  const completedCount = useMemo(() => (Array.isArray(completedChapters) ? completedChapters.length : 0), [completedChapters])

  // Memoize filtered units with better performance
  const filteredUnits = useMemo(() => {
    if (!course?.courseUnits) return []

    if (!searchQuery.trim()) return course.courseUnits

    const query = searchQuery.toLowerCase()
    return course.courseUnits
      .map((unit) => ({
        ...unit,
        chapters: unit.chapters.filter((chapter) => chapter.title?.toLowerCase().includes(query)),
      }))
      .filter((unit) => unit.chapters.length > 0)
  }, [course?.courseUnits, searchQuery])

  // Optimized chapter click handler
  const handleChapterClick = useCallback(
    (chapter: FullChapterType) => {
      onChapterSelect(chapter)
    },
    [onChapterSelect],
  )

  // Memoize course progress calculation
  const courseProgress = useMemo(() => {
    if (!completedChapters?.length) return 0

    if (totalChapters === 0) return 0

    return Math.round((completedChapters.length / totalChapters) * 100)
  }, [completedChapters, totalChapters])

  // Use debounced search for better performance
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  // Get values from either passed courseStats or calculate them
  const computedStats = useMemo(() => {
    if (courseStats) return courseStats

    return {
      totalChapters,
      completedCount,
      progressPercentage: courseProgress,
    }
  }, [courseStats, totalChapters, completedCount, courseProgress])

  // Sidebar content component - extract to improve render performance
  const SidebarContent = React.memo(() => (
    <>
      {/* Authentication prompt for non-authenticated users */}
      {!isAuthenticated && (
        <div className="p-4 border-b bg-muted/30">
          <p className="text-sm text-muted-foreground mb-2">Sign in to save your progress</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
            className="w-full"
          >
            Sign In
          </Button>
        </div>
      )}

      {/* Course Content Navigation */}
      <ScrollArea className="flex-1">
        <nav aria-label="Course navigation" className="divide-y divide-border/40">
          {filteredUnits?.map((unit) => (
            <div key={unit.id} className="mb-1 last:mb-0">
              {/* Unit heading */}
              <div className="px-5 py-2.5 bg-muted/40 sticky top-0 z-10 font-medium text-sm">
                <h3>{unit.title}</h3>
              </div>

              {/* Chapter list */}
              <ul role="list">
                {unit.chapters.map((chapter) => {
                  const isActive = currentChapter?.id === chapter.id
                  const isCompleted = completedChapters?.includes(Number(chapter.id)) || false
                  const isLocked = !isAuthenticated && !chapter.isFree
                  const isNextVideo = chapter.videoId === nextVideoId

                  return (
                    <ChapterItem
                      key={chapter.id}
                      chapter={chapter}
                      isActive={isActive}
                      isCompleted={isCompleted}
                      isLocked={isLocked}
                      isNextVideo={isNextVideo}
                      onChapterClick={handleChapterClick}
                    />
                  )
                })}
              </ul>
            </div>
          )) || (
            <div className="p-5 text-center text-muted-foreground">
              <p>No chapters available.</p>
            </div>
          )}

          {/* Bottom spacing for better scrolling experience */}
          <div className="h-8" aria-hidden="true"></div>
        </nav>
      </ScrollArea>

      {/* Footer area for additional course information */}
      <div className="border-t p-4 bg-muted/30 text-xs text-muted-foreground">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between cursor-help">
                <span>Course ID: {courseId}</span>
                {courseProgress === 100 && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    Completed
                  </Badge>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Your progress is saved automatically</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  ))

  SidebarContent.displayName = "SidebarContent"

  return (
    <>
      {/* Mobile Sidebar */}
      <MobileSidebar
        course={course}
        courseProgress={computedStats.progressPercentage}
        completedCount={computedStats.completedCount}
        totalChapters={computedStats.totalChapters}
      >
        <SidebarContent />
      </MobileSidebar>

      {/* Desktop Sidebar */}
      <DesktopSidebar
        course={course}
        courseProgress={computedStats.progressPercentage}
        completedCount={computedStats.completedCount}
        totalChapters={computedStats.totalChapters}
      >
        <SidebarContent />
      </DesktopSidebar>
    </>
  )
}
