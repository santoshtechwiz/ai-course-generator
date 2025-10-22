import { useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { selectCourseProgressById, setVideoProgress } from '@/store/slices/courseProgress-slice'

/**
 * Hook to restore video player state on mount from Redux and localStorage
 * Handles page reload scenarios to restore:
 * - Previously completed chapters
 * - Last watched position
 * - Current chapter ID
 */
export function useRestorePlayerState(courseId: string | number, chapterId: string | number, userId?: string) {
  const dispatch = useAppDispatch()
  const courseProgress = useAppSelector((state) => selectCourseProgressById(state, courseId))
  const initializedRef = useRef(false)

  useEffect(() => {
    // Only restore once per mount
    if (initializedRef.current) return
    initializedRef.current = true

    // Load from Redux to restore completed chapters and last position
    if (courseProgress && userId) {
      const { videoProgress } = courseProgress

      console.log('[useRestorePlayerState] Restoring state:', {
        courseId,
        currentChapterId: videoProgress.currentChapterId,
        completedChapters: videoProgress.completedChapters.length,
        playedSeconds: videoProgress.playedSeconds,
        lastPositions: Object.keys(videoProgress.lastPositions || {}).length,
      })

      // If we're loading a different chapter, restore its last position if available
      if (videoProgress.lastPositions && videoProgress.lastPositions[String(chapterId)]) {
        const savedSeconds = videoProgress.lastPositions[String(chapterId)]
        console.log(`[useRestorePlayerState] Restoring last position for chapter ${chapterId}: ${savedSeconds}s`)

        // Dispatch update to ensure player knows about this position
        dispatch(
          setVideoProgress({
            courseId: String(courseId),
            chapterId: Number(chapterId),
            progress: 0, // Will be updated as video plays
            playedSeconds: savedSeconds,
            completed: false,
            userId: userId || '',
            lastPositions: videoProgress.lastPositions,
          })
        )
      }
    } else if (userId) {
      console.log('[useRestorePlayerState] No course progress found in Redux for course:', courseId)
    }
  }, [courseId, chapterId, userId, courseProgress, dispatch])

  return {
    courseProgress,
    isRestored: initializedRef.current,
  }
}
