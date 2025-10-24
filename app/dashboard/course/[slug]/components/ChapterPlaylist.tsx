"use client"

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { CheckCircle, Clock, Play, Lock, PlayCircle, Loader2, Zap } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { createThumbnailErrorHandler, getYouTubeThumbnailUrl } from "@/utils/youtube-thumbnails"
import { useMilestoneTracker } from "@/hooks/use-milestone-tracker"
import neo from "@/components/neo/tokens"

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
  // Progress effect intentionally empty (debug logging removed)
  useEffect(() => {}, [progress, completedChapters, videoDurations])
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const progressUpdateTimeout = useRef<NodeJS.Timeout>()
  const videoDurationsRef = useRef(videoDurations)

  const stableOnProgressUpdate = useRef(onProgressUpdate)
  const stableOnChapterComplete = useRef(onChapterComplete)

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

    console.log('[ChapterPlaylist] Statistics recalculated:', {
      totalChapters,
      completedCount,
      completedChapters: completedChapters?.slice(0, 5),
      courseSample: course?.chapters?.slice(0, 3).map(c => ({ id: c.id, title: c.title }))
    })

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
            const thumbnailUrl = chapter.thumbnail || (hasVideo ? getYouTubeThumbnailUrl(chapter.videoId || "", "maxresdefault") : null)

            if (chapterIndex === 0) {
              console.log('[ChapterPlaylist] First chapter debug:', {
                chapterId: chapter.id,
                videoId: chapter.videoId,
                progressValue: progress?.[chapter.videoId || ''],
                chapterProgress,
                allProgress: progress
              })
            }

            return (
              <button
                key={safeId}
                onClick={() => (!isLocked && hasVideo ? handleChapterClick(chapter) : null)}
                onMouseEnter={() => setHoveredChapter(safeId)}
                onMouseLeave={() => setHoveredChapter(null)}
                disabled={!hasVideo || isLocked}
                className={cn(
                  "w-full text-left p-2 transition-all flex gap-2 group border-b-2 border-b-black",
                  isActive ? "bg-yellow-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : isCompleted ? "bg-green-50 hover:bg-green-100" : "hover:bg-gray-50",
                  isLocked && "opacity-60 cursor-not-allowed bg-gray-100",
                )}
              >
                <div className="relative flex-shrink-0">
                  {thumbnailUrl && hasVideo ? (
                    <div className="w-[168px] h-[94px] sm:w-[120px] sm:h-[68px] border-2 border-black overflow-hidden bg-muted relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Image
                        src={thumbnailUrl}
                        alt={chapter.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 640px) 168px, 120px"
                        priority={isActive ?? false}
                        onError={createThumbnailErrorHandler(chapter.videoId || "")}
                      />

                      {/* Duration overlay - bottom right - Neobrutalism */}
                      {duration && (
                        <div className="absolute bottom-1 right-1 bg-black text-white text-xs px-2 py-0.5 font-bold border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                          {formatDuration(duration)}
                        </div>
                      )}

                      {/* Progress bar at bottom */}
                      {!isCompleted && chapterProgress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                          <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${Math.min(chapterProgress, 100)}%` }} />
                        </div>
                      )}

                      {/* Completed checkmark overlay */}
                      {isCompleted && (
                        <div className="absolute inset-0 bg-green-400/80 border-2 border-black flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-white drop-shadow-lg font-black" />
                        </div>
                      )}

                      {/* Play icon overlay on hover */}
                      {!isActive && !isLocked && !isCompleted && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <PlayCircle className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                      )}

                      {/* Active indicator - border */}
                      {isActive && <div className="absolute inset-0 border-3 border-yellow-500 shadow-inset" />}

                      {/* Lock overlay */}
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/70 border-2 border-black flex items-center justify-center">
                          <Lock className="h-6 w-6 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-[168px] h-[94px] sm:w-[120px] sm:h-[68px] bg-gray-200 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Lock className="h-6 w-6 text-black" />
                    </div>
                  )}

                  {/* Chapter number badge - Neobrutalism */}
                  <div className={cn("absolute top-1 left-1", neo.badge, "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]")}>
                    #{chapterIndex + 1}
                  </div>

                  {/* Status badge - Completed */}
                  {isCompleted && (
                    <div className={cn("absolute top-1 right-1", neo.badge, "bg-green-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]")}>
                      ✓ DONE
                    </div>
                  )}

                  {/* Status badge - In Progress */}
                  {!isCompleted && chapterProgress > 0 && !isActive && (
                    <div className={cn("absolute top-1 right-1", neo.badge, "bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]")}>
                      {Math.round(chapterProgress)}%
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-start gap-2">
                    {/* Status icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <div className="h-5 w-5 bg-green-400 border-2 border-black font-black flex items-center justify-center text-xs text-white">✓</div>
                      ) : isActive ? (
                        <div className="h-5 w-5 bg-yellow-300 border-2 border-black font-black flex items-center justify-center text-xs">▶</div>
                      ) : isLocked ? (
                        <Lock className="h-4 w-4 text-black font-bold" />
                      ) : (
                        <div className="h-4 w-4 border border-black" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={cn(
                          "text-sm font-bold line-clamp-2 mb-2 uppercase tracking-tight",
                          isActive ? "text-black" : "text-foreground",
                          isCompleted && "line-through opacity-60"
                        )}
                      >
                        {chapter.title}
                      </h3>

                      {hasVideo && (
                        <div className="flex flex-col gap-2 text-xs font-bold">
                          {/* Duration and Status */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {duration && (
                              <>
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span className="text-black">{formatDuration(duration)}</span>
                              </>
                            )}
                            {isCompleted && (
                              <span className="bg-green-400 text-black px-2 py-0.5 border border-black font-black uppercase text-xs">✓ Done</span>
                            )}
                          </div>

                          {/* Last position info - where user was watching */}
                          {lastPositions && lastPositions[String(chapter.id)] && !isCompleted && (
                            <div className="flex items-center gap-1.5 bg-blue-100 border border-blue-400 px-2 py-1 rounded">
                              <Clock className="h-3 w-3 flex-shrink-0 text-blue-600" />
                              <span className="text-blue-900 font-bold text-xs">
                                Left at: {formatDuration(lastPositions[String(chapter.id)])}
                              </span>
                            </div>
                          )}

                          {/* Progress indicator - Neobrutalism */}
                          {chapterProgress > 0 && !isCompleted && (
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-2 bg-neo-background border border-neo-border overflow-hidden">
                                <div 
                                  className="h-full bg-black transition-all duration-300" 
                                  style={{ width: `${Math.min(chapterProgress, 100)}%` }} 
                                />
                              </div>
                              <span className="text-black font-black min-w-fit bg-yellow-200 border border-black px-1">{Math.round(chapterProgress)}%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default React.memo(ChapterPlaylist)
