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
        "w-full text-left p-2 transition-all flex gap-2 group border-b-2",
        "border-b-[hsl(var(--border))]",
        isActive 
          ? "bg-[hsl(var(--warning))]/20 shadow-neo border-l-4 border-l-[hsl(var(--warning))]" 
          : isCompleted 
          ? "bg-[hsl(var(--success))]/10 hover:bg-[hsl(var(--success))]/20" 
          : "bg-[hsl(var(--surface))] hover:bg-[hsl(var(--muted))]",
        isLocked && "opacity-60 cursor-not-allowed bg-[hsl(var(--muted))]/50",
      )}
    >
      <div className="relative flex-shrink-0">
        {thumbnailUrl && hasVideo ? (
          <div className="w-[168px] h-[94px] sm:w-[120px] sm:h-[68px] border-2 border-[hsl(var(--border))] overflow-hidden bg-[hsl(var(--muted))] relative shadow-neo">
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
              <div className="w-full h-full bg-[hsl(var(--muted))] animate-pulse" />
            )}

            {/* Duration overlay - bottom right */}
            {duration && (
              <div className="absolute bottom-1 right-1 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-xs px-2 py-0.5 font-bold border border-[hsl(var(--border))] shadow-neo-sm">
                {formatDuration(duration)}
              </div>
            )}

            {/* Progress bar at bottom */}
            {!isCompleted && chapterProgress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[hsl(var(--foreground))]/30">
                <div className="h-full bg-[hsl(var(--accent))] transition-all duration-300" style={{ width: `${Math.min(chapterProgress, 100)}%` }} />
              </div>
            )}

            {/* Completed checkmark overlay */}
            {isCompleted && (
              <div className="absolute inset-0 bg-[hsl(var(--success))]/80 border-2 border-[hsl(var(--border))] flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-[hsl(var(--success-foreground))] drop-shadow-lg font-black" />
              </div>
            )}

            {/* Play icon overlay on hover */}
            {!isActive && !isLocked && !isCompleted && (
              <div className="absolute inset-0 bg-[hsl(var(--foreground))]/0 group-hover:bg-[hsl(var(--foreground))]/40 transition-colors flex items-center justify-center">
                <PlayCircle className="h-10 w-10 text-[hsl(var(--background))] opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            )}

            {/* Active indicator - border */}
            {isActive && <div className="absolute inset-0 border-3 border-[hsl(var(--warning))] shadow-inset" />}

            {/* Lock overlay */}
            {isLocked && (
              <div className="absolute inset-0 bg-[hsl(var(--foreground))]/70 border-2 border-[hsl(var(--border))] flex items-center justify-center">
                <Lock className="h-6 w-6 text-[hsl(var(--background))] drop-shadow-lg" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-[168px] h-[94px] sm:w-[120px] sm:h-[68px] bg-[hsl(var(--muted))] border-2 border-[hsl(var(--border))] flex items-center justify-center shadow-neo">
            <Lock className="h-6 w-6 text-[hsl(var(--foreground))]/60" />
          </div>
        )}

        {/* Chapter number badge */}
        <div className={cn(
          "absolute top-1 left-1 px-2 py-0.5 text-xs font-black uppercase",
          "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]",
          "border-2 border-[hsl(var(--border))] shadow-neo-sm"
        )}>
          #{chapterIndex + 1}
        </div>

        {/* Status badge - Completed */}
        {isCompleted && (
          <div className={cn(
            "absolute top-1 right-1 px-2 py-0.5 text-xs font-black uppercase",
            "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]",
            "border-2 border-[hsl(var(--border))] shadow-neo-sm"
          )}>
            ✓ DONE
          </div>
        )}

        {/* Status badge - In Progress */}
        {!isCompleted && chapterProgress > 0 && !isActive && (
          <div className={cn(
            "absolute top-1 right-1 px-2 py-0.5 text-xs font-black uppercase",
            "bg-[hsl(var(--warning))] text-[hsl(var(--foreground))]",
            "border-2 border-[hsl(var(--border))] shadow-neo-sm"
          )}>
            {Math.round(chapterProgress)}%
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-start gap-2">
          {/* Status icon */}
          <div className="flex-shrink-0 mt-0.5">
            {isCompleted ? (
              <div className="h-5 w-5 bg-[hsl(var(--success))] border-2 border-[hsl(var(--border))] font-black flex items-center justify-center text-xs text-[hsl(var(--success-foreground))]">✓</div>
            ) : isActive ? (
              <div className="h-5 w-5 bg-[hsl(var(--warning))] border-2 border-[hsl(var(--border))] font-black flex items-center justify-center text-xs">▶</div>
            ) : isLocked ? (
              <Lock className="h-4 w-4 text-[hsl(var(--foreground))]/60 font-bold" />
            ) : (
              <div className="h-4 w-4 border border-[hsl(var(--border))]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "text-sm font-bold line-clamp-2 mb-2 uppercase tracking-tight",
                isActive ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground))]",
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
                      <Clock className="h-3 w-3 flex-shrink-0 text-[hsl(var(--foreground))]/70" />
                      <span className="text-[hsl(var(--foreground))]/80">{formatDuration(duration)}</span>
                    </>
                  )}
                  {isCompleted && (
                    <span className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] px-2 py-0.5 border-2 border-[hsl(var(--border))] font-black uppercase text-xs shadow-neo-sm">✓ Done</span>
                  )}
                </div>

                {/* Last position info - where user was watching */}
                {lastPosition && !isCompleted && (
                  <div className="flex items-center gap-1.5 bg-[hsl(var(--primary))]/10 border-2 border-[hsl(var(--primary))]/30 px-2 py-1">
                    <Clock className="h-3 w-3 flex-shrink-0 text-[hsl(var(--primary))]" />
                    <span className="text-[hsl(var(--primary))] font-bold text-xs">
                      Left at: {formatDuration(lastPosition)}
                    </span>
                  </div>
                )}

                {/* Progress indicator */}
                {chapterProgress > 0 && !isCompleted && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-2 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] overflow-hidden">
                      <div 
                        className="h-full bg-[hsl(var(--accent))] transition-all duration-300" 
                        style={{ width: `${Math.min(chapterProgress, 100)}%` }} 
                      />
                    </div>
                    <span className="text-[hsl(var(--foreground))] font-black min-w-fit bg-[hsl(var(--warning))]/30 border border-[hsl(var(--border))] px-1">{Math.round(chapterProgress)}%</span>
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
