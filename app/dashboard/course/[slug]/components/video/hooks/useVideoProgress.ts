"use client"

import { useCallback, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useVideoProgressTracker } from "@/hooks/useVideoProgressTracker"
import { useAppSelector } from "@/store/hooks"
import { selectCourseProgressById } from "@/store/slices/courseProgress-slice"
import type { ProgressState } from "../types"

interface UseVideoProgressOptions {
  courseId: string | number
  chapterId: string | number
  videoId: string
  enabled?: boolean
  saveInterval?: number // How often to save progress (in milliseconds)
}

interface VideoProgressData {
  progress: number
  playedSeconds: number
  duration: number
  completed: boolean
}

export function useVideoProgress({
  courseId,
  chapterId,
  videoId,
  enabled = true,
  saveInterval = 10000, // Save every 10 seconds by default
}: UseVideoProgressOptions) {
  const { data: session } = useSession()
  const lastSaveTimeRef = useRef<number>(0)
  const progressDataRef = useRef<VideoProgressData>({
    progress: 0,
    playedSeconds: 0,
    duration: 0,
    completed: false,
  })

  // Use centralized tracker for persistence and completion handling
  const tracker = useVideoProgressTracker({
    courseId,
    chapterId,
    videoId,
    throttleMs: Math.max(5000, saveInterval),
  })

  // Initialize completed chapters on mount
  useEffect(() => {
    // Completed chapters are synchronized via server -> Redux on mount elsewhere.
  }, [session?.user?.id])
 
  // Save progress to API
  const saveProgress = useCallback(
    async (data: VideoProgressData, force = false) => {
      if (!enabled || !session?.user?.id) return

      const now = Date.now()
      const timeSinceLastSave = now - lastSaveTimeRef.current

      // Only save if enough time has passed or if forced (e.g., on video end)
      if (!force && timeSinceLastSave < saveInterval) {
        return
      }

      try {
        // Delegate persistence to the centralized tracker
        tracker.handleVideoProgress({ played: data.progress / 100, playedSeconds: data.playedSeconds })
        lastSaveTimeRef.current = now
      } catch (error) {
        console.error("Failed to save video progress via tracker:", error)
      }
    },
    [enabled, session?.user?.id, courseId, chapterId, videoId, saveInterval]
  )

  // Handle progress updates from video player
  const handleProgress = useCallback(
    (progressState: ProgressState, videoDuration?: number) => {
      const progress = Math.round(progressState.played * 100)
      const completed = progress >= 90 // Consider video completed at 90%

      const newData: VideoProgressData = {
        progress,
        playedSeconds: progressState.playedSeconds,
        duration: videoDuration || progressState.playedSeconds || 0,
        completed,
      }

      progressDataRef.current = newData

      // Auto-save at regular intervals
      saveProgress(newData)
    },
    [saveProgress]
  )

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    const data: VideoProgressData = {
      ...progressDataRef.current,
      progress: 100,
      completed: true,
    }

  // Use tracker to persist completion
  tracker.handleVideoEnd()
  }, [saveProgress])

  // Handle manual seek - save immediately
  const handleSeek = useCallback(
    (seconds: number) => {
      const data: VideoProgressData = {
        ...progressDataRef.current,
        playedSeconds: seconds,
      }

      // Forward seek update to tracker as an immediate progress update
      try {
        tracker.handleVideoProgress({ played: Math.min(1, (seconds / (data.duration || seconds)) || 0), playedSeconds: seconds })
      } catch (err) {
        // Fallback: nothing
      }
    },
    [saveProgress]
  )

  // Load saved progress position
  const loadSavedPosition = useCallback(async (): Promise<number> => {
    if (!enabled || !session?.user?.id) return 0

    try {
      const response = await fetch(`/api/progress/${courseId}`)
      if (response.ok) {
        const result = await response.json()
        const progress = result.progress

        if (progress && progress.currentChapterId === Number(chapterId)) {
          return progress.playedSeconds || 0
        }
      }
    } catch (error) {
      console.error("Failed to load saved progress:", error)
    }

    return 0
  }, [enabled, session?.user?.id, courseId, chapterId])

  // Get completion status
  const isChapterCompleted = useCallback((): boolean => {
    const chapterNum = Number(chapterId)
    const progress = useAppSelector((state) => selectCourseProgressById(state, courseId))
    try {
      return (progress?.videoProgress?.completedChapters || []).includes(chapterNum)
    } catch { return false }
  }, [chapterId])

  return {
    handleProgress,
    handleVideoEnd,
    handleSeek,
    loadSavedPosition,
    isChapterCompleted,
    currentProgress: progressDataRef.current,
  }
}
