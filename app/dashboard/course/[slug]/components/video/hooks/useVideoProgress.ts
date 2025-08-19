"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { progressApi } from "../../../api/progressApi"
import { useAppDispatch } from "@/store/hooks"
import { PROGRESS_MILESTONES, checkMilestoneReached, throttle } from "./progressUtils"
import type { CourseProgress } from "@/app/types/course-types"
import { useAuth } from "@/hooks"

interface VideoProgressOptions {
  videoId?: string | null
  courseId: number | string
  chapterId?: string | number
  currentChapterId?: string | number
  duration?: number
  playedThreshold?: number
  initialProgress?: Partial<CourseProgress>
  onMilestoneReached?: (milestone: number) => void
  useSSE?: boolean
}

export function useVideoProgress({
  videoId,
  courseId,
  chapterId,
  currentChapterId,
  duration = 0,
  playedThreshold = 0.95,
  initialProgress,
  onMilestoneReached,
}: VideoProgressOptions) {
  const { isAuthenticated, user } = useAuth()
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  
  const effectiveChapterId = useMemo(() => {
    const cid = typeof chapterId !== 'undefined' ? chapterId : currentChapterId
    const n = Number(cid)
    return Number.isFinite(n) && !Number.isNaN(n) && n > 0 ? n : undefined
  }, [chapterId, currentChapterId])
  
  useEffect(() => {
    if (!courseId || courseId === '') {
      console.warn('Progress tracking: courseId is missing or empty', { courseId, videoId, effectiveChapterId });
      setError(new Error('Course ID is required for progress tracking'));
      return;
    }
    
    if (!videoId) {
      setError(new Error('Video ID is required for progress tracking'));
      return;
    }
    
    if (!effectiveChapterId) {
      setError(new Error('Chapter ID is required for progress tracking'));
      return;
    }
    
    if (!user?.id && !user) {
      setError(new Error('User authentication is required for progress tracking'));
      return;
    }
  }, [courseId, videoId, effectiveChapterId, user]);
  
  const courseIdStr = String(courseId)
  
  // Load completed chapters from progressApi memory/localStorage
  useEffect(() => {
    if (user?.id) {
      progressApi.loadCompletedChapters(user.id);
    }
  }, [user?.id]);

  const [progressState, setProgressState] = useState({
    time: 0,
    played: 0,
    playedSeconds: 0,
    duration: duration || 0,
    bookmarks: [],
    isCompleted: false,
    completedChapters: progressApi.completedChapters.map(String)
  })

  const reachedMilestonesRef = useRef<Set<number>>(new Set())
  const isSyncingToAPIRef = useRef(false)
  const lastSentProgressRef = useRef(0)
  const lastUpdateTimeRef = useRef<number>(0)
  
  const [needsCertificatePrompt, setNeedsCertificatePrompt] = useState(false)
  const [hasPromptedCertificate, setHasPromptedCertificate] = useState(false)
  const [hasShownRestartPrompt, setHasShownRestartPrompt] = useState(false)
  
  const getStorageId = useCallback(() => {
    if (isAuthenticated && user?.id) return user.id;
    try {
      let guestId = sessionStorage.getItem('video-guest-id');
      if (!guestId) {
        guestId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        sessionStorage.setItem('video-guest-id', guestId);
      }
      return guestId;
    } catch (e) {
      return 'anonymous';
    }
  }, [isAuthenticated, user]);
  
  useEffect(() => {
    const loadStoredProgress = () => {
      try {
        setIsLoading(true);
        
        if (videoId) {
          const storageKey = `video-progress-${getStorageId()}-${videoId}`;
          const storedProgress = localStorage.getItem(storageKey);
          
          if (storedProgress) {
            const parsed = JSON.parse(storedProgress);
            setProgressState(prev => ({
              ...prev,
              time: parsed.time || 0,
              played: parsed.played || 0,
              playedSeconds: parsed.playedSeconds || 0,
              duration: parsed.duration || duration || 0
            }));
          }
        }
        
        const certKey = `certificate-prompted-${getStorageId()}-${courseId}`;
        const hasPrompted = localStorage.getItem(certKey) === 'true';
        setHasPromptedCertificate(hasPrompted);
        
        if (initialProgress) {
          // Normalize completedChapters from initialProgress into string[] for local state
          let completedChapters: string[] = [];
          
          if (initialProgress && 'completedChapters' in initialProgress && initialProgress.completedChapters) {
            if (Array.isArray(initialProgress.completedChapters)) {
              completedChapters = (initialProgress.completedChapters as Array<string | number>)
                .map((v) => String(v))
                .filter(Boolean);
            } else if (typeof initialProgress.completedChapters === 'string') {
              completedChapters = (initialProgress.completedChapters as string).split(',').filter(Boolean);
            }
          }
          
          setProgressState(prev => ({
            ...prev,
            completedChapters,
            isCompleted: !!(initialProgress as any).isCompleted
          }));
        }
        
        progressApi.loadFromLocalStorage();
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading progress:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    };
    
    loadStoredProgress();
  }, [videoId, courseId, getStorageId, duration, initialProgress]);
  
  const progress = useMemo(() => ({
    id: initialProgress?.id || 0,
    userId: getStorageId(),
    courseId: Number(courseId) || 0,
    currentChapterId: Number(effectiveChapterId) || (initialProgress && 'currentChapterId' in initialProgress ? (initialProgress as any).currentChapterId : 0) || 0,
    // Expose as (string|number)[] for consumers like playlists/sidebar
    completedChapters: Array.isArray(progressState.completedChapters)
      ? (progressState.completedChapters as string[])
      : [],
    progress: progressState.played,
    lastAccessedAt: new Date().toISOString(),
    timeSpent: initialProgress && 'timeSpent' in initialProgress ? (initialProgress as any).timeSpent ?? 0 : 0,
    isCompleted: progressState.isCompleted,
    resumePoint: progressState.playedSeconds || 0
  }), [progressState, courseId, effectiveChapterId, getStorageId, initialProgress]);

  const trackProgress = useCallback(
    throttle((progressState: { played: number; playedSeconds: number; loaded: number }) => {
      if (progress.isCompleted || !effectiveChapterId) return;

      const currentPlayed = progressState.played;
      const currentPlayedSeconds = progressState.playedSeconds;
      
      setProgressState(prev => ({
        ...prev,
        played: currentPlayed,
        playedSeconds: currentPlayedSeconds,
        time: currentPlayed
      }));
      
      try {
        if (videoId) {
          const storageKey = `video-progress-${getStorageId()}-${videoId}`;
          localStorage.setItem(storageKey, JSON.stringify({
            time: currentPlayed,
            played: currentPlayed,
            playedSeconds: currentPlayedSeconds,
            duration: duration,
            lastUpdated: Date.now()
          }));
        }
      } catch (err) {
        console.warn('Error saving progress to localStorage:', err);
      }
      
      let hasSentUpdate = false;
      const currentTime = Date.now();
      const timeSinceLastUpdate = (currentTime - lastUpdateTimeRef.current) / 1000;
      const progressChange = Math.abs(currentPlayed - lastSentProgressRef.current);

      // Check milestones
      PROGRESS_MILESTONES.forEach((milestone) => {
        if (checkMilestoneReached(currentPlayed, milestone, reachedMilestonesRef.current)) {
          reachedMilestonesRef.current.add(milestone);
          onMilestoneReached?.(milestone);
          hasSentUpdate = true;

          // Handle chapter completion
          if (milestone >= playedThreshold && effectiveChapterId && !isSyncingToAPIRef.current) {
            isSyncingToAPIRef.current = true;
            setProgressState(prev => {
              const chapterIdStr = String(effectiveChapterId);
              if (prev.completedChapters.includes(chapterIdStr)) {
                return prev;
              }
              // Update progressApi.completedChapters and persist
              if (user?.id) {
                progressApi.completedChapters.push(Number(chapterIdStr));
                progressApi.saveCompletedChapters(user.id);
              }
              return {
                ...prev,
                completedChapters: [...prev.completedChapters, chapterIdStr]
              };
            });
            if (courseId && courseId !== '') {
              progressApi.queueUpdate({
                courseId,
                chapterId: effectiveChapterId,
                videoId: String(videoId || ""),
                progress: currentPlayed,
                playedSeconds: currentPlayedSeconds,
                duration: duration,
                completed: true,
                userId: getStorageId(),
              });
            }
            setTimeout(() => {
              isSyncingToAPIRef.current = false;
            }, 3000);
          }
        }
      });

      // Send update if:
      // - Milestone was reached OR
      // - Significant progress change (>=5%) OR
      // - Enough time has passed (30 seconds)
      const shouldSendNonMilestone = 
        !hasSentUpdate && 
        (timeSinceLastUpdate >= 30 || progressChange >= 0.05);
      
      if (shouldSendNonMilestone && effectiveChapterId && courseId && courseId !== '') {
        progressApi.queueUpdate({
          courseId,
          chapterId: effectiveChapterId,
          videoId: String(videoId || ""),
          progress: currentPlayed,
          playedSeconds: currentPlayedSeconds,
          duration: duration,
          completed: false,
          userId: getStorageId(),
        });
        hasSentUpdate = true;
      }

      // Update last sent values if we sent any update
      if (hasSentUpdate) {
        lastUpdateTimeRef.current = currentTime;
        lastSentProgressRef.current = currentPlayed;
      }
    }, 30000), // 30 seconds throttle
    [videoId, courseId, effectiveChapterId, progress.isCompleted, getStorageId, duration, 
     onMilestoneReached, playedThreshold]
  );

  type ProgressUpdateInput = Partial<CourseProgress> & { currentChapterId?: string | number; videoId?: string };

  const updateProgress = useCallback(
    async (data: ProgressUpdateInput) => {
      try {
        if (data && 'completedChapters' in data && data.completedChapters) {
          let chaptersArray: string[] = [];
          if (Array.isArray(data.completedChapters)) {
            chaptersArray = (data.completedChapters as Array<string | number>)
              .map((v) => String(v))
              .filter(Boolean);
          } else if (typeof (data as any).completedChapters === 'string') {
            chaptersArray = ((data as any).completedChapters as string).split(',').filter(Boolean);
          }
          setProgressState(prev => ({
            ...prev,
            completedChapters: chaptersArray
          }));
        }
        
        if (typeof data.progress === "number") {
          const chapterIdForApi = Number('currentChapterId' in data ? data.currentChapterId : effectiveChapterId)
          if (Number.isFinite(chapterIdForApi) && chapterIdForApi > 0) {
            if (courseId && courseId !== '') {
              progressApi.queueUpdate({
                courseId,
                chapterId: chapterIdForApi,
                videoId: String(('videoId' in data && data.videoId) ? data.videoId : (videoId || "")),
                progress: data.progress,
                playedSeconds: progressState.playedSeconds || 0,
                duration: progressState.duration || 0,
                completed: !!data.isCompleted,
                userId: getStorageId(),
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to update progress:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [courseId, effectiveChapterId, getStorageId, videoId, progressState]
  );

  const markCertificatePrompted = useCallback(() => {
    const certificateKey = `certificate-prompted-${getStorageId()}-${courseId}`;
    localStorage.setItem(certificateKey, 'true');
    setHasPromptedCertificate(true);
    setNeedsCertificatePrompt(false);
  }, [courseId, getStorageId]);

  const markRestartPrompted = useCallback(() => {
    const restartKey = `restart-prompted-${getStorageId()}-${courseId}`;
    localStorage.setItem(restartKey, 'true');
    setHasShownRestartPrompt(true);
  }, [courseId, getStorageId]);

  useEffect(() => {
    reachedMilestonesRef.current.clear();
    isSyncingToAPIRef.current = false;
    lastSentProgressRef.current = 0;
    lastUpdateTimeRef.current = 0;
  }, [videoId]);
  
  return {
    progress,
    progressState,
    trackProgress,
    updateProgress,
    needsCertificatePrompt,
    markCertificatePrompted,
    hasShownRestartPrompt,
    markRestartPrompted,
    isCourseCompleted: progressState.isCompleted,
    isLoading,
    error,
    isAuthenticated
  };
}

export const useProgress = useVideoProgress;
export default useVideoProgress;