import type { BookmarkItem } from "@/store/slices/course-slice";
//Create a BookmarkTimeline that displays bookmarks on a video timeline

import React, { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bookmark, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [hoveredBookmark, setHoveredBookmark] = useState<string | null>(null)

  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => a.time - b.time)
  }, [bookmarks])

  if (sortedBookmarks.length === 0 || !duration) return null

  return (
    <div className="w-full bg-black/50 backdrop-blur-sm rounded-lg p-2 shadow-lg relative">
      <div className="relative w-full h-6">
        {/* Timeline bar */}
        <div className="absolute inset-0 w-full bg-muted/30 rounded-full h-1.5 top-1/2 -translate-y-1/2" />

        {/* Current position indicator */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-primary rounded-full z-20 shadow-lg"
          style={{ left: `${(currentTime / duration) * 100}%` }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Bookmarks */}
        <AnimatePresence>
          {sortedBookmarks.map((bookmark) => {
            const position = (bookmark.time / duration) * 100
            const isActive = Math.abs(bookmark.time - currentTime) < 1
            const isHovered = hoveredBookmark === (bookmark.id || `${bookmark.videoId}-${bookmark.time}`)

            return (
              <div key={bookmark.id || `${bookmark.videoId}-${bookmark.time}`}>
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 -ml-1 h-4 w-4 rounded-full cursor-pointer z-10 shadow-sm transition-all duration-200",
                    isActive
                      ? "bg-primary scale-125 ring-2 ring-primary/50 shadow-primary/50"
                      : "bg-yellow-400 hover:bg-yellow-300",
                    isHovered && "scale-110"
                  )}
                  style={{ left: `${position}%` }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSeekToBookmark(bookmark.time)
                  }}
                  onMouseEnter={() => setHoveredBookmark(bookmark.id || `${bookmark.videoId}-${bookmark.time}`)}
                  onMouseLeave={() => setHoveredBookmark(null)}
                  title={`${bookmark.title || "Bookmark"} - ${formatTime(bookmark.time)}`}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Bookmark className="h-2 w-2 text-black" />
                </motion.button>

                {/* Enhanced tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      className="absolute top-[-60px] left-1/2 -translate-x-1/2 z-30 bg-black/90 text-white px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm border border-white/20 min-w-max"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Bookmark className="h-3 w-3 text-yellow-400" />
                        <div>
                          <div className="font-medium">
                            {bookmark.title || "Bookmark"}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-300">
                            <Clock className="h-3 w-3" />
                            {formatTime(bookmark.time)}
                          </div>
                        </div>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Bookmark count indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm"
      >
        {sortedBookmarks.length}
      </motion.div>
    </div>
  )
}

export default React.memo(BookmarkTimeline)