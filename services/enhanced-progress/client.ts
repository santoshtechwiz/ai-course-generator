/**
 * Enhanced Progress Tracking System - Client-Side Only
 * This version works in browsers without Node.js dependencies
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import type { ProgressEvent } from './types'

// Client-safe progress queue (no worker_threads)
class ClientProgressQueue {
  private queue: ProgressEvent[] = []
  private isProcessing = false
  private maxQueueSize = 100
  private flushInterval = 15000

  constructor() {
    // Auto-flush every 5 seconds
    // Auto-flush on a slightly longer interval to reduce frequent small writes
    setInterval(() => this.flush(), this.flushInterval)
  }

  enqueue(event: ProgressEvent): boolean {
    if (this.queue.length >= this.maxQueueSize) {
      console.warn('Progress queue is full, dropping oldest event')
      this.queue.shift()
    }

    // Attempt to merge with an existing queued event for same user/course/chapter/eventType
    const keyOf = (e: ProgressEvent) => `${e.userId}:${e.courseId}:${e.chapterId}:${e.eventType}`
    const incomingKey = keyOf(event)
    const existingIndex = this.queue.findIndex(q => keyOf(q) === incomingKey)

    if (existingIndex >= 0) {
      const existing = this.queue[existingIndex]
      if (event.eventType === 'chapter_progress') {
        // Merge progress: keep highest progress, sum timeSpent, prefer latest timestamp/metadata
        existing.progress = Math.max(existing.progress || 0, event.progress || 0)
        existing.timeSpent = (existing.timeSpent || 0) + (event.timeSpent || 0)
        existing.timestamp = Math.max(existing.timestamp || 0, event.timestamp || 0)
        existing.metadata = { ...(existing.metadata || {}), ...(event.metadata || {}) }
        this.queue[existingIndex] = existing
        console.log(`Merged progress event in queue for ${event.courseId}:${event.chapterId} -> ${existing.progress}%`) 
      } else {
        // For other events, replace with latest
        this.queue[existingIndex] = event
        console.log(`Replaced queued event ${event.eventType} for ${event.courseId}:${event.chapterId}`)
      }
    } else {
      this.queue.push(event)
      console.log(`Progress event queued: ${event.eventType} for ${event.courseId}:${event.chapterId}`)
    }

    // Auto-flush only when queue grows large to reduce frequency
    if (this.queue.length >= 25) {
      this.flush()
    }

    return true
  }

  async flush(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true
    // Coalesce similar events to reduce duplicate updates (especially chapter_progress)
    const events = this.coalesceEvents([...this.queue])
    this.queue = []

    console.log(`Flushing ${events.length} events:`, events)

    if (events.length === 0) {
      console.warn('No events to flush after coalescing')
      this.isProcessing = false
      return
    }

    // Validate events before sending
    const validEvents = events.filter(event => {
      const isValid = event.userId && event.courseId && event.chapterId && event.eventType
      if (!isValid) {
        console.error('Invalid event found:', event)
      }
      return isValid
    })

    if (validEvents.length === 0) {
      console.warn('No valid events to flush after validation')
      this.isProcessing = false
      return
    }

    console.log(`Sending ${validEvents.length} valid events`)

    try {
      const requestBody = { events: validEvents }
      let jsonString: string
      try {
        jsonString = JSON.stringify(requestBody)
        console.log('Sending request body:', jsonString)
      } catch (stringifyError) {
        console.error('JSON stringify error:', stringifyError, 'Request body:', requestBody)
        this.isProcessing = false
        return
      }

      // Additional validation
      if (!jsonString || jsonString === '{}' || jsonString === '{"events":[]}') {
        console.error('Invalid JSON string generated:', jsonString)
        this.isProcessing = false
        return
      }

      const response = await fetch('/api/progress/enhanced-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonString,
      })

      if (response.ok) {
        console.log(`Successfully flushed ${validEvents.length} progress events`)
      } else {
        console.error('Failed to flush progress events:', await response.text())
        // Re-queue events on failure
        this.queue.unshift(...validEvents)
      }
    } catch (error) {
      console.error('Error flushing progress events:', error)
      // Re-queue events on error
      this.queue.unshift(...validEvents)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Coalesce events by user/course/chapter/eventType to reduce noise.
   * - For chapter_progress: keep the event with the highest progress and sum timeSpent.
   * - For other event types: keep the most recent event (by timestamp).
   */
  private coalesceEvents(events: ProgressEvent[]): ProgressEvent[] {
    const map = new Map<string, ProgressEvent>()

    for (const ev of events) {
      const key = `${ev.userId}:${ev.courseId}:${ev.chapterId}:${ev.eventType}`

      if (!map.has(key)) {
        map.set(key, { ...ev })
        continue
      }

      const existing = map.get(key) as ProgressEvent

      if (ev.eventType === 'chapter_progress') {
        // Keep the highest progress and aggregate timeSpent; prefer latest metadata/timestamp
        const higherProgress = ev.progress > existing.progress ? ev.progress : existing.progress
        const combinedTime = (existing.timeSpent || 0) + (ev.timeSpent || 0)
        const latest = ev.timestamp > existing.timestamp ? ev : existing

        map.set(key, {
          ...latest,
          progress: higherProgress,
          timeSpent: combinedTime,
          // keep an id (latest) and merged metadata
          id: latest.id,
          metadata: { ...(existing.metadata || {}), ...(ev.metadata || {}) },
          timestamp: Math.max(existing.timestamp || 0, ev.timestamp || 0)
        })
      } else {
        // For other events prefer the most recent one
        const latest = ev.timestamp > existing.timestamp ? ev : existing
        map.set(key, { ...latest })
      }
    }

    return Array.from(map.values())
  }

  getQueueSize(): number {
    return this.queue.length
  }
}

