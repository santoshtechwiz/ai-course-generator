/**
 * Simplified Storage Service
 * 
 * A lightweight replacement for the over-engineered unified storage system.
 * Provides safe localStorage operations with SSR support.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface VideoProgressData {
  courseId: string | number
  chapterId: string | number
  videoId: string
  progress: number
  playedSeconds: number
  duration?: number
  userId: string
  timeSpent?: number
  completed?: boolean
}

export interface StorageOptions {
  prefix?: string
  encrypt?: boolean
}

// ============================================================================
// SIMPLE STORAGE SERVICE
// ============================================================================

class SimpleStorageService {
  private prefix = 'courseai_'
  
  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || 'courseai_'
  }

  // Safe localStorage operations with SSR support
  setItem(key: string, value: any): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const prefixedKey = this.prefix + key
      const serializedValue = JSON.stringify(value)
      localStorage.setItem(prefixedKey, serializedValue)
      return true
    } catch (error) {
      console.warn('Storage setItem failed:', error)
      return false
    }
  }

  getItem<T = any>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') return defaultValue || null
    
    try {
      const prefixedKey = this.prefix + key
      const item = localStorage.getItem(prefixedKey)
      return item ? JSON.parse(item) : (defaultValue || null)
    } catch (error) {
      console.warn('Storage getItem failed:', error)
      return defaultValue || null
    }
  }

  removeItem(key: string): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const prefixedKey = this.prefix + key
      localStorage.removeItem(prefixedKey)
      return true
    } catch (error) {
      console.warn('Storage removeItem failed:', error)
      return false
    }
  }

  // Video progress specific methods
  saveVideoProgress(data: VideoProgressData): boolean {
    const key = `video_progress_${data.courseId}_${data.chapterId}`
    return this.setItem(key, {
      videoId: data.videoId,
      progress: data.progress,
      playedSeconds: data.playedSeconds,
      duration: data.duration,
      userId: data.userId,
      timeSpent: data.timeSpent,
      completed: data.completed,
      timestamp: Date.now()
    })
  }

  getVideoProgress(courseId: string | number, chapterId: string | number): VideoProgressData | null {
    const key = `video_progress_${courseId}_${chapterId}`
    return this.getItem(key)
  }

  // Chapter completion
  markChapterCompleted(courseId: string | number, chapterId: string | number, userId: string): boolean {
    const key = `chapter_completion_${courseId}_${chapterId}`
    return this.setItem(key, {
      completed: true,
      completedAt: new Date().toISOString(),
      userId,
      timestamp: Date.now()
    })
  }

  isChapterCompleted(courseId: string | number, chapterId: string | number): boolean {
    const key = `chapter_completion_${courseId}_${chapterId}`
    const completion = this.getItem(key)
    return completion?.completed === true
  }

  // Cleanup old data
  cleanup(maxAge = 30 * 24 * 60 * 60 * 1000): number { // 30 days default
    if (typeof window === 'undefined') return 0
    
    let cleaned = 0
    const now = Date.now()
    
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.prefix)) {
          try {
            const item = localStorage.getItem(key)
            if (item) {
              const data = JSON.parse(item)
              if (data.timestamp && (now - data.timestamp) > maxAge) {
                localStorage.removeItem(key)
                cleaned++
              }
            }
          } catch (error) {
            // Invalid JSON, remove it
            localStorage.removeItem(key)
            cleaned++
          }
        }
      }
    } catch (error) {
      console.warn('Storage cleanup failed:', error)
    }
    
    return cleaned
  }
}

// ============================================================================
// SIMPLIFIED EXPORTS
// ============================================================================

export { SimpleStorageService }
export const simpleStorage = new SimpleStorageService()

// Async wrapper for consistency with existing API
export const asyncVideoProgressSave = async (data: VideoProgressData): Promise<{ success: boolean; error?: string }> => {
  try {
    const success = simpleStorage.saveVideoProgress(data)
    return { success }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const asyncChapterCompletion = async (
  courseId: string | number, 
  chapterId: string | number, 
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const success = simpleStorage.markChapterCompleted(courseId, chapterId, userId)
    return { success }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}