"use client"

import { useCallback, useRef, useEffect } from "react"
import { useAuth } from "@/modules/auth"
import useProgressTracker from "@/hooks/use-progress-tracker"
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
  const { user, isAuthenticated } = useAuth()
  const lastSaveTimeRef = useRef<number>(0)
  const progressDataRef = useRef<VideoProgressData>({
    progress: 0,
    playedSeconds: 0,
    duration: 0,
    completed: false,
  })

  // Use centralized tracker for persistence and completion handling
  const { updateProgress } = useProgressTracker({
    userId: user?.id || '',
    courseId: Number(courseId),
    chapterId: Number(chapterId),
    onError: (error) => {
      console.error("Failed to save video progress:", error)
    },
  })

  // No-op effect retained for possible future initialization hooks
  useEffect(() => { /* placeholder */ }, [user?.id])
 
  // Save progress to API
  const saveProgress = useCallback(
    async (data: VideoProgressData, force = false) => {
  if (!enabled || !isAuthenticated || !user?.id) return

      const now = Date.now()
      const timeSinceLastSave = now - lastSaveTimeRef.current

      // Only save if enough time has passed or if forced (e.g., on video end)
      if (!force && timeSinceLastSave < saveInterval) {
        return
      }

      try {
        // Use new queue-based progress tracking
        updateProgress(data.progress, 'video', {
          videoId,
          playedSeconds: data.playedSeconds,
          timestamp: now
        })
        lastSaveTimeRef.current = now
      } catch (error) {
        console.error("Failed to save video progress:", error)
      }
    },
  [enabled, isAuthenticated, user?.id, updateProgress, videoId, saveInterval]
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

    // Use new queue-based progress tracking for completion
    updateProgress(100, 'video', {
      videoId,
      playedSeconds: data.playedSeconds,
      completed: true,
      timestamp: Date.now()
    })
  }, [updateProgress, videoId])

  // Handle manual seek - save immediately
  const handleSeek = useCallback(
    (seconds: number) => {
      const data: VideoProgressData = {
        ...progressDataRef.current,
        playedSeconds: seconds,
      }

      // Forward seek update to tracker as an immediate progress update
      try {
        // Use new queue-based progress tracking
        updateProgress(data.progress, 'video', {
          videoId,
          playedSeconds: data.playedSeconds,
          timestamp: Date.now()
        })
      } catch (error) {
        console.error("Failed to save video progress:", error)
      }
    },
    [updateProgress, videoId]
  )

  // Load saved progress position
  const loadSavedPosition = useCallback(async (): Promise<number> => {
  if (!enabled || !isAuthenticated || !user?.id) return 0

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
  }, [enabled, isAuthenticated, user?.id, courseId, chapterId])

  // Get completion status
  const progressState = useAppSelector((state) => selectCourseProgressById(state, courseId))
  const isChapterCompleted = useCallback((): boolean => {
    try {
      const chapterNum = Number(chapterId)
      return (progressState?.videoProgress?.completedChapters || []).includes(chapterNum)
    } catch { return false }
  }, [progressState, chapterId])

  return {
    handleProgress,
    handleVideoEnd,
    handleSeek,
    loadSavedPosition,
    isChapterCompleted,
    currentProgress: progressDataRef.current,
  }
}
