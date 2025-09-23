/**
 * In-Memory Progress Queue
 * Lightweight queue for progress events with batching and thread-safe operations
 */

import { EventEmitter } from 'events'
import { 
  ProgressEvent, 
  QueuedProgressUpdate, 
  ProgressBatch, 
  ProgressQueueConfig, 
  ProgressQueueMetrics 
} from './types'

export class ProgressQueue extends EventEmitter {
  private queue: Map<string, QueuedProgressUpdate> = new Map()
  private batches: Map<string, ProgressBatch> = new Map()
  private processing = false
  private flushTimer?: NodeJS.Timeout
  private metrics: ProgressQueueMetrics
  
  private readonly config: ProgressQueueConfig = {
    maxQueueSize: 1000,
    batchSize: 10,
    flushInterval: 5000, // 5 seconds
    maxRetries: 3,
    retryDelay: 1000,
    ttl: 300000, // 5 minutes
  }

  constructor(config?: Partial<ProgressQueueConfig>) {
    super()
    this.config = { ...this.config, ...config }
    this.metrics = this.initializeMetrics()
    this.startFlushTimer()
    this.startCleanupTimer()
  }

  private initializeMetrics(): ProgressQueueMetrics {
    return {
      queueSize: 0,
      totalProcessed: 0,
      totalFailed: 0,
      averageProcessingTime: 0,
      lastFlushTime: 0,
      errorRate: 0
    }
  }

  /**
   * Enqueue a progress update with deduplication
   */
  public enqueue(event: ProgressEvent, priority: 'low' | 'normal' | 'high' = 'normal'): boolean {
    // Check queue size limit
    if (this.queue.size >= this.config.maxQueueSize) {
      this.emit('queueOverflow', { queueSize: this.queue.size, maxSize: this.config.maxQueueSize })
      return false
    }

    // Create unique key for deduplication
    const key = this.createEventKey(event)
    const now = Date.now()

    // Check if similar event exists and merge if appropriate
    const existing = this.queue.get(key)
    if (existing && this.shouldMergeEvents(existing.event, event)) {
      this.mergeEvents(existing, event, priority)
      return true
    }

    // Create new queued update
    const queuedUpdate: QueuedProgressUpdate = {
      id: event.id || this.generateId(),
      event: { ...event, timestamp: now },
      priority,
      enqueueTime: now,
      attemptCount: 0
    }

    this.queue.set(key, queuedUpdate)
    this.updateMetrics()
    
    this.emit('eventEnqueued', queuedUpdate)

    // Trigger immediate flush for high priority events
    if (priority === 'high') {
      this.flushImmediate()
    }

    return true
  }

  /**
   * Flush the queue and create batches for processing
   */
  public async flush(): Promise<string[]> {
    if (this.processing || this.queue.size === 0) {
      return []
    }

    this.processing = true
    const batchIds: string[] = []

    try {
      // Group events by priority and type
      const eventGroups = this.groupEventsForBatching()
      
      for (const [groupKey, events] of eventGroups.entries()) {
        const batches = this.createBatches(events)
        
        for (const batch of batches) {
          this.batches.set(batch.id, batch)
          batchIds.push(batch.id)
          
          // Remove processed events from queue
          events.forEach(event => {
            const key = this.createEventKey(event.event)
            this.queue.delete(key)
          })
        }
      }

      this.metrics.lastFlushTime = Date.now()
      this.updateMetrics()
      
      this.emit('queueFlushed', { batchIds, eventCount: this.queue.size })
      
    } finally {
      this.processing = false
    }

    return batchIds
  }

  /**
   * Get a batch for processing
   */
  public getBatch(batchId: string): ProgressBatch | undefined {
    return this.batches.get(batchId)
  }

  /**
   * Mark batch as completed
   */
  public completeBatch(batchId: string, success: boolean, error?: string): void {
    const batch = this.batches.get(batchId)
    if (!batch) return

    batch.status = success ? 'completed' : 'failed'
    
    if (success) {
      this.metrics.totalProcessed += batch.events.length
      this.batches.delete(batchId)
    } else {
      this.metrics.totalFailed += batch.events.length
      batch.retryCount++
      
      if (batch.retryCount >= this.config.maxRetries) {
        this.batches.delete(batchId)
        this.emit('batchFailed', { batchId, error, events: batch.events })
      } else {
        // Schedule retry
        setTimeout(() => {
          if (this.batches.has(batchId)) {
            batch.status = 'pending'
            this.emit('batchRetry', { batchId, retryCount: batch.retryCount })
          }
        }, this.config.retryDelay * batch.retryCount)
      }
    }

    this.updateMetrics()
  }

