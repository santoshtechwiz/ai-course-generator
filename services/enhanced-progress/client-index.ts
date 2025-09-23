/**
 * Enhanced Progress Tracking System - Client Exports
 * Only exports client-safe components
 */

// Client-safe exports only
export { 
  clientProgressService, 
  enqueueProgress, 
  flushProgress,
  useProgressMutation,
  useChapterProgress 
} from './client'

// Types (these are safe for client-side)
export type {
  ProgressEvent,
  QueuedProgressUpdate,
  ProgressBatch,
  ProgressQueueConfig,
  ProgressQueueMetrics,
  ProgressServiceConfig,
  ProgressUpdateRequest,
  ProgressUpdateResponse,
  ProgressQueryData,
  ProgressSyncRequest,
  ProgressSyncResponse,
  ChapterProgressData
} from './types'