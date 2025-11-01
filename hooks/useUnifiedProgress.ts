/**
 * Unified Progress Hook - Phase 1 Fix
 * 
 * Consolidates guest and authenticated progress tracking into a single interface.
 * Eliminates duplicate code and provides a consistent API regardless of auth state.
 * 
 * BEFORE: 5 different progress systems (Redux, Guest, SWR, VideoState, Local)
 * AFTER: Single source of truth with unified interface
 */

import { useCallback } from 'react';
import { useAuth } from '@/modules/auth';
import { useCourseProgressSync } from './useCourseProgressSync';
import { useGuestProgress } from './useGuestProgress';

interface UnifiedProgressData {
  progress: number;
  currentChapterId: number | null;
  // ✅ FIX: Changed from number[] to string[] to match Redux state
  completedChapters: string[];
  isCompleted: boolean;
  playedSeconds: number;
  lastPositions: Record<number, number>;
}

interface UnifiedProgressActions {
  markChapterCompleted: (chapterId: number) => Promise<void> | void;
  setCurrentChapter: (chapterId: number) => void;
  updateVideoProgress: (chapterId: number, seconds: number) => void;
  refetch: () => Promise<void> | void;
}

interface UnifiedProgressReturn {
  // Data
  progress: UnifiedProgressData | null;
  
  // Actions
  markChapterCompleted: UnifiedProgressActions['markChapterCompleted'];
  setCurrentChapter: UnifiedProgressActions['setCurrentChapter'];
  updateVideoProgress: UnifiedProgressActions['updateVideoProgress'];
  refetch: UnifiedProgressActions['refetch'];
  
  // State
  isLoading: boolean;
  isGuest: boolean;
}

/**
 * Unified progress hook that works for both authenticated and guest users
 * 
 * @param courseId - Course ID to track progress for
 * @returns Unified progress data and actions
 * 
 * @example
 * const { progress, markChapterCompleted, isGuest } = useUnifiedProgress(courseId);
 * 
 * // Same API whether user is authenticated or guest
 * await markChapterCompleted(chapterId);
 */
export function useUnifiedProgress(courseId: number | string): UnifiedProgressReturn {
  const { isAuthenticated } = useAuth();
  
  // Get both progress systems
  const authProgress = useCourseProgressSync(courseId);
  const guestProgress = useGuestProgress(courseId);
  
  // Determine which system to use
  const isGuest = !isAuthenticated;
  
  // Unified progress data
  const progress = isGuest 
    ? guestProgress.currentCourseProgress 
      ? {
          progress: guestProgress.currentCourseProgress.progress || 0,
          currentChapterId: guestProgress.currentCourseProgress.currentChapterId || null,
          completedChapters: guestProgress.currentCourseProgress.completedChapters || [],
          isCompleted: guestProgress.currentCourseProgress.isCompleted || false,
          playedSeconds: 0, // Guest progress doesn't track played seconds
          lastPositions: {}, // Guest progress doesn't track last positions
        }
      : null
    : authProgress.courseProgress
      ? {
          progress: authProgress.courseProgress.videoProgress?.progress || 0,
          currentChapterId: authProgress.courseProgress.videoProgress?.currentChapterId 
            ? Number(authProgress.courseProgress.videoProgress.currentChapterId) 
            : null,
          // ✅ FIX: Keep as Strings to match Redux state and prevent progress display bugs
          completedChapters: (authProgress.courseProgress.videoProgress?.completedChapters || [])
            .map((id: string | number) => String(id)),
          isCompleted: authProgress.courseProgress.videoProgress?.isCompleted || false,
          playedSeconds: authProgress.courseProgress.videoProgress?.playedSeconds || 0,
          lastPositions: authProgress.courseProgress.videoProgress?.lastPositions || {},
        }
      : null;
  
  // Unified mark chapter completed
  const markChapterCompleted = useCallback(
    async (chapterId: number) => {
      if (isGuest) {
        guestProgress.markGuestChapterCompleted(chapterId);
      } else {
        // For authenticated users, the action is handled by MainContent
        // This hook just provides the interface
        console.log('[useUnifiedProgress] Marking chapter completed for auth user:', chapterId);
      }
    },
    [isGuest, guestProgress]
  );
  
  // Unified set current chapter
  const setCurrentChapter = useCallback(
    (chapterId: number) => {
      if (isGuest) {
        guestProgress.setGuestCurrentChapter(chapterId);
      } else {
        // For authenticated users, handled by Redux
        console.log('[useUnifiedProgress] Setting current chapter for auth user:', chapterId);
      }
    },
    [isGuest, guestProgress]
  );
  
  // Unified update video progress
  const updateVideoProgress = useCallback(
    (chapterId: number, seconds: number) => {
      if (isGuest) {
        guestProgress.trackGuestVideoWithCourse(String(chapterId), seconds);
      } else {
        // For authenticated users, handled by progress mutation queue
        console.log('[useUnifiedProgress] Updating video progress for auth user:', chapterId, seconds);
      }
    },
    [isGuest, guestProgress]
  );
  
  // Unified refetch
  const refetch = useCallback(async () => {
    if (!isGuest && authProgress.refetch) {
      await authProgress.refetch();
    }
    // Guest progress is in localStorage, no refetch needed
  }, [isGuest, authProgress]);
  
  return {
    progress,
    markChapterCompleted,
    setCurrentChapter,
    updateVideoProgress,
    refetch,
    isLoading: false, // Both systems load synchronously
    isGuest,
  };
}

/**
 * Hook for getting completion stats
 * Works for both guest and authenticated users
 */
export function useUnifiedCompletionStats(courseId: number | string) {
  const { isAuthenticated } = useAuth();
  const guestProgress = useGuestProgress(courseId);
  const authProgress = useCourseProgressSync(courseId);
  
  const isGuest = !isAuthenticated;
  
  if (isGuest) {
    return guestProgress.getGuestCompletionStats();
  }
  
  // For authenticated users
  if (!authProgress.courseProgress) {
    return {
      completedCount: 0,
      totalCount: 0,
      percentage: 0,
    };
  }
  
  const completedChapters = authProgress.courseProgress.videoProgress?.completedChapters || [];
  
  return {
    completedCount: completedChapters.length,
    totalCount: 0, // Will be calculated from course data
    percentage: authProgress.courseProgress.videoProgress?.progress || 0,
  };
}
