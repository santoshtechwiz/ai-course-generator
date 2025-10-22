import { useEffect, useCallback, useRef, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  setVideoProgress,
  markChapterCompleted,
  selectCourseProgressById,
} from "@/store/slices/courseProgress-slice"
import { useProgressEvents } from "@/utils/progress-events"
import { useAuth } from "@/modules/auth"

const progressFetchCache = new Map<string, { data: any; timestamp: number }>()
const activeFetchRequests = new Map<string, Promise<any>>()
const CACHE_DURATION_MS = 60000 // 1 minute

export function useCourseProgressSync(courseId: string | number) {
  const dispatch = useAppDispatch()
  const courseProgress = useAppSelector((state) =>
    selectCourseProgressById(state, courseId)
  )
  const { dispatchCourseProgressUpdated, dispatchChapterCompleted } =
    useProgressEvents()
  const { user, isAuthenticated } = useAuth()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Stable userId
  const userId = user?.id ? String(user.id) : null

  // ✅ Memoize event dispatchers so they don’t change identity each render
  const stableDispatchCourseProgressUpdated = useMemo(
    () => dispatchCourseProgressUpdated,
    []
  )
  const stableDispatchChapterCompleted = useMemo(
    () => dispatchChapterCompleted,
    []
  )

  // Sync to Redux with intelligent completion detection
  const syncProgressToRedux = useCallback(
    (progress: any) => {
      if (!progress) return

      console.log('[useCourseProgressSync] Syncing progress to Redux:', {
        courseId,
        currentChapterId: progress.currentChapterId,
        progress: progress.progress,
        completedChaptersFromAPI: progress.completedChapters,
        isCompleted: progress.isCompleted,
        playedSeconds: progress.playedSeconds,
        lastPositions: progress.lastPositions
      })

      // ✅ Extract completed chapters list from API
      const completedChapters = Array.isArray(progress.completedChapters)
        ? progress.completedChapters
        : []

      // ✅ Compute current chapter completion intelligently:
      // 1. Explicitly marked as completed in API response
      // 2. Progress >= 95%
      // 3. Already in completedChapters array
      const currentChapterId = progress.currentChapterId
      const currentProgress = progress.progress || 0
      
      const isCurrentChapterCompleted =
        progress.isCompleted === true ||
        currentProgress >= 95 ||
        (currentChapterId && (
          completedChapters.includes(Number(currentChapterId)) ||
          completedChapters.includes(String(currentChapterId))
        ))

      // ✅ Update current chapter progress in Redux (instant UI update)
      if (currentChapterId) {
        dispatch(
          setVideoProgress({
            courseId: String(courseId),
            chapterId: Number(currentChapterId),
            progress: isCurrentChapterCompleted ? 100 : currentProgress,
            playedSeconds: progress.playedSeconds || 0,
            completed: isCurrentChapterCompleted,
            userId: progress.userId || "",
            lastPositions: progress.lastPositions || {},
          })
        )
      }

      // ✅ Mark ALL completed chapters in Redux (from API)
      for (const chapterId of completedChapters) {
        const chapterIdNum = Number(chapterId)
        dispatch(
          markChapterCompleted({
            courseId: String(courseId),
            chapterId: chapterIdNum,
            userId: progress.userId || "",
          })
        )
        
        // Dispatch custom event for chapter completion
        if (progress.userId) {
          stableDispatchChapterCompleted(
            progress.userId,
            String(chapterIdNum),
            String(courseId),
            0
          )
        }
      }

      // ✅ If current chapter is completed but NOT in completedChapters array, add it
      if (isCurrentChapterCompleted && currentChapterId) {
        const currentChapterIdNum = Number(currentChapterId)
        const alreadyMarked = completedChapters.some(
          (id: string | number) => Number(id) === currentChapterIdNum
        )
        
        if (!alreadyMarked) {
          console.log('[useCourseProgressSync] ✅ Intelligent completion: marking chapter', currentChapterIdNum, 'as completed (progress:', currentProgress, '%)')
          dispatch(
            markChapterCompleted({
              courseId: String(courseId),
              chapterId: currentChapterIdNum,
              userId: progress.userId || "",
            })
          )
          
          if (progress.userId) {
            stableDispatchChapterCompleted(
              progress.userId,
              String(currentChapterIdNum),
              String(courseId),
              0
            )
          }
        }
      }

      // ✅ Dispatch course progress updated event (for global listeners)
      if (progress.userId) {
        stableDispatchCourseProgressUpdated(
          progress.userId,
          String(courseId),
          currentProgress,
          completedChapters,
          currentChapterId ? Number(currentChapterId) : undefined,
          0
        )
      }
    },
    [
      courseId,
      dispatch,
      stableDispatchCourseProgressUpdated,
      stableDispatchChapterCompleted,
    ]
  )

  // Fetch & sync
  const fetchAndSyncProgress = useCallback(async () => {
      if (!isAuthenticated || !userId) {
        console.debug("[useCourseProgressSync] Skipping fetch — not authenticated")
        return
      }

      const cacheKey = `progress-${courseId}`
      const now = Date.now()
      const cached = progressFetchCache.get(cacheKey)

      // Cached result
      if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
        console.debug(`[useCourseProgressSync] Using cached progress for ${courseId}`)
        syncProgressToRedux(cached.data.progress)
        return
      }

      // Deduplicate
      if (activeFetchRequests.has(cacheKey)) {
        console.debug(`[useCourseProgressSync] Awaiting existing fetch for ${courseId}`)
        const result = await activeFetchRequests.get(cacheKey)
        syncProgressToRedux(result?.progress)
        return
      }

      try {
        abortControllerRef.current = new AbortController()
        const fetchPromise = fetch(`/api/progress/${courseId}`, {
          credentials: "include",
          cache: "no-store",
          signal: abortControllerRef.current.signal,
        }).then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })

        activeFetchRequests.set(cacheKey, fetchPromise)
        const data = await fetchPromise
        progressFetchCache.set(cacheKey, { data, timestamp: now })
        syncProgressToRedux(data.progress)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.debug("[useCourseProgressSync] Fetch aborted")
          return
        }
        console.error("[useCourseProgressSync] Error fetching progress:", err)
      } finally {
        activeFetchRequests.delete(cacheKey)
      }
    },
    [courseId, isAuthenticated, userId, syncProgressToRedux]
  )

  // Run once per course/user
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchAndSyncProgress()
    }
    return () => abortControllerRef.current?.abort()
  }, [fetchAndSyncProgress, isAuthenticated, userId])

  return { courseProgress, refetch: fetchAndSyncProgress }
}
