"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { progressApi } from "../../../api/progressApi"

import { useAppDispatch } from "@/store/hooks"
import { PROGRESS_MILESTONES, checkMilestoneReached, throttle } from "./progressUtils"
import type { CourseProgress } from "@/app/types/types"
import { useAuth } from "@/hooks"

// Simplified options interface
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
  const { isAuthenticated, userId, getGuestId: authGetGuestId } = useAuth()
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Use numeric chapter ID only; never fall back to videoId (API requires currentChapterId)
  const effectiveChapterId = useMemo(() => {
    const cid = typeof chapterId !== 'undefined' ? chapterId : currentChapterId
    const n = Number(cid)
    return Number.isFinite(n) && !Number.isNaN(n) && n > 0 ? n : undefined
  }, [chapterId, currentChapterId])
  
  // Convert courseId to string for consistent lookup
  const courseIdStr = String(courseId)
  
  // Local state for tracking progress
  const [progressState, setProgressState] = useState({
    time: 0,
    played: 0,
    playedSeconds: 0,
    duration: duration || 0,
    bookmarks: [],
    isCompleted: false,
    completedChapters: initialProgress?.completedChapters 
      ? typeof initialProgress.completedChapters === 'string'
        ? initialProgress.completedChapters.split(',')
        : Array.isArray(initialProgress.completedChapters) 
          ? initialProgress.completedChapters
          : []
      : []
  })

  // Refs for tracking state between renders
  const reachedMilestonesRef = useRef<Set<number>>(new Set())
  const isSyncingToAPIRef = useRef(false)
  
  // Certification states
  const [needsCertificatePrompt, setNeedsCertificatePrompt] = useState(false)
  const [hasPromptedCertificate, setHasPromptedCertificate] = useState(false)
  const [hasShownRestartPrompt, setHasShownRestartPrompt] = useState(false)
  
  // Local storage ID helper
  const getStorageId = useCallback(() => {
    if (isAuthenticated && userId) return userId;
    
    if (authGetGuestId) return authGetGuestId();
    
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
  }, [isAuthenticated, userId, authGetGuestId]);
  
  // Initialize from local storage on mount
  useEffect(() => {
    const loadStoredProgress = () => {
      try {
        setIsLoading(true);
        
        // Check for stored progress in localStorage
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
        
        // Check for certification status
        const certKey = `certificate-prompted-${getStorageId()}-${courseId}`;
        const hasPrompted = localStorage.getItem(certKey) === 'true';
        setHasPromptedCertificate(hasPrompted);
        
        // Initialize course progress
        if (initialProgress) {
          // Handle various formats of completedChapters
          let completedChapters: string[] = [];
          
          if (initialProgress.completedChapters) {
            if (typeof initialProgress.completedChapters === 'string') {
              completedChapters = initialProgress.completedChapters.split(',');
            } else if (Array.isArray(initialProgress.completedChapters)) {
              completedChapters = initialProgress.completedChapters;
            }
          }
          
          setProgressState(prev => ({
            ...prev,
            completedChapters,
            isCompleted: !!initialProgress.isCompleted
          }));
        }
        
        // Load any pending updates
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
  
  // Create standard progress object structure that matches the API format
  const progress = useMemo(() => ({
    id: initialProgress?.id || 0,
    userId: userId || "",
    courseId: Number(courseId),
    currentChapterId: Number(effectiveChapterId) || initialProgress?.currentChapterId || 0,
    currentUnitId: initialProgress?.currentUnitId || null,
    completedChapters: Array.isArray(progressState.completedChapters) 
      ? progressState.completedChapters.join(',') 
      : progressState.completedChapters.toString(),
    progress: progressState.played,
    lastAccessedAt: new Date().toISOString(),
    timeSpent: initialProgress?.timeSpent || 0,
    isCompleted: progressState.isCompleted,
    completionDate: initialProgress?.completionDate || null,
    quizProgress: initialProgress?.quizProgress || null,
    notes: initialProgress?.notes || null,
    bookmarks: initialProgress?.bookmarks || null,
    lastInteractionType: initialProgress?.lastInteractionType || null,
    interactionCount: initialProgress?.interactionCount || 0,
    engagementScore: initialProgress?.engagementScore || 0,
    createdAt: initialProgress?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resumePoint: progressState.playedSeconds || 0
  }), [progressState, courseId, effectiveChapterId, userId, initialProgress]);

  // Track progress with milestone detection
  const trackProgress = useCallback(
    throttle((progressState: { played: number; playedSeconds: number; loaded: number }) => {
      // Skip if already completed or no valid chapter ID
      if (progress.isCompleted || !effectiveChapterId) return;
      
      // Update local state
      setProgressState(prev => ({
        ...prev,
        played: progressState.played,
        playedSeconds: progressState.playedSeconds,
        time: progressState.played
      }));
      
      // Store progress locally
      try {
        if (videoId) {
          const storageKey = `video-progress-${getStorageId()}-${videoId}`;
          localStorage.setItem(storageKey, JSON.stringify({
            time: progressState.played,
            played: progressState.played,
            playedSeconds: progressState.playedSeconds,
            duration: duration,
            lastUpdated: Date.now()
          }));
        }
      } catch (err) {
        console.warn('Error saving progress to localStorage:', err);
      }
      
      // Check for milestone achievements and only send significant updates
      let shouldSendUpdate = false;
      
      PROGRESS_MILESTONES.forEach((milestone) => {
        if (checkMilestoneReached(progressState.played, milestone, reachedMilestonesRef.current)) {
          reachedMilestonesRef.current.add(milestone);
          onMilestoneReached?.(milestone);
          shouldSendUpdate = true;
          
          // Mark chapter as completed if we've reached threshold
          if (milestone >= playedThreshold && effectiveChapterId && !isSyncingToAPIRef.current) {
            isSyncingToAPIRef.current = true;
            
            // Mark locally completed
            setProgressState(prev => {
              const chapterIdStr = String(effectiveChapterId);
              if (prev.completedChapters.includes(chapterIdStr)) {
                return prev; // No change needed
              }
              return {
                ...prev,
                completedChapters: [...prev.completedChapters, chapterIdStr]
              };
            });
            
            // Call API to update progress - this will be rate limited by progressApi
            progressApi.queueUpdate({
              courseId,
              chapterId: effectiveChapterId,
              videoId: String(videoId || ""),
              progress: progressState.played,
              playedSeconds: progressState.playedSeconds,
              duration: duration,
              completed: true,
              userId: userId,
            });
            
            setTimeout(() => {
              isSyncingToAPIRef.current = false;
            }, 3000);
          }
        }
      });
      
      // For non-milestone updates, only send every 15 seconds of playback
      // This creates a secondary throttle on top of the main throttle
      const secondsSinceLastUpdate = 
        (Date.now() - (lastUpdateTimeRef.current || 0)) / 1000;
        
      if (secondsSinceLastUpdate > 15) {
        shouldSendUpdate = true;
        lastUpdateTimeRef.current = Date.now();
      }
      
      // Only send non-milestone updates if significant progress has been made
      if (shouldSendUpdate && effectiveChapterId) {
        progressApi.queueUpdate({
          courseId,
          chapterId: effectiveChapterId,
          videoId: String(videoId || ""),
          progress: progressState.played,
          playedSeconds: progressState.playedSeconds,
          duration: duration,
          completed: false,
          userId: userId,
        });
      }
    }, 10000), // Increase throttle delay to 10 seconds
    [videoId, courseId, effectiveChapterId, progress.isCompleted, userId, duration, 
     onMilestoneReached, playedThreshold, getStorageId]
  );

  // Add a ref to track last update time
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Update progress method for compatibility with existing code
  const updateProgress = useCallback(
    async (data: Partial<CourseProgress>) => {
      try {
        // Update local state
        if (data.completedChapters) {
          const chaptersArray = typeof data.completedChapters === 'string'
            ? data.completedChapters.split(',')
            : Array.isArray(data.completedChapters) 
              ? data.completedChapters
              : [];
              
          setProgressState(prev => ({
            ...prev,
            completedChapters: chaptersArray
          }));
        }
        
        // Queue API update
        if (typeof data.progress === "number") {
          const chapterIdForApi = Number(data.currentChapterId ?? effectiveChapterId)
          if (Number.isFinite(chapterIdForApi) && chapterIdForApi > 0) {
            progressApi.queueUpdate({
              courseId,
              chapterId: chapterIdForApi,
              videoId: String(videoId || ""),
              progress: data.progress,
              playedSeconds: progressState.playedSeconds || 0,
              duration: progressState.duration || 0,
              completed: !!data.isCompleted,
              userId,
            });
          } else {
            console.warn('Progress update skipped: invalid chapterId', data.currentChapterId, effectiveChapterId);
          }
        }
      } catch (err) {
        console.error("Failed to update progress:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [courseId, effectiveChapterId, userId, videoId, progressState]
  );

  // Certificate prompt handling
  const markCertificatePrompted = useCallback(() => {
    const certificateKey = `certificate-prompted-${getStorageId()}-${courseId}`;
    localStorage.setItem(certificateKey, 'true');
    setHasPromptedCertificate(true);
    setNeedsCertificatePrompt(false);
  }, [courseId, getStorageId]);

  // Restart prompt handling
  const markRestartPrompted = useCallback(() => {
    const restartKey = `restart-prompted-${getStorageId()}-${courseId}`;
    localStorage.setItem(restartKey, 'true');
    setHasShownRestartPrompt(true);
  }, [courseId, getStorageId]);

  // Reset milestones when video changes
  useEffect(() => {
    reachedMilestonesRef.current.clear();
    isSyncingToAPIRef.current = false;
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

// Legacy hook for backward compatibility
export const useProgress = useVideoProgress;

// Default export for backward compatibility
export default useVideoProgress;
