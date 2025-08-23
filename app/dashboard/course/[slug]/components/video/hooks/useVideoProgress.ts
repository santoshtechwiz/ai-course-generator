"use client"

import { useCallback, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { progressApi } from "../../../api/progressApi"
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

  // Initialize completed chapters on mount
  useEffect(() => {
    if (session?.user?.id) {
      progressApi.loadCompletedChapters(session.user.id)
    }
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
        progressApi.queueUpdate({
          courseId,
          chapterId,
          videoId,
          progress: data.progress,
          playedSeconds: data.playedSeconds,
          duration: data.duration,
          completed: data.completed,
          userId: session.user.id,
        })

        lastSaveTimeRef.current = now
        
        // Update completed chapters locally
        if (data.completed) {
          const chapterNum = Number(chapterId)
          if (!progressApi.completedChapters.includes(chapterNum)) {
            progressApi.completedChapters.push(chapterNum)
            progressApi.saveCompletedChapters(session.user.id)
          }
        }
      } catch (error) {
        console.error("Failed to save video progress:", error)
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

    // Force save when video ends
    saveProgress(data, true)
  }, [saveProgress])

  // Handle manual seek - save immediately
  const handleSeek = useCallback(
    (seconds: number) => {
      const data: VideoProgressData = {
        ...progressDataRef.current,
        playedSeconds: seconds,
      }

      // Force save on seek
      saveProgress(data, true)
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
    return progressApi.completedChapters.includes(chapterNum)
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
