/**
 * Enhanced Progress Tracking System Types
 * Unified types for TanStack Query-based progress tracking
 */

export interface ProgressEvent {
  id: string
  userId: string
  courseId: string | number
  chapterId?: string | number
  quizId?: string | number
  eventType: 'chapter_start' | 'chapter_progress' | 'chapter_complete' | 'quiz_start' | 'quiz_progress' | 'quiz_complete'
  progress: number
  timeSpent: number
  timestamp: number
  metadata?: Record<string, any>
  retryCount?: number
  batchId?: string
}

export interface QueuedProgressUpdate {
  id: string
  event: ProgressEvent
  priority: 'low' | 'normal' | 'high'
  enqueueTime: number
  attemptCount: number
  lastAttemptTime?: number
  nextRetryTime?: number
  error?: string
}

export interface ProgressBatch {
  id: string
  events: ProgressEvent[]
  createdAt: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  retryCount: number
}

export interface ProgressQueueConfig {
  maxQueueSize: number
  batchSize: number
  flushInterval: number
  maxRetries: number
  retryDelay: number
  ttl: number
}

export interface ProgressQueueMetrics {
  queueSize: number
  totalProcessed: number
  totalFailed: number
  averageProcessingTime: number
  lastFlushTime: number
  errorRate: number
}

interface WorkerTask {
  id: string
  type: 'process_batch' | 'flush_queue' | 'cleanup'
  payload: any
  priority: number
  createdAt: number
}

interface WorkerConfig {
  maxConcurrency: number
  taskTimeout: number
  retryLimit: number
  healthCheckInterval: number
}

interface ProgressServiceConfig {
  queue: ProgressQueueConfig
  worker: WorkerConfig
  enableOptimisticUpdates: boolean
  enableBatching: boolean
  enableRetries: boolean
  enableMetrics: boolean
}

// TanStack Query mutation types
interface ProgressMutationContext {
  previousProgress?: any
  optimisticUpdate?: any
  rollbackData?: any
}

interface ChapterProgressData {
  progress: number
  completed: boolean
  timeSpent: number
  lastUpdated: number
}

export interface ProgressQueryData {
  courseProgress: Record<string, any>
  chapterProgress: Record<string, ChapterProgressData>
  quizProgress: Record<string, any>
  lastUpdated: number
}

// API types
interface ProgressUpdateRequest {
  events: ProgressEvent[]
  batchId?: string
  forceImmediate?: boolean
}

interface ProgressUpdateResponse {
  success: boolean
  processedCount: number
  failedCount: number
  batchId?: string
  errors?: string[]
}

interface ProgressSyncRequest {
  userId: string
  courseId?: string | number
  lastSyncTime?: number
}

export interface ProgressSyncResponse {
  progress: ProgressQueryData
  syncTime: number
  hasUpdates: boolean
}