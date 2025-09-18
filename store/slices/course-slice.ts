import { createSlice, type PayloadAction, createAsyncThunk } from "@reduxjs/toolkit"
import { courseApiClient } from '@/app/dashboard/course/services/course-api-client';
import { migratedStorage } from '@/lib/storage';

// --- Improved TypeScript interfaces ---
export interface VideoProgress {
  time: number
  playedSeconds: number
  duration: number
  lastUpdated?: number // Add timestamp for cache invalidation
}

export interface CourseProgress {
  courseId: number | string
  progress: number
  completedChapters: number[]
  currentChapterId?: number
  isCompleted: boolean
  lastPlayedAt?: string
  resumePoint?: number
  lastUpdated?: number // Add timestamp for cache invalidation
  learningStreak?: number
  studyTimeThisWeek?: number
  averageQuizScore?: number
  lastActivityDate?: string
  userId?: string // Add userId for proper state management
}

export interface BookmarkItem {
  id: string
  videoId: string
  time: number
  title: string
  description: string
  createdAt: string
}

export interface BookmarkData {
  id: string
  videoId: string
  time: number
  title?: string
  description?: string
  createdAt: string
}

export interface PlaybackSettings {
  volume: number
  muted: boolean
  playbackSpeed: number
  autoQuality?: boolean
  preload?: string
}

export interface CourseState {
  currentVideoId: string | null
  videoProgress: Record<string, VideoProgress>
  autoplayEnabled: boolean
  bookmarks: Record<string, BookmarkItem[]>
  userProgress: Record<string, Record<number | string, CourseProgress>> // Per-user progress
  guestProgress: Record<number | string, CourseProgress> // Guest-only progress
  currentCourseId: number | null
  currentCourseSlug: string | null
  courseCompletionStatus: boolean
  playbackSettings: PlaybackSettings
  userPlaybackSettings: Record<string, PlaybackSettings> // Per-user settings
  guestPlaybackSettings: PlaybackSettings // Guest settings
  nextVideoId: string | null
  prevVideoId: string | null
  isLoading: boolean
  certificateStatus?: { generated: boolean }
  videoCache?: Record<string, { cachedAt: string; [key: string]: any }>
  performanceSettings?: Record<string, any>
  userPreferences?: Record<string, any>
  analytics?: {
    events: any[]
  }
}

// Initial state with strong typing
const initialState: CourseState = {
  currentVideoId: null,
  videoProgress: {},
  autoplayEnabled: true,
  bookmarks: {},
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
  certificateStatus: { generated: false }
}

