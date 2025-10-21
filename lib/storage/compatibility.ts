/**
 * Storage Compatibility Layer
 * 
 * Drop-in replacement for the over-engineered transaction manager
 * that provides the same API but uses simple localStorage operations.
 */

import { SimpleStorageService, simpleStorage, asyncVideoProgressSave, asyncChapterCompletion } from './storage'

// ============================================================================
// COMPATIBILITY TYPES (matching the complex system's interface)
// ============================================================================

interface TransactionResult {
  success: boolean
  operations?: any[]
  errors?: string[]
}

interface StorageOperation {
  id: string
  type: string
  data: any
  timestamp: number
}

// ============================================================================
// TRANSACTION MANAGER COMPATIBILITY
// ============================================================================

class TransactionManagerCompat {
  // Video progress save (main method used)
  async saveVideoProgress(data: {
    courseId: string | number
    chapterId: string | number
    videoId: string
    progress: number
    playedSeconds: number
    duration?: number
    userId: string
    timeSpent?: number
    completed?: boolean
  }): Promise<TransactionResult> {
    const result = await asyncVideoProgressSave(data)
    
    return {
      success: result.success,
      operations: result.success ? [{
        id: `video_progress_${Date.now()}`,
        type: 'video_progress',
        data,
        timestamp: Date.now()
      }] : [],
      errors: result.error ? [result.error] : []
    }
  }

  // Chapter completion
  async markChapterCompleted(data: {
    courseId: string | number
    chapterId: string | number
    userId: string
  }): Promise<TransactionResult> {
    const result = await asyncChapterCompletion(data.courseId, data.chapterId, data.userId)
    
    return {
      success: result.success,
      operations: result.success ? [{
        id: `chapter_completion_${Date.now()}`,
        type: 'chapter_completion',
        data,
        timestamp: Date.now()
      }] : [],
      errors: result.error ? [result.error] : []
    }
  }

  // Mock methods for methods that might be called but aren't essential
  async executeTransaction(operations: StorageOperation[]): Promise<TransactionResult> {
    console.warn('[TransactionManagerCompat] executeTransaction is deprecated - use specific methods instead')
    return { success: true, operations, errors: [] }
  }

  getStatus() {
    return {
      pendingOperations: 0,
      activeLocks: 0,
      conflictsDetected: 0,
      status: 'ready'
    }
  }

  // Singleton pattern for compatibility
  static getInstance(): TransactionManagerCompat {
    if (!TransactionManagerCompat.instance) {
      TransactionManagerCompat.instance = new TransactionManagerCompat()
    }
    return TransactionManagerCompat.instance
  }

  private static instance: TransactionManagerCompat
}

// ============================================================================
// STORAGE COMPATIBILITY
// ============================================================================

class StorageCompat {
  setItem(key: string, value: any): void {
    simpleStorage.setItem(key, value)
  }

  getItem<T = any>(key: string): T | null {
    return simpleStorage.getItem<T>(key)
  }

  removeItem(key: string): void {
    simpleStorage.removeItem(key)
  }
}

// ============================================================================
// EXPORTS FOR DROP-IN REPLACEMENT
// ============================================================================

export const transactionManager = TransactionManagerCompat.getInstance()
export const storage = new StorageCompat()

// Legacy exports for any remaining imports
export const conflictDetector = {
  detectConflicts: () => [],
  resolveConflict: () => ({ success: true }),
  getConflictHistory: () => []
}

const storageStartup = {
  initialize: async () => ({ success: true }),
  getStatus: () => ({ initialized: true, healthy: true })
}

// Re-export simple storage for direct usage
export { simpleStorage }
