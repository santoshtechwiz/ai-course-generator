"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import type { BookmarkData } from "../types"
import { Progress } from "@radix-ui/react-progress"

interface ProgressBarProps {
  played: number
  loaded: number
  duration: number
  onSeek: (time: number) => void
  formatTime: (seconds: number) => string
  bookmarks?: BookmarkData[]
  onSeekToBookmark?: (time: number) => void
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  played,
  loaded,
  duration,
  onSeek,
  formatTime,
  bookmarks = [],
  onSeekToBookmark,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [hoverPosition, setHoverPosition] = useState(0)
  const [dragPosition, setDragPosition] = useState(0)
  const progressRef = useRef<HTMLDivElement>(null)

  const safeLoaded = Math.max(0, Math.min(1, isNaN(loaded) ? 0 : loaded))
  const safePlayed = Math.max(0, Math.min(1, isNaN(played) ? 0 : played))
  const currentPosition = isDragging ? dragPosition : safePlayed

  // Calculate position from mouse event
  const getPositionFromEvent = useCallback((e: React.MouseEvent | MouseEvent): number => {
    if (!progressRef.current) return 0
    const rect = progressRef.current.getBoundingClientRect()
    const position = (e.clientX - rect.left) / rect.width
    return Math.max(0, Math.min(1, position))
  }, [])

  // Handle mouse move for hover preview
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isHovering) return
      const position = getPositionFromEvent(e)
      setHoverPosition(position)
    },
    [isHovering, getPositionFromEvent],
  )

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      const position = getPositionFromEvent(e)
      setDragPosition(position)
      onSeek(position * duration)
    },
    [getPositionFromEvent, onSeek, duration],
  )

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
    }
  }, [isDragging])

  // Handle global mouse move during drag
  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !progressRef.current) return
      const position = getPositionFromEvent(e)
      setDragPosition(position)
      onSeek(position * duration)
    },
    [isDragging, getPositionFromEvent, onSeek, duration],
  )

  // Handle click on progress bar
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return
      const position = getPositionFromEvent(e)
      onSeek(position * duration)
    },
    [isDragging, getPositionFromEvent, onSeek, duration],
  )

  // Handle bookmark click
  const handleBookmarkClick = useCallback(
    (e: React.MouseEvent, bookmark: BookmarkData) => {
      e.stopPropagation()
      if (onSeekToBookmark) {
        onSeekToBookmark(bookmark.time)
      }
    },
    [onSeekToBookmark],
  )

  // Global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, handleGlobalMouseMove, handleMouseUp])

  // Calculate time for hover/drag position
  const previewTime = duration * (isDragging ? dragPosition : hoverPosition)
  const currentTime = duration * currentPosition

  return (
    <div className={cn("relative group", className)}>
      {/* Time preview tooltip */}
      <AnimatePresence>
        {(isHovering || isDragging) && duration > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 bg-black/90 text-white px-2 py-1 rounded text-xs font-medium pointer-events-none z-10 transform -translate-x-1/2 whitespace-nowrap"
            style={{
              left: `${(isDragging ? dragPosition : hoverPosition) * 100}%`,
            }}
          >
            {formatTime(previewTime)}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/90" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar container */}
      <div
        ref={progressRef}
        className={cn(
          "relative w-full bg-white/20 rounded-full cursor-pointer transition-all duration-200",
          isHovering || isDragging ? "h-2" : "h-1",
          "hover:h-2",
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        role="slider"
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
      >
        {/* Buffer progress */}
        <div
          className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-all duration-300"
          style={{ width: `${safeLoaded * 100}%` }}
        />

        {/* Played progress */}
        <div
          className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-150"
          style={{ width: `${currentPosition * 100}%` }}
        />

        {/* Hover indicator */}
        {isHovering && !isDragging && (
          <div
            className="absolute top-0 w-px h-full bg-white/60 pointer-events-none"
            style={{ left: `${hoverPosition * 100}%` }}
          />
        )}

        {/* Progress thumb */}
        <AnimatePresence>
          {(isHovering || isDragging) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute top-1/2 w-4 h-4 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg cursor-grab active:cursor-grabbing"
              style={{ left: `${currentPosition * 100}%` }}
            />
          )}
        </AnimatePresence>

        {/* Bookmarks */}
        {bookmarks.map((bookmark) => {
          if (!duration || bookmark.time > duration) return null

          const bookmarkPosition = (bookmark.time / duration) * 100

          return (
            <motion.div
              key={bookmark.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1/2 w-2 h-3 bg-yellow-400 rounded-sm transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:bg-yellow-300 transition-colors shadow-sm z-10"
              style={{ left: `${bookmarkPosition}%` }}
              onClick={(e) => handleBookmarkClick(e, bookmark)}
              title={`${bookmark.title} - ${formatTime(bookmark.time)}`}
              role="button"
              aria-label={`Bookmark: ${bookmark.title} at ${formatTime(bookmark.time)}`}
            />
          )
        })}
      </div>

      {/* Current time display */}
      <div className="absolute -bottom-6 left-0 text-xs text-white/80 font-medium">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  )
}

export default ProgressBar
