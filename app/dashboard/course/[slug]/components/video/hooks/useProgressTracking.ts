"use client"

import { useCallback, useRef, useEffect } from "react"
import { useAppDispatch } from "@/store/hooks"
import { updateUserProgress } from "@/store/slices/courseSlice"
import { PROGRESS_MILESTONES, PROGRESS_UPDATE_DELAY, checkMilestoneReached, debounce } from "./progressUtils"
import type { ProgressState } from "../types"

interface UseProgressTrackingProps {
  courseId: string
  chapterId: string
  videoId: string
  onMilestoneReached?: (milestone: number) => void
}

interface UseProgressTrackingReturn {
  trackProgress: (progress: ProgressState) => void
  markChapterComplete: () => void
  saveProgress: () => void
}

export function useProgressTracking({
  courseId,
  chapterId,
  videoId,
  onMilestoneReached,
}: UseProgressTrackingProps): UseProgressTrackingReturn {
  const dispatch = useAppDispatch()
  const reachedMilestonesRef = useRef<Set<number>>(new Set())
  const lastProgressRef = useRef<ProgressState | null>(null)
  const pendingUpdatesRef = useRef<{
    progress?: number
    completed?: boolean
    timestamp: number
  } | null>(null)

  // Debounced progress update to prevent excessive API calls
  const debouncedProgressUpdate = useCallback(
    debounce((progressData: { progress: number; completed?: boolean }) => {
      dispatch(
        updateCourseProgress({
          courseId,
          chapterId,
          progress: progressData.progress,
          completed: progressData.completed || false,
          lastAccessedAt: new Date().toISOString(),
        }),
      )

      pendingUpdatesRef.current = null
    }, PROGRESS_UPDATE_DELAY),
    [courseId, chapterId, dispatch],
  )

  // Track progress with milestone detection
  const trackProgress = useCallback(
    (progress: ProgressState) => {
      lastProgressRef.current = progress

      // Check for milestone achievements
      PROGRESS_MILESTONES.forEach((milestone) => {
        if (checkMilestoneReached(progress.played, milestone, reachedMilestonesRef.current)) {
          reachedMilestonesRef.current.add(milestone)
          onMilestoneReached?.(milestone)

          // Queue progress update for significant milestones
          if (milestone >= 0.25) {
            pendingUpdatesRef.current = {
              progress: progress.played,
              timestamp: Date.now(),
            }
            debouncedProgressUpdate({ progress: progress.played })
          }
        }
      })
    },
    [onMilestoneReached, debouncedProgressUpdate],
  )

  // Mark chapter as complete
  const markChapterComplete = useCallback(() => {
    if (lastProgressRef.current) {
      // Immediate update for completion
      dispatch(
        updateUserProgress({
          courseId,
          chapterId,
          progress: 1.0,
          completed: true,
          lastAccessedAt: new Date().toISOString(),
        }),
      )

      reachedMilestonesRef.current.add(1.0)
      pendingUpdatesRef.current = null
    }
  }, [courseId, chapterId, dispatch])

  // Save current progress (called on pause, blur, etc.)
  const saveProgress = useCallback(() => {
    if (lastProgressRef.current && lastProgressRef.current.played > 0.05) {
      debouncedProgressUpdate({
        progress: lastProgressRef.current.played,
      })
    }
  }, [debouncedProgressUpdate])

  // Save progress on unmount or page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingUpdatesRef.current) {
        // Use sendBeacon for reliable data sending on page unload
        const data = JSON.stringify({
          courseId,
          chapterId,
          progress: pendingUpdatesRef.current.progress,
          completed: pendingUpdatesRef.current.completed,
          lastAccessedAt: new Date().toISOString(),
        })

        navigator.sendBeacon("/api/progress", data)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      saveProgress()
    }
  }, [courseId, chapterId, saveProgress])

  // Reset milestones when video changes
  useEffect(() => {
    reachedMilestonesRef.current.clear()
    lastProgressRef.current = null
    pendingUpdatesRef.current = null
  }, [videoId])

  return {
    trackProgress,
    markChapterComplete,
    saveProgress,
  }
}
