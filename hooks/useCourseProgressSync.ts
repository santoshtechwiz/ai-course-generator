import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  setLastPosition,
  markLectureCompleted,
  makeSelectCourseProgressById,
} from "@/store/slices/courseProgress-slice"

// Utility to fetch course progress from API and sync to Redux
export function useCourseProgressSync(courseId: string | number) {
  const dispatch = useAppDispatch()
  const selectCourseProgress = makeSelectCourseProgressById()
  const courseProgress = useAppSelector((state) => selectCourseProgress(state, courseId))

  // Fetch progress from API on mount
  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch(`/api/progress/${courseId}`)
        if (!res.ok) return
        const { progress } = await res.json()
        if (progress) {
          // Sync completed chapters to Redux
          dispatch(
            setLastPosition({
              courseId: String(courseId),
              lectureId: String(progress.currentChapterId || progress.lastLectureId || ""),
              timestamp: 0,
            })
          )
          if (Array.isArray(progress.completedChapters)) {
            progress.completedChapters.forEach((chapterId: string | number) => {
              dispatch(
                markLectureCompleted({
                  courseId: String(courseId),
                  lectureId: String(chapterId),
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

  // Save progress to API when completedLectures changes
  useEffect(() => {
    if (!courseProgress) return
    async function saveProgress() {
      try {
        await fetch(`/api/progress/${courseId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentChapterId: courseProgress.lastLectureId,
            completedChapters: courseProgress.completedLectures,
            progress: 0,
            isCompleted: courseProgress.isCourseCompleted,
          }),
        })
      } catch (err) {
        // Silent fail
      }
    }
    saveProgress()
  }, [courseId, courseProgress?.completedLectures, courseProgress?.lastLectureId, courseProgress?.isCourseCompleted])

  // Return current progress for convenience
  return courseProgress
}
