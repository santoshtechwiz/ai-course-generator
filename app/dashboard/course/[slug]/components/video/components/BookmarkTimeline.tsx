//Create a BookmarkTimeline that displays bookmarks on a video timeline

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { Bookmark } from "lucide-react"
import type { BookmarkItem } from "../types"

interface BookmarkTimelineProps {
  bookmarks: BookmarkItem[]
  duration: number
  currentTime: number
  onSeekToBookmark: (time: number) => void
  formatTime: (seconds: number) => string
}

const BookmarkTimeline: React.FC<BookmarkTimelineProps> = ({
  bookmarks,
  duration,
  currentTime,
  onSeekToBookmark,
  formatTime,
}) => {
  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => a.time - b.time)
  }, [bookmarks])

  if (sortedBookmarks.length === 0 || !duration) return null

  return (
    <div className="w-full bg-black/50 backdrop-blur-sm rounded-lg p-2 shadow-lg">
      <div className="relative w-full h-6">
        {/* Timeline bar */}
        <div className="absolute inset-0 w-full bg-muted/30 rounded-full h-1.5 top-1/2 -translate-y-1/2" />

        {/* Current position indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-primary rounded-full z-20"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />

        {/* Bookmarks */}
        {sortedBookmarks.map((bookmark) => {
          const position = (bookmark.time / duration) * 100
          const isActive = Math.abs(bookmark.time - currentTime) < 1

          return (
            <motion.button
              key={bookmark.id || `${bookmark.videoId}-${bookmark.time}`}
              className={`absolute top-1/2 -translate-y-1/2 -ml-1 h-4 w-4 rounded-full transition-all duration-150
                ${isActive ? "bg-primary scale-125 ring-2 ring-primary/30" : "bg-primary/80 hover:scale-110"}
              `}
              style={{ left: `${position}%` }}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                onSeekToBookmark(bookmark.time)
              }}
              title={`${bookmark.title || "Bookmark"} - ${formatTime(bookmark.time)}`}
              whileHover={{ scale: 1.2 }}
            >
              <Bookmark className="h-2 w-2" />
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default React.memo(BookmarkTimeline)