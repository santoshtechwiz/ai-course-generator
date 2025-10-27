"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bookmark, Clock, X, Plus, CheckCircle, AlertCircle, Play, ChevronLeft, ChevronRight } from "lucide-react"
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
    isSelected = false,
  }: {
    bookmark: BookmarkItem
    formatTime: (seconds: number) => string
    onSeekToBookmark: (time: number) => void
    onRemoveBookmark: (bookmarkId: string) => void
    isNew?: boolean
    isSelected?: boolean
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
          className={cn(
            "flex items-center gap-2 p-3 rounded-none bg-black/30 hover:bg-black/40 border group relative overflow-hidden mb-2 last:mb-0 transition-all",
            isSelected 
              ? "border-amber-400/60 bg-black/40 shadow-lg" 
              : "border-white/20 hover:border-amber-400/50"
          )}
        >
          {/* New bookmark indicator */}
          {isNew && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent rounded-none"
            />
          )}

          <div
            className="flex-grow cursor-pointer relative z-10 min-w-0"
            onClick={() => onSeekToBookmark(bookmark.time)}
          >
            <div className="font-medium flex items-center gap-2 text-sm truncate text-white">
              {isNew && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                </motion.div>
              )}
              <span className="truncate">
                {bookmark.title || `Bookmark at ${formatTime(bookmark.time)}`}
              </span>
            </div>
            <div className="text-xs text-white/50 flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              {formatTime(bookmark.time)}
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              size="sm"
              onClick={() => onSeekToBookmark(bookmark.time)}
              className="h-7 px-2 text-xs bg-black/30 hover:bg-black/50 border border-border/30"
            >
              <Play className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-7 px-2 text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-3 w-3" />
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
                className="bg-background rounded-none p-4 max-w-sm w-full mx-4"
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
  const [selectedBookmarkTime, setSelectedBookmarkTime] = useState<number | null>(null)

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

  // Bookmark navigation handlers - navigate by time to handle sorting/filtering changes
  const handlePreviousBookmark = useCallback(() => {
    if (!selectedBookmarkTime || sortedBookmarks.length === 0) return

    const currentIndex = sortedBookmarks.findIndex(b => b.time === selectedBookmarkTime)
    if (currentIndex > 0) {
      const prevBookmark = sortedBookmarks[currentIndex - 1]
      setSelectedBookmarkTime(prevBookmark.time)
      onSeekToBookmark(prevBookmark.time)
    }
  }, [selectedBookmarkTime, sortedBookmarks, onSeekToBookmark])

  const handleNextBookmark = useCallback(() => {
    if (!selectedBookmarkTime || sortedBookmarks.length === 0) return

    const currentIndex = sortedBookmarks.findIndex(b => b.time === selectedBookmarkTime)
    if (currentIndex >= 0 && currentIndex < sortedBookmarks.length - 1) {
      const nextBookmark = sortedBookmarks[currentIndex + 1]
      setSelectedBookmarkTime(nextBookmark.time)
      onSeekToBookmark(nextBookmark.time)
    }
  }, [selectedBookmarkTime, sortedBookmarks, onSeekToBookmark])

  const handleSelectBookmark = useCallback((bookmarkTime: number) => {
    setSelectedBookmarkTime(bookmarkTime)
    onSeekToBookmark(bookmarkTime)
  }, [onSeekToBookmark])

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

  // Reset selected bookmark if it's no longer in the filtered/sorted list
  useEffect(() => {
    if (selectedBookmarkTime && sortedBookmarks.length > 0) {
      const bookmarkExists = sortedBookmarks.some(b => b.time === selectedBookmarkTime)
      if (!bookmarkExists) {
        setSelectedBookmarkTime(null)
      }
    } else if (selectedBookmarkTime && sortedBookmarks.length === 0) {
      setSelectedBookmarkTime(null)
    }
  }, [sortedBookmarks, selectedBookmarkTime])

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
            onSeekToBookmark={() => handleSelectBookmark(bookmark.time)}
            onRemoveBookmark={onRemoveBookmark}
            isNew={recentlyAddedIds.has(bookmark.id || "")}
            isSelected={selectedBookmarkTime === bookmark.time}
          />
        ))}
      </AnimatePresence>
    )
  }, [sortedBookmarks, formatTime, handleSelectBookmark, onRemoveBookmark, recentlyAddedIds, selectedBookmarkTime])

  return (
    <div
      className="space-y-3 max-h-full flex flex-col bg-black/60 rounded-xl border border-white/10 shadow-[8px_8px_0px_rgba(0,0,0,0.3)]"
      role="region"
      aria-label="Video bookmarks panel"
    >
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <h3 className="text-base font-bold flex items-center gap-2 text-white">
          <div className="p-2 bg-gradient-to-br from-amber-500/30 to-orange-500/20 rounded-none border border-amber-500/50">
            <Bookmark className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <span>Bookmarks</span>
          {sortedBookmarks.length > 0 && (
            <span className="ml-auto text-xs font-semibold bg-amber-500/30 border border-amber-500/50 px-2.5 py-1 rounded-full text-amber-300">
              {sortedBookmarks.length}
            </span>
          )}
        </h3>
      </div>

      {/* Search and Sort Controls */}
      {sortedBookmarks.length > 0 && (
        <div className="px-4 py-2 flex gap-2 flex-shrink-0 border-b border-white/10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-black/30 border border-white/20 rounded-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30 text-sm text-white placeholder:text-white/40"
              aria-label="Search bookmarks"
            />
          </div>
          <Button
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-9 px-3 bg-black/30 border border-white/20 hover:border-white/40 hover:bg-black/40 text-white"
            title={`Sort ${sortOrder === 'asc' ? 'newest first' : 'oldest first'}`}
            aria-label={`Sort bookmarks ${sortOrder === 'asc' ? 'newest first' : 'oldest first'}`}
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" aria-hidden="true" /> : <SortDesc className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      )}

      {/* Bookmark Navigation Controls */}
      {sortedBookmarks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 flex gap-2 flex-shrink-0 border-b border-white/10 items-center justify-center"
        >
          <Button
            size="sm"
            onClick={handlePreviousBookmark}
            disabled={!selectedBookmarkTime || sortedBookmarks.findIndex(b => b.time === selectedBookmarkTime) <= 0}
            className="h-9 px-3 bg-black/30 border border-white/20 hover:border-amber-400/50 hover:bg-black/40 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Jump to previous bookmark"
            aria-label="Previous bookmark"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-sm font-bold text-white/80 px-3 py-2 bg-black/40 border border-amber-400/30 rounded-none min-w-[60px] text-center">
            <span className="text-amber-400">
              {selectedBookmarkTime ? (sortedBookmarks.findIndex(b => b.time === selectedBookmarkTime) + 1) : '-'}
            </span>
            <span className="text-white/60">/{sortedBookmarks.length}</span>
          </div>

          <Button
            size="sm"
            onClick={handleNextBookmark}
            disabled={!selectedBookmarkTime || sortedBookmarks.findIndex(b => b.time === selectedBookmarkTime) >= sortedBookmarks.length - 1}
            className="h-9 px-3 bg-black/30 border border-white/20 hover:border-amber-400/50 hover:bg-black/40 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Jump to next bookmark"
            aria-label="Next bookmark"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Add Bookmark Form */}
      <motion.div
        className="mx-4 mb-3 flex items-center gap-2 p-3 rounded-none bg-black/30 border border-amber-500/40 flex-shrink-0"
        whileHover={{ borderColor: "hsl(var(--primary) / 0.6)", backgroundColor: "rgb(0 0 0 / 0.35)" }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex-grow">
          <Input
            type="text"
            placeholder="Bookmark title (optional)"
            value={newBookmarkTitle}
            onChange={(e) => setNewBookmarkTitle(e.target.value)}
            className="w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-white placeholder:text-white/40"
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
          className="text-xs font-mono whitespace-nowrap px-2.5 py-1.5 bg-black/40 border border-white/20 rounded-none text-white/70"
          aria-label={`Current time: ${formattedCurrentTime}`}
        >
          {formattedCurrentTime}
        </span>
        <Button
          size="sm"
          onClick={handleAddBookmark}
          disabled={isAddingBookmark}
          className="min-w-[80px] bg-amber-500/40 hover:bg-amber-500/50 border border-amber-500/60 text-amber-100 hover:text-amber-50"
          aria-label={isAddingBookmark ? "Adding bookmark..." : "Add bookmark at current time"}
        >
          {isAddingBookmark ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs">Saving...</span>
            </motion.div>
          ) : (
            <motion.div
              className="flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="h-4 w-4" />
              Save
            </motion.div>
          )}
        </Button>
      </motion.div>

      {/* Bookmark List */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-1 px-4 pb-4 scrollbar-hide"
        style={{
          scrollBehavior: 'smooth',
          msOverflowStyle: 'none' as any,
          scrollbarWidth: 'none' as any,
        }}
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {sortedBookmarks.length === 0 ? (
          searchQuery ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-8 space-y-3"
            >
              <Search className="h-10 w-10 mx-auto mb-3 opacity-50 text-white/40" />
              <p className="text-sm font-medium text-white/70">No bookmarks found</p>
              <p className="text-xs text-white/50">
                Try searching for a different keyword
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-8 space-y-3"
            >
              <div className="flex justify-center">
                <div className="p-3 bg-amber-500/20 rounded-none border border-amber-500/30">
                  <Bookmark className="h-8 w-8 text-amber-400" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">No bookmarks yet</p>
                <p className="text-xs mt-1 text-white/60">
                  Click the "Save" button above to bookmark important moments
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-xs text-white/50">
                💡 Tip: Use the "Add Bookmark Form" above to save timestamps with custom titles
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
              className="bg-background rounded-none p-4 max-w-sm w-full mx-4"
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
