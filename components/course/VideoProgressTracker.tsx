'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import useProgressTracker from '@/hooks/use-progress-tracker';

interface VideoProgressTrackerProps {
  userId: string;
  courseId: number;
  chapterId: number;
  videoId: string;
  onProgressUpdate?: (progress: number) => void;
  onCompletion?: () => void;
  completionThreshold?: number;
  autoSaveInterval?: number;
}

export function VideoProgressTracker({
  userId,
  courseId,
  chapterId,
  videoId,
  onProgressUpdate,
  onCompletion,
  completionThreshold = 0.95,
  autoSaveInterval = 15000, // Increased to 15 seconds
}: VideoProgressTrackerProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const lastUpdateRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  const { updateProgress } = useProgressTracker({
    userId,
    courseId,
    chapterId,
    onError: (error) => {
      toast.error('Failed to update progress. Will retry automatically.');
      console.error('Failed to update video progress:', error);
    },
  });

  // Auto-save progress periodically
  useEffect(() => {
    if (isCompleted) return;

    let lastSavedProgress = 0;
    const interval = setInterval(() => {
      // Only save if progress has changed by at least 2%
      if (progressRef.current > 0 && Math.abs(progressRef.current - lastSavedProgress) >= 0.02) {
        updateProgress(progressRef.current * 100, 'video', {
          videoId,
          playedSeconds: progressRef.current * durationRef.current,
          duration: durationRef.current
        });
        lastSavedProgress = progressRef.current;
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSaveInterval, isCompleted, updateProgress, videoId]);

  // Clean up on unmount - save final progress
  useEffect(() => {
    return () => {
      if (progressRef.current > 0 && !isCompleted) {
        updateProgress(progressRef.current * 100, 'video', {
          videoId,
          playedSeconds: progressRef.current * durationRef.current,
          duration: durationRef.current,
          isFinal: true
        });
      }
    };
  }, [isCompleted, updateProgress, videoId]);

  const handleProgress = useCallback(
    (progress: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
      const now = Date.now();
      progressRef.current = progress.played;

      // Update UI callback without throttling
      onProgressUpdate?.(progress.played * 100);

      // Throttle server updates to every 10 seconds
      if (now - lastUpdateRef.current < 10000) return;
      
      // Check for completion
      if (!isCompleted && progress.played >= completionThreshold) {
        setIsCompleted(true);
        handleVideoComplete();
        onCompletion?.();
        return;
      }

      lastUpdateRef.current = now;
      updateProgress(progress.played * 100, 'video', {
        videoId,
        playedSeconds: progress.playedSeconds,
        loaded: progress.loaded,
        loadedSeconds: progress.loadedSeconds
      });
    },
    [completionThreshold, isCompleted, onCompletion, onProgressUpdate, updateProgress, videoId]
  );

  const handleVideoComplete = useCallback(() => {
    updateProgress(100, 'video', {
      videoId,
      completed: true,
      finalTimestamp: Date.now()
    });
  }, [updateProgress, videoId]);

  const handleDuration = useCallback((duration: number) => {
    durationRef.current = duration;
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('Video playback error:', error);
    toast.error('Video playback error. Please try refreshing the page.');
  }, []);

  return {
    handleProgress,
    handleVideoComplete,
    handleDuration,
    handleError,
    isCompleted
  };
}
