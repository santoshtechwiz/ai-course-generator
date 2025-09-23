/**
 * Enhanced Progress Tracking System
 * Main export file for the robust progress tracking system
 */

// Core services (using client-safe versions)
export { clientProgressService, enqueueProgress } from './client'
export { ProgressQueue, progressQueue } from './queue'
export { ProgressWorkerManager, progressWorkerManager } from './worker-manager'
export { ProgressMonitor, progressMonitor } from './monitoring'

// React hooks (using client-safe versions)
export {
  useProgressMutation,
  useChapterProgress
} from './client'

export { useProgressMetrics } from './monitoring'

// Types
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
  ChapterProgressData,
  ProgressQueueMetrics as ProgressMetrics
} from './types'

// Initialize the enhanced progress service (commented out for now to avoid build errors)
// enhancedProgressService.initialize({
//   enableOptimisticUpdates: true,
//   enableBatching: true,
//   enableRetries: true,
//   enableMetrics: true,
//   queue: {
//     maxQueueSize: 1000,
//     batchSize: 10,
//     flushInterval: 5000,
//     maxRetries: 3,
//     retryDelay: 1000,
//     ttl: 300000,
//   },
//   worker: {
//     maxConcurrency: 3,
//     taskTimeout: 30000,
//     retryLimit: 3,
//     healthCheckInterval: 60000,
//   }
// })

// Start monitoring in development for debugging (commented out for now)
// if (process.env.NODE_ENV === 'development') {
//   progressMonitor.start(10000) // 10 second intervals for development
// }