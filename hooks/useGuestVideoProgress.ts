import { useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setVideoProgress } from '../store/slices/course-slice';
import { useGuestState } from './useGuestState';
import { migratedStorage } from '../lib/storage';

/**
 * Hook for managing guest video progress tracking
 * Specialized for video playback progress before authentication
 */
export function useGuestVideoProgress(videoId?: string) {
  const dispatch = useAppDispatch();
  const { status } = useSession();
  const { trackGuestVideoProgress } = useGuestState();
  
  // Get video progress from Redux store
  const videoProgress = useAppSelector(state => state.course.videoProgress);
  
  const isGuest = status === 'unauthenticated';
  
  // Get current video progress if videoId provided
  const currentVideoProgress = useMemo(() => {
    if (!videoId) return null;
    return videoProgress[videoId] || null;
  }, [videoId, videoProgress]);
  
  // Update video progress for guest
  const updateVideoProgress = useCallback((
    targetVideoId: string,
    time: number,
    playedSeconds?: number,
    duration?: number
  ) => {
    if (!isGuest) return;
    
    trackGuestVideoProgress(targetVideoId, time, playedSeconds, duration);
  }, [isGuest, trackGuestVideoProgress]);
  
  // Quick update for current video (if videoId provided)
  const updateCurrentVideoProgress = useCallback((
    time: number,
    playedSeconds?: number,
    duration?: number
  ) => {
    if (!videoId || !isGuest) return;
    
    updateVideoProgress(videoId, time, playedSeconds, duration);
  }, [videoId, isGuest, updateVideoProgress]);
  
  // Save progress to local storage as backup
  const saveToLocalStorage = useCallback(async (
    targetVideoId: string,
    time: number,
    playedSeconds?: number,
    duration?: number
  ) => {
    if (!isGuest) return;
    
    try {
      const storageKey = `guest_video_progress_${targetVideoId}`;
      const progressData = {
        time,
        playedSeconds: playedSeconds || 0,
        duration: duration || 0,
        lastUpdated: Date.now()
      };
      
      await migratedStorage.setItem(storageKey, progressData);
    } catch (error) {
      console.warn('Failed to save guest video progress to localStorage:', error);
    }
  }, [isGuest]);
  
  // Load progress from local storage
  const loadFromLocalStorage = useCallback(async (targetVideoId: string) => {
    if (!isGuest) return null;
    
    try {
      const storageKey = `guest_video_progress_${targetVideoId}`;
      const stored = await migratedStorage.getItem(storageKey);
      return stored || null;
    } catch (error) {
      console.warn('Failed to load guest video progress from localStorage:', error);
      return null;
    }
  }, [isGuest]);
  
  // Enhanced update with local storage backup
  const updateVideoProgressWithBackup = useCallback(async (
    targetVideoId: string,
    time: number,
    playedSeconds?: number,
    duration?: number
  ) => {
    if (!isGuest) return;
    
    // Update Redux state
    updateVideoProgress(targetVideoId, time, playedSeconds, duration);
    
    // Backup to localStorage
    await saveToLocalStorage(targetVideoId, time, playedSeconds, duration);
  }, [isGuest, updateVideoProgress, saveToLocalStorage]);
  
  // Initialize video progress from localStorage if not in Redux
  const initializeVideoProgress = useCallback(async (targetVideoId: string) => {
    if (!isGuest) return;
    
    // Check if already in Redux
    if (videoProgress[targetVideoId]) return;
    
    // Try to load from localStorage
    const stored = await loadFromLocalStorage(targetVideoId);
    if (stored && typeof stored === 'object') {
      const videoData = stored as any; // Type assertion for flexibility
      dispatch(setVideoProgress({
        videoId: targetVideoId,
        time: Number(videoData.time) || 0,
        playedSeconds: Number(videoData.playedSeconds) || 0,
        duration: Number(videoData.duration) || 0,
        userId: 'guest'
      }));
    }
  }, [isGuest, videoProgress, loadFromLocalStorage, dispatch]);
  
  // Get progress percentage for video
  const getVideoProgressPercentage = useCallback((targetVideoId?: string) => {
    const vId = targetVideoId || videoId;
    if (!vId) return 0;
    
    const progress = videoProgress[vId];
    if (!progress || !progress.duration) return 0;
    
    return Math.min(100, (progress.time / progress.duration) * 100);
  }, [videoId, videoProgress]);
  
  // Check if video is completed (watched >= 90%)
  const isVideoCompleted = useCallback((targetVideoId?: string) => {
    const percentage = getVideoProgressPercentage(targetVideoId);
    return percentage >= 90;
  }, [getVideoProgressPercentage]);
  
  // Get all guest video progress for migration
  const getAllGuestVideoProgress = useCallback(() => {
    if (!isGuest) return {};
    
    return Object.entries(videoProgress).reduce((acc, [vId, progress]) => {
      if (progress) {
        acc[vId] = {
          ...progress,
          percentage: getVideoProgressPercentage(vId),
          isCompleted: isVideoCompleted(vId)
        };
      }
      return acc;
    }, {} as Record<string, any>);
  }, [isGuest, videoProgress, getVideoProgressPercentage, isVideoCompleted]);
  
  // Auto-initialize current video progress on mount
  useEffect(() => {
    if (videoId && isGuest) {
      initializeVideoProgress(videoId);
    }
  }, [videoId, isGuest, initializeVideoProgress]);
  
  return {
    // State
    isGuest,
    currentVideoProgress,
    currentVideoPercentage: videoId ? getVideoProgressPercentage(videoId) : 0,
    isCurrentVideoCompleted: videoId ? isVideoCompleted(videoId) : false,
    
    // Actions
    updateVideoProgress,
    updateCurrentVideoProgress,
    updateVideoProgressWithBackup,
    initializeVideoProgress,
    
    // Queries
    getVideoProgressPercentage,
    isVideoCompleted,
    getAllGuestVideoProgress,
    
    // Storage utilities
    saveToLocalStorage,
    loadFromLocalStorage
  };
}