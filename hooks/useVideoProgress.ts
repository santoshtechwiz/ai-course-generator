/**
 * Video Progress Hook
 * 
 * Lightweight video progress tracking that uses simple storage
 * instead of the over-engineered transaction system.
 */

import { useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { simpleStorage, asyncVideoProgressSave } from '@/lib/storage/storage'
import { debounce } from 'lodash'

interface UseVideoProgressOptions {
  courseId: string | number
  chapterId: string | number
  videoId: string
  enabled?: boolean
  saveInterval?: number
  autoSaveThreshold?: number
}

interface VideoProgressUpdate {
  progress: number
  playedSeconds: number
  duration?: number
  timeSpent?: number
  completed?: boolean
  force?: boolean
}

/**
 * Video progress hook that saves to localStorage
 */
export function useVideoProgress({
  courseId,
  chapterId,
  videoId,
  enabled = true,
  saveInterval = 10000, // 10 seconds
  autoSaveThreshold = 0.05 // 5% progress change
}: UseVideoProgressOptions) {
  const { user, isAuthenticated } = useAuth()
  const lastSaveRef = useRef<{
    progress: number
    playedSeconds: number
    timestamp: number
  }>({ progress: 0, playedSeconds: 0, timestamp: 0 })
  
  const saveIntervalRef = useRef<NodeJS.Timeout>()

  // Simple debounced save function
  const debouncedSave = useCallback(
    debounce(async (data: VideoProgressUpdate) => {
      if (!enabled || !isAuthenticated || !user?.id) return

      try {
        const result = await asyncVideoProgressSave({
          courseId,
          chapterId,
          videoId,
          progress: data.progress,
          playedSeconds: data.playedSeconds,
          duration: data.duration,
          userId: user.id,
          timeSpent: data.timeSpent,
          completed: data.completed
        })

        if (result.success) {
          lastSaveRef.current = {
            progress: data.progress,
            playedSeconds: data.playedSeconds,
            timestamp: Date.now()
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('[SimpleVideoProgress] Saved:', {
              courseId,
              chapterId,
              progress: data.progress,
              playedSeconds: data.playedSeconds
            })
          }
        } else {
          console.warn('[SimpleVideoProgress] Save failed:', result.error)
        }
      } catch (error) {
        console.error('[SimpleVideoProgress] Error:', error)
      }
    }, saveInterval / 2), // Debounce for half the save interval
    [courseId, chapterId, videoId, enabled, isAuthenticated, user?.id, saveInterval]
  )

  // Update progress function
  const updateProgress = useCallback((data: VideoProgressUpdate) => {
    if (!enabled) return

    const currentTime = Date.now()
    const lastSave = lastSaveRef.current
    const progressDiff = Math.abs(data.progress - lastSave.progress)
    const timeDiff = currentTime - lastSave.timestamp
    
    // Save if:
    // 1. Forced save
    // 2. Progress changed significantly 
    // 3. Enough time has passed
    // 4. Video completed
    const shouldSave = data.force || 
                      progressDiff >= autoSaveThreshold ||
                      timeDiff >= saveInterval ||
                      data.completed

    if (shouldSave) {
      debouncedSave(data)
    }
  }, [enabled, autoSaveThreshold, saveInterval, debouncedSave])

  // Get current progress from storage
  const getProgress = useCallback(() => {
    return simpleStorage.getVideoProgress(courseId, chapterId)
  }, [courseId, chapterId])

  // Auto-save on unmount
  useEffect(() => {
    return () => {
      debouncedSave.flush()
    }
  }, [debouncedSave])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
      }
    }
  }, [])

  return {
    updateProgress,
    getProgress,
    // For backward compatibility
    saveVideoProgress: updateProgress
  }
}

// Backward compatibility export
export function useSimpleVideoProgress(options: UseVideoProgressOptions) {
  console.warn('[useSimpleVideoProgress] This hook is deprecated. Use useVideoProgress instead.')
  return useVideoProgress(options)
}