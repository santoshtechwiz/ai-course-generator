"use client"

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { PlayCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMilestoneTracker } from "@/hooks/use-milestone-tracker"
import neo from "@/components/neo/tokens"
import ChapterItem from "./ChapterItem"

interface Chapter {
  id: string
  title: string
  videoId?: string
  duration?: number
  thumbnail?: string
  locked?: boolean
  isFree?: boolean
}

interface Course {
  id: number | string
  title: string
  chapters: Chapter[]
}

interface ChapterPlaylistProps {
  course: Course
  currentChapter: Chapter | null
  courseId: string
  onChapterSelect: (chapter: Chapter) => void
  currentVideoId: string
  isAuthenticated: boolean
  userSubscription: string | null
  progress: Record<string, number>
  completedChapters: string[]
  videoDurations: Record<string, number>
  formatDuration: (duration: number) => string
  courseStats: Record<string, any>
  onProgressUpdate?: (chapterId: string, progress: number) => void
  onChapterComplete?: (chapterId: string) => void
  isProgressLoading?: boolean
  lastPositions?: Record<string, number> // Add lastPositions prop
}

const ChapterPlaylist: React.FC<ChapterPlaylistProps> = ({
  course,
  currentChapter,
  onChapterSelect,
  progress,
  completedChapters,
  videoDurations,
  formatDuration,
  onProgressUpdate,
  onChapterComplete,
  isProgressLoading = false,
  lastPositions = {}, // Destructure lastPositions
}) => {
  // Activate milestone tracking for engagement
  const milestoneData = useMilestoneTracker(course.id)

  // Defensive runtime check: guard against malformed completedChapters
  useEffect(() => {
    try {
      if (!Array.isArray(completedChapters)) {
        console.error('[ChapterPlaylist] completedChapters unexpected type:', typeof completedChapters, completedChapters)
      }
    } catch (err) {
      console.error('[ChapterPlaylist] Error checking completedChapters', err)
    }
  }, [completedChapters])
  
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const progressUpdateTimeout = useRef<NodeJS.Timeout>()
  const videoDurationsRef = useRef(videoDurations)

  const stableOnProgressUpdate = useRef(onProgressUpdate)
  const stableOnChapterComplete = useRef(onChapterComplete)

  // Memoize hover handlers to prevent re-creation in map loop
  const handleMouseEnter = useCallback((chapterId: string) => {
    setHoveredChapter(chapterId)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredChapter(null)
  }, [])

  useEffect(() => {
    stableOnProgressUpdate.current = onProgressUpdate
    stableOnChapterComplete.current = onChapterComplete
  }, [onProgressUpdate, onChapterComplete])

  useEffect(() => {
    videoDurationsRef.current = videoDurations
  }, [videoDurations])

  useEffect(() => {
    if (!currentChapter?.id || !progress[currentChapter.id]) return

    if (progressUpdateTimeout.current) {
      clearTimeout(progressUpdateTimeout.current)
    }

    progressUpdateTimeout.current = setTimeout(() => {
      stableOnProgressUpdate.current?.(currentChapter.id, progress[currentChapter.id])

      if (progress[currentChapter.id] >= 0.95) {
        stableOnChapterComplete.current?.(currentChapter.id)
      }
    }, 2000)

    return () => {
      if (progressUpdateTimeout.current) {
        clearTimeout(progressUpdateTimeout.current)
      }
    }
  }, [currentChapter?.id, progress])

  const overallProgress = useMemo(() => {
    if (!course?.chapters?.length || !completedChapters?.length) return 0
    const verified = course.chapters.filter(
      (ch) => completedChapters?.includes(String(ch.id)) || completedChapters?.includes(ch.id),
    ).length
    return (verified / course.chapters.length) * 100
  }, [course?.chapters, completedChapters])

  const courseStatistics = useMemo(() => {
    const totalChapters = course?.chapters?.length || 0
    
    // Properly count completed chapters - they should be actual chapter IDs from Redux
    let completedCount = 0
    if (Array.isArray(completedChapters) && completedChapters.length > 0) {
      completedCount = completedChapters.filter(id => {
        // Verify the chapter actually exists in the course
        return course?.chapters?.some(ch => String(ch.id) === String(id))
      }).length
    }
    
    // Calculate total duration in seconds
    const totalDurationSeconds =
      course?.chapters?.reduce((acc, chapter) => {
        return acc + (chapter.videoId ? videoDurationsRef.current?.[chapter.videoId] || 0 : 0)
      }, 0) || 0

    // Calculate hours for display
    const totalHours = Math.floor(totalDurationSeconds / 3600)
    const remainingMinutes = Math.floor((totalDurationSeconds % 3600) / 60)

    return {
      totalChapters,
      completedCount,
      totalDurationSeconds,
      totalHours,
      remainingMinutes,
      remainingChapters: totalChapters - completedCount,
    }
  }, [course?.chapters, completedChapters])

  const handleChapterClick = useCallback(
    (chapter: Chapter) => {
      if (chapter.locked) return
      if (!chapter.videoId) {
        console.info("Chapter doesn't have a videoId:", chapter)
        return
      }
      onChapterSelect(chapter)
    },
    [onChapterSelect],
  )

  if (!course?.chapters?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <PlayCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="font-medium text-base mb-2">No chapters available</h3>
        <p className="text-muted-foreground text-sm">This course doesn't have any content yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {isProgressLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}

      <div className="flex-shrink-0 border-b-4 border-b-black bg-background">
        <div className="p-4 space-y-4">
          <h2 className="font-bold text-base mb-2 line-clamp-2 uppercase tracking-tight">{course.title}</h2>
          
          {/* Statistics Grid - Neobrutalism Style */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Completed Card - Highlighted */}
            <div className={cn(
              "border-2 border-black p-3 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all",
              courseStatistics.completedCount > 0 
                ? "bg-green-400 text-black font-black" 
                : "bg-green-100 text-black"
            )}>
              <div className="font-black text-2xl">{courseStatistics.completedCount}</div>
              <div className="font-bold text-xs uppercase tracking-tight">
                {courseStatistics.completedCount === 1 ? 'Completed' : 'Completed'}
              </div>
              {courseStatistics.completedCount > 0 && (
                <div className="text-xs font-bold mt-1 text-green-900">✓ {((courseStatistics.completedCount / courseStatistics.totalChapters) * 100).toFixed(0)}%</div>
              )}
            </div>
            
            {/* Remaining Card */}
            <div className={cn(
              "border-2 border-black p-3 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all",
              courseStatistics.remainingChapters === 0
                ? "bg-green-400 text-black font-black"
                : "bg-yellow-100 text-black"
            )}>
              <div className="font-black text-2xl">{courseStatistics.remainingChapters}</div>
              <div className="font-bold text-xs uppercase tracking-tight">Remaining</div>
              {courseStatistics.remainingChapters === 0 && (
                <div className="text-xs font-bold mt-1 text-green-900">All Done! 🎉</div>
              )}
            </div>
            
            {/* Total Hours Card */}
            <div className="bg-blue-100 border-2 border-black p-3 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="font-black text-2xl">
                {courseStatistics.totalHours}h
              </div>
              <div className="font-bold text-xs uppercase tracking-tight">Total Time</div>
              <div className="text-xs font-bold mt-1 text-blue-900">{courseStatistics.remainingMinutes}m</div>
            </div>
          </div>

          {/* Progress Bar - Neobrutalism */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-black uppercase tracking-tight">Progress</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-black px-2 py-1 border border-black",
                  overallProgress === 100 
                    ? "bg-green-400 text-black"
                    : "bg-white text-black"
                )}>
                  {Math.round(overallProgress)}%
                </span>
                {/* Milestone badges */}
                {milestoneData.shownMilestones.length > 0 && (
                  <div className="flex gap-1">
                    {milestoneData.shownMilestones.includes(25) && (
                      <div className="text-xs bg-blue-300 border border-black px-1 py-0.5 font-bold">25% ✓</div>
                    )}
                    {milestoneData.shownMilestones.includes(50) && (
                      <div className="text-xs bg-purple-300 border border-black px-1 py-0.5 font-bold">50% ✓</div>
                    )}
                    {milestoneData.shownMilestones.includes(75) && (
                      <div className="text-xs bg-orange-300 border border-black px-1 py-0.5 font-bold">75% ✓</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="h-3 bg-neo-background border-2 border-neo-border relative overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300",
                  overallProgress === 100 ? "bg-green-500" : "bg-black"
                )} 
                style={{ width: `${overallProgress}%` }} 
              />
              {overallProgress === 100 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-white drop-shadow-lg">✓ COMPLETE</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom scrollbar using Tailwind scrollbar-hide + overflow-y-auto for content overflow */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="divide-y divide-border">
          {course.chapters.map((chapter, chapterIndex) => {
            const safeId = String(chapter.id || `ch-${chapterIndex}`)
            const isActive = currentChapter && safeId === String(currentChapter.id)
            const isCompleted = completedChapters?.some((id) => String(id) === safeId)
            const chapterProgress = chapter.videoId ? progress?.[chapter.videoId] || 0 : 0
            const duration = chapter.videoId ? videoDurations?.[chapter.videoId] : undefined
            const hasVideo = !!chapter.videoId
            const isLocked = hasVideo && !chapter.isFree && chapter.locked
            const lastPosition = lastPositions?.[safeId]

            return (
              <ChapterItem
                key={safeId}
                chapter={chapter}
                chapterIndex={chapterIndex}
                isActive={isActive ?? false}
                isCompleted={isCompleted}
                chapterProgress={chapterProgress}
                duration={duration}
                hasVideo={hasVideo}
                isLocked={isLocked ?? false}
                lastPosition={lastPosition}
                formatDuration={formatDuration}
                onChapterClick={handleChapterClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default React.memo(ChapterPlaylist)
