"use client"

import React from "react"
import { Dispatch } from "@reduxjs/toolkit"
import { markChapterAsCompleted } from "@/store/slices/course-slice"
import { markChapterCompleted as markChapterCompletedRedux, setVideoProgress } from "@/store/slices/courseProgress-slice"
import { useVideoState } from "@/app/dashboard/course/[slug]/components/video/hooks/useVideoState"

// Types for progress operations
export interface ProgressUpdateParams {
  userId: string
  courseId: string | number
  chapterId: string | number
  progress?: number
  playedSeconds?: number
  timeSpent?: number
  completed?: boolean
  trigger?: 'video_end' | 'next_click' | 'seek_to_end'
  videoDuration?: number
  watchTime?: number
  lastProgressUpdate?: number
}

export interface ChapterCompletionParams {
  userId: string
  courseId: string | number
  chapterId: string | number
  currentProgress: number
  timeSpent: number
  trigger: 'video_end' | 'next_click' | 'seek_to_end'
  dispatch: Dispatch
  dispatchChapterCompleted: (userId: string, chapterId: string, courseId: string, timeSpent: number) => void
  isAlreadyCompleted?: boolean
  onProgressRefresh?: () => void
  onCacheInvalidate?: () => void
  onCompletionAnimation?: () => Promise<void>
  videoDuration?: number
  lastProgressUpdate?: number
  watchTime?: number
}

/**
 * Unified Progress Service
 * Consolidates all progress synchronization logic to eliminate duplication
 */
export class ProgressService {
  private static instance: ProgressService
  private videoStateStore: any = null

  private constructor() {}

  public static getInstance(): ProgressService {
    if (!ProgressService.instance) {
      ProgressService.instance = new ProgressService()
    }
    return ProgressService.instance
  }

  /**
   * Initialize the service with video state store reference
   */
  public initialize(videoStateStore: any) {
    this.videoStateStore = videoStateStore
  }

  /**
   * Mark a chapter as completed with unified logic
   * Handles Redux updates, localStorage sync, and API calls
   */
  public async markChapterCompleted(params: ChapterCompletionParams): Promise<boolean> {
    const {
      userId,
      courseId,
      chapterId,
      currentProgress,
      timeSpent,
      trigger,
      dispatch,
      dispatchChapterCompleted,
      isAlreadyCompleted = false,
      onProgressRefresh,
      onCacheInvalidate,
      onCompletionAnimation,
      videoDuration,
      lastProgressUpdate,
      watchTime
    } = params

    // Check if chapter should be completed
    const shouldComplete = this.shouldMarkChapterCompleted(
      currentProgress,
      trigger,
      { watchTime, videoDuration, lastProgressUpdate }
    )

    if (!shouldComplete && !isAlreadyCompleted) {
      console.log(`Chapter ${chapterId} completion criteria not met`, {
        currentProgress,
        trigger,
        watchTime,
        videoDuration
      })
      return false
    }

    console.log(`Marking chapter ${chapterId} as completed via ${trigger}`)

    // Prepare IDs in both formats for different slices
    const chapterIdNum = Number(chapterId)
    const courseIdNum = Number(courseId)
    const chapterIdStr = String(chapterId)
    const courseIdStr = String(courseId)

    if (isNaN(chapterIdNum) || isNaN(courseIdNum)) {
      console.error("Invalid chapter or course ID", { chapterId, courseId })
      return false
    }

    // 1. Update Redux state immediately for UI responsiveness
    this.updateReduxState(dispatch, courseIdNum, chapterIdNum, courseIdStr, chapterIdStr, userId)

    // 2. Play completion animation if available
    if (onCompletionAnimation && !isAlreadyCompleted) {
      try {
        await onCompletionAnimation()
      } catch (error) {
        console.warn('Completion animation failed:', error)
      }
    }

    // 3. Update localStorage via video state store
    this.updateVideoState(courseIdStr, chapterIdStr)

    // 4. Update ChapterProgress in database
    const dbUpdateSuccess = await this.updateDatabaseProgress({
      userId,
      courseId: courseIdNum,
      chapterId: chapterIdNum,
      progress: 100,
      timeSpent: Math.round(timeSpent),
      watchTime: Math.round(watchTime || 0),
      completed: true,
      completionTrigger: trigger,
      lastWatchedAt: new Date().toISOString(),
      metadata: {
        videoDuration,
        completedAt: Date.now(),
        progressHistory: [
          { timestamp: Date.now(), progress: currentProgress, trigger }
        ]
      }
    })

    if (dbUpdateSuccess) {
      // 5. Handle cache and refresh callbacks
      if (onCacheInvalidate) {
        console.log(`Invalidating progress cache after chapter ${chapterId} completion`)
        onCacheInvalidate()
      }

      if (onProgressRefresh) {
        console.log(`Triggering progress refresh after chapter ${chapterId} completion`)
        setTimeout(() => {
          onProgressRefresh()
        }, 200)
      }
    }

    // 6. Dispatch chapter completed event
    dispatchChapterCompleted(
      userId,
      chapterIdStr,
      courseIdStr,
      Math.round(timeSpent)
    )

    return dbUpdateSuccess
  }

