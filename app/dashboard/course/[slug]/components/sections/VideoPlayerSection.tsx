'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setPiPActive, setPiPVideoData } from '@/store/slices/course-slice';
import { setVideoProgress, markChapterCompleted } from '@/store/slices/courseProgress-slice';
import { useToast } from '@/components/ui/use-toast';
import { useCourseModule } from '../../context/CourseModuleContext';
import { useVideoState } from '../video/hooks/useVideoState';
import { useProgressMutation, flushProgress } from '@/services/enhanced-progress/client_progress_queue';
import type { FullCourseType, FullChapterType } from '@/app/types/types';

interface VideoPlayerSectionProps {
  course: FullCourseType;
  currentChapter: FullChapterType | undefined;
  currentIndex: number;
  videoPlaylist: { videoId: string; chapter: FullChapterType }[];
  isLastVideo: boolean;
  hasNextVideo: boolean;
  nextVideoEntry: { videoId: string; chapter: FullChapterType } | null;
  autoplayMode: boolean;
  isTheaterMode: boolean;
  onTheaterModeToggle: (newMode: boolean) => void;
  onNextVideo: () => Promise<void>;
  onCertificateClick: () => void;
  onVideoLoadingChange?: (isLoading: boolean) => void; // New callback
}

/**
 * useVideoPlayerSection Hook
 * 
 * Handles all video player functionality including:
 * - Video playback control and state management
 * - Progress tracking with throttling
 * - PiP (Picture-in-Picture) mode
 * - Theater mode toggling
 * - Bookmark seeking
 * - Video loading states
 * - Chapter completion on video end
 */
