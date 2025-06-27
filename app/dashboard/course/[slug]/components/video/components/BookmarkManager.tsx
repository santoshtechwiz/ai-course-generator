"use client"

import React, { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bookmark, Clock, X } from "lucide-react"
import { BookmarkItem } from "../types"

interface BookmarkManagerProps {
  videoId: string
  bookmarks: BookmarkItem[]
  currentTime: number
  duration: number
  onSeekToBookmark: (time: number) => void
  onAddBookmark: (time: number, title?: string) => void
  onRemoveBookmark: (bookmarkId: string) => void
  formatTime: (seconds: number) => string
}

// Memoize individual bookmark item to prevent unnecessary re-renders
const BookmarkListItem = React.memo(
  ({
    bookmark,
    formatTime,
    onSeekToBookmark,
    onRemoveBookmark,
  }: {
    bookmark: BookmarkItem
    formatTime: (seconds: number) => string
    onSeekToBookmark: (time: number) => void
    onRemoveBookmark: (bookmarkId: string) => void
  }) => (
    <div
      key={bookmark.id || `${bookmark.videoId}-${bookmark.time}`}
      className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted group"
    >
      <div
        className="flex-grow cursor-pointer"
        onClick={() => onSeekToBookmark(bookmark.time)}
      >
        <div className="font-medium">
          {bookmark.title || `Bookmark at ${formatTime(bookmark.time)}`}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTime(bookmark.time)}
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onSeekToBookmark(bookmark.time)}
        className="h-8 px-2"
      >
        Jump
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onRemoveBookmark(bookmark.id || "")}
        className="h-8 px-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
)

BookmarkListItem.displayName = "BookmarkListItem"

const BookmarkManager: React.FC<BookmarkManagerProps> = ({
  videoId,
  bookmarks,
  currentTime,
  duration,
  onSeekToBookmark,
  onAddBookmark,
  onRemoveBookmark,
  formatTime,
}) => {
  const [newBookmarkTitle, setNewBookmarkTitle] = useState("")

  // Sort bookmarks by time once, not on each render
  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => a.time - b.time)
  }, [bookmarks])

  const handleAddBookmark = useCallback((): void => {
    onAddBookmark(currentTime, newBookmarkTitle)
    setNewBookmarkTitle("")
  }, [currentTime, newBookmarkTitle, onAddBookmark])

  const formattedCurrentTime = formatTime(currentTime)

  // Use optimized render for bookmark list
  const bookmarkList = useMemo(() => {
    if (sortedBookmarks.length === 0) {
      return (
        <div className="text-center p-4 text-muted-foreground">
          No bookmarks yet. Add one at a specific time in the video.
        </div>
      )
    }

    return sortedBookmarks.map((bookmark) => (
      <BookmarkListItem
        key={bookmark.id || `${bookmark.videoId}-${bookmark.time}`}
        bookmark={bookmark}
        formatTime={formatTime}
        onSeekToBookmark={onSeekToBookmark}
        onRemoveBookmark={onRemoveBookmark}
      />
    ))
  }, [sortedBookmarks, formatTime, onSeekToBookmark, onRemoveBookmark])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Bookmark className="h-5 w-5" />
        Bookmarks
      </h3>

      {/* Add Bookmark Form */}
      <div className="flex items-center gap-2">
        <div className="flex-grow">
          <Input
            type="text"
            placeholder="Bookmark title (optional)"
            value={newBookmarkTitle}
            onChange={(e) => setNewBookmarkTitle(e.target.value)}
            className="w-full"
          />
        </div>
        <span className="text-sm text-muted-foreground font-mono whitespace-nowrap">
          {formattedCurrentTime}
        </span>
        <Button size="sm" onClick={handleAddBookmark}>
          Add Bookmark
        </Button>
      </div>

      {/* Bookmark List */}
      <div className="space-y-2 max-h-60 overflow-auto pr-1">{bookmarkList}</div>
    </div>
  )
}

export default React.memo(BookmarkManager)
