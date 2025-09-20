/**
 * Simplified bookmark hook that uses the global store
 */
import { useCallback, useEffect } from "react"
import { useBookmarkStore } from "../stores/bookmark-store"

export interface UseBookmarkOptions {
  courseId?: number
  chapterId?: number
  initialStatus?: boolean
}

export function useBookmarkStatus(options: UseBookmarkOptions = {}) {
  const { courseId, chapterId, initialStatus } = options
  const key = `${courseId}:${chapterId || ""}`

  const {
    cache,
    isLoading,
    error,
    setBookmarkStatus,
    fetchStatus,
    updateBookmark
  } = useBookmarkStore()

  // Initialize from props if provided
  useEffect(() => {
    if (initialStatus !== undefined && courseId) {
      setBookmarkStatus(key, initialStatus)
    }
  }, [initialStatus, courseId, key, setBookmarkStatus])

  // Get current status
  const isBookmarked = cache.get(key) || false

  // Load status if not in cache
  useEffect(() => {
    if (courseId && !cache.has(key)) {
      fetchStatus(key)
    }
  }, [courseId, key, fetchStatus])

  // Toggle handler with optimistic update
  const toggleBookmark = useCallback(async () => {
    if (!courseId) return
    await updateBookmark(key, !isBookmarked)
  }, [courseId, key, isBookmarked, updateBookmark])

  return {
    isBookmarked,
    isLoading,
    error,
    toggleBookmark,
  }
}