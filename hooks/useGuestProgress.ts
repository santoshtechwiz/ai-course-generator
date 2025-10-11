import { useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useGuestState } from './useGuestState';
import type { CourseProgress } from '../store/slices/course-slice';

/**
 * Hook for managing guest progress tracking across courses and videos
 * Specialized hook for tracking learning progress before authentication
 */
export function useGuestProgress(courseId?: number | string) {
  const { status } = useSession();
  const {
    guestProgress,
    updateGuestCourseProgress,
    getGuestCourseProgress,
    hasGuestProgress,
    trackGuestVideoProgress
  } = useGuestState();
  
  const isGuest = status === 'unauthenticated';
  
  // Get current course progress if courseId provided
  const currentCourseProgress = useMemo(() => {
    if (!courseId) return null;
    return getGuestCourseProgress(courseId);
  }, [courseId, getGuestCourseProgress]);
  
  // Track chapter completion for guest
  const markGuestChapterCompleted = useCallback((
    chapterId: number,
    targetCourseId?: number | string
  ) => {
    if (!isGuest) return;
    
    const cId = targetCourseId || courseId;
    if (!cId) return;
    
    const currentProgress = getGuestCourseProgress(cId);
    const completedChapters = currentProgress?.completedChapters || [];
    
    if (!completedChapters.includes(chapterId)) {
      const updatedChapters = [...completedChapters, chapterId];
      updateGuestCourseProgress(cId, {
        completedChapters: updatedChapters,
        currentChapterId: chapterId,
        lastUpdated: Date.now()
      });
    }
  }, [isGuest, courseId, getGuestCourseProgress, updateGuestCourseProgress]);
  
  // Set current chapter for guest
  const setGuestCurrentChapter = useCallback((
    chapterId: number,
    targetCourseId?: number | string
  ) => {
    if (!isGuest) return;
    
    const cId = targetCourseId || courseId;
    if (!cId) return;
    
    updateGuestCourseProgress(cId, {
      currentChapterId: chapterId,
      lastUpdated: Date.now()
    });
  }, [isGuest, courseId, updateGuestCourseProgress]);
  
  // Update overall course progress percentage
  const updateGuestCourseProgressPercentage = useCallback((
    progressPercentage: number,
    targetCourseId?: number | string
  ) => {
    if (!isGuest) return;
    
    const cId = targetCourseId || courseId;
    if (!cId) return;
    
    updateGuestCourseProgress(cId, {
      progress: Math.max(0, Math.min(100, progressPercentage)),
      lastUpdated: Date.now()
    });
  }, [isGuest, courseId, updateGuestCourseProgress]);
  
  // Mark course as completed for guest
  const markGuestCourseCompleted = useCallback((
    targetCourseId?: number | string
  ) => {
    if (!isGuest) return;
    
    const cId = targetCourseId || courseId;
    if (!cId) return;
    
    updateGuestCourseProgress(cId, {
      isCompleted: true,
      progress: 100,
      lastUpdated: Date.now()
    });
  }, [isGuest, courseId, updateGuestCourseProgress]);
  
  // Track video progress for guest with course context
  const trackGuestVideoWithCourse = useCallback((
    videoId: string,
    time: number,
    playedSeconds?: number,
    duration?: number,
    targetCourseId?: number | string
  ) => {
    if (!isGuest) return;
    
    // Track video progress
    trackGuestVideoProgress(videoId, time, playedSeconds, duration);
    
    // Update course context if provided
    const cId = targetCourseId || courseId;
    if (cId) {
      updateGuestCourseProgress(cId, {
        lastPlayedAt: new Date().toISOString(),
        resumePoint: time,
        lastUpdated: Date.now()
      });
    }
  }, [isGuest, courseId, trackGuestVideoProgress, updateGuestCourseProgress]);
  
  // Get completion statistics for guest
  const getGuestCompletionStats = useCallback((targetCourseId?: number | string) => {
    const cId = targetCourseId || courseId;
    if (!cId) return null;
    
    const progress = getGuestCourseProgress(cId);
    if (!progress) return null;
    
    return {
      completedChapters: progress.completedChapters?.length || 0,
      currentChapter: progress.currentChapterId,
      progressPercentage: progress.progress || 0,
      isCompleted: progress.isCompleted || false,
      lastActivity: progress.lastUpdated ? new Date(progress.lastUpdated) : null
    };
  }, [courseId, getGuestCourseProgress]);
  
  // Get all guest progress summary
  const getGuestProgressSummary = useCallback(() => {
    if (!isGuest) return null;
    
    const courses = Object.keys(guestProgress);
    const totalCourses = courses.length;
    const completedCourses = courses.filter(id => guestProgress[id]?.isCompleted).length;
    const totalChapters = courses.reduce((acc, id) => 
      acc + (guestProgress[id]?.completedChapters?.length || 0), 0);
    
    return {
      totalCourses,
      completedCourses,
      totalChapters,
      courses: courses.map(id => ({
        courseId: id,
        progress: guestProgress[id]?.progress || 0,
        completedChapters: guestProgress[id]?.completedChapters?.length || 0,
        isCompleted: guestProgress[id]?.isCompleted || false
      }))
    };
  }, [isGuest, guestProgress]);
  
  return {
    // State
    isGuest,
    currentCourseProgress,
    hasProgressForCourse: courseId ? hasGuestProgress(courseId) : false,
    
    // Actions
    markGuestChapterCompleted,
    setGuestCurrentChapter,
    updateGuestCourseProgressPercentage,
    markGuestCourseCompleted,
    trackGuestVideoWithCourse,
    
    // Queries
    getGuestCompletionStats,
    getGuestProgressSummary
  };
}