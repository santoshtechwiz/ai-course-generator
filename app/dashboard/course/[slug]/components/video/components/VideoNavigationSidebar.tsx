"use client"

import React from "react"
import { useMemo, useState, useCallback } from "react"
import {
  CheckCircle,
  Lock,
  ChevronRight,
  Circle,
  Menu,
  Play,
  Pause,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  BookOpen,
  Timer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
// Fix type import path
import type { FullCourseType, FullChapterType } from "@/app/types/course-types"
// Use our CourseProgress type instead of Prisma's
import type { CourseProgress } from "@/app/types/course-types"

interface VideoNavigationSidebarProps {
  course: {
    id: number
    title: string
    chapters: FullChapterType[]
  }
  currentChapter?: FullChapterType | null
  courseId: string | number
  onChapterSelect: (chapter: FullChapterType) => void
  currentVideoId: string
  isAuthenticated: boolean
  progress: Record<string, any> | null
  completedChapters: (number | string)[]
  nextVideoId?: string
  courseStats?: {
    totalChapters: number
    completedChapters: number
    progressPercentage: number
  }
  isPlaying?: boolean
  onTogglePlay?: () => void
  formatDuration?: (seconds: number) => string
  videoDurations?: Record<string, number>
  isSubscribed?: boolean
}

const Equalizer = () => (
  <div className="flex items-end gap-0.5">
    <motion.span
      className="w-1 rounded-sm bg-primary"
      initial={{ height: 6 }}
      animate={{ height: [6, 14, 8, 12, 6] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      style={{ display: "inline-block" }}
    />
    <motion.span
      className="w-1 rounded-sm bg-primary"
      initial={{ height: 10 }}
      animate={{ height: [10, 6, 12, 6, 10] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      style={{ display: "inline-block" }}
    />
    <motion.span
      className="w-1 rounded-sm bg-primary"
      initial={{ height: 8 }}
      animate={{ height: [8, 12, 6, 14, 8] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      style={{ display: "inline-block" }}
    />
  </div>
)

// Enhanced Chapter Item Component with better status indicators
const ChapterItem = React.memo(
  ({
    chapter,
    isActive,
    isCompleted,
    isLocked,
    isNextVideo,
    isPrevVideo,
    isPlaying,
    onChapterClick,
    chapterIndex,
    totalChapters,
    formatDuration,
  }: {
    chapter: FullChapterType
    isActive: boolean
    isCompleted: boolean
    isLocked: boolean
    isNextVideo: boolean
    isPrevVideo: boolean
    isPlaying?: boolean
    onChapterClick: (chapter: FullChapterType) => void
    chapterIndex: number
    totalChapters: number
    formatDuration?: (seconds: number) => string
  }) => {
    const getStatusIcon = () => {
      if (isActive && isPlaying) {
        return <Equalizer />
      }
      if (isActive && !isPlaying) {
        return <Pause className="h-4 w-4 text-primary" fill="currentColor" />
      }
      if (isCompleted) {
        return <CheckCircle className="h-4 w-4 text-green-500" fill="currentColor" />
      }
      if (isLocked) {
        return <Lock className="h-4 w-4 text-muted-foreground" />
      }
      return <Circle className="h-4 w-4 text-muted-foreground" />
    }

    const getStatusBadges = () => {
      const badges = [] as React.ReactNode[]

      if (isActive) {
        badges.push(
          <Badge key="current" variant="default" className="text-[10px] py-0 h-5 bg-primary text-primary-foreground animate-pulse">
            {isPlaying ? "Playing" : "Current"}
          </Badge>,
        )
      }

      if (isNextVideo && !isActive) {
        badges.push(
          <Badge
            key="next"
            variant="outline"
            className="text-[10px] py-0 h-5 bg-primary/10 text-primary border-primary/20"
          >
            Up Next
          </Badge>,
        )
      }

      if (chapter.isFree) {
        badges.push(
          <Badge
            key="free"
            variant="outline"
            className="text-[10px] py-0 h-5 bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
          >
            Free
          </Badge>,
        )
      }

      return badges
    }

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: chapterIndex * 0.05 }}
      >
        <div
          className={cn(
            "relative border-l-4 transition-all duration-200",
            isActive
              ? "border-l-primary bg-primary/10"
              : isCompleted
                ? "border-l-green-500/40 hover:border-l-green-500/70"
                : "border-l-transparent hover:border-l-primary/40",
            isNextVideo && !isActive && "border-l-primary/30 bg-primary/5",
          )}
        >
          <button
            className={cn(
              "flex items-start w-full px-4 py-3 text-sm transition-all duration-200 text-left group",
              "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isActive && "bg-accent font-medium",
              isLocked && "opacity-60 cursor-not-allowed",
              "relative overflow-hidden",
            )}
            onClick={() => !isLocked && onChapterClick(chapter)}
            disabled={isLocked}
            aria-current={isActive ? "page" : undefined}
            aria-label={`${chapter.title || "Untitled Chapter"}${isCompleted ? " (completed)" : ""}${isActive ? " (currently playing)" : ""}${isLocked ? " (locked)" : ""}`}
            tabIndex={isLocked ? -1 : 0}
          >
            {/* Progress indicator line for active chapter */}
            {isActive && (
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}

            {/* Chapter number and status icon */}
            <div className="flex-shrink-0 flex items-center mr-3 min-w-[2rem]">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-green-500 text-white"
                      : isNextVideo
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                )}
              >
                {isActive || isCompleted ? getStatusIcon() : chapterIndex + 1}
              </div>
            </div>

            {/* Thumbnail */}
            {chapter.videoId && (
              <div className="relative mr-3 w-16 h-10 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={`https://img.youtube.com/vi/${chapter.videoId}/mqdefault.jpg`}
                  alt={chapter.title || "Chapter thumbnail"}
                  fill
                  className={cn("object-cover transition-transform duration-200", isLocked ? "opacity-60" : "group-hover:scale-[1.03]")}
                  sizes="64px"
                  priority={false}
                />
                {isLocked && (
                  <div className="absolute inset-0 grid place-items-center bg-black/20">
                    <Lock className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            )}

            {/* Chapter content */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h4
                  className={cn(
                    "font-medium line-clamp-2 leading-tight break-words text-sm",
                    isActive ? "text-foreground" : "text-foreground/90",
                    isLocked && "text-muted-foreground",
                  )}
                >
                  {chapter.title || "Untitled Chapter"}
                </h4>

                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground/50 transition-all flex-shrink-0 mt-0.5",
                    isActive ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-70",
                  )}
                />
              </div>

              {/* Chapter metadata */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {chapter.duration && (
                  <span className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {typeof chapter.duration === 'number' && formatDuration ? formatDuration(chapter.duration) : chapter.duration}
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Chapter {chapterIndex + 1} of {totalChapters}
                </span>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-1 flex-wrap">{getStatusBadges()}</div>
            </div>
          </button>
        </div>
      </motion.div>
    )
  },
)

ChapterItem.displayName = "ChapterItem"

// Enhanced Unit Card Component
const UnitCard = React.memo(
  ({
    unit,
    isExpanded,
    onToggle,
    children,
    completedChapters,
    totalChapters,
  }: {
    unit: any
    isExpanded: boolean
    onToggle: () => void
    children: React.ReactNode
    completedChapters: number
    totalChapters: number
  }) => {
    const progressPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0

    return (
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-3 bg-card hover:bg-accent transition-colors border-b text-left group">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{unit.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {completedChapters} of {totalChapters} completed
                  </span>
                  <div className="flex-1 max-w-20">
                    <Progress value={progressPercentage} className="h-1" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{Math.round(progressPercentage)}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {completedChapters === totalChapters && totalChapters > 0 && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    )
  },
)

UnitCard.displayName = "UnitCard"

// Enhanced Mobile Sidebar Component
function MobileSidebar({
  children,
  course,
  courseProgress,
  completedCount,
  totalChapters,
  isPlaying,
  onTogglePlay,
}: {
  children: React.ReactNode
  course: FullCourseType
  courseProgress: number
  completedCount: number
  totalChapters: number
  isPlaying?: boolean
  onTogglePlay?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden fixed top-4 left-4 z-50 bg-background/95 backdrop-blur-sm shadow-lg border-border/50"
          aria-label="Open course navigation"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0 bg-background/95 backdrop-blur-sm">
        <SheetHeader className="p-4 border-b border-border/50 bg-background/50">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-left line-clamp-2 text-base font-semibold">
              {course?.title || "Course Content"}
            </SheetTitle>
            {onTogglePlay && (
              <Button variant="ghost" size="sm" onClick={onTogglePlay} className="h-8 w-8 p-0">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            )}
          </div>

          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                <span>
                  {completedCount} of {totalChapters} completed
                </span>
              </span>
              <span className="text-muted-foreground font-medium">{courseProgress}%</span>
            </div>
            <Progress value={courseProgress} className="h-2" aria-label={`Course progress: ${courseProgress}%`} />
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">{children}</div>
      </SheetContent>

      {/* Floating mobile Chapters button bottom-right */}
      <Button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 rounded-full shadow-xl bg-primary text-primary-foreground"
        aria-label="Open chapters"
      >
        Chapters
      </Button>
    </Sheet>
  )
}

// Enhanced Desktop Sidebar Component
function DesktopSidebar({
  children,
  course,
  courseProgress,
  completedCount,
  totalChapters,
  isPlaying,
  onTogglePlay,
}: {
  children: React.ReactNode
  course: FullCourseType
  courseProgress: number
  completedCount: number
  totalChapters: number
  isPlaying?: boolean
  onTogglePlay?: () => void
}) {
  return (
    <div className="hidden lg:flex flex-col h-full bg-background/95 backdrop-blur-sm border-l border-border/50">
      {/* Enhanced Header */}
      <div className="p-5 sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold leading-none line-clamp-2 flex-1">
            {course?.title || "Course Content"}
          </h2>
          {onTogglePlay && (
            <Button variant="ghost" size="sm" onClick={onTogglePlay} className="h-8 w-8 p-0 ml-2">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <span>
                {completedCount} of {totalChapters} completed
              </span>
            </span>
            <span className="text-muted-foreground font-medium">{courseProgress}%</span>
          </div>

          <Progress value={courseProgress} className="h-2" aria-label={`Course progress: ${courseProgress}%`} />

          {/* Course stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Course Progress
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {totalChapters} Chapters
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

// Memoize ChapterItem and UnitCard with stable keys and props
const MemoizedChapterItem = React.memo(ChapterItem)
const MemoizedUnitCard = React.memo(UnitCard)

// SidebarContent with improved UX and performance
const SidebarContent = React.memo(function SidebarContent({
  filteredUnits,
  expandedUnits,
  toggleUnit,
  completedChapters,
  currentChapter,
  nextVideoId,
  isAuthenticated,
  isSubscribed,
  handleChapterClick,
  totalChapters,
  isPlaying,
  searchQuery,
  handleSearchChange,
  courseId,
  courseProgress,
  computedStats,
  loading,
  scrollToActive,
  formatDuration,
}: {
  filteredUnits: any[]
  expandedUnits: Record<string, boolean>
  toggleUnit: (unitId: string) => void
  completedChapters: (number | string)[]
  currentChapter?: FullChapterType | null
  nextVideoId?: string
  isAuthenticated: boolean
  isSubscribed: boolean
  handleChapterClick: (chapter: FullChapterType) => void
  totalChapters: number
  isPlaying?: boolean
  searchQuery: string
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  courseId: string | number
  courseProgress: number
  computedStats: {
    completedCount: number
    totalChapters: number
    progressPercentage: number
  }
  loading?: boolean
  scrollToActive?: boolean
  formatDuration?: (seconds: number) => string
}) {
  // Ref for auto-scroll to active chapter
  const activeChapterRef = React.useRef<HTMLLIElement>(null)

  React.useEffect(() => {
    if (scrollToActive && activeChapterRef.current) {
      activeChapterRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [currentChapter?.id, scrollToActive])

  // Skeleton loading for sidebar
  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded" />
          <div className="h-6 bg-muted rounded w-2/3" />
          <div className="h-6 bg-muted rounded w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <React.Fragment>
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-10 p-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chapters..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9 h-9 bg-background/50 focus:ring-2 focus:ring-primary"
            aria-label="Search chapters"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearchChange({ target: { value: "" } } as any)}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              tabIndex={0}
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Course Content Navigation */}
      <ScrollArea className="flex-1">
        <nav aria-label="Course navigation" className="pb-4">
          {filteredUnits?.length > 0 ? (
            filteredUnits.map((unit, unitIndex) => {
              const unitCompletedChapters = unit.chapters.filter((chapter: any) =>
                completedChapters?.includes(Number(chapter.id)),
              ).length

              // Precompute global chapter index for all chapters in this unit
              const prevChaptersCount = React.useMemo(
                () =>
                  filteredUnits
                    .slice(0, unitIndex)
                    .reduce((acc, u) => acc + u.chapters.length, 0),
                [filteredUnits, unitIndex]
              )

              return (
                <motion.div
                  key={unit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: unitIndex * 0.1 }}
                  className="mb-2 last:mb-0"
                >
                  <MemoizedUnitCard
                    unit={unit}
                    isExpanded={expandedUnits[unit.id] ?? true}
                    onToggle={() => toggleUnit(unit.id)}
                    completedChapters={unitCompletedChapters}
                    totalChapters={unit.chapters.length}
                  >
                    <ul role="list" className="bg-background/30">
                      {unit.chapters.map((chapter: FullChapterType, chapterIndex: number) => {
                        const globalChapterIndex = prevChaptersCount + chapterIndex
                        const isActive = currentChapter?.id === chapter.id
                        const isCompleted = completedChapters?.includes(Number(chapter.id)) || false
                        const isLocked = !(chapter.isFree || isSubscribed)
                        const isNextVideo = chapter.videoId === nextVideoId
                        const isPrevVideo = chapter.videoId === currentChapter?.videoId

                        const chapterWithDescriptionFix = {
                          ...chapter,
                          description: chapter.description === null ? undefined : chapter.description,
                        }

                        return (
                          <li
                            key={chapter.id}
                            ref={isActive ? activeChapterRef : undefined}
                            tabIndex={isLocked ? -1 : 0}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <MemoizedChapterItem
                              chapter={chapterWithDescriptionFix}
                              isActive={isActive}
                              isCompleted={isCompleted}
                              isLocked={isLocked}
                              isNextVideo={isNextVideo}
                              isPrevVideo={isPrevVideo}
                              isPlaying={isActive ? isPlaying : false}
                              onChapterClick={handleChapterClick}
                              chapterIndex={globalChapterIndex}
                              totalChapters={totalChapters}
                              formatDuration={formatDuration}
                            />
                          </li>
                        )
                      })}
                    </ul>
                  </MemoizedUnitCard>
                </motion.div>
              )
            })
          ) : (
            <div className="p-5 text-center text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No chapters available.</p>
            </div>
          )}

          {searchQuery && filteredUnits?.length === 0 && (
            <div className="p-5 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No chapters found for "{searchQuery}"</p>
              <Button variant="ghost" size="sm" onClick={() => handleSearchChange({ target: { value: "" } } as any)} className="mt-2">
                Clear search
              </Button>
            </div>
          )}
        </nav>
      </ScrollArea>

      {/* Enhanced Footer */}
      <div className="border-t border-border/50 p-4 bg-muted/30 text-xs text-muted-foreground">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between cursor-help">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-3 w-3" />
                  Course ID: {courseId}
                </span>
                {courseProgress === 100 && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
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
    </React.Fragment>
  )
})

SidebarContent.displayName = "SidebarContent"

export default function VideoNavigationSidebar({
  course,
  currentChapter,
  courseId,
  onChapterSelect,
  currentVideoId,
  isAuthenticated,
  isSubscribed,
  progress,
  completedChapters = [],
  nextVideoId,
  courseStats,
  isPlaying = false,
  onTogglePlay,
  formatDuration,
}: VideoNavigationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  // Collapse all units on mobile by default, expand on desktop
  React.useEffect(() => {
    if (course?.courseUnits && Object.keys(expandedUnits).length === 0) {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 1024
      const initialExpanded = course.courseUnits.reduce(
        (acc, unit) => {
          acc[unit.id] = !isMobile // collapsed on mobile, expanded on desktop
          return acc
        },
        {} as Record<string, boolean>,
      )
      setExpandedUnits(initialExpanded)
    }
  }, [course?.courseUnits, expandedUnits])

  // Optionally, show loading skeleton while course is loading
  React.useEffect(() => {
    setLoading(!course)
  }, [course])

  const totalChapters = useMemo(() => {
    if (!course?.courseUnits) return 0
    return course.courseUnits.reduce((acc, unit) => acc + (unit?.chapters?.length || 0), 0)
  }, [course?.courseUnits])

  const completedCount = useMemo(
    () => (Array.isArray(completedChapters) ? completedChapters.length : 0),
    [completedChapters],
  )

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

  const handleChapterClick = useCallback(
    (chapter: FullChapterType) => {
      onChapterSelect(chapter)
    },
    [onChapterSelect],
  )

  const courseProgress = useMemo(() => {
    if (!completedChapters?.length) return 0
    if (totalChapters === 0) return 0
    return Math.round((completedChapters.length / totalChapters) * 100)
  }, [completedChapters, totalChapters])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const computedStats = useMemo(() => {
    if (courseStats) return courseStats
    return {
      totalChapters,
      completedCount,
      progressPercentage: courseProgress,
    }
  }, [courseStats, totalChapters, completedCount, courseProgress])

  const toggleUnit = useCallback((unitId: string) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }))
  }, [])

  // Auto-scroll to active chapter on navigation
  const scrollToActive = true

  return (
    <>
      {/* Mobile Sidebar */}
      <MobileSidebar
        course={course}
        courseProgress={computedStats.progressPercentage}
        completedCount={computedStats.completedCount}
        totalChapters={computedStats.totalChapters}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
      >
        <SidebarContent
          filteredUnits={filteredUnits}
          expandedUnits={expandedUnits}
          toggleUnit={toggleUnit}
          completedChapters={completedChapters}
          currentChapter={currentChapter}
          nextVideoId={nextVideoId}
          isAuthenticated={isAuthenticated}
          isSubscribed={isSubscribed}
          handleChapterClick={handleChapterClick}
          totalChapters={totalChapters}
          isPlaying={isPlaying}
          searchQuery={searchQuery}
          handleSearchChange={handleSearchChange}
          courseId={courseId}
          courseProgress={courseProgress}
          computedStats={computedStats}
          loading={loading}
          scrollToActive={scrollToActive}
          formatDuration={formatDuration}
        />
      </MobileSidebar>

      {/* Desktop Sidebar */}
      <DesktopSidebar
        course={course}
        courseProgress={computedStats.progressPercentage}
        completedCount={computedStats.completedCount}
        totalChapters={computedStats.totalChapters}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
      >
        <SidebarContent
          filteredUnits={filteredUnits}
          expandedUnits={expandedUnits}
          toggleUnit={toggleUnit}
          completedChapters={completedChapters}
          currentChapter={currentChapter}
          nextVideoId={nextVideoId}
          isAuthenticated={isAuthenticated}
          isSubscribed={isSubscribed}
          handleChapterClick={handleChapterClick}
          totalChapters={totalChapters}
          isPlaying={isPlaying}
          searchQuery={searchQuery}
          handleSearchChange={handleSearchChange}
          courseId={courseId}
          courseProgress={courseProgress}
          computedStats={computedStats}
          loading={loading}
          scrollToActive={scrollToActive}
          formatDuration={formatDuration}
        />
      </DesktopSidebar>
    </>
  )
}
