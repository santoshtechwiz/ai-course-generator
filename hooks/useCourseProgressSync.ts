import { useEffect, useCallback, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  setVideoProgress,
  markChapterCompleted,
  selectCourseProgressById,
} from "@/store/slices/courseProgress-slice"
import { useProgressEvents } from "@/utils/progress-events"
import { useAuth } from "@/modules/auth"

// Global request deduplication cache with timestamps
const progressFetchCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION_MS = 60000 // 60 seconds - increased for less frequent calls
const activeFetchRequests = new Map<string, Promise<any>>() // Track in-flight requests

// Utility to fetch course progress from API and sync to Redux
export function useCourseProgressSync(courseId: string | number) {
  const dispatch = useAppDispatch()
  const courseProgress = useAppSelector((state) => selectCourseProgressById(state, courseId))
  const { dispatchCourseProgressUpdated, dispatchChapterCompleted } = useProgressEvents()
  const { user, isAuthenticated } = useAuth()
  const abortControllerRef = useRef<AbortController | null>(null)
  const fetchingRef = useRef(false)

  // Helper to sync progress data to Redux
  const syncProgressToRedux = useCallback((progress: any) => {
    if (!progress) return

    // Sync video progress to Redux
    dispatch(
      setVideoProgress({
        courseId: String(courseId),
        chapterId: Number(progress.currentChapterId || 0),
        progress: progress.progress || 0,
        playedSeconds: progress.playedSeconds || 0,
        completed: progress.isCompleted || false,
        userId: progress.userId || '',
        lastPositions: progress.lastPositions || {}, // Add lastPositions
      })
    )

    // Defensive: ensure completedChapters is an array before iterating
    const completedChaptersSrc = progress.completedChapters
    const completedChapters = Array.isArray(completedChaptersSrc) ? completedChaptersSrc : []
    if (!Array.isArray(completedChaptersSrc) && typeof completedChaptersSrc !== 'undefined') {
      console.warn('[useCourseProgressSync] Unexpected completedChapters type:', typeof completedChaptersSrc, completedChaptersSrc)
    }

    completedChapters.forEach((chapterId: string | number) => {
      try {
        dispatch(
          markChapterCompleted({
            courseId: String(courseId),
            chapterId: Number(chapterId),
            userId: progress.userId || '',
          })
        )

        // Dispatch chapter completed event
        if (progress.userId) {
          dispatchChapterCompleted(
            progress.userId,
            String(chapterId),
            String(courseId),
            0 // timeSpent - not available from API
          )
        }
      } catch (e) {
        console.error('[useCourseProgressSync] Error processing completed chapter:', e, chapterId)
      }
    })

    // Dispatch course progress updated event
    if (progress.userId) {
      dispatchCourseProgressUpdated(
        progress.userId,
        String(courseId),
        progress.progress || 0,
        progress.completedChapters || [],
        progress.currentChapterId ? Number(progress.currentChapterId) : undefined,
        0 // timeSpent - not available from API
      )
    }
  }, [courseId, dispatch, dispatchChapterCompleted, dispatchCourseProgressUpdated])

  // Function to fetch and sync progress with aggressive deduplication
  const fetchAndSyncProgress = useCallback(async () => {
    // Skip fetching progress if user is not authenticated
    if (!isAuthenticated || !user?.id) {
      console.log('[useCourseProgressSync] Skipping progress fetch - user not authenticated')
      return
    }

    const cacheKey = `progress-${courseId}`
    const now = Date.now()

    // OPTIMIZATION 1: Check if we have a valid cached result first (most common path)
    const cached = progressFetchCache.get(cacheKey)
    if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
      console.log(`[useCourseProgressSync] Using cached progress for course ${courseId} (${now - cached.timestamp}ms old)`)
      syncProgressToRedux(cached.data.progress)
      return
    }

    // OPTIMIZATION 2: If request is already in-flight, wait for it instead of making a duplicate
    if (activeFetchRequests.has(cacheKey)) {
      console.log(`[useCourseProgressSync] Request already in-flight for course ${courseId}, waiting...`)
      try {
        const inFlightResult = await activeFetchRequests.get(cacheKey)
        syncProgressToRedux(inFlightResult?.progress)
      } catch (e) {
        console.error('[useCourseProgressSync] In-flight request failed:', e)
      }
      return
    }

    try {
      console.log(`[useCourseProgressSync] Fetching FRESH progress for course ${courseId}`)

      // Create the fetch promise and store it
      const fetchPromise = fetch(`/api/progress/${courseId}`, {
        credentials: 'include',
        cache: 'no-store',
        signal: abortControllerRef.current?.signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`)
          }
          return res.json()
        })

      activeFetchRequests.set(cacheKey, fetchPromise)

      const responseData = await fetchPromise

      // Cache the successful response
      progressFetchCache.set(cacheKey, {
        data: responseData,
        timestamp: now,
      })

      console.log(`[useCourseProgressSync] Successfully fetched and cached progress for course ${courseId}`)
      syncProgressToRedux(responseData.progress)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[useCourseProgressSync] Progress fetch was aborted')
        return
      }
      console.error('[useCourseProgressSync] Error fetching progress:', err)
    } finally {
      activeFetchRequests.delete(cacheKey)
    }
  }, [courseId, isAuthenticated, user?.id, syncProgressToRedux])

  // Fetch progress from API on mount - ONLY if user is authenticated
  useEffect(() => {
    fetchAndSyncProgress()

    // Cleanup abort controller on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchAndSyncProgress])

  // NOTE: We intentionally do NOT auto-save here when Redux state changes.
  // Progress updates are handled by the queue-based useProgressTracker hook
  // which writes progress to `/api/progress` (to avoid duplicate requests).

  // Return current progress and refetch function for convenience
  return {
    courseProgress,
    refetch: fetchAndSyncProgress,
  }
}