  /**
   * Get current queue metrics
   */
  public getMetrics(): ProgressQueueMetrics {
    return { ...this.metrics }
  }

  /**
   * Get pending batches
   */
  public getPendingBatches(): ProgressBatch[] {
    return Array.from(this.batches.values()).filter(batch => batch.status === 'pending')
  }

  /**
   * Clear the queue (for testing/cleanup)
   */
  public clear(): void {
    this.queue.clear()
    this.batches.clear()
    this.metrics = this.initializeMetrics()
  }

  private createEventKey(event: ProgressEvent): string {
    return `${event.userId}:${event.courseId}:${event.chapterId || 'null'}:${event.eventType}`
  }

  private shouldMergeEvents(existing: ProgressEvent, incoming: ProgressEvent): boolean {
    return (
      existing.userId === incoming.userId &&
      existing.courseId === incoming.courseId &&
      existing.chapterId === incoming.chapterId &&
      existing.eventType === incoming.eventType &&
      (Date.now() - existing.timestamp) < 10000 // Within 10 seconds
    )
  }

  private mergeEvents(existing: QueuedProgressUpdate, incoming: ProgressEvent, priority: 'low' | 'normal' | 'high'): void {
    // Take the latest progress and time spent
    existing.event.progress = Math.max(existing.event.progress, incoming.progress)
    existing.event.timeSpent += incoming.timeSpent
    existing.event.timestamp = incoming.timestamp
    existing.event.metadata = { ...existing.event.metadata, ...incoming.metadata }
    
    // Upgrade priority if needed
    if (priority === 'high' || (priority === 'normal' && existing.priority === 'low')) {
      existing.priority = priority
    }
  }

  private groupEventsForBatching(): Map<string, QueuedProgressUpdate[]> {
    const groups = new Map<string, QueuedProgressUpdate[]>()
    
    for (const queuedUpdate of this.queue.values()) {
      const groupKey = `${queuedUpdate.priority}:${queuedUpdate.event.eventType}`
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      
      groups.get(groupKey)!.push(queuedUpdate)
    }

    return groups
  }

  private createBatches(events: QueuedProgressUpdate[]): ProgressBatch[] {
    const batches: ProgressBatch[] = []
    
    // Sort by priority and timestamp
    events.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.enqueueTime - b.enqueueTime
    })

    for (let i = 0; i < events.length; i += this.config.batchSize) {
      const batchEvents = events.slice(i, i + this.config.batchSize)
      const batch: ProgressBatch = {
        id: this.generateId(),
        events: batchEvents.map(qu => qu.event),
        createdAt: Date.now(),
        status: 'pending',
        retryCount: 0
      }
      batches.push(batch)
    }

    return batches
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.queue.size > 0) {
        this.flush().catch(error => {
          this.emit('flushError', error)
        })
      }
    }, this.config.flushInterval)
  }

  private startCleanupTimer(): void {
    // Clean up old batches every minute
    setInterval(() => {
      const now = Date.now()
      for (const [batchId, batch] of this.batches.entries()) {
        if (now - batch.createdAt > this.config.ttl) {
          this.batches.delete(batchId)
        }
      }
    }, 60000)
  }

  private flushImmediate(): void {
    // Debounce immediate flushes
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }
    
    setTimeout(() => {
      this.flush().catch(error => {
        this.emit('flushError', error)
      })
      this.startFlushTimer()
    }, 100)
  }

  private updateMetrics(): void {
    this.metrics.queueSize = this.queue.size
    
    const total = this.metrics.totalProcessed + this.metrics.totalFailed
    if (total > 0) {
      this.metrics.errorRate = this.metrics.totalFailed / total
    }
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.removeAllListeners()
    this.clear()
  }
}

// Singleton instance for the application
export const progressQueue = new ProgressQueue()