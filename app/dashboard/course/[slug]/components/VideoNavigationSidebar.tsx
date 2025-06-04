"use client"

import { useState, useMemo, useCallback } from "react"
import { signIn } from "next-auth/react"
import { ChevronDown, CheckCircle, ChevronUp, Info, Play, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { FullCourseType, FullChapterType, CourseProgress } from "@/app/types/types"
import { cn } from "@/lib/tailwindUtils"
import { motion } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

// Simple Info icon without tooltip to avoid infinite loops
const InfoIcon = () => <Info className="h-4 w-4 text-muted-foreground" />

interface VideoNavigationSidebarProps {
  course: FullCourseType
  currentChapter?: FullChapterType
  courseId: string
  onVideoSelect: (videoId: string) => void
  currentVideoId: string
  isAuthenticated: boolean
  progress: CourseProgress | null
  completedChapters: number[]
  nextVideoId?: string
  prevVideoId?: string
}

// Helper function for formatting duration - define outside component to avoid circular reference
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "--:--"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Helper function to determine the total duration of previous chapters - define outside component
function calculateStartTime(unit: any, chapterIndex: number): number {
  let startTime = 0
  for (let i = 0; i < chapterIndex; i++) {
    startTime += unit.chapters[i]?.duration || 0
  }
  return startTime
}

export default function VideoNavigationSidebar({
  course,
  currentChapter,
  courseId,
  onVideoSelect,
  currentVideoId,
  isAuthenticated,
  progress,
  completedChapters,
  nextVideoId,
  prevVideoId,
}: VideoNavigationSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 640 : false
  const dispatch = useAppDispatch()
  const playingVideoId = useAppSelector((state) => state.course.currentVideoId)

  // Add a search filter for chapters
  // Add this state at the top of the component
  const [searchQuery, setSearchQuery] = useState("")

  // Use progress data if available, otherwise create a default structure
  // Added null checking for course
  const effectiveProgress = useMemo(() => {
    if (!course) {
      return {
        id: 0,
        userId: "",
        courseId: 0,
        progress: 0,
        completedChapters: [],
        currentChapterId: currentChapter?.id || null,
      }
    }

    return (
      progress || {
        id: 0,
        userId: "",
        courseId: typeof course.id === "string" ? Number.parseInt(course.id) : course.id || 0,
        progress: 0,
        completedChapters: [],
        currentChapterId: currentChapter?.id || null,
      }
    )
  }, [progress, course, currentChapter?.id])

  // Ensure course is defined before accessing its properties
  const totalChapters = useMemo(() => {
    if (!course?.courseUnits) return 0
    return course.courseUnits.reduce((acc, unit) => acc + (unit?.chapters?.length || 0), 0)
  }, [course])

  // Calculate progress for display
  const completedCount = Array.isArray(completedChapters) ? completedChapters.length : 0
  const progressPercentage = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0

  // Add this function to filter chapters
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim() || !course?.courseUnits) return course?.courseUnits || []

    return course.courseUnits
      .map((unit) => ({
        ...unit,
        chapters: unit.chapters.filter((chapter) => chapter.title?.toLowerCase().includes(searchQuery.toLowerCase())),
      }))
      .filter((unit) => unit.chapters.length > 0)
  }, [course?.courseUnits, searchQuery])

  // Enhance the sidebar with better UX
  // Add this function inside the component before the return statement

  const handleChapterClick = useCallback(
    (chapter) => {
      if (chapter.videoId) {
        // Add a visual feedback animation when clicking a chapter
        const element = document.getElementById(`chapter-${chapter.id}`)
        if (element) {
          element.classList.add("bg-primary/10")
          setTimeout(() => {
            element.classList.remove("bg-primary/10")
          }, 300)
        }

        // Track the click for analytics
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "select_chapter", {
            chapter_id: chapter.id,
            chapter_title: chapter.title,
          })
        }

        onVideoSelect(chapter.videoId)
      }
    },
    [onVideoSelect],
  )

  // Memoize the content to prevent unnecessary re-renders
  // Add proper null checking throughout
  const sidebarContent = useMemo(
    () => (
      <div className={cn("flex h-full flex-col bg-background transition-all duration-300", isCollapsed && "w-16")}>
        <div className="flex items-center justify-between p-4 border-b">
          {!isCollapsed ? (
            <h2 className="text-lg font-semibold tracking-tight">Course Content</h2>
          ) : (
            <span className="sr-only">Course Content</span>
          )}
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn("transition-all duration-200 hover:bg-accent", isCollapsed ? "mx-auto" : "ml-auto")}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
                <ChevronUp className="h-4 w-4" />
              </motion.div>
            </Button>
          )}
        </div>

        {!isCollapsed && (
          <div className="px-4 py-2 sticky top-0 bg-background z-10 border-b">
            <input
              type="text"
              placeholder="Search chapters..."
              className="w-full px-3 py-1 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 z-0">
          {effectiveProgress && !isCollapsed && (
            <div className="px-6 py-4 sticky top-0 bg-background z-10 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Course Progress</h3>
                <Button variant="ghost" size="icon" className="h-auto w-auto p-0 hover:bg-transparent">
                  <InfoIcon />
                  <span className="sr-only">Course progress info</span>
                </Button>
              </div>
              <Progress value={effectiveProgress.progress} className="h-2" />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {Array.isArray(effectiveProgress.completedChapters) ? effectiveProgress.completedChapters.length : 0}{" "}
                  / {totalChapters} chapters
                </span>
                <span>{Math.round(effectiveProgress.progress)}% complete</span>
              </div>

              {!isAuthenticated && (
                <div className="mt-2 pt-2 border-t border-dashed border-muted">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
                    className="text-xs p-0 h-auto text-primary"
                  >
                    Sign in to save your progress
                  </Button>
                </div>
              )}
            </div>
          )}

          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <div
                className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
                style={{ maxHeight: "calc(100vh - 200px)" }}
              >
                {filteredUnits.map((unit, unitIndex) => (
                  <div key={unit.id} className="mb-4">
                    {/* Unit title section - Collapsible trigger removed for simplicity */}
                    <div className="flex items-center justify-between p-3 text-sm font-medium text-foreground">
                      <div className="flex flex-col w-full">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{unit.title || "Untitled Unit"}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {unit.chapters?.filter((chapter) =>
                                progress?.completedChapters?.includes(chapter?.id || ""),
                              ).length || 0}
                              /{unit.chapters?.length || 0}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                                false ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>
                        <Progress value={0} className="h-1" />
                      </div>
                    </div>

                    {/* Chapter list - Directly rendered without collapsible for simplicity */}
                    <div className="space-y-1 mt-2">
                      {unit.chapters.map((chapter, chapterIndex) => {
                        const isCurrentChapter = chapter.videoId === currentVideoId
                        const isNextChapter = chapter.videoId === nextVideoId
                        const isCompleted = completedChapters?.includes(+chapter.id)

                        // Calculate timestamps for the chapter
                        const startTime = calculateStartTime(unit, chapterIndex)
                        const endTime = startTime + (chapter.duration || 0)

                        return (
                          <motion.div
                            id={`chapter-${chapter.id}`}
                            key={chapter.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "relative rounded-md px-3 py-2 transition-all cursor-pointer",
                              isCurrentChapter
                                ? "bg-primary/15 border-l-4 border-primary text-primary pl-2"
                                : isCompleted
                                  ? "bg-muted/50 hover:bg-muted/80"
                                  : isNextChapter
                                    ? "bg-accent/10 hover:bg-accent/20 border-l-2 border-accent pl-[10px]"
                                    : "hover:bg-muted/50",
                            )}
                            onClick={() => handleChapterClick(chapter)}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                {/* Status indicator */}
                                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                  {isCompleted ? (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                    >
                                      <CheckCircle className="h-4 w-4 text-primary" />
                                    </motion.div>
                                  ) : isCurrentChapter ? (
                                    <motion.div
                                      animate={{ scale: [0.8, 1.2, 0.8] }}
                                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                                    >
                                      <Play className="h-4 w-4 fill-primary text-primary" />
                                    </motion.div>
                                  ) : isNextChapter ? (
                                    <ChevronRight className="h-4 w-4 text-accent" />
                                  ) : (
                                    <span className="text-xs text-muted-foreground font-medium">
                                      {unitIndex + 1}.{chapterIndex + 1}
                                    </span>
                                  )}
                                </span>

                                {/* Title */}
                                <div className="flex-1 text-sm truncate">
                                  <span
                                    className={cn(
                                      "truncate line-clamp-2",
                                      isCurrentChapter ? "font-medium" : "",
                                      isCompleted && !isCurrentChapter ? "text-muted-foreground" : "",
                                    )}
                                  >
                                    {chapter.title}
                                  </span>
                                </div>

                                {/* Next badge for upcoming video */}
                                {isNextChapter && (
                                  <span className="text-[10px] uppercase font-semibold bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                                    Next
                                  </span>
                                )}
                              </div>

                              {/* Duration indicator */}
                              {chapter.videoId && chapter.duration > 0 && (
                                <div className="flex items-center text-xs text-muted-foreground ml-7">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>
                                    {formatDuration(startTime)} - {formatDuration(endTime)}
                                    <span className="ml-1">({formatDuration(chapter.duration || 0)})</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    [
      course?.courseUnits,
      currentChapter,
      currentVideoId,
      effectiveProgress,
      isAuthenticated,
      isCollapsed,
      isMobile,
      nextVideoId,
      onVideoSelect,
      prevVideoId,
      totalChapters,
      filteredUnits,
      handleChapterClick,
      searchQuery,
    ],
  )

  return <div className="flex flex-col h-full overflow-hidden">{sidebarContent}</div>
}
