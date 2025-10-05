import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  setVideoProgress,
  markChapterCompleted,
  selectCourseProgressById,
} from "@/store/slices/courseProgress-slice"
import { useProgressEvents } from "@/utils/progress-events"
import { useAuth } from "@/modules/auth"

// Utility to fetch course progress from API and sync to Redux
export function useCourseProgressSync(courseId: string | number) {
  const dispatch = useAppDispatch()
  const courseProgress = useAppSelector((state) => selectCourseProgressById(state, courseId))
  const { dispatchCourseProgressUpdated, dispatchChapterCompleted } = useProgressEvents()
  const { user, isAuthenticated } = useAuth()

  // Fetch progress from API on mount - ONLY if user is authenticated
  useEffect(() => {
    // Skip fetching progress if user is not authenticated
    if (!isAuthenticated || !user?.id) {
      console.log('[useCourseProgressSync] Skipping progress fetch - user not authenticated')
      return
    }

    async function fetchProgress() {
      try {
        console.log(`[useCourseProgressSync] Fetching progress for course ${courseId}`)
        const res = await fetch(`/api/progress/${courseId}`)
        if (!res.ok) {
          console.warn(`[useCourseProgressSync] Progress fetch failed with status ${res.status}`)
          return
        }
        const { progress } = await res.json()
        if (progress) {
          // Sync video progress to Redux
          dispatch(
            setVideoProgress({
              courseId: String(courseId),
              chapterId: Number(progress.currentChapterId || 0),
              progress: progress.progress || 0,
              playedSeconds: progress.playedSeconds || 0,
              completed: progress.isCompleted || false,
              userId: progress.userId || '',
            })
          )
          if (Array.isArray(progress.completedChapters)) {
            progress.completedChapters.forEach((chapterId: string | number) => {
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
            })
          }

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
        }
      } catch (err) {
        console.error('[useCourseProgressSync] Error fetching progress:', err)
      }
    }
    fetchProgress()
  }, [courseId, dispatch, isAuthenticated, user?.id])

  // NOTE: We intentionally do NOT auto-save here when Redux state changes.
  // Progress updates are handled by the queue-based useProgressTracker hook
  // which writes progress to `/api/progress` (to avoid duplicate requests).

  // Return current progress for convenience
  return courseProgress
}
