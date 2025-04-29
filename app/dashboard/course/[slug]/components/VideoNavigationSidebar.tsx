"use client"

import { useState, useEffect, memo, useMemo } from "react"
import { signIn } from "next-auth/react"
import { Lock, PlayCircle, ChevronDown, CheckCircle, ChevronUp, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { FullCourseType, FullChapterType, CourseProgress } from "@/app/types/types"
import { cn } from "@/lib/tailwindUtils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { motion } from "framer-motion"

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
  nextVideoId?: string
  prevVideoId?: string
  completedChapters: string | string[]
}

// Separate VideoPlaylist component to avoid re-renders
const VideoPlaylist = memo(function VideoPlaylist({
  courseUnits,
  currentChapter,
  onVideoSelect,
  currentVideoId,
  progress,
  nextVideoId,
  prevVideoId,
}: {
  courseUnits: FullCourseType["courseUnits"]
  currentChapter?: FullChapterType
  onVideoSelect: (videoId: string) => void
  currentVideoId: string
  progress: CourseProgress | null
  nextVideoId?: string
  prevVideoId?: string
}) {
  const showFullContent = true
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({})

  // Initialize expanded state based on current chapter
  useEffect(() => {
    if (currentChapter) {
      const currentUnitId = courseUnits
        ?.find((unit) => unit.chapters.some((chapter) => chapter.id === currentChapter.id))
        ?.id.toString()

      if (currentUnitId) {
        setExpandedUnits((prev) => ({
          ...prev,
          [currentUnitId]: true,
        }))
      }
    }
  }, [currentChapter, courseUnits])

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }))
  }

  return (
    <div className="p-4">
      {courseUnits?.map((unit) => {
        const isCurrentUnit = unit.chapters.some((chapter) => chapter.id === currentChapter?.id)
        const isExpanded = expandedUnits[unit.id.toString()] || isCurrentUnit
        const completedChaptersInUnit = unit.chapters.filter((chapter) =>
          progress?.completedChapters.includes(chapter.id),
        ).length
        const totalChaptersInUnit = unit.chapters.length
        const unitProgress = totalChaptersInUnit > 0 ? (completedChaptersInUnit / totalChaptersInUnit) * 100 : 0

        return (
          <Collapsible
            key={unit.id}
            open={isExpanded}
            onOpenChange={() => toggleUnit(unit.id.toString())}
            className="mb-4 border rounded-lg overflow-hidden"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{unit.title}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {completedChaptersInUnit}/{totalChaptersInUnit}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>
                <Progress value={unitProgress} className="h-1" />
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-1 p-2 bg-muted/20">
              {unit.chapters.map((chapter, index) => {
                const isCompleted = showFullContent && progress?.completedChapters.includes(chapter.id)
                const isCurrent = chapter.videoId === currentVideoId
                const isNext = chapter.videoId === nextVideoId

                return (
                  <button
                    key={chapter.id}
                    onClick={() => showFullContent && chapter.videoId && onVideoSelect(chapter.videoId)}
                    disabled={!showFullContent || !chapter.videoId}
                    className={cn(
                      "group relative w-full rounded-md p-3 text-left text-sm transition-all duration-200",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      isCurrent && "bg-accent/70 text-accent-foreground",
                      !showFullContent && "cursor-not-allowed opacity-60",
                      !chapter.videoId && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center shrink-0">
                        {showFullContent ? (
                          isCurrent ? (
                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                              <PlayCircle className="h-4 w-4 text-primary" />
                            </div>
                          ) : isCompleted ? (
                            <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-muted-foreground/70" />
                            </div>
                          )
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <span className={cn("flex-1 truncate", isCurrent && "font-medium")}>
                        {index + 1}. {chapter.title}
                      </span>
                      {isNext && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                        >
                          Next
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-primary/10 text-primary border-primary/20 animate-pulse"
                        >
                          Playing
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
})

function VideoNavigationSidebar({
  course,
  currentChapter,
  onVideoSelect,
  currentVideoId,
  isAuthenticated,
  progress,
  nextVideoId,
  prevVideoId,
}: VideoNavigationSidebarProps) {
  // Allow unauthenticated users to see content but with limited functionality
  const showFullContent = course.isPublic || isAuthenticated
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [localProgress, setLocalProgress] = useState<{
    completedChapters: string[]
    progress: number
    currentChapterId: string | null
  }>({
    completedChapters: [],
    progress: 0,
    currentChapterId: null,
  })

  // Load local progress for unauthenticated users - only once on mount
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        const savedProgress = localStorage.getItem(`local-course-progress-${course.id}`)
        if (savedProgress) {
          setLocalProgress(JSON.parse(savedProgress))
        }
      } catch (e) {
        console.error("Error loading local progress:", e)
      }
    }
  }, [isAuthenticated, course.id])

  // Calculate effective progress outside of render to prevent infinite loops
  const effectiveProgress = useMemo(() => {
    if (isAuthenticated && progress) {
      return progress
    }

    // Create a fallback progress object for unauthenticated users
    const totalChapters = course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0
    const progressPercentage = totalChapters > 0 ? (localProgress.completedChapters.length / totalChapters) * 100 : 0

    return {
      completedChapters: localProgress.completedChapters,
      progress: progressPercentage,
      currentChapterId: localProgress.currentChapterId,
    }
  }, [isAuthenticated, progress, localProgress, course.courseUnits])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Memoize the content to prevent unnecessary re-renders
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
                  {effectiveProgress.completedChapters.length} /{" "}
                  {course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0)} chapters
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
                <VideoPlaylist
                  courseUnits={course.courseUnits}
                  currentChapter={currentChapter}
                  onVideoSelect={onVideoSelect}
                  currentVideoId={currentVideoId}
                  progress={effectiveProgress}
                  nextVideoId={nextVideoId}
                  prevVideoId={prevVideoId}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    [
      course.courseUnits,
      currentChapter,
      currentVideoId,
      effectiveProgress,
      isAuthenticated,
      isCollapsed,
      isMobile,
      nextVideoId,
      onVideoSelect,
      prevVideoId,
    ],
  )

  return sidebarContent
}

export default memo(VideoNavigationSidebar)
