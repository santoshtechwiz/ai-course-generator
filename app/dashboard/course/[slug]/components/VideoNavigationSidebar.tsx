"use client"

import { useState, useMemo, useCallback } from "react"
import { signIn } from "next-auth/react"
import { ChevronDown, CheckCircle, ChevronUp, Play, ChevronRight, Clock, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 640 : false

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

        // Analytics tracking
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "select_chapter", {
            chapter_id: chapter.id,
            chapter_title: chapter.title,
          })
        }
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
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Course Content</h2>
          <Badge variant="secondary" className="text-xs">
            {completedCount}/{totalChapters}
          </Badge>
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-accent"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
              <ChevronUp className="h-4 w-4" />
            </motion.div>
          </Button>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Search */}
          <div className="p-4 border-b bg-background sticky top-[73px] z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search chapters..."
                className="pl-10 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Your Progress</h3>
              <span className="text-xs text-muted-foreground">{Math.round(effectiveProgress.progress)}%</span>
            </div>
            <Progress value={effectiveProgress.progress} className="h-2 mb-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {completedCount} of {totalChapters} complete
              </span>
              {!isAuthenticated && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
                  className="text-xs p-0 h-auto text-primary"
                >
                  Sign in to save
                </Button>
              )}
            </div>
          </div>

          {/* Course Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              {filteredUnits.map((unit, unitIndex) => {
                const unitProgress = unit.chapters.filter((chapter) =>
                  completedChapters.includes(Number(chapter.id)),
                ).length
                const isExpanded = expandedUnits.has(unit.id.toString())

                return (
                  <div key={unit.id} className="border-b border-border/50 last:border-b-0">
                    {/* Unit Header */}
                    <button
                      onClick={() => toggleUnit(unit.id.toString())}
                      className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{unit.title || "Untitled Unit"}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {unitProgress}/{unit.chapters.length} lessons
                            </span>
                            <Progress
                              value={(unitProgress / unit.chapters.length) * 100}
                              className="h-1 flex-1 max-w-20"
                            />
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Unit Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-0">
                            {unit.chapters.map((chapter, chapterIndex) => {
                              const isCurrentChapter = chapter.videoId === currentVideoId
                              const isNextChapter = chapter.videoId === nextVideoId
                              const isCompleted = completedChapters?.includes(+chapter.id)
                              const startTime = calculateStartTime(unit, chapterIndex)

                              return (
                                <motion.button
                                  key={chapter.id}
                                  onClick={() => handleChapterClick(chapter)}
                                  className={cn(
                                    "w-full text-left p-3 pl-8 transition-all duration-200 group",
                                    "hover:bg-muted/50 border-l-2 border-transparent",
                                    isCurrentChapter && "bg-primary/10 border-l-primary text-primary font-medium",
                                    isCompleted && !isCurrentChapter && "text-muted-foreground",
                                    isNextChapter && "border-l-orange-400 bg-orange-50 dark:bg-orange-950/20",
                                  )}
                                  whileHover={{ x: 2 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Status Icon */}
                                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
                                      {isCompleted ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : isCurrentChapter ? (
                                        <motion.div
                                          animate={{ scale: [0.8, 1.2, 0.8] }}
                                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                                        >
                                          <Play className="h-4 w-4 fill-primary text-primary" />
                                        </motion.div>
                                      ) : isNextChapter ? (
                                        <ChevronRight className="h-4 w-4 text-orange-500" />
                                      ) : (
                                        <span className="text-xs font-medium text-muted-foreground">
                                          {chapterIndex + 1}
                                        </span>
                                      )}
                                    </div>

                                    {/* Chapter Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                          {chapter.title}
                                        </h4>
                                        {isNextChapter && (
                                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                            Next
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Duration */}
                                      {chapter.duration > 0 && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                          <Clock className="h-3 w-3" />
                                          <span>{formatDuration(chapter.duration)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.button>
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
          </div>
        </>
      )}
    </div>
  )
}
