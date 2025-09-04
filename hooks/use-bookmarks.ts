import { useCallback, useMemo } from "react"
import useSWR from "swr"
import { Bookmark } from "@prisma/client"
import { bookmarkService, CreateBookmarkData, UpdateBookmarkData, BookmarkFilters } from "@/lib/bookmark-service"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch bookmarks: ${response.statusText}`)
  }
  return response.json()
}

export function useBookmarks(filters: BookmarkFilters = {}) {
  // Create cache key from filters
  const cacheKey = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.courseId) params.append("courseId", filters.courseId.toString())
    if (filters.chapterId) params.append("chapterId", filters.chapterId.toString())
    if (filters.limit) params.append("limit", filters.limit.toString())
    if (filters.offset) params.append("offset", filters.offset.toString())
    return `/api/bookmarks?${params.toString()}`
  }, [filters])

  const {
    data,
    error,
    isLoading: loading,
    mutate
  } = useSWR(cacheKey, fetcher, {
    dedupingInterval: 30_000, // 30 seconds
    revalidateOnFocus: false,
    revalidateIfStale: true,
    revalidateOnReconnect: true,
  })

  const bookmarks = data?.bookmarks || []
  const pagination = data?.pagination || null

  const createBookmark = useCallback(async (data: CreateBookmarkData) => {
    try {
      const newBookmark = await bookmarkService.createBookmark(data)
      
      // Optimistically update cache
      await mutate(
        (current: any) => current ? {
          ...current,
          bookmarks: [newBookmark, ...current.bookmarks],
          pagination: current.pagination ? { 
            ...current.pagination, 
            total: current.pagination.total + 1 
          } : null
        } : undefined,
        { revalidate: false }
      )
      
      return newBookmark
    } catch (err) {
      // Revalidate on error
      mutate()
      throw err
    }
  }, [mutate])

  const updateBookmark = useCallback(async (id: string, data: UpdateBookmarkData) => {
    try {
      const updatedBookmark = await bookmarkService.updateBookmark(id, data)
      
      // Optimistically update cache
      await mutate(
        (current: any) => current ? {
          ...current,
          bookmarks: current.bookmarks.map((bookmark: Bookmark) =>
            bookmark.id === id ? updatedBookmark : bookmark
          )
        } : undefined,
        { revalidate: false }
      )
      
      return updatedBookmark
    } catch (err) {
      // Revalidate on error
      mutate()
      throw err
    }
  }, [mutate])

  const deleteBookmark = useCallback(async (id: string) => {
    try {
      await bookmarkService.deleteBookmark(id)
      
      // Optimistically update cache
      await mutate(
        (current: any) => current ? {
          ...current,
          bookmarks: current.bookmarks.filter((bookmark: Bookmark) => bookmark.id !== id),
          pagination: current.pagination ? {
            ...current.pagination,
            total: current.pagination.total - 1
          } : null
        } : undefined,
        { revalidate: false }
      )
    } catch (err) {
      // Revalidate on error
      mutate()
      throw err
    }
  }, [mutate])

  const toggleBookmark = useCallback(async (courseId: number, chapterId?: number) => {
    try {
      const result = await bookmarkService.toggleBookmark(courseId, chapterId)
      
      // Optimistically update cache
      if (result.bookmarked && result.bookmark) {
        await mutate(
          (current: any) => current ? {
            ...current,
            bookmarks: [result.bookmark!, ...current.bookmarks]
          } : undefined,
          { revalidate: false }
        )
      } else {
        // Find and remove the bookmark
        const bookmarkToRemove = bookmarks.find(
          (b: Bookmark) => b.courseId === courseId && b.chapterId === chapterId
        )
        if (bookmarkToRemove) {
          await mutate(
            (current: any) => current ? {
              ...current,
              bookmarks: current.bookmarks.filter((b: Bookmark) => b.id !== bookmarkToRemove.id)
            } : undefined,
            { revalidate: false }
          )
        }
      }
      return result.bookmarked
    } catch (err) {
      // Revalidate on error
      mutate()
      throw err
    }
  }, [bookmarks, mutate])

  const hasBookmark = useCallback(async (courseId: number, chapterId?: number) => {
    return await bookmarkService.hasBookmark(courseId, chapterId)
  }, [])

  return {
    bookmarks,
    loading,
    error: error?.message || null,
    pagination,
    refetch: mutate,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    toggleBookmark,
    hasBookmark,
  }
}

export function useBookmark(courseId: number, chapterId?: number) {
  const cacheKey = useMemo(() => {
    const params = new URLSearchParams()
    params.append("courseId", courseId.toString())
    if (chapterId) params.append("chapterId", chapterId.toString())
    params.append("limit", "1")
    return `/api/bookmarks?${params.toString()}`
  }, [courseId, chapterId])

  const { data, isLoading: loading, mutate } = useSWR(cacheKey, fetcher, {
    dedupingInterval: 30_000,
    revalidateOnFocus: false,
  })

  const hasBookmark = (data?.bookmarks?.length || 0) > 0

  const toggle = useCallback(async () => {
    try {
      const result = await bookmarkService.toggleBookmark(courseId, chapterId)
      
      // Optimistically update cache
      await mutate(
        (current: any) => ({
          ...current,
          bookmarks: result.bookmarked && result.bookmark ? [result.bookmark] : []
        }),
        { revalidate: false }
      )
      
      return result.bookmarked
    } catch (err) {
      // Revalidate on error
      mutate()
      throw err
    }
  }, [courseId, chapterId, mutate])

  return {
    hasBookmark,
    loading,
    toggle,
    refetch: mutate,
  }
}