// Singleton instance
const clientProgressQueue = new ClientProgressQueue()

// Client-safe progress service
export const clientProgressService = {
  enqueueProgress(
    userId: string,
    courseId: string | number,
    chapterId: string | number,
    eventType: ProgressEvent['eventType'],
    progress: number,
    timeSpent: number,
    metadata?: Record<string, any>
  ): boolean {
    const event: ProgressEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      courseId: String(courseId),
      chapterId: String(chapterId),
      eventType,
      progress,
      timeSpent,
      timestamp: Date.now(),
      metadata
    }

    return clientProgressQueue.enqueue(event)
  },

  async flushProgress(): Promise<void> {
    return clientProgressQueue.flush()
  },

  getQueueSize(): number {
    return clientProgressQueue.getQueueSize()
  }
}

// TanStack Query hooks for client-side
export const useProgressMutation = () => {
  const mutation = useMutation({
    mutationFn: async (events: ProgressEvent[]) => {
      const response = await fetch('/api/progress/enhanced-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      })
      
      if (!response.ok) {
        throw new Error(`Progress update failed: ${response.statusText}`)
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      console.log('Progress mutation successful:', data)
    },
    onError: (error) => {
      console.error('Progress mutation failed:', error)
    },
  })

  const enqueueProgress = (
    userId: string,
    courseId: string | number,
    chapterId: string | number,
    eventType: ProgressEvent['eventType'],
    progress: number,
    timeSpent: number,
    metadata?: Record<string, any>
  ) => {
    return clientProgressService.enqueueProgress(
      userId,
      courseId,
      chapterId,
      eventType,
      progress,
      timeSpent,
      metadata
    )
  }

  const flushQueue = async () => {
    return clientProgressService.flushProgress()
  }

  return {
    enqueueProgress,
    flushQueue,
    isLoading: mutation.isPending,
    error: mutation.error,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync
  }
}

export const useChapterProgress = (userId?: string, courseId?: string | number, chapterId?: string | number) => {
  const query = useQuery({
    queryKey: ['chapterProgress', userId, courseId, chapterId],
    queryFn: async () => {
      if (!userId || !courseId || !chapterId) {
        return null
      }

      try {
        const response = await fetch(`/api/progress/chapter?userId=${userId}&courseId=${courseId}&chapterId=${chapterId}`)

        if (!response.ok) {
          // Try to parse JSON error body if available
          let errBody = null
          try {
            errBody = await response.json()
          } catch {
            // ignore parse errors
          }
          const message = errBody?.error || response.statusText || `HTTP ${response.status}`
          // Return a structured error object instead of throwing to avoid uncaught rejection in UI
          throw Object.assign(new Error(message), { status: response.status, body: errBody })
        }

        return response.json()
      } catch (err: any) {
        // Log and rethrow so react-query sets error state, but keep message consistent
        console.error('Chapter progress query failed:', err)
        throw err
      }
    },
    enabled: !!(userId && courseId && chapterId),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })

  return {
    chapterProgress: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}

// Export the main functions
export const enqueueProgress = clientProgressService.enqueueProgress.bind(clientProgressService)
export const flushProgress = clientProgressService.flushProgress.bind(clientProgressService)