export function useVideoPlayerSection({
  course,
  currentChapter,
  currentIndex,
  videoPlaylist,
  isLastVideo,
  hasNextVideo,
  nextVideoEntry,
  autoplayMode,
  isTheaterMode,
  onTheaterModeToggle,
  onNextVideo,
  onCertificateClick,
  onVideoLoadingChange,
}: VideoPlayerSectionProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const videoStateStore = useVideoState();
  
  // Context data
  const {
    user,
    currentVideoId,
    completedChapters,
    markChapterCompleted: markChapterComplete,
  } = useCourseModule();
  
  // Global PiP state
  const { isPiPActive } = useAppSelector((state) => state.course);
  
  // Local state
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({});
  const [playerRef, setPlayerRef] = useState<React.RefObject<any> | null>(null);
  const [currentVideoProgress, setCurrentVideoProgress] = useState<number>(0);
  
  // Throttle progress events
  const lastProgressEventTime = useRef<number>(0);
  const PROGRESS_THROTTLE_MS = 3000;
  
  // Progress mutation
  const { enqueueProgress, flushQueue } = useProgressMutation();
  
  // Pre-populate videoDurations
  useEffect(() => {
    const durations: Record<string, number> = {};
    
    videoPlaylist.forEach(({ videoId, chapter }) => {
      if (chapter?.videoDuration && typeof chapter.videoDuration === 'number' && chapter.videoDuration > 0) {
        durations[videoId] = chapter.videoDuration;
      } else if (chapter?.duration && typeof chapter.duration === 'number' && chapter.duration > 0) {
        durations[videoId] = chapter.duration;
      }
    });
    
    if (Object.keys(durations).length > 0) {
      setVideoDurations((prev) => ({ ...prev, ...durations }));
    }
  }, [videoPlaylist]);
  
  // Reset progress when video changes
  useEffect(() => {
    setCurrentVideoProgress(0);
    // Set loading to true when video changes
    if (onVideoLoadingChange) {
      onVideoLoadingChange(true);
    }
  }, [currentVideoId, onVideoLoadingChange]);
  
  // ============================================================================
  // Event Handlers
  // ============================================================================
  
  const handlePIPToggle = useCallback(
    (activatePiP?: boolean, currentTime?: number) => {
      const shouldActivate = activatePiP ?? false;
      
      dispatch(setPiPActive(shouldActivate));
      if (shouldActivate) {
        const videoTime = currentTime || 0; // Simplified - just use provided time or 0
        
        dispatch(
          setPiPVideoData({
            youtubeVideoId: currentVideoId || '',
            chapterId: currentChapter?.id?.toString(),
            courseId: course.id,
            courseName: course.title,
            chapterTitle: currentChapter?.title || '',
            currentTime: videoTime,
          }),
        );
        toast({
          title: 'Picture-in-Picture',
          description: 'Video is now playing in a separate window.',
        });
      } else {
        dispatch(setPiPVideoData(undefined));
      }
    },
    [currentVideoId, currentChapter, course.id, course.title, dispatch, toast],
  );
  
  const handleTheaterModeToggle = useCallback(
    (newTheaterMode: boolean) => {
      onTheaterModeToggle(newTheaterMode);
    },
    [onTheaterModeToggle],
  );
  
  const handleVideoProgress = useCallback(
    (progressState: { played: number; playedSeconds: number }) => {
      setCurrentVideoProgress(progressState.played);
      
      if (progressState.played > 0.05) {
        if (currentChapter?.id && currentVideoId) {
          if (user?.id && !course.isShared) {
            // Update Redux state for instant UI feedback
            dispatch(
              setVideoProgress({
                courseId: String(course.id),
                chapterId: Number(currentChapter.id),
                progress: progressState.played * 100,
                playedSeconds: progressState.playedSeconds,
                completed: false,
                userId: user.id,
              }),
            );
            
            // Throttle API events
            const now = Date.now();
            const timeSinceLastEvent = now - lastProgressEventTime.current;
            
            if (timeSinceLastEvent >= PROGRESS_THROTTLE_MS) {
              lastProgressEventTime.current = now;
              
              enqueueProgress(
                user.id,
                course.id,
                currentChapter.id,
                'chapter_progress',
                progressState.played * 100,
                progressState.playedSeconds,
                {
                  courseId: String(course.id),
                  chapterId: String(currentChapter.id),
                  progress: progressState.played * 100,
                  playedSeconds: progressState.playedSeconds,
                  duration: videoDurations[currentVideoId] || 0,
                  videoId: currentVideoId,
                  totalDuration: videoDurations[currentVideoId] || 0,
                  timestamp: Date.now(),
                  eventSubtype: 'continuous_progress',
                },
              );
            }
            
            // Milestone tracking
            const progressPercent = Math.floor(progressState.played * 100);
            if (progressPercent % 25 === 0 && progressPercent > 0) {
              enqueueProgress(
                user.id,
                course.id,
                currentChapter.id,
                'chapter_progress',
                progressPercent,
                Math.round(progressState.playedSeconds),
                {
                  courseId: String(course.id),
                  chapterId: String(currentChapter.id),
                  progress: progressPercent,
                  playedSeconds: Math.round(progressState.playedSeconds),
                  duration: videoDurations[currentVideoId] || 0,
                  videoId: currentVideoId,
                  milestone: progressPercent,
                  totalDuration: videoDurations[currentVideoId] || 0,
                  timestamp: Date.now(),
                  eventSubtype: 'progress_milestone',
                },
              );
            }
          } else {
            console.log('[VideoPlayerSection] Video progress tracked:', {
              chapterId: currentChapter?.id,
              progress: progressState.playedSeconds,
            });
          }
        }
      }
    },
    [
      user?.id,
      course.isShared,
      currentChapter?.id,
      course.id,
      currentVideoId,
      videoDurations,
      dispatch,
      enqueueProgress,
    ],
  );
  
  const handleVideoEnded = useCallback(() => {
    if (currentChapter) {
      const chapterId = Number(currentChapter.id);
      const courseId = Number(course.id);
      
      if (user?.id && !course.isShared) {
        const isAlreadyCompleted = completedChapters.includes(String(currentChapter.id));
        
        if (!isAlreadyCompleted) {
          dispatch(markChapterCompleted({ courseId, chapterId, userId: user.id }));
          
          // Trigger cache invalidation
          console.log('[VideoPlayerSection] 🎯 Chapter completed (video ended)');
          window.dispatchEvent(
            new CustomEvent('progressSynced', {
              detail: {
                requiresRefetch: true,
                completedChaptersMap: { [String(courseId)]: [chapterId] },
                courseId: String(courseId),
                chapterId: String(chapterId),
              },
            }),
          );
        }
        
        dispatch(
          setVideoProgress({
            courseId: String(courseId),
            chapterId: chapterId,
            progress: 100,
            playedSeconds: Math.round(currentVideoProgress * (videoDurations[currentVideoId || ''] || 0)),
            completed: true,
            userId: user.id,
          }),
        );
        
        const timeSpent = Math.round(currentVideoProgress * (videoDurations[currentVideoId || ''] || 0));
        enqueueProgress(
          user.id,
          courseId,
          chapterId,
          'chapter_progress',
          100,
          timeSpent,
          {
            completed: true,
            courseId: String(courseId),
            chapterId: String(chapterId),
            videoId: currentVideoId,
            completedAt: Date.now(),
            completedVia: 'video_end',
            finalProgress: 100,
            totalDuration: videoDurations[currentVideoId || ''] || 0,
            playedSeconds: timeSpent,
          },
        );
        
        // Flush immediately
        setTimeout(() => {
          flushQueue().catch((err) => console.error('[handleVideoEnded] Flush failed:', err));
        }, 100);
      } else {
        markChapterComplete(chapterId);
      }
      
      if (autoplayMode && hasNextVideo && nextVideoEntry) {
        setTimeout(() => {
          onNextVideo();
        }, 1000);
      }
    }
    
    if (isLastVideo) {
      onCertificateClick();
    }
  }, [
    currentChapter,
    completedChapters,
    dispatch,
    course.id,
    course.isShared,
    currentVideoProgress,
    videoDurations,
    currentVideoId,
    isLastVideo,
    onCertificateClick,
    user?.id,
    autoplayMode,
    hasNextVideo,
    nextVideoEntry,
    onNextVideo,
    enqueueProgress,
    flushQueue,
    markChapterComplete,
  ]);
  
  const handleVideoLoad = useCallback(
    (metadata: { duration: number; title: string }) => {
      if (currentVideoId && metadata.duration > 0) {
        setVideoDurations((prev) => ({
          ...prev,
          [currentVideoId]: metadata.duration,
        }));
        
        // Video metadata loaded - set loading to false
        if (onVideoLoadingChange) {
          onVideoLoadingChange(false);
        }
      }
    },
    [currentVideoId, onVideoLoadingChange],
  );
  
  const handlePlayerReady = useCallback((player: React.RefObject<any>) => {
    setPlayerRef(player);
    // Notify that video is ready and loading is complete
    if (onVideoLoadingChange) {
      onVideoLoadingChange(false);
    }
  }, [onVideoLoadingChange]);
  
  const handleSeekToBookmark = useCallback(
    (time: number) => {
      if (playerRef?.current) {
        playerRef.current.seekTo(time);
      }
    },
    [playerRef],
  );
  
  return {
    // State
    videoDurations,
    playerRef,
    currentVideoProgress,
    setCurrentVideoProgress,
    isPiPActive,
    
    // Handlers
    handlePIPToggle,
    handleTheaterModeToggle,
    handleVideoProgress,
    handleVideoEnded,
    handleVideoLoad,
    handlePlayerReady,
    handleSeekToBookmark,
  };
}
