"use client"

import { useState, useMemo, useCallback } from "react"
import { signIn } from "next-auth/react"
import { ChevronDown, CheckCircle, Play, ChevronUp, Clock, Lock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import type { FullCourseType, FullChapterType, CourseProgress } from "@/app/types/types"
import { cn } from "@/lib/tailwindUtils"
import { motion, AnimatePresence } from "framer-motion"

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
  completedChapters,
  nextVideoId,
}: VideoNavigationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())

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

  const totalChapters = useMemo(() => {
    if (!course?.courseUnits) return 0
    return course.courseUnits.reduce((acc, unit) => acc + (unit?.chapters?.length || 0), 0)
  }, [course])

  const completedCount = Array.isArray(completedChapters) ? completedChapters.length : 0

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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Course Content Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold">Course Content</h2>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalChapters}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="p-1 h-auto">
          <ChevronUp className="h-5 w-5" />
        </Button>
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
      <div className="flex-1 overflow-y-auto">
        {filteredUnits.map((unit, unitIndex) => {
          const unitProgress = unit.chapters.filter((chapter) => completedChapters.includes(Number(chapter.id))).length
          const isExpanded = expandedUnits.has(unit.id.toString())

          return (
            <div key={unit.id} className="border-b">
              {/* Unit Header */}
              <button
                onClick={() => toggleUnit(unit.id.toString())}
                className="w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="font-bold text-base">{unit.title || "Untitled Unit"}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <span>
                      {unitProgress}/{unit.chapters.length} lessons
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                    isExpanded && "rotate-180",
                  )}
                />
              </button>

              {/* Unit Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-muted/10"
                  >
                    <div className="border-t border-border/30">
                      {unit.chapters.map((chapter, chapterIndex) => {
                        const isCurrentChapter = chapter.videoId === currentVideoId
                        const isNextChapter = chapter.videoId === nextVideoId
                        const isCompleted = completedChapters?.includes(+chapter.id)
                        const isLocked = false // Replace with your logic for locked content

                        return (
                          <button
                            key={chapter.id}
                            onClick={() => handleChapterClick(chapter)}
                            className={cn(
                              "w-full text-left py-3 px-4 border-b last:border-b-0 border-border/30 flex items-start gap-3 transition-colors",
                              isCurrentChapter ? "bg-primary/5" : "hover:bg-muted/30",
                              isLocked && "opacity-70",
                            )}
                            disabled={isLocked}
                          >
                            {/* Number or Status Icon */}
                            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full border">
                              {isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-primary fill-primary" />
                              ) : isCurrentChapter ? (
                                <Play className="h-3 w-3 fill-primary text-primary" />
                              ) : isLocked ? (
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <span className="text-sm font-medium">{chapterIndex + 1}</span>
                              )}
                            </div>

                            {/* Chapter Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4
                                  className={cn(
                                    "text-sm font-medium line-clamp-2",
                                    isCurrentChapter && "text-primary",
                                    isCompleted && !isCurrentChapter && "text-muted-foreground",
                                  )}
                                >
                                  {chapter.title}
                                </h4>
                              </div>

                              {/* Content type and duration */}
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <div className="flex items-center">
                                  <FileText className="h-3 w-3 mr-1" />
                                  <span>Video</span>
                                </div>

                                {chapter.duration > 0 && (
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>{formatDuration(chapter.duration)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Preview button for locked content */}
                            {isLocked && (
                              <Button variant="outline" size="sm" className="text-xs h-7">
                                Preview
                              </Button>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* CourseAIState */}
      <div className="border-t p-4 bg-blue-50 dark:bg-blue-950/20">
        <button className="w-full flex items-center justify-between text-primary">
          <div className="flex items-center">
            <div className="mr-2 text-primary">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 3L4 9V21H20V9L12 3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 13C16 15.2091 14.2091 17 12 17C9.79086 17 8 15.2091 8 13C8 10.7909 9.79086 9 12 9C14.2091 9 16 10.7909 16 13Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 17V21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="font-medium">CourseAIState</span>
          </div>
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
