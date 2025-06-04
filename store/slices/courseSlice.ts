import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { FullCourseType, CourseProgress } from "@/app/types/types";

// Define the state interface
interface VideoProgress {
  time: number;
  playedSeconds: number;
  duration: number;
}

interface CourseProgress {
  courseId: number;
  progress: number;
  completedChapters: number[];
  currentChapterId?: number;
  isCompleted: boolean;
  lastPlayedAt?: string;
  resumePoint?: number;
}

interface BookmarkData {
  videoId: string;
  time: number;
}

interface PlaybackSettings {
  volume: number;
  muted: boolean;
  playbackSpeed: number;
}

interface CourseState {
  currentVideoId: string | null;
  videoProgress: Record<string, VideoProgress>;
  autoplayEnabled: boolean;
  bookmarks: Record<string, number[]>;
  courseProgress: Record<number, CourseProgress>;
  currentCourseId: number | null;
  currentCourseSlug: string | null;
  courseCompletionStatus: boolean;
  playbackSettings: PlaybackSettings;
}

// Initial state
const initialState: CourseState = {
  currentVideoId: null,
  videoProgress: {},
  autoplayEnabled: true,
  bookmarks: {},
  courseProgress: {},
  currentCourseId: null,
  currentCourseSlug: null,
  courseCompletionStatus: false,
  playbackSettings: {
    volume: 0.8,
    muted: false,
    playbackSpeed: 1.0,
  },
};

const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    setCurrentVideoApi(state, action: PayloadAction<string>) {
      state.currentVideoId = action.payload;
    },
    setVideoProgress(
      state,
      action: PayloadAction<{
        videoId: string;
        time: number;
        playedSeconds?: number;
        duration?: number;
      }>
    ) {
      const { videoId, time, playedSeconds, duration } = action.payload;
      state.videoProgress[videoId] = {
        time,
        playedSeconds: playedSeconds || (state.videoProgress[videoId]?.playedSeconds || 0),
        duration: duration || (state.videoProgress[videoId]?.duration || 0),
      };
    },
    setAutoplayEnabled(state, action: PayloadAction<boolean>) {
      state.autoplayEnabled = action.payload;
    },
    addBookmark(state, action: PayloadAction<BookmarkData>) {
      const { videoId, time } = action.payload;
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
    removeBookmark(state, action: PayloadAction<BookmarkData>) {
      const { videoId, time } = action.payload;
      if (state.bookmarks[videoId]) {
        state.bookmarks[videoId] = state.bookmarks[videoId].filter(
          (bookmark) => Math.abs(bookmark - time) > 1 // Add a small tolerance
        );
      }
    },
    updateProgress(state, action: PayloadAction<CourseProgress>) {
      const { courseId, progress, completedChapters, currentChapterId, isCompleted, lastPlayedAt, resumePoint } = action.payload;
      state.courseProgress[courseId] = {
        courseId,
        progress,
        completedChapters,
        currentChapterId,
        isCompleted,
        lastPlayedAt,
        resumePoint,
      };
    },
    setResumePoint(state, action: PayloadAction<{ courseId: number; resumePoint: number }>) {
      const { courseId, resumePoint } = action.payload;
      if (state.courseProgress[courseId]) {
        state.courseProgress[courseId].resumePoint = resumePoint;
      }
    },
    setLastPlayedAt(state, action: PayloadAction<{ courseId: number; lastPlayedAt: string }>) {
      const { courseId, lastPlayedAt } = action.payload;
      if (state.courseProgress[courseId]) {
        state.courseProgress[courseId].lastPlayedAt = lastPlayedAt;
      }
    },
    markChapterAsStarted(state, action: PayloadAction<{ courseId: number; chapterId: number }>) {
      const { courseId, chapterId } = action.payload;
      if (state.courseProgress[courseId]) {
        state.courseProgress[courseId].currentChapterId = chapterId;
      }
    },
    markChapterAsCompleted(state, action: PayloadAction<{ courseId: number; chapterId: number }>) {
      const { courseId, chapterId } = action.payload;
      if (state.courseProgress[courseId]) {
        const completedChapters = [...state.courseProgress[courseId].completedChapters];
        if (!completedChapters.includes(chapterId)) {
          completedChapters.push(chapterId);
          state.courseProgress[courseId].completedChapters = completedChapters;

          // Recalculate progress (would need total chapter count for accuracy)
          // This is simplified - actual calculation would need total chapter count
          // state.courseProgress[courseId].progress = (completedChapters.length / totalChapters) * 100;
        }
      }
    },
    initializeCourseState(
      state,
      action: PayloadAction<{
        courseId: number;
        courseSlug: string;
        initialVideoId?: string;
      }>
    ) {
      const { courseId, courseSlug, initialVideoId } = action.payload;
      state.currentCourseId = courseId;
      state.currentCourseSlug = courseSlug;

      if (initialVideoId) {
        state.currentVideoId = initialVideoId;
      }

      // Initialize course progress if not exists
      if (!state.courseProgress[courseId]) {
        state.courseProgress[courseId] = {
          courseId,
          progress: 0,
          completedChapters: [],
          isCompleted: false,
        };
      }
    },
    setCourseCompletionStatus(state, action: PayloadAction<boolean>) {
      state.courseCompletionStatus = action.payload;
    },
    setPlaybackSettings(state, action: PayloadAction<PlaybackSettings>) {
      state.playbackSettings = action.payload;
    },
    resetCourseState(state) {
      state.currentVideoId = null;
      state.currentCourseId = null;
      state.currentCourseSlug = null;
      state.courseCompletionStatus = false;
    },
  },
});

export const {
  setCurrentVideoApi,
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
} = courseSlice.actions;

export default courseSlice.reducer;
