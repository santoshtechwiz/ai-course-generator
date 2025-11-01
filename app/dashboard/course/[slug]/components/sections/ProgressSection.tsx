'use client';

import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setVideoProgress, markChapterCompleted } from '@/store/slices/courseProgress-slice';
import { useProgressMutation, flushProgress } from '@/services/enhanced-progress/client_progress_queue';
import { useCourseModule } from '../../context/CourseModuleContext';
import type { FullCourseType, FullChapterType } from '@/app/types/types';

interface ProgressSectionProps {
  course: FullCourseType;
  videoPlaylist: { videoId: string; chapter: FullChapterType }[];
  currentVideoId: string | null;
  currentVideoProgress: number;
  videoDurations: Record<string, number>;
  completedChapters: string[];
}

/**
 * useProgressSection Hook
 * 
 * Handles all progress-related functionality including:
 * - Chapter completion tracking
 * - Progress updates to Redux and backend
 * - Progress synchronization with server
 * - Cache invalidation events
 * - Progress queue flushing
 */
export function useProgressSection({
  course,
  videoPlaylist,
  currentVideoId,
  currentVideoProgress,
  videoDurations,
  completedChapters,
}: ProgressSectionProps) {
  const dispatch = useAppDispatch();
  
  // Context data
  const {
    user,
    refreshProgress: refreshProgressFromServer,
  } = useCourseModule();
  
  // Progress mutation
  const { enqueueProgress, flushQueue } = useProgressMutation();
  
  /**
   * Handle chapter completion
   * - Marks chapter as completed in Redux
   * - Dispatches progressSynced event for cache invalidation
   * - Enqueues progress event
   * - Flushes progress queue and refreshes from server
   */
  const handleChapterComplete = useCallback(
    async (chapterId: number) => {
      const chapterIdNum = Number(chapterId);
      const courseIdNum = Number(course.id);

      if (user?.id && !course.isShared) {
        const isAlreadyCompleted = completedChapters.includes(String(chapterId));

        if (!isAlreadyCompleted) {
          // Mark as completed in Redux
          dispatch(
            markChapterCompleted({
              courseId: courseIdNum,
              chapterId: chapterIdNum,
              userId: user.id,
            }),
          );

          // Trigger immediate cache invalidation and refetch
          console.log('[ProgressSection] 🎯 Dispatching progressSynced event after markChapterCompleted');
          window.dispatchEvent(
            new CustomEvent('progressSynced', {
              detail: {
                requiresRefetch: true,
                completedChaptersMap: { [String(courseIdNum)]: [chapterIdNum] },
                courseId: String(courseIdNum),
                chapterId: String(chapterIdNum),
              },
            }),
          );

          // Calculate time spent
          const timeSpent = Math.round(currentVideoProgress * (videoDurations[currentVideoId || ''] || 0));
          
          // Enqueue progress event
          const success = enqueueProgress(
            user.id,
            courseIdNum,
            chapterIdNum,
            'chapter_progress',
            100,
            timeSpent,
            {
              completed: true,
              trigger: 'playlist_callback',
              videoDuration: videoDurations[currentVideoId || ''] || 0,
              watchedSeconds: timeSpent,
              completedAt: Date.now(),
            },
          );

          // Flush queue and refresh from server
          if (success) {
            try {
              await flushQueue();
              await refreshProgressFromServer();
            } catch (err) {
              console.error('[ProgressSection] Failed to flush progress:', err);
            }
          }
        }
      }
    },
    [
      user?.id,
      course.id,
      course.isShared,
      completedChapters,
      currentVideoProgress,
      videoDurations,
      currentVideoId,
      dispatch,
      enqueueProgress,
      flushQueue,
      refreshProgressFromServer,
    ],
  );

  /**
   * Handle progress update
   * - Updates video progress in Redux
   * - Only updates if user is authenticated and video matches current chapter
   */
  const handleProgressUpdate = useCallback(
    (chapterId: string, progress: number) => {
      if (user?.id && !course.isShared && currentVideoId) {
        const chapter = videoPlaylist.find((v) => String(v.chapter.id) === String(chapterId));
        
        if (chapter && chapter.videoId === currentVideoId) {
          dispatch(
            setVideoProgress({
              courseId: String(course.id),
              chapterId: Number(chapterId),
              progress,
              playedSeconds: Math.round((progress / 100) * (videoDurations[currentVideoId] || 0)),
              completed: progress >= 95,
              userId: user.id,
            }),
          );
        }
      }
    },
    [user?.id, course.id, course.isShared, currentVideoId, videoPlaylist, videoDurations, dispatch],
  );

  return {
    handleChapterComplete,
    handleProgressUpdate,
  };
}
