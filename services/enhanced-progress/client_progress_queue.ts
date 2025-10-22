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

    // ✅ AUTO-DETECT COMPLETION: If progress >= 95, mark as completed
    if (event.eventType === 'chapter_progress' && event.progress >= 95) {
      event.metadata = event.metadata || {}
      event.metadata.completed = true
      console.log(`[ProgressQueue] ✅ Auto-marked chapter ${event.chapterId} as completed (progress: ${event.progress}%)`)
    }

    // Attempt to merge with an existing queued event for same user/course/chapter/eventType
    const keyOf = (e: ProgressEvent) => `${e.userId}:${e.courseId}:${e.chapterId}:${e.eventType}`
    const incomingKey = keyOf(event)
    const existingIndex = this.queue.findIndex(q => keyOf(q) === incomingKey)

    if (existingIndex >= 0) {
      const existing = this.queue[existingIndex]
      if (event.eventType === 'chapter_progress') {
        // Merge progress: keep highest progress, sum timeSpent, prefer latest timestamp
        existing.progress = Math.max(existing.progress || 0, event.progress || 0)
        existing.timeSpent = (existing.timeSpent || 0) + (event.timeSpent || 0)
        existing.timestamp = Math.max(existing.timestamp || 0, event.timestamp || 0)
        
        // ✅ PRESERVE COMPLETION FLAG: Once completed, always completed
        const wasCompleted = existing.metadata?.completed === true
        const nowCompleted = event.metadata?.completed === true
        existing.metadata = { ...(existing.metadata || {}), ...(event.metadata || {}) }
        if (wasCompleted || nowCompleted) {
          existing.metadata.completed = true
        }
        
        this.queue[existingIndex] = existing
        console.log(`Merged progress event in queue for ${event.courseId}:${event.chapterId} -> ${existing.progress}% (completed: ${existing.metadata.completed})`) 
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

        // ✅ PRESERVE COMPLETION FLAG during coalescing: once completed, always completed
        const wasCompleted = existing.metadata?.completed === true
        const nowCompleted = ev.metadata?.completed === true
        const mergedMetadata = { ...(existing.metadata || {}), ...(ev.metadata || {}) }
        if (wasCompleted || nowCompleted) {
          mergedMetadata.completed = true
        }

        map.set(key, {
          ...latest,
          progress: higherProgress,
          timeSpent: combinedTime,
          id: latest.id,
          metadata: mergedMetadata,
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
const clientProgressService = {
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

// ✅ REMOVED: useChapterProgress - redundant with useCourseProgressSync
// All chapter progress data is available through GET /api/progress/[courseId]
// which returns completedChapters, lastPositions, and current chapter data

// Export the main functions
const enqueueProgress = clientProgressService.enqueueProgress.bind(clientProgressService)
export const flushProgress = clientProgressService.flushProgress.bind(clientProgressService)

// Development helper: expose flush and queue size on window for manual debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  try {
    ;(window as any).__ai_flush_progress = clientProgressService.flushProgress.bind(clientProgressService)
    ;(window as any).__ai_get_progress_queue_size = () => clientProgressQueue.getQueueSize()
    console.info('[Dev] Exposed __ai_flush_progress() and __ai_get_progress_queue_size() on window for debugging')
  } catch (e) {
    // ignore
  }
}