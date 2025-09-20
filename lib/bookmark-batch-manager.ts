/**
 * Batch Bookmark Manager - Optimizes bookmark API calls by batching requests
 * Reduces N+1 API call pattern to single batched requests
 */

interface CacheEntry {
  status: boolean
  timestamp: number
  ttl: number
}

class BookmarkCache {
  private cache = new Map<number, CacheEntry>()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes

  get(courseId: number): boolean | null {
    const entry = this.cache.get(courseId)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(courseId)
      return null
    }

    return entry.status
  }

  set(courseId: number, status: boolean) {
    this.cache.set(courseId, {
      status,
      timestamp: Date.now(),
      ttl: this.TTL
    })
  }

  invalidate(courseId: number) {
    this.cache.delete(courseId)
  }

  getMultiple(courseIds: number[]): Map<number, boolean> {
    const result = new Map<number, boolean>()
    courseIds.forEach(id => {
      const status = this.get(id)
      if (status !== null) {
        result.set(id, status)
      }
    })
    return result
  }

  setMultiple(statusMap: Record<number, boolean>) {
    Object.entries(statusMap).forEach(([courseId, status]) => {
      this.set(Number(courseId), status)
    })
  }

  clear() {
    this.cache.clear()
  }
}

interface QueuedPromise {
  resolve: (value: boolean) => void
  reject: (error: any) => void
}

export class BookmarkBatchManager {
  private queue = new Map<number, QueuedPromise>()
  private pendingRequests = new Set<number>()
  private batchSize = 20
  private debounceMs = 100
  private batchTimeout: NodeJS.Timeout | null = null
  private cache = new BookmarkCache()

  // Metrics for monitoring
  private metrics = {
    apiCallsReduced: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
  }

  async getBookmarkStatus(courseId: number): Promise<boolean> {
    this.metrics.totalRequests++

    // Check cache first
    const cached = this.cache.get(courseId)
    if (cached !== null) {
      this.metrics.cacheHits++
      return cached
    }

    this.metrics.cacheMisses++

    // Return existing promise if already queued
    if (this.queue.has(courseId)) {
      return new Promise<boolean>((resolve, reject) => {
        const existing = this.queue.get(courseId)!
        existing.resolve = resolve
        existing.reject = reject
      })
    }

    // Create new promise and queue it
    return new Promise<boolean>((resolve, reject) => {
      this.queue.set(courseId, { resolve, reject })
      this.scheduleBatchProcessing()
    })
  }

  async getMultipleStatuses(courseIds: number[]): Promise<Map<number, boolean>> {
    const result = new Map<number, boolean>()
    const uncachedIds: number[] = []

    // Check cache for all IDs
    courseIds.forEach(id => {
      const cached = this.cache.get(id)
      if (cached !== null) {
        result.set(id, cached)
        this.metrics.cacheHits++
      } else {
        uncachedIds.push(id)
        this.metrics.cacheMisses++
      }
      this.metrics.totalRequests++
    })

    // If all were cached, return immediately
    if (uncachedIds.length === 0) {
      return result
    }

    // Queue uncached IDs for batch processing
    const batchPromises = uncachedIds.map(id => this.getBookmarkStatus(id))

    try {
      const batchResults = await Promise.all(batchPromises)

      // Combine cached and fresh results
      uncachedIds.forEach((id, index) => {
        result.set(id, batchResults[index])
      })

      return result
    } catch (error) {
      console.error('Batch bookmark status fetch failed:', error)
      throw error
    }
  }

  private scheduleBatchProcessing() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch()
    }, this.debounceMs)
  }

  private async processBatch() {
    if (this.queue.size === 0) return

    const courseIds = Array.from(this.queue.keys()).slice(0, this.batchSize)
    const promises = courseIds.map(id => this.queue.get(id)!)

    try {
      const response = await fetch('/api/bookmarks/batch-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseIds }),
      })

      if (!response.ok) {
        throw new Error(`Batch API failed: ${response.status}`)
      }

      const statusMap: Record<number, boolean> = await response.json()

      // Cache the results
      this.cache.setMultiple(statusMap)

      // Resolve all queued promises
      courseIds.forEach(id => {
        const promise = this.queue.get(id)
        if (promise) {
          const status = statusMap[id] || false
          promise.resolve(status)
          this.queue.delete(id)
        }
      })

      // Track metrics
      this.metrics.apiCallsReduced += courseIds.length - 1 // N requests reduced to 1 API call

    } catch (error) {
      console.error('Batch bookmark processing failed:', error)

      // Reject all queued promises
      courseIds.forEach(id => {
        const promise = this.queue.get(id)
        if (promise) {
          promise.reject(error)
          this.queue.delete(id)
        }
      })
    }

    // Process remaining items if any
    if (this.queue.size > 0) {
      this.scheduleBatchProcessing()
    }
  }

  // Invalidate cache when bookmark status changes
  invalidateCache(courseId: number) {
    this.cache.invalidate(courseId)
  }

  // Get performance metrics
  getMetrics() {
    const cacheHitRate = this.metrics.totalRequests > 0
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100
      : 0

    return {
      ...this.metrics,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      queueSize: this.queue.size,
      cacheSize: this.cache['cache'].size,
    }
  }

  // Clear all caches (useful for testing or forced refresh)
  clearCache() {
    this.cache.clear()
    this.metrics = {
      apiCallsReduced: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
    }
  }
}

// Global singleton instance
export const bookmarkBatchManager = new BookmarkBatchManager()

// React hook for using batch bookmarks
import { useState, useEffect } from 'react'

export function useBatchBookmarks(courseIds: number[], isAuthenticated: boolean = false) {
  const [bookmarkStatuses, setBookmarkStatuses] = useState<Map<number, boolean>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!courseIds.length || !isAuthenticated) {
      setLoading(false)
      setBookmarkStatuses(new Map())
      return
    }

    const loadStatuses = async () => {
      try {
        setLoading(true)
        setError(null)
        const statuses = await bookmarkBatchManager.getMultipleStatuses(courseIds)
        setBookmarkStatuses(statuses)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load bookmark statuses'))
        console.error('useBatchBookmarks error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStatuses()
  }, [courseIds, isAuthenticated])

  return {
    bookmarkStatuses,
    loading,
    error,
    refetch: () => {
      if (isAuthenticated) {
        bookmarkBatchManager.clearCache()
        // Trigger re-run of effect
        setBookmarkStatuses(new Map())
      }
    }
  }
}

// Hook for single course bookmark status
export function useBookmarkStatus(courseId: number | undefined, isAuthenticated: boolean = false) {
  const courseIds = courseId && isAuthenticated ? [courseId] : []
  const { bookmarkStatuses, loading, error, refetch } = useBatchBookmarks(courseIds, isAuthenticated)

  const isBookmarked = courseId && isAuthenticated ? bookmarkStatuses.get(courseId) || false : false

  return {
    isBookmarked,
    loading: loading && isAuthenticated,
    error,
    refetch,
  }
}