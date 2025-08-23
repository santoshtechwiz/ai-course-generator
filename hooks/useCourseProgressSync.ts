import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  setVideoProgress,
  markChapterCompleted,
  selectCourseProgressById,
} from "@/store/slices/courseProgress-slice"

// Utility to fetch course progress from API and sync to Redux
export function useCourseProgressSync(courseId: string | number) {
  const dispatch = useAppDispatch()
  const courseProgress = useAppSelector((state) => selectCourseProgressById(state, courseId))

  // Fetch progress from API on mount
  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch(`/api/progress/${courseId}`)
        if (!res.ok) return
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
            })
          }
        }
      } catch (err) {
        // Silent fail
      }
    }
    fetchProgress()
  }, [courseId, dispatch])

  // NOTE: We intentionally do NOT auto-save here when Redux state changes.
  // The `useVideoProgressTracker` hook is responsible for throttled API saves
  // and will write progress to `/api/progress` (to avoid duplicate requests).

  // Return current progress for convenience
  return courseProgress
}
