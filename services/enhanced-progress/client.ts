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
  private flushInterval = 5000

  constructor() {
    // Auto-flush every 5 seconds
    setInterval(() => this.flush(), this.flushInterval)
  }

  enqueue(event: ProgressEvent): boolean {
    if (this.queue.length >= this.maxQueueSize) {
      console.warn('Progress queue is full, dropping oldest event')
      this.queue.shift()
    }
    
    this.queue.push(event)
    console.log(`Progress event queued: ${event.eventType} for ${event.courseId}:${event.chapterId}`)
    
    // Auto-flush if queue is getting full
    if (this.queue.length >= 10) {
      this.flush()
    }
    
    return true
  }

  async flush(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true
    const events = [...this.queue]
    this.queue = []

    try {
      const response = await fetch('/api/progress/enhanced-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      })

      if (response.ok) {
        console.log(`Successfully flushed ${events.length} progress events`)
      } else {
        console.error('Failed to flush progress events:', await response.text())
        // Re-queue events on failure
        this.queue.unshift(...events)
      }
    } catch (error) {
      console.error('Error flushing progress events:', error)
      // Re-queue events on error
      this.queue.unshift(...events)
    } finally {
      this.isProcessing = false
    }
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
      
      const response = await fetch(`/api/progress/chapter?userId=${userId}&courseId=${courseId}&chapterId=${chapterId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chapter progress: ${response.statusText}`)
      }
      
      return response.json()
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