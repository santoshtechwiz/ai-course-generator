import { useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  initializeGuestProgress, 
  setGuestPlaybackSettings,
  setVideoProgress 
} from '../store/slices/course-slice';
import { useSession } from 'next-auth/react';
import type { CourseProgress, PlaybackSettings } from '../store/slices/course-slice';

/**
 * Hook for managing guest user state before authentication
 * Provides state management for unauthenticated users exploring the platform
 */
export function useGuestState() {
  const dispatch = useAppDispatch();
  const { status } = useSession();
  
  // Get guest state from Redux store
  const guestProgress = useAppSelector(state => state.course.guestProgress);
  const guestPlaybackSettings = useAppSelector(state => state.course.guestPlaybackSettings);
  const videoProgress = useAppSelector(state => state.course.videoProgress);
  
  const isGuest = status === 'unauthenticated';
  
  // Initialize guest course progress
  const initializeGuestCourseProgress = useCallback((
    courseId: number | string,
    initialProgress?: Partial<CourseProgress>
  ) => {
    if (!isGuest) return;
    
    const progress: CourseProgress = {
      courseId,
      progress: 0,
      completedChapters: [],
      isCompleted: false,
      lastUpdated: Date.now(),
      ...initialProgress
    };
    
    dispatch(initializeGuestProgress({ courseId, progress }));
  }, [dispatch, isGuest]);
  
  // Update guest course progress
  const updateGuestCourseProgress = useCallback((
    courseId: number | string,
    updates: Partial<CourseProgress>
  ) => {
    if (!isGuest) return;
    
    const currentProgress = guestProgress[courseId];
    if (!currentProgress) {
      // Initialize if doesn't exist
      initializeGuestCourseProgress(courseId, updates);
      return;
    }
    
    const updatedProgress = {
      ...currentProgress,
      ...updates,
      lastUpdated: Date.now()
    };
    
    dispatch(initializeGuestProgress({ courseId, progress: updatedProgress }));
  }, [dispatch, isGuest, guestProgress, initializeGuestCourseProgress]);
  
  // Update guest playback settings
  const updateGuestPlaybackSettings = useCallback((settings: Partial<PlaybackSettings>) => {
    if (!isGuest) return;
    
    const updatedSettings = {
      ...guestPlaybackSettings,
      ...settings
    };
    
    dispatch(setGuestPlaybackSettings(updatedSettings));
  }, [dispatch, isGuest, guestPlaybackSettings]);
  
  // Track guest video progress
  const trackGuestVideoProgress = useCallback((
    videoId: string,
    time: number,
    playedSeconds?: number,
    duration?: number
  ) => {
    if (!isGuest) return;
    
    dispatch(setVideoProgress({
      videoId,
      time,
      playedSeconds,
      duration,
      userId: 'guest' // Mark as guest progress
    }));
  }, [dispatch, isGuest]);
  
  // Get guest progress for specific course
  const getGuestCourseProgress = useCallback((courseId: number | string) => {
    return guestProgress[courseId] || null;
  }, [guestProgress]);
  
  // Check if guest has progress for course
  const hasGuestProgress = useCallback((courseId: number | string) => {
    return Boolean(guestProgress[courseId]);
  }, [guestProgress]);
  
  // Get all guest state for migration
  const getGuestStateForMigration = useCallback(() => {
    if (!isGuest) return null;
    
    return {
      guestProgress,
      guestPlaybackSettings,
      videoProgress: Object.entries(videoProgress).reduce((acc, [videoId, progress]) => {
        // Filter for guest video progress (simple heuristic)
        acc[videoId] = progress;
        return acc;
      }, {} as typeof videoProgress)
    };
  }, [isGuest, guestProgress, guestPlaybackSettings, videoProgress]);
  
  // Computed values
  const guestCourseCount = useMemo(() => Object.keys(guestProgress).length, [guestProgress]);
  const guestVideoCount = useMemo(() => Object.keys(videoProgress).length, [videoProgress]);
  
  return {
    // State
    isGuest,
    guestProgress,
    guestPlaybackSettings,
    guestCourseCount,
    guestVideoCount,
    
    // Actions
    initializeGuestCourseProgress,
    updateGuestCourseProgress,
    updateGuestPlaybackSettings,
    trackGuestVideoProgress,
    
    // Queries
    getGuestCourseProgress,
    hasGuestProgress,
    getGuestStateForMigration
  };
}