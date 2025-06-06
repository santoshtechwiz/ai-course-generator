import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

// Define the state interface
interface VideoProgress {
  time: number
  playedSeconds: number
  duration: number
}

interface CourseProgress {
  courseId: number
  progress: number
  completedChapters: number[]
  currentChapterId?: number
  isCompleted: boolean
  lastPlayedAt?: string
  resumePoint?: number
}

interface BookmarkData {
  videoId: string
  time: number
}

interface PlaybackSettings {
  volume: number
  muted: boolean
  playbackSpeed: number
  autoQuality?: boolean
  preload?: string
}

interface CourseState {
  currentVideoId: string | null
  videoProgress: Record<string, VideoProgress>
  autoplayEnabled: boolean
  bookmarks: Record<string, number[]>
  courseProgress: Record<number, CourseProgress> // Legacy - keep for backward compatibility
  userProgress: Record<string, Record<number | string, CourseProgress>> // Per-user progress
  guestProgress: Record<number | string, CourseProgress> // Guest-only progress
  currentCourseId: number | null
  currentCourseSlug: string | null
  courseCompletionStatus: boolean
  playbackSettings: PlaybackSettings
  userPlaybackSettings: Record<string, PlaybackSettings> // Per-user settings
  guestPlaybackSettings: PlaybackSettings // Guest settings
  videoCache?: Record<string, any>
  performanceSettings?: Record<string, any>
  userPreferences?: Record<string, any>
  analytics?: { events: any[] }
  nextVideoId: string | null
  prevVideoId: string | null
  isLoading: boolean
}

// Initial state
const initialState: CourseState = {
  currentVideoId: null,
  videoProgress: {},
  autoplayEnabled: true,
  bookmarks: {},
  courseProgress: {},
  userProgress: {},
  guestProgress: {},
  currentCourseId: null,
  currentCourseSlug: null,
  courseCompletionStatus: false,
  playbackSettings: {
    volume: 0.8,
    muted: false,
    playbackSpeed: 1.0,
  },
  userPlaybackSettings: {},
  guestPlaybackSettings: {
    volume: 0.8,
    muted: false,
    playbackSpeed: 1.0,
  },
  nextVideoId: null,
  prevVideoId: null,
  isLoading: true,
}

