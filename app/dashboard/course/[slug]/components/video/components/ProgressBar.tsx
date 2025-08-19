"use client"

import React, { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface ProgressBarProps {
  played: number
  loaded: number
  onSeek: (time: number) => void
  bufferHealth: number
  duration: number
  formatTime: (seconds: number) => string
  bookmarks?: number[]
  onSeekToBookmark?: (time: number) => void
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  played,
  loaded,
  onSeek,
  bufferHealth,
  duration,
  formatTime,
  bookmarks = [],
  onSeekToBookmark,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [hoverPosition, setHoverPosition] = useState(0)
  const [dragPosition, setDragPosition] = useState(0)
  const [showChapterMarkers, setShowChapterMarkers] = useState(true)
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
    },
    [getPositionFromEvent],
  )

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      onSeek(dragPosition * duration)
      setIsDragging(false)
    }
  }, [isDragging, dragPosition, duration, onSeek])

  // Handle global mouse move during drag
  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !progressRef.current) return
      const position = getPositionFromEvent(e)
      setDragPosition(position)
    },
    [isDragging, getPositionFromEvent],
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
    (e: React.MouseEvent, time: number) => {
      e.stopPropagation()
      if (onSeekToBookmark) {
        onSeekToBookmark(time)
      }
    },
    [onSeekToBookmark],
  )

  // Global mouse events for dragging
  React.useEffect(() => {
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

  const getBufferHealthColor = useCallback(() => {
    if (bufferHealth >= 0.8) return "bg-green-400/40"
    if (bufferHealth >= 0.5) return "bg-yellow-400/40"
    return "bg-red-400/40"
  }, [bufferHealth])

  return (
    <div className="relative group">
      <AnimatePresence>
        {(isHovering || isDragging) && duration > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-3 bg-black/95 text-white px-3 py-2 rounded-lg text-sm font-medium pointer-events-none z-20 transform -translate-x-1/2 whitespace-nowrap backdrop-blur-sm border border-white/10 shadow-lg"
            style={{
              left: `${(isDragging ? dragPosition : hoverPosition) * 100}%`,
            }}
          >
            <div className="flex items-center gap-2">
              <span>{formatTime(previewTime)}</span>
              <span className="text-xs text-white/60">
                ({Math.round((isDragging ? dragPosition : hoverPosition) * 100)}%)
              </span>
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/95" />
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
        aria-valuenow={duration * currentPosition}
        tabIndex={0}
      >
        <div
          className={cn(
            "absolute top-0 left-0 h-full rounded-full transition-all duration-300",
            getBufferHealthColor(),
          )}
          style={{ width: `${safeLoaded * 100}%` }}
        />

        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-150 shadow-sm"
          style={{ width: `${currentPosition * 100}%` }}
        />

        {/* Hover indicator */}
        {isHovering && !isDragging && (
          <div
            className="absolute top-0 w-0.5 h-full bg-white/80 pointer-events-none rounded-full"
            style={{ left: `${hoverPosition * 100}%` }}
          />
        )}

        <AnimatePresence>
          {(isHovering || isDragging) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute top-1/2 w-4 h-4 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg cursor-grab active:cursor-grabbing border-2 border-white/20"
              style={{ left: `${currentPosition * 100}%` }}
            />
          )}
        </AnimatePresence>

        {bookmarks.map((time, index) => {
          if (!duration || time > duration) return null

          const bookmarkPosition = (time / duration) * 100

          return (
            <motion.div
              key={`bookmark-${index}-${time}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.3, y: -2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute top-1/2 w-2.5 h-3.5 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-sm transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:from-yellow-300 hover:to-yellow-400 transition-colors shadow-sm z-10 border border-yellow-600/20"
              style={{ left: `${bookmarkPosition}%` }}
              onClick={(e) => handleBookmarkClick(e, time)}
              title={`Bookmark at ${formatTime(time)}`}
              role="button"
              aria-label={`Bookmark at ${formatTime(time)}`}
            />
          )
        })}
      </div>

      <div className="absolute -bottom-7 left-0 flex items-center gap-2 text-xs text-white/80 font-medium">
        <span>{formatTime(duration * currentPosition)}</span>
        <span className="text-white/40">/</span>
        <span>{formatTime(duration)}</span>
        <div className="flex items-center gap-1 ml-2">
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              bufferHealth >= 0.8 ? "bg-green-400" : bufferHealth >= 0.5 ? "bg-yellow-400" : "bg-red-400",
            )}
          />
          <span className="text-xs text-white/60">{Math.round(bufferHealth * 100)}%</span>
        </div>
      </div>
    </div>
  )
}

export default ProgressBar