// --- Optimized slice with improved type safety ---
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
        videoId: string;
        time: number;
        playedSeconds?: number;
        duration?: number;
        userId?: string;
      }>
    ) {
      const { videoId, time, playedSeconds, duration } = action.payload;

      if (!videoId) return;

      state.videoProgress[videoId] = {
        time,
        playedSeconds: playedSeconds ?? state.videoProgress[videoId]?.playedSeconds ?? 0,
        duration: duration ?? state.videoProgress[videoId]?.duration ?? 0,
        lastUpdated: Date.now(),
      };
    },

    setAutoplayEnabled(state, action: PayloadAction<boolean>) {
      state.autoplayEnabled = action.payload;
    },

    addBookmark(state, action: PayloadAction<BookmarkData>) {
      const { videoId, time, title, description, id, createdAt } = action.payload;
      
      if (!videoId || time === undefined || !id) return; // Validate required fields
      
      // Initialize bookmarks array for this video if needed
      if (!state.bookmarks[videoId]) {
        state.bookmarks[videoId] = [];
      }
      
      // Prevent duplicates within 0.75s tolerance
      const DUP_TOLERANCE = 0.75;
      if (state.bookmarks[videoId].some(b => Math.abs(b.time - time) < DUP_TOLERANCE)) {
        return;
      }
      
      // Add new bookmark with properly typed fields
      state.bookmarks[videoId].push({
        id: action.payload.id,
        videoId,
        time,
        title: title || `Bookmark at ${Math.floor(time)}s`,
        description: description || '',
        createdAt: new Date().toISOString(),
      });
    },

    removeBookmark(state, action: PayloadAction<{ bookmarkId?: string; videoId?: string; time?: number }>) {
      const { bookmarkId, videoId, time } = action.payload;
      
      // Handle removal by ID (preferred)
      if (bookmarkId && videoId && state.bookmarks[videoId]) {
        state.bookmarks[videoId] = state.bookmarks[videoId].filter(bookmark => 
          bookmark.id !== bookmarkId
        );
        return;
      }
      
      // Fallback: handle removal by approximate time
      if (videoId && time !== undefined && state.bookmarks[videoId]) {
        const TOLERANCE = 1; // 1 second tolerance
        state.bookmarks[videoId] = state.bookmarks[videoId].filter(bookmark => 
          Math.abs(bookmark.time - time) > TOLERANCE
        );
      }
    },
    updateProgress(state, action: PayloadAction<CourseProgress>) {
      const { courseId, progress, completedChapters, currentChapterId, isCompleted, lastPlayedAt, resumePoint } =
        action.payload;
      
      // Update user-specific progress if userId is provided, otherwise update guest progress
      const userId = action.payload.userId || 'guest';
      
      if (!state.userProgress[userId]) {
        state.userProgress[userId] = {};
      }
      
      state.userProgress[userId][courseId] = {
        courseId,
        progress,
        completedChapters,
        currentChapterId,
        isCompleted,
        lastPlayedAt,
        resumePoint,
      };
    },
    setResumePoint(state, action: PayloadAction<{ courseId: number; resumePoint: number; userId?: string }>) {
      const { courseId, resumePoint, userId = 'guest' } = action.payload
      
      if (!state.userProgress[userId]) {
        state.userProgress[userId] = {};
      }
      
      if (state.userProgress[userId][courseId]) {
        state.userProgress[userId][courseId].resumePoint = resumePoint
      }
    },
    setLastPlayedAt(state, action: PayloadAction<{ courseId: number; lastPlayedAt: string; userId?: string }>) {
      const { courseId, lastPlayedAt, userId = 'guest' } = action.payload
      
      if (!state.userProgress[userId]) {
        state.userProgress[userId] = {};
      }
      
      if (state.userProgress[userId][courseId]) {
        state.userProgress[userId][courseId].lastPlayedAt = lastPlayedAt
      }
    },
    markChapterAsStarted(state, action: PayloadAction<{ courseId: number; chapterId: number; userId?: string }>) {
      const { courseId, chapterId, userId = 'guest' } = action.payload
      
      if (!state.userProgress[userId]) {
        state.userProgress[userId] = {};
      }
      
      if (state.userProgress[userId][courseId]) {
        state.userProgress[userId][courseId].currentChapterId = chapterId
      }
    },
    markChapterAsCompleted(state, action: PayloadAction<{ courseId: number; chapterId: number; userId?: string }>) {
      const { courseId, chapterId, userId = 'guest' } = action.payload;
      
      // Initialize user progress if it doesn't exist
      if (!state.userProgress[userId]) {
        state.userProgress[userId] = {};
      }
      
      // Initialize course progress if it doesn't exist
      if (!state.userProgress[userId][courseId]) {
        state.userProgress[userId][courseId] = {
          courseId,
          progress: 0,
          completedChapters: [],
          isCompleted: false,
          currentChapterId: undefined,
          lastUpdated: Date.now(),
          lastActivityDate: new Date().toISOString()
        };
      }
      
      const courseProgress = state.userProgress[userId][courseId];
      const completedChapters = [...courseProgress.completedChapters];
      
      // Only add if not already included to prevent unnecessary updates
      if (!completedChapters.includes(chapterId)) {
        completedChapters.push(chapterId);
        state.userProgress[userId][courseId] = {
          ...courseProgress,
          completedChapters,
          lastUpdated: Date.now(),
          lastActivityDate: new Date().toISOString(),
          progress: completedChapters.length // We'll calculate percentage later
        };
        
        console.log(`[CourseSlice] Chapter ${chapterId} marked as completed for course ${courseId}. New state:`, {
          userId,
          courseId,
          completedChapters: state.userProgress[userId][courseId].completedChapters,
        });
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
        userId?: string
      }>,
    ) {
      const { courseId, courseSlug, initialVideoId, userId = 'guest' } = action.payload
      state.currentCourseId = courseId
      state.currentCourseSlug = courseSlug

      if (initialVideoId) {
        state.currentVideoId = initialVideoId
      }

      // Initialize course progress if not exists
      if (!state.userProgress[userId]) {
        state.userProgress[userId] = {};
      }
      
      if (!state.userProgress[userId][courseId]) {
        state.userProgress[userId][courseId] = {
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
        userId: string;
        courseId: number | string;
        progress: CourseProgress;
      }>
    ) {
      const { userId, courseId, progress } = action.payload;

      if (!state.userProgress[userId]) {
        state.userProgress[userId] = {};
      }

      state.userProgress[userId][courseId] = progress;

      if (typeof courseId === "number") {
        if (!state.userProgress['guest']) {
          state.userProgress['guest'] = {};
        }
        state.userProgress['guest'][courseId] = {
          ...progress,
          courseId,
          lastUpdated: Date.now()
        };
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
    },
    
    setGuestPlaybackSettings(
      state,
      action: PayloadAction<PlaybackSettings>
    ) {
      state.guestPlaybackSettings = action.payload;
      
      // Also update the global settings for backwards compatibility
      state.playbackSettings = action.payload;
    },
    // Add a reset state action
    resetState: () => {
      return initialState
    }
  },
})

// --- Optimized action creator with proper error handling ---
export const setCurrentVideoApi = (videoId: string, userId?: string) => 
  (dispatch: any, getState: any) => {
  try {
    // Check if we're already on this video to prevent unnecessary updates
    const currentState = getState();
    if (currentState.course.currentVideoId === videoId) {
      return; // No need to update if it's the same video
    }

    // Dispatch the action to update current video
    dispatch(courseSlice.actions.setCurrentVideo(videoId));

    // Persist to storage for recovery
    try {
      const storageKey = userId ? `currentVideoId_${userId}` : "currentVideoId_guest";
      migratedStorage.setItem(storageKey, videoId, { temporary: true });
    } catch (storageError) {
      // Silent fail for storage errors
    }

    // Track analytics if available
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

// Update fetchCourseDetails thunk to use courseApiClient
export const fetchCourseDetails = createAsyncThunk(
  "course/fetchDetails",
  async (slug: string, { rejectWithValue }) => {
    try {
      // Use API client instead of direct fetch
      return await courseApiClient.getCourse(slug);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch course details");
    }
  }
);

// Export actions
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
  resetState,
} = courseSlice.actions

export default courseSlice.reducer
