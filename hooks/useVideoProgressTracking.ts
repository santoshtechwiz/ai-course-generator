import { useCallback, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import useProgressTracker from "@/hooks/use-progress-tracker"
import { useAppSelector } from "@/store/hooks"
import { selectCourseProgressById } from "@/store/slices/courseProgress-slice"
import { useProgressEvents } from "@/utils/progress-events"
import { markChapterAsCompleted, setVideoProgress } from "@/store/slices/course-slice"
import { markChapterCompleted, setVideoProgress as setVideoProgressState } from "@/store/slices/courseProgress-slice"

interface VideoProgressData {
  played: number
  playedSeconds: number
}

interface UseVideoProgressTrackingOptions {
  courseId: string | number
  chapterId: string | number | null
  videoId: string | null
  userId: string
  onChapterComplete?: () => void
  throttleMs?: number
}

export function useVideoProgressTracking({
  courseId,
  chapterId,
  videoId,
  userId,
  onChapterComplete,
  throttleMs = 5000
}: UseVideoProgressTrackingOptions) {
  const dispatch = useAppDispatch()
  const lastSaveRef = useRef<number>(0)
  const completedRef = useRef<Set<string>>(new Set())
  const { dispatchVideoWatched, dispatchChapterCompleted } = useProgressEvents()

  // Save progress to API with throttling
  const saveToAPI = useCallback(async (
    progressData: {
      currentChapterId: number
      progress: number
      playedSeconds: number
      completedChapters?: number[]
      isCompleted?: boolean
    }
  ) => {
    try {
      await fetch(`/api/progress/${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData)
      })
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }, [courseId])

  // Handle video progress updates
  const handleVideoProgress = useCallback((progressData: VideoProgressData) => {
    if (!chapterId || !videoId) return

    const now = Date.now()
    const progressPercent = Math.round(progressData.played * 100)
    
    // Update Redux state immediately for UI responsiveness
    dispatch(setVideoProgress({
      videoId,
      time: progressData.playedSeconds,
      playedSeconds: progressData.playedSeconds,
      userId
    }))

    // Dispatch video watched event
    if (userId && courseId && chapterId) {
      dispatchVideoWatched(
        userId,
        String(chapterId),
        String(courseId),
        progressPercent,
        progressData.playedSeconds,
        0 // duration - could be passed in if available
      )
    }

    // Throttled API save
    if (now - lastSaveRef.current > throttleMs) {
      lastSaveRef.current = now
      saveToAPI({
        currentChapterId: Number(chapterId),
        progress: progressPercent,
        playedSeconds: progressData.playedSeconds
      })
    }
  }, [chapterId, videoId, userId, dispatch, throttleMs, saveToAPI, dispatchVideoWatched, courseId])

  // Handle video completion (only called when video actually ends)
  const handleVideoEnd = useCallback(() => {
    if (!chapterId || !videoId) return

    const chapterKey = `${courseId}-${chapterId}`
    
    // Prevent duplicate completion calls
    if (completedRef.current.has(chapterKey)) return
    completedRef.current.add(chapterKey)

    // Update both Redux slices for consistency
    dispatch(markChapterAsCompleted({ 
      courseId: Number(courseId), 
      chapterId: Number(chapterId),
      userId 
    }))
    
    dispatch(markChapterCompleted({
      courseId: String(courseId),
      chapterId: Number(chapterId),
      userId
    }))

    dispatch(setVideoProgressState({
      courseId: String(courseId),
      chapterId: Number(chapterId),
      progress: 100,
      playedSeconds: 0, // Will be updated by video player
      completed: true,
      userId
    }))

    // Dispatch chapter completed event
    if (userId && courseId && chapterId) {
      dispatchChapterCompleted(
        userId,
        String(chapterId),
        String(courseId),
        0 // timeSpent - could be calculated from start time
      )
    }

    // Save completion to API
    saveToAPI({
      currentChapterId: Number(chapterId),
      progress: 100,
      playedSeconds: 0,
      isCompleted: true
    })

    // Trigger completion callback
    onChapterComplete?.()
  }, [chapterId, videoId, courseId, userId, dispatch, saveToAPI, onChapterComplete, dispatchChapterCompleted])

  // Reset completion tracking when chapter changes
  const resetChapterCompletion = useCallback(() => {
    completedRef.current.clear()
  }, [])

  return {
    handleVideoProgress,
    handleVideoEnd,
    resetChapterCompletion
  }
}