const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    setCurrentVideo(state, action: PayloadAction<string>) {
      state.currentVideoId = action.payload;
    },
    setVideoProgress(
      state,
      action: PayloadAction<{
        videoId: string
        time: number
        playedSeconds?: number
        duration?: number
        userId?: string
      }>,
    ) {
      const { videoId, time, playedSeconds, duration, userId } = action.payload;
      
      // Basic video progress info shared across users
      state.videoProgress[videoId] = {
        time,
        playedSeconds: playedSeconds || state.videoProgress[videoId]?.playedSeconds || 0,
        duration: duration || state.videoProgress[videoId]?.duration || 0,
      };
    },
    setAutoplayEnabled(state, action: PayloadAction<boolean>) {
      state.autoplayEnabled = action.payload
    },
    addBookmark(state, action: PayloadAction<BookmarkData & { userId?: string }>) {
      const { videoId, time, userId } = action.payload;
      
      if (!state.bookmarks[videoId]) {
        state.bookmarks[videoId] = [];
      }
      // Prevent duplicate bookmarks
      if (!state.bookmarks[videoId].includes(time)) {
        state.bookmarks[videoId].push(time);
        // Sort bookmarks by time
        state.bookmarks[videoId].sort((a, b) => a - b);
      }
    },
    removeBookmark(state, action: PayloadAction<BookmarkData & { userId?: string }>) {
      const { videoId, time } = action.payload;
      if (state.bookmarks[videoId]) {
        state.bookmarks[videoId] = state.bookmarks[videoId].filter(
          (bookmark) => Math.abs(bookmark - time) > 1, // Add a small tolerance
        );
      }
    },
    updateProgress(state, action: PayloadAction<CourseProgress>) {
      const { courseId, progress, completedChapters, currentChapterId, isCompleted, lastPlayedAt, resumePoint } =
        action.payload;
      
      // Legacy state update
      state.courseProgress[courseId] = {
        courseId,
        progress,
        completedChapters,
        currentChapterId,
        isCompleted,
        lastPlayedAt,
        resumePoint,
      };
      
      // If we have a current user in the session, also update user-specific state
    },
    setResumePoint(state, action: PayloadAction<{ courseId: number; resumePoint: number }>) {
      const { courseId, resumePoint } = action.payload
      if (state.courseProgress[courseId]) {
        state.courseProgress[courseId].resumePoint = resumePoint
      }
    },
    setLastPlayedAt(state, action: PayloadAction<{ courseId: number; lastPlayedAt: string }>) {
      const { courseId, lastPlayedAt } = action.payload
      if (state.courseProgress[courseId]) {
        state.courseProgress[courseId].lastPlayedAt = lastPlayedAt
      }
    },
    markChapterAsStarted(state, action: PayloadAction<{ courseId: number; chapterId: number }>) {
      const { courseId, chapterId } = action.payload
      if (state.courseProgress[courseId]) {
        state.courseProgress[courseId].currentChapterId = chapterId
      }
    },
    markChapterAsCompleted(state, action: PayloadAction<{ courseId: number; chapterId: number }>) {
      const { courseId, chapterId } = action.payload;
      
      if (state.courseProgress[courseId]) {
        const completedChapters = [...state.courseProgress[courseId].completedChapters];
        
        // Only add if not already included to prevent unnecessary updates
        if (!completedChapters.includes(chapterId)) {
          completedChapters.push(chapterId);
          state.courseProgress[courseId].completedChapters = completedChapters;
          
          // Also update user-specific progress if available
          if (state.userProgress) {
            Object.keys(state.userProgress).forEach(userId => {
              if (state.userProgress[userId][courseId]) {
                const userCompletedChapters = [...state.userProgress[userId][courseId].completedChapters];
                if (!userCompletedChapters.includes(chapterId)) {
                  userCompletedChapters.push(chapterId);
                  state.userProgress[userId][courseId].completedChapters = userCompletedChapters;
                }
              }
            });
          }
        }
      }
    },
    // Add new reducers for navigation with stable updates
    setNextVideoId(state, action: PayloadAction<string | undefined>) {
      // Only update if the value is defined and changed to prevent render loops
      if (action.payload !== undefined) {
        state.nextVideoId = action.payload;
      }
    },
    
    setPrevVideoId(state, action: PayloadAction<string | undefined>) {
      // Only update if the value is defined and changed to prevent render loops
      if (action.payload !== undefined) {
        state.prevVideoId = action.payload;
      }
    },
    
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    
    initializeCourseState(
      state,
      action: PayloadAction<{
        courseId: number
        courseSlug: string
        initialVideoId?: string
      }>,
    ) {
      const { courseId, courseSlug, initialVideoId } = action.payload
      state.currentCourseId = courseId
      state.currentCourseSlug = courseSlug

      if (initialVideoId) {
        state.currentVideoId = initialVideoId
      }

      // Initialize course progress if not exists
      if (!state.courseProgress[courseId]) {
        state.courseProgress[courseId] = {
          courseId,
          progress: 0,
          completedChapters: [],
          isCompleted: false,
        }
      }
    },
    setCourseCompletionStatus(state, action: PayloadAction<boolean>) {
      state.courseCompletionStatus = action.payload
    },
    setPlaybackSettings(state, action: PayloadAction<PlaybackSettings>) {
      state.playbackSettings = action.payload
    },
    resetCourseState(state) {
      state.currentVideoId = null
      state.currentCourseId = null
      state.currentCourseSlug = null
      state.courseCompletionStatus = false
    },
    cacheVideoData(state, action) {
      const { videoId, data } = action.payload
      if (!state.videoCache) {
        state.videoCache = {}
      }
      state.videoCache[videoId] = {
        ...data,
        cachedAt: new Date().toISOString(),
      }
    },
    setPerformanceSettings(state, action) {
      state.performanceSettings = {
        ...(state.performanceSettings || {}),
        ...action.payload,
      }
    },
    setUserPreferences(state, action) {
      state.userPreferences = {
        ...(state.userPreferences || {}),
        ...action.payload,
      }
    },
    trackAnalytics(state, action) {
      const { eventType, data } = action.payload
      if (!state.analytics) {
        state.analytics = {
          events: [],
        }
      }

      // Keep only the last 50 events to prevent state bloat
      state.analytics.events = [
        {
          eventType,
          data,
          timestamp: new Date().toISOString(),
        },
        ...state.analytics.events.slice(0, 49),
      ]
    },
    optimizeState(state) {
      // Remove old cached data
      if (state.videoCache) {
        const now = new Date()
        Object.keys(state.videoCache).forEach((key) => {
          const cachedAt = new Date(state.videoCache[key].cachedAt)
          // Remove cache items older than 1 hour
          if (now.getTime() - cachedAt.getTime() > 3600000) {
            delete state.videoCache[key]
          }
        })
      }

      // Limit analytics data
      if (state.analytics && state.analytics.events && state.analytics.events.length > 100) {
        state.analytics.events = state.analytics.events.slice(0, 100)
      }
    },
    // User-specific reducers
    updateUserProgress(
      state,
      action: PayloadAction<{
        userId: string,
        courseId: number | string,
        progress: CourseProgress
      }>
    ) {
      const { userId, courseId, progress } = action.payload;
      
      if (!state.userProgress[userId]) {
        state.userProgress[userId] = {};
      }
      
      state.userProgress[userId][courseId] = progress;
      
      // Also update the legacy field for backward compatibility
      if (typeof courseId === 'number') {
        state.courseProgress[courseId] = progress;
      }
    },
    
    setUserPlaybackSettings(
      state,
      action: PayloadAction<{
        userId: string,
        settings: PlaybackSettings
      }>
    ) {
      const { userId, settings } = action.payload;
      state.userPlaybackSettings[userId] = settings;
      
      // Also update the global settings for backwards compatibility
      state.playbackSettings = settings;
    },
    
    // Guest-specific reducers
    initializeGuestProgress(
      state,
      action: PayloadAction<{
        courseId: number | string,
        progress: CourseProgress
      }>
    ) {
      const { courseId, progress } = action.payload;
      state.guestProgress[courseId] = progress;
      
      // Also update the legacy field for backward compatibility
      if (typeof courseId === 'number') {
        state.courseProgress[courseId] = progress;
      }
    },
    
    setGuestPlaybackSettings(
      state,
      action: PayloadAction<PlaybackSettings>
    ) {
      state.guestPlaybackSettings = action.payload;
      
      // Also update the global settings for backwards compatibility
      state.playbackSettings = action.payload;
    },
  },
})

