"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { CheckCircle, Clock, Play, Lock, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { createThumbnailErrorHandler, getYouTubeThumbnailUrl } from "@/utils/youtube-thumbnails"
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

interface ChapterItemProps {
  chapter: Chapter
  chapterIndex: number
  isActive: boolean
  isCompleted: boolean
  chapterProgress: number
  duration?: number
  hasVideo: boolean
  isLocked: boolean
  lastPosition?: number
  formatDuration: (duration: number) => string
  onChapterClick: (chapter: Chapter) => void
  onMouseEnter: (chapterId: string) => void
  onMouseLeave: () => void
}

const ChapterItem: React.FC<ChapterItemProps> = ({
  chapter,
  chapterIndex,
  isActive,
  isCompleted,
  chapterProgress,
  duration,
  hasVideo,
  isLocked,
  lastPosition,
  formatDuration,
  onChapterClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const itemRef = useRef<HTMLButtonElement>(null)
  const safeId = String(chapter.id || `ch-${chapterIndex}`)
  
  // ✅ Lazy load thumbnails using IntersectionObserver
  useEffect(() => {
    if (!itemRef.current) return
    
    // ✅ Capture ref value to avoid stale closure
    const element = itemRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            // Once visible, disconnect to prevent re-triggers
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: "200px", // Load 200px before entering viewport
        threshold: 0.01,
      }
    )

    observer.observe(element)

    // ✅ Cleanup: Always disconnect observer on unmount
    return () => {
      observer.disconnect()
    }
  }, [])

  const thumbnailUrl = chapter.thumbnail || (hasVideo ? getYouTubeThumbnailUrl(chapter.videoId || "", "hqdefault") : null)

  return (
    <button
      ref={itemRef}
      onClick={() => (!isLocked && hasVideo ? onChapterClick(chapter) : null)}
      onMouseEnter={() => onMouseEnter(safeId)}
      onMouseLeave={onMouseLeave}
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
            {/* ✅ Only load image when visible */}
            {isVisible ? (
              <Image
                src={thumbnailUrl}
                alt={chapter.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 640px) 168px, 120px"
                priority={isActive ?? false}
                onError={createThumbnailErrorHandler(chapter.videoId || "")}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 animate-pulse" />
            )}

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
                {lastPosition && !isCompleted && (
                  <div className="flex items-center gap-1.5 bg-blue-100 border border-blue-400 px-2 py-1 rounded">
                    <Clock className="h-3 w-3 flex-shrink-0 text-blue-600" />
                    <span className="text-blue-900 font-bold text-xs">
                      Left at: {formatDuration(lastPosition)}
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
}

export default React.memo(ChapterItem)
