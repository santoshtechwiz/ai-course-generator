"use client"

import React, { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bookmark, Clock, X, Plus, CheckCircle, AlertCircle } from "lucide-react"
import { BookmarkItem } from "@/store/slices/course-slice"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Search, SortAsc, SortDesc, Trash2 } from "lucide-react"

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

// Memoized individual bookmark item to prevent unnecessary re-renders
const BookmarkListItem = React.memo(
  ({
    bookmark,
    formatTime,
    onSeekToBookmark,
    onRemoveBookmark,
    isNew = false,
  }: {
    bookmark: BookmarkItem
    formatTime: (seconds: number) => string
    onSeekToBookmark: (time: number) => void
    onRemoveBookmark: (bookmarkId: string) => void
    isNew?: boolean
  }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleDelete = () => {
      onRemoveBookmark(bookmark.id || "")
      setShowDeleteConfirm(false)
    }

    return (
      <>
        <motion.div
          initial={isNew ? { opacity: 0, y: -10, scale: 0.95 } : { opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          key={bookmark.id || `${bookmark.videoId}-${bookmark.time}`}
          className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted group relative overflow-hidden"
        >
          {/* New bookmark indicator */}
          {isNew && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 bg-green-500/10 rounded-md"
            />
          )}

          <div
            className="flex-grow cursor-pointer relative z-10"
            onClick={() => onSeekToBookmark(bookmark.time)}
          >
            <div className="font-medium flex items-center gap-2">
              {bookmark.title || `Bookmark at ${formatTime(bookmark.time)}`}
              {isNew && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </motion.div>
              )}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(bookmark.time)}
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSeekToBookmark(bookmark.time)}
              className="h-8 px-2 text-xs"
            >
              Jump
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                className="bg-background rounded-lg p-4 max-w-sm w-full mx-4"
                onClick={(e) => e.stopPropagation()}
                initial={{ y: 20 }}
                animate={{ y: 0 }}
              >
                <h4 className="font-semibold mb-2">Delete Bookmark</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Are you sure you want to delete "{bookmark.title || `Bookmark at ${formatTime(bookmark.time)}`}"?
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }
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
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set())
  const [isAddingBookmark, setIsAddingBookmark] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Sort bookmarks by time once, not on each render
  const sortedBookmarks = useMemo(() => {
    let sorted = [...bookmarks].sort((a, b) => {
      return sortOrder === 'asc' ? a.time - b.time : b.time - a.time
    })

    // Filter by search query
    if (searchQuery.trim()) {
      sorted = sorted.filter(bookmark =>
        bookmark.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatTime(bookmark.time).includes(searchQuery)
      )
    }

    return sorted
  }, [bookmarks, sortOrder, searchQuery, formatTime])

  const handleAddBookmark = useCallback(async (): Promise<void> => {
    if (isAddingBookmark) return

    setIsAddingBookmark(true)
    try {
      // Create a temporary ID for the new bookmark
      const tempId = `temp-${Date.now()}`
      setRecentlyAddedIds(prev => new Set([...prev, tempId]))

      await onAddBookmark(currentTime, newBookmarkTitle)

      // Remove the temporary ID after a delay to show the animation
      setTimeout(() => {
        setRecentlyAddedIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(tempId)
          return newSet
        })
      }, 2000)

      setNewBookmarkTitle("")
    } catch (error) {
      setRecentlyAddedIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(`temp-${Date.now()}`)
        return newSet
      })
    } finally {
      setIsAddingBookmark(false)
    }
  }, [currentTime, newBookmarkTitle, onAddBookmark, isAddingBookmark])

  const formattedCurrentTime = formatTime(currentTime)

  // Use optimized render for bookmark list
  const bookmarkList = useMemo(() => {
    if (sortedBookmarks.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center p-4 text-muted-foreground"
        >
          <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No bookmarks yet. Add one at a specific time in the video.
        </motion.div>
      )
    }

    return (
      <AnimatePresence>
        {sortedBookmarks.map((bookmark) => (
          <BookmarkListItem
            key={bookmark.id || `${bookmark.videoId}-${bookmark.time}`}
            bookmark={bookmark}
            formatTime={formatTime}
            onSeekToBookmark={onSeekToBookmark}
            onRemoveBookmark={onRemoveBookmark}
            isNew={recentlyAddedIds.has(bookmark.id || "")}
          />
        ))}
      </AnimatePresence>
    )
  }, [sortedBookmarks, formatTime, onSeekToBookmark, onRemoveBookmark, recentlyAddedIds])

  return (
    <div
      className="space-y-4 max-h-full flex flex-col"
      role="region"
      aria-label="Video bookmarks panel"
    >
      <h3 className="text-lg font-semibold flex items-center gap-2 flex-shrink-0">
        <Bookmark className="h-5 w-5" aria-hidden="true" />
        Bookmarks
        {sortedBookmarks.length > 0 && (
          <span className="text-sm text-muted-foreground font-normal" aria-label={`${sortedBookmarks.length} bookmarks`}>
            ({sortedBookmarks.length})
          </span>
        )}
      </h3>

      {/* Search and Sort Controls */}
      {sortedBookmarks.length > 0 && (
        <div className="flex gap-2 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
              aria-label="Search bookmarks"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-9 px-3"
            title={`Sort ${sortOrder === 'asc' ? 'newest first' : 'oldest first'}`}
            aria-label={`Sort bookmarks ${sortOrder === 'asc' ? 'newest first' : 'oldest first'}`}
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" aria-hidden="true" /> : <SortDesc className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      )}

      {/* Add Bookmark Form */}
      <motion.div
        className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30 flex-shrink-0"
        whileHover={{ borderColor: "hsl(var(--primary) / 0.5)" }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex-grow">
          <Input
            type="text"
            placeholder="Bookmark title (optional)"
            value={newBookmarkTitle}
            onChange={(e) => setNewBookmarkTitle(e.target.value)}
            className="w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isAddingBookmark) {
                handleAddBookmark()
              }
            }}
            disabled={isAddingBookmark}
            aria-label="Bookmark title"
          />
        </div>
        <span
          className="text-sm text-muted-foreground font-mono whitespace-nowrap px-2 py-1 bg-muted rounded hidden sm:inline"
          aria-label={`Current time: ${formattedCurrentTime}`}
        >
          {formattedCurrentTime}
        </span>
        <Button
          size="sm"
          onClick={handleAddBookmark}
          disabled={isAddingBookmark}
          className="min-w-[80px]"
          aria-label={isAddingBookmark ? "Adding bookmark..." : "Add bookmark at current time"}
        >
          {isAddingBookmark ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              className="flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="h-4 w-4" />
              Add
            </motion.div>
          )}
        </Button>
      </motion.div>

      {/* Bookmark List */}
      <div className="flex-1 overflow-auto pr-1 min-h-0">
        {sortedBookmarks.length === 0 ? (
          searchQuery ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-6 text-muted-foreground"
            >
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No bookmarks found matching "{searchQuery}"
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-6 text-muted-foreground"
            >
              <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No bookmarks yet. Add one at a specific time in the video.
              <div className="text-xs mt-2 text-muted-foreground/70">
                Double-click the video or press 'B' to bookmark
              </div>
            </motion.div>
          )
        ) : (
          <AnimatePresence>
            {sortedBookmarks.map((bookmark) => (
              <BookmarkListItem
                key={bookmark.id || `${bookmark.videoId}-${bookmark.time}`}
                bookmark={bookmark}
                formatTime={formatTime}
                onSeekToBookmark={onSeekToBookmark}
                onRemoveBookmark={onRemoveBookmark}
                isNew={recentlyAddedIds.has(bookmark.id || "")}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              className="bg-background rounded-lg p-4 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 20 }}
              animate={{ y: 0 }}
            >
              <h4 className="font-semibold mb-2">Delete Bookmark</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete this bookmark?
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onRemoveBookmark(showDeleteConfirm)
                    setShowDeleteConfirm(null)
                  }}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default React.memo(BookmarkManager)