// Add the new actions to the exports
export const {
  setCurrentVideo,
  setVideoProgress,
  setAutoplayEnabled,
  addBookmark,
  removeBookmark,
  updateProgress,
  setResumePoint,
  setLastPlayedAt,
  markChapterAsStarted,
  markChapterAsCompleted,
  initializeCourseState,
  setCourseCompletionStatus,
  setPlaybackSettings,
  resetCourseState,
  cacheVideoData,
  setPerformanceSettings,
  setUserPreferences,
  trackAnalytics,
  optimizeState,
  // New exports:
  updateUserProgress,
  setUserPlaybackSettings,
  initializeGuestProgress,
  setGuestPlaybackSettings,
  setNextVideoId,
  setPrevVideoId,
  setLoading,
} = courseSlice.actions

// Fix the setCurrentVideoApi function to properly handle user-specific state
export const setCurrentVideoApi = (videoId: string, userId?: string) => (dispatch, getState) => {
  try {
    // Check if we're already on this video to prevent unnecessary updates
    const currentState = getState();
    if (currentState.course.currentVideoId === videoId) {
      return; // No need to update if it's the same video
    }

    console.debug("[courseSlice] Setting current video:", videoId);
    dispatch(courseSlice.actions.setCurrentVideo(videoId));

    // Persist to local storage for better recovery
    try {
      if (userId) {
        // For authenticated users, store in user-specific key
        localStorage.setItem(`currentVideoId_${userId}`, videoId);
      } else {
        // For guests
        localStorage.setItem("currentVideoId_guest", videoId);
      }
    } catch (storageError) {
      console.warn("[courseSlice] Error saving to local storage:", storageError);
    }

    // Track video change for analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "video_change", {
        video_id: videoId,
        course_id: currentState.course.currentCourseId,
        user_type: userId ? 'authenticated' : 'guest'
      });
    }
  } catch (error) {
    console.error("[courseSlice] Error setting current video:", error);
  }
};

export default courseSlice.reducer
