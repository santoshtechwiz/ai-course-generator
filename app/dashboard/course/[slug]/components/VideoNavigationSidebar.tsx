"use client"

import { useMemo, useState, useCallback } from "react"
import { signIn } from "next-auth/react"
import { CheckCircle, Lock, ChevronRight, Circle, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import type { FullCourseType, FullChapterType, CourseProgress } from "@/app/types/types"
import { cn } from "@/lib/tailwindUtils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { useAppSelector } from "@/store/hooks"

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

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "--:--"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export default function VideoNavigationSidebar({
  course,
  currentChapter,
  courseId,
  onVideoSelect,
  currentVideoId,
  isAuthenticated,
  progress,
  nextVideoId,
  prevVideoId,
  completedChapters,
}: VideoNavigationSidebarProps) {
  // Safety check for course and courseUnits
  if (!course || !Array.isArray(course.courseUnits) || course.courseUnits.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No course content available</p>
      </div>
    )
  }

  const [searchQuery, setSearchQuery] = useState("")
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())

  // Get Redux state for course progress
  const reduxCourseProgress = useAppSelector((state) => state.course.courseProgress[+courseId])
  const reduxCompletedChapters = reduxCourseProgress?.completedChapters || []

  // Use Redux state if available, otherwise fall back to props
  const effectiveCompletedChapters = reduxCompletedChapters.length > 0 ? reduxCompletedChapters : completedChapters

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

    // Use Redux progress if available
    if (reduxCourseProgress) {
      return {
        ...reduxCourseProgress,
        completedChapters: effectiveCompletedChapters,
      }
    }

    return (
      progress || {
        id: 0,
        userId: "",
        courseId: typeof course.id === "string" ? Number.parseInt(course.id) : course.id || 0,
        progress: 0,
        completedChapters: effectiveCompletedChapters,
        currentChapterId: currentChapter?.id || null,
      }
    )
  }, [progress, course, currentChapter?.id, reduxCourseProgress, effectiveCompletedChapters])

  const totalChapters = useMemo(() => {
    if (!course?.courseUnits) return 0
    return course.courseUnits.reduce((acc, unit) => acc + (unit?.chapters?.length || 0), 0)
  }, [course])

  const completedCount = Array.isArray(effectiveCompletedChapters) ? effectiveCompletedChapters.length : 0

  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim() || !course?.courseUnits) return course?.courseUnits || []

    return course.courseUnits
      .map((unit) => ({
        ...unit,
        chapters: unit.chapters.filter((chapter) => chapter.title?.toLowerCase().includes(searchQuery.toLowerCase())),
      }))
      .filter((unit) => unit.chapters.length > 0)
  }, [course?.courseUnits, searchQuery])

  const toggleUnit = useCallback((unitId: string) => {
    setExpandedUnits((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(unitId)) {
        newSet.delete(unitId)
      } else {
        newSet.add(unitId)
      }
      return newSet
    })
  }, [])

  const handleChapterClick = useCallback(
    (chapter) => {
      if (chapter.videoId) {
        onVideoSelect(chapter.videoId)
      }
    },
    [onVideoSelect],
  )

  // Auto-expand unit containing current chapter
  useMemo(() => {
    if (currentChapter && course?.courseUnits) {
      const unitWithCurrentChapter = course.courseUnits.find((unit) =>
        unit.chapters.some((chapter) => chapter.id === currentChapter.id),
      )
      if (unitWithCurrentChapter) {
        setExpandedUnits((prev) => new Set([...prev, unitWithCurrentChapter.id.toString()]))
      }
    }
  }, [currentChapter, course?.courseUnits])

  // Calculate the overall progress percentage
  const courseProgress = useMemo(() => {
    if (!effectiveCompletedChapters?.length) return 0

    const totalChapters = course?.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0) || 0

    return totalChapters ? Math.round((effectiveCompletedChapters.length / totalChapters) * 100) : 0
  }, [effectiveCompletedChapters?.length, course?.courseUnits])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header section with course title and progress */}
      <div className="p-5 sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b" aria-label="Course progress">
        <h3 className="text-lg font-medium leading-none line-clamp-1 mb-2">{course?.title || "Course Content"}</h3>

        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-primary/80" />
            <span>
              {effectiveCompletedChapters?.length || 0} of {totalChapters} completed
            </span>
          </span>
          <span className="text-muted-foreground font-medium">{Math.round(effectiveProgress.progress)}%</span>
        </div>

        <Progress
          value={courseProgress}
          className="h-1.5"
          aria-label={`Course progress: ${courseProgress}%`}
          aria-valuenow={courseProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search chapters..."
            className="w-full bg-muted/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Progress */}
      <div className="p-4 border-b">
        <h3 className="text-base font-medium mb-2">Your Progress</h3>
        <Progress value={effectiveProgress.progress} className="h-2 mb-2" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {completedCount} of {totalChapters} complete
          </span>
          <span className="font-medium">{Math.round(effectiveProgress.progress)}%</span>
        </div>

        {!isAuthenticated && (
          <Button
            variant="link"
            size="sm"
            onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
            className="text-sm p-0 h-auto text-primary mt-2"
          >
            Sign in to save
          </Button>
        )}
      </div>

      {/* Course Content */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border/40">
          {course?.courseUnits?.map((unit) => (
            <div key={unit.id} className="mb-1 last:mb-0">
              {/* Unit heading */}
              <div className="px-5 py-2.5 bg-muted/40 sticky top-0 z-10 font-medium text-sm">{unit.title}</div>

              {/* Chapter list */}
              <div>
                {unit.chapters.map((chapter) => {
                  const isActive = currentChapter?.id === chapter.id
                  const isCompleted = effectiveCompletedChapters?.includes(Number(chapter.id)) || false
                  const isLocked = !isAuthenticated && !chapter.isFree
                  const isNextVideo = chapter.videoId === nextVideoId

                  return (
                    <div
                      key={chapter.id}
                      className={cn(
                        "border-l-2 border-transparent transition-all",
                        isActive ? "border-l-primary bg-accent/50" : "hover:border-l-primary/30",
                      )}
                    >
                      <button
                        className={cn(
                          "flex items-center w-full px-5 py-3 text-sm transition-colors",
                          isActive ? "text-foreground font-medium" : "text-muted-foreground",
                          "hover:text-foreground group",
                          isLocked && "opacity-70",
                        )}
                        onClick={() => !isLocked && onVideoSelect(chapter.videoId || "")}
                        disabled={isLocked}
                        aria-current={isActive ? "true" : "false"}
                        aria-label={`${chapter.title || "Untitled Chapter"}${isCompleted ? " (completed)" : ""}${isLocked ? " (locked)" : ""}`}
                      >
                        <div
                          className={cn(
                            "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3.5",
                            isActive ? "text-primary" : isCompleted ? "text-green-500" : "text-muted-foreground",
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 fill-green-500/20" />
                          ) : isLocked ? (
                            <Lock className="h-4 w-4" />
                          ) : isActive ? (
                            <PlayCircle className="h-5 w-5 fill-primary/20" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </div>

                        <div className="flex flex-col items-start text-left">
                          <span className={cn("line-clamp-2 leading-tight", isActive && "font-medium text-foreground")}>
                            {chapter.title || "Untitled Chapter"}
                          </span>

                          <div className="flex items-center gap-2 mt-1 text-xs">
                            {chapter.duration && <span className="text-muted-foreground">{chapter.duration}</span>}

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

                        <ChevronRight
                          className={cn(
                            "ml-auto h-4 w-4 text-muted-foreground/70 transition-opacity",
                            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-70",
                          )}
                        />
                      </button>

                      {/* Bottom divider for better visual separation */}
                      <div className={cn("h-px mx-10 bg-border/40", isActive && "bg-transparent")}></div>
                    </div>
                  )
                })}
              </div>
            </div>
          )) || <div className="p-5 text-center text-muted-foreground">No chapters available.</div>}

          {/* Bottom spacing for better scrolling experience */}
          <div className="h-8"></div>
        </div>
      </ScrollArea>

      {/* Footer area for additional course information */}
      <div className="border-t p-4 bg-muted/30 text-xs text-muted-foreground">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between cursor-help">
                <span>Course ID: {courseId}</span>
                {Math.round(effectiveProgress.progress) === 100 && (
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
    </div>
  )
}
