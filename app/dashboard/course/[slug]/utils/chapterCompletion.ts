import { markChapterAsCompleted } from "@/store/slices/course-slice"
import { Dispatch } from "@reduxjs/toolkit"

export interface ChapterCompletionParams {
  userId: string
  courseId: number
  chapterId: number
  currentProgress: number
  timeSpent: number
  trigger: 'video_end' | 'next_click' | 'seek_to_end'
  dispatch: Dispatch
  dispatchChapterCompleted: (userId: string, chapterId: string, courseId: string, timeSpent: number) => void
  isAlreadyCompleted?: boolean
  onProgressRefresh?: () => void // Add callback to refresh progress data
  onCacheInvalidate?: () => void // Add callback to invalidate cache
  onCompletionAnimation?: () => Promise<void> // Add callback for completion animation
  videoDuration?: number // Total video duration in seconds
  lastProgressUpdate?: number // Timestamp of last progress update
  watchTime?: number // Time spent watching the video
}

/**
 * Centralized function to handle chapter completion logic
 * Ensures consistent behavior across different completion triggers
 */
export const markChapterCompleted = async (params: ChapterCompletionParams) => {
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
  const shouldComplete = shouldMarkChapterCompleted(
    currentProgress,
    trigger,
    { watchTime, videoDuration, lastProgressUpdate }
  );

  if (!shouldComplete && !isAlreadyCompleted) {
    console.log(`Chapter ${chapterId} completion criteria not met`, {
      currentProgress,
      trigger,
      watchTime,
      videoDuration
    });
    return false;
  }

  console.log(`Marking chapter ${chapterId} as completed via ${trigger}`);

  // Always update Redux state for immediate UI feedback
  dispatch(markChapterAsCompleted({ 
    courseId, 
    chapterId, 
    userId 
  }));

  // Play completion animation if available
  if (onCompletionAnimation && !isAlreadyCompleted) {
    try {
      await onCompletionAnimation();
    } catch (error) {
      console.warn('Completion animation failed:', error);
      // Non-critical error, continue with completion
    }
  }

  try {
    // Update ChapterProgress in database with enhanced metadata
    const response = await fetch('/api/progress/chapter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        courseId,
        chapterId,
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
      }),
    })

    if (response.ok) {
      console.log(`ChapterProgress updated for chapter ${chapterId} via ${trigger}`)
      
      // Invalidate cache first to ensure fresh data
      if (onCacheInvalidate) {
        console.log(`Invalidating progress cache after chapter ${chapterId} completion`)
        onCacheInvalidate()
      }
      
      // Trigger progress refresh to update UI with latest data
      if (onProgressRefresh) {
        console.log(`Triggering progress refresh after chapter ${chapterId} completion`)
        setTimeout(() => {
          onProgressRefresh()
        }, 200) // Small delay to ensure database update is complete
      }
    } else {
      console.error(`Failed to update ChapterProgress via ${trigger}:`, await response.text())
      return false
    }
  } catch (error) {
    console.error(`Error updating ChapterProgress via ${trigger}:`, error)
    return false
  }

  // Dispatch chapter completed event to progress tracking system
  dispatchChapterCompleted(
    userId,
    String(chapterId),
    String(courseId),
    Math.round(timeSpent)
  )

  return true
}

/**
 * Helper to determine if a chapter should be marked as completed
 * based on video progress, trigger type, and watch time
 */
export const shouldMarkChapterCompleted = (
  progress: number,
  trigger: ChapterCompletionParams['trigger'],
  params: {
    watchTime?: number; // Time spent watching in seconds
    videoDuration?: number; // Total video duration in seconds
    lastProgressUpdate?: number; // Timestamp of last progress update
  } = {}
): boolean => {
  const { watchTime = 0, videoDuration = 0, lastProgressUpdate = 0 } = params;
  const now = Date.now();
  
  switch (trigger) {
    case 'video_end':
      // Complete on natural video end
      return true;
      
    case 'next_click':
      // Complete on next click if:
      // 1. User watched > 60% OR
      // 2. Spent significant time watching (>30s for short videos, >2min for longer ones)
      const minWatchRatio = videoDuration > 300 ? 0.6 : 0.75; // Stricter for shorter videos
      const hasWatchedEnough = watchTime >= Math.min(120, videoDuration * 0.3);
      return progress >= minWatchRatio || hasWatchedEnough;
      
    case 'seek_to_end':
      // Only complete if user was actively watching before seeking
      const recentProgress = (now - lastProgressUpdate) < 30000; // Within 30s
      return progress >= 0.95 && recentProgress;
      
    default:
      // Auto-complete at 95% progress if significant time spent
      const hasMinimalProgress = progress >= 0.95;
      const hasMinimalWatchTime = watchTime >= Math.min(30, videoDuration * 0.2);
      return hasMinimalProgress && hasMinimalWatchTime;
  }
}