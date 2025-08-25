import { useCallback, useRef, useState, useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setVideoProgress, markChapterCompleted, persistVideoProgress } from "@/store/slices/courseProgress-slice";
import { markChapterAsCompleted } from "@/store/slices/course-slice";

interface VideoProgressParams {
  played: number; 
  playedSeconds: number;
}

interface UpdateProgressParams {
  courseId: string | number;
  currentChapterId: string | number;
  videoId?: string;
  progress: number;
  playedSeconds?: number;
  duration?: number;
  lastAccessedAt?: string;
  isCompleted?: boolean;
}

interface UseVideoProgressTrackerOptions {
  courseId: string | number;
  chapterId?: string | number | null;
  videoId?: string | null;
  isLastVideo?: boolean;
  onCompletion?: () => void;
  throttleMs?: number;  // Milliseconds to throttle progress updates
  completionThreshold?: number; // When to consider video completed (0-1)
}

/**
 * Custom hook to track video progress with throttled updates to Redux and API
 */
export function useVideoProgressTracker({
  courseId,
  chapterId,
  videoId,
  isLastVideo = false,
  onCompletion,
  // Increase default throttle to 12s to cut API chatter (can be overridden explicitly)
  throttleMs = 12000, // Default to update every 12 seconds
  completionThreshold = 0.95 // Default to mark completed at 95%
}: UseVideoProgressTrackerOptions) {
  const dispatch = useAppDispatch();
  const lastUpdateTimeRef = useRef<number>(0);
  const completionSentRef = useRef<Record<string, boolean>>({});
  const [videoEnding, setVideoEnding] = useState(false);
  const videoDurationsRef = useRef<Record<string, number>>({});

  // Reset completion sent flag when chapter changes
  useEffect(() => {
    if (chapterId != null) {
      const key = String(chapterId);
      completionSentRef.current[key] = false;
    }
  }, [chapterId]);
  
  // Function to update progress to API
  // Progress cache to avoid duplicate/frequent POSTs per chapter
  const progressCacheRef = useRef<Record<string, { lastSavedAt: number; lastProgress: number; completed: boolean }>>({})

  const updateProgress = useCallback((params: UpdateProgressParams) => {
    const key = `${params.courseId}:${params.currentChapterId}`
    const cache = progressCacheRef.current[key] || { lastSavedAt: 0, lastProgress: -1, completed: false }

    // If chapter already marked completed in cache, skip further updates
    if (cache.completed) return

    const now = Date.now()
    // If progress hasn't changed significantly and recent save happened, skip
  // Require at least 4 seconds gap OR a meaningful progress delta (>=1%)
  const progressDelta = Math.abs(params.progress - cache.lastProgress)
  if (now - cache.lastSavedAt < 4000 && progressDelta < 0.01) {
      return
    }

    // Update cache immediately (optimistic) to prevent rapid duplicate calls
    progressCacheRef.current[key] = {
      lastSavedAt: now,
      lastProgress: params.progress,
      completed: !!params.isCompleted || params.progress >= 1,
    }

    // Dispatch Redux thunk to persist progress (centralized handling)
    try {
      const progressPercent = params.progress <= 1 ? Math.round(params.progress * 100) : Math.round(params.progress)
      const playedSeconds = Math.max(0, Math.floor(params.playedSeconds || 0))

      // Dispatch and don't await to avoid blocking UI, but catch synchronous errors
      // Skip if percent value hasn't changed by at least 1 point to avoid spam
      const percentInt = progressPercent
      if (Math.abs(percentInt - Math.round(cache.lastProgress * 100)) < 1 && !params.isCompleted) {
        return
      }

      dispatch(persistVideoProgress({
        courseId: params.courseId,
        chapterId: params.currentChapterId,
        progress: progressPercent,
        playedSeconds,
        completed: !!params.isCompleted,
        userId: '',
      }))
    } catch (err) {
      // On error, clear cache so next update will retry
      const existing = progressCacheRef.current[key]
      if (existing) {
        progressCacheRef.current[key] = { ...existing, lastSavedAt: 0 }
      }
    }
  }, [dispatch]);

  // Save video duration
  const setVideoDuration = useCallback((videoId: string, duration: number) => {
    if (videoId && duration) {
      videoDurationsRef.current[videoId] = duration;
    }
  }, []);

  // Handle progress updates with throttling
  const handleVideoProgress = useCallback((
    progressState: VideoProgressParams
  ) => {
    if (!chapterId || !courseId) return;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    const chapterIdStr = String(chapterId);
    
    // Check if video is ending to trigger UI effects
    if (progressState.playedSeconds > 0 && videoId) {
      const videoDuration = videoId ? videoDurationsRef.current[videoId] || 300 : 300;
      const timeRemaining = videoDuration - progressState.playedSeconds;

      // Show ending UI when video is in last 10 seconds
      if (timeRemaining <= 10 && timeRemaining > 0 && !videoEnding) {
        setVideoEnding(true);
      }

      // Reset for next video
      if (timeRemaining > 10 && videoEnding) {
        setVideoEnding(false);
      }
    }
    
    // Only update progress if we've passed the throttle time
  if (progressState.played > 0.1 && (timeSinceLastUpdate > throttleMs)) {
      lastUpdateTimeRef.current = now;
      
      // Only send API updates periodically to reduce server load
      updateProgress({
        courseId,
        currentChapterId: chapterId,
        videoId: videoId || undefined,
        progress: progressState.played,
        playedSeconds: progressState.playedSeconds,
        duration: videoDurationsRef.current[videoId || ''] || undefined,
        lastAccessedAt: new Date().toISOString(),
      });

      // Mark chapter complete at threshold to update playlist immediately
      if (!completionSentRef.current[chapterIdStr] && progressState.played >= completionThreshold) {
        completionSentRef.current[chapterIdStr] = true;
        
        // Update both slices so playlist reflects completion
        dispatch(markChapterAsCompleted({ courseId: Number(courseId), chapterId: Number(chapterId) }));
        dispatch(
          setVideoProgress({
            courseId: String(courseId),
            chapterId: Number(chapterId),
            progress: progressState.played * 100, // Convert to percentage
            playedSeconds: progressState.playedSeconds,
            completed: true,
            userId: '',
          })
        );

        // Persist completion to API (single save)
        updateProgress({
          courseId,
          currentChapterId: chapterId,
          videoId: videoId || undefined,
          progress: 1,
          isCompleted: true,
          lastAccessedAt: new Date().toISOString(),
        })

        // Additional callback for completion events
        if (onCompletion) {
          onCompletion();
        }
      }
    }
  }, [chapterId, courseId, updateProgress, throttleMs, completionThreshold, videoId, videoEnding, onCompletion]);
  
  // Handle video completion
  const handleVideoEnd = useCallback(() => {
    if (!chapterId || !courseId) return;
    
    const chapterIdStr = String(chapterId);
    
    // Mark chapter as completed in both slices
    dispatch(markChapterAsCompleted({ courseId: Number(courseId), chapterId: Number(chapterId) }));
    dispatch(
      setVideoProgress({
        courseId: String(courseId),
        chapterId: Number(chapterId),
        progress: 100, // 100% completion
        playedSeconds: videoDurationsRef.current[videoId || ''] || 0,
        completed: true,
        userId: '',
      })
    );

    // Ensure API persisted and cache marked completed to avoid duplicate writes
    const key = `${courseId}:${chapterId}`
    progressCacheRef.current[key] = {
      lastSavedAt: Date.now(),
      lastProgress: 1,
      completed: true,
    }

    // Fire final save (if needed)
    updateProgress({
      courseId,
      currentChapterId: chapterId,
      videoId: videoId || undefined,
      progress: 1,
      isCompleted: true,
      lastAccessedAt: new Date().toISOString(),
    });
    
    // Additional callback for completion events
    if (onCompletion) {
      onCompletion();
    }
  }, [
    chapterId, 
    courseId, 
    dispatch, 
    updateProgress, 
    isLastVideo, 
    videoId,
    onCompletion
  ]);

  return {
    handleVideoProgress,
    handleVideoEnd,
    setVideoDuration,
    videoEnding
  };
}