  /**
   * Update Redux state for chapter completion
   */
  private updateReduxState(
    dispatch: Dispatch,
    courseIdNum: number,
    chapterIdNum: number,
    courseIdStr: string,
    chapterIdStr: string,
    userId: string
  ) {
    // Update course-slice (needs number IDs)
    dispatch(markChapterAsCompleted({
      courseId: courseIdNum,
      chapterId: chapterIdNum,
      userId
    }))

    // Update courseProgress-slice (needs string IDs)
    dispatch(markChapterCompletedRedux({
      courseId: courseIdStr,
      chapterId: chapterIdStr,
      userId
    }))

    console.log(`[ProgressService] Redux state updated for chapter ${chapterIdStr} in course ${courseIdStr}`)
  }

  /**
   * Update video state store (localStorage persistence)
   */
  private updateVideoState(courseIdStr: string, chapterIdStr: string) {
    if (!this.videoStateStore) {
      console.warn('[ProgressService] Video state store not initialized')
      return
    }

    try {
      const videoState = this.videoStateStore.getState()
      const existingCompleted = videoState.courseProgress[courseIdStr]?.completedChapters || []

      const updatedCompletedChapters = Array.from(
        new Set([...existingCompleted, chapterIdStr])
      )

      // Sync with localStorage
      this.videoStateStore.getState().syncWithApiData(courseIdStr, updatedCompletedChapters)

      console.log(`[ProgressService] Video state updated for course ${courseIdStr}:`, updatedCompletedChapters)
    } catch (error) {
      console.error('[ProgressService] Failed to update video state:', error)
    }
  }

  /**
   * Update progress in database
   */
  private async updateDatabaseProgress(params: {
    userId: string
    courseId: number
    chapterId: number
    progress: number
    timeSpent: number
    watchTime: number
    completed: boolean
    completionTrigger: string
    lastWatchedAt: string
    metadata: any
  }): Promise<boolean> {
    try {
      const response = await fetch('/api/progress/chapter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (response.ok) {
        console.log(`[ProgressService] ChapterProgress updated for chapter ${params.chapterId}`)
        return true
      } else {
        console.error(`[ProgressService] Failed to update ChapterProgress:`, await response.text())
        return false
      }
    } catch (error) {
      console.error(`[ProgressService] Error updating ChapterProgress:`, error)
      return false
    }
  }

  /**
   * Update video progress in Redux
   */
  public updateVideoProgress(
    dispatch: Dispatch,
    params: ProgressUpdateParams
  ) {
    const { courseId, chapterId, progress = 0, playedSeconds = 0, completed = false, userId } = params

    dispatch(setVideoProgress({
      courseId: String(courseId),
      chapterId: Number(chapterId),
      progress,
      playedSeconds,
      completed,
      userId
    }))

    console.log(`[ProgressService] Video progress updated: ${progress}% for chapter ${chapterId}`)
  }

  /**
   * Sync progress data between API and local state
   */
  public syncProgressWithApi(
    courseId: string,
    apiCompletedChapters: string[],
    existingCompleted: string[] = []
  ) {
    if (!this.videoStateStore) {
      console.warn('[ProgressService] Video state store not initialized')
      return
    }

    // Merge local and API data
    const mergedCompletedChapters = Array.from(
      new Set([...existingCompleted, ...apiCompletedChapters].map(String))
    )

    console.log(`[ProgressService] Syncing progress for course ${courseId}:`, {
      local: existingCompleted,
      api: apiCompletedChapters,
      merged: mergedCompletedChapters
    })

    // Update video state
    this.videoStateStore.getState().syncWithApiData(courseId, mergedCompletedChapters)
  }

  /**
   * Helper to determine if a chapter should be marked as completed
   */
  private shouldMarkChapterCompleted(
    progress: number,
    trigger: ChapterCompletionParams['trigger'],
    params: {
      watchTime?: number
      videoDuration?: number
      lastProgressUpdate?: number
    } = {}
  ): boolean {
    const { watchTime = 0, videoDuration = 0, lastProgressUpdate = 0 } = params
    const now = Date.now()

    switch (trigger) {
      case 'video_end':
        return true

      case 'next_click':
        const minWatchRatio = videoDuration > 300 ? 0.6 : 0.75
        const hasWatchedEnough = watchTime >= Math.min(120, videoDuration * 0.3)
        return progress >= minWatchRatio || hasWatchedEnough

      case 'seek_to_end':
        const recentProgress = (now - lastProgressUpdate) < 30000
        return progress >= 0.95 && recentProgress

      default:
        const hasMinimalProgress = progress >= 0.95
        const hasMinimalWatchTime = watchTime >= Math.min(30, videoDuration * 0.2)
        return hasMinimalProgress && hasMinimalWatchTime
    }
  }
}

// Export singleton instance
export const progressService = ProgressService.getInstance()

// React hook for using the progress service
export function useProgressService() {
  const videoStateStore = useVideoState()

  // Initialize service with video state store
  React.useEffect(() => {
    progressService.initialize(videoStateStore)
  }, [videoStateStore])

  return progressService
}