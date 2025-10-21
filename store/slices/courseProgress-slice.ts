import { createSlice, type PayloadAction, createSelector, createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { 
  getErrorMessage
} from '../utils/async-state'

interface VideoProgress {
  currentChapterId: string | null // Changed to string to ensure consistent ID handling
  currentUnitId: string | null // Changed to string for consistency
  progress: number // 0-100 percentage
  timeSpent: number // in minutes
  playedSeconds: number // current position in seconds
  isCompleted: boolean
  lastAccessedAt: string
  completedChapters: string[] // Changed to string[] for consistent ID handling
  bookmarks: string[]
}

interface CourseProgressData {
  courseId: string
  userId: string
  videoProgress: VideoProgress
  lastUpdatedAt: number
}

// Type for course progress state
type CourseProgressState = Record<string, CourseProgressData>

// Type for the entire course progress slice
interface CourseProgressSliceState {
  byCourseId: CourseProgressState
  isLoading: boolean
  error: string | null
}

const initialState: CourseProgressSliceState = {
  byCourseId: {},
  isLoading: false,
  error: null,
}

// Async thunk for persisting progress to API
const persistVideoProgress = createAsyncThunk(
  "courseProgress/persistVideoProgress",
  async (
    {
      courseId,
      chapterId,
      progress,
      playedSeconds,
      completed,
      userId
    }: {
      courseId: string | number
      chapterId: string | number
      progress: number
      playedSeconds: number
      completed: boolean
      userId: string
    },
    { rejectWithValue }
  ) => {
    try {
      // Direct API call for progress persistence
      const response = await fetch(`/api/progress/${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentChapterId: String(chapterId),
          progress: Math.max(0, Math.min(100, progress)),
          playedSeconds: Math.max(0, playedSeconds),
          isCompleted: completed
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to save progress: ${response.statusText}`)
      }

      const result = await response.json()

      // Return success data with consistently typed IDs
      return {
        courseId: String(courseId),
        chapterId: String(chapterId),
        progress: Math.max(0, Math.min(100, progress)),
        playedSeconds: Math.max(0, playedSeconds),
        isCompleted: completed,
        completedChapters: (result.progress?.completedChapters || []).map(String), // Ensure consistent string IDs
        timestamp: Date.now()
      }
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  }
)

const courseProgressSlice = createSlice({
  name: "courseProgress",
  initialState,
  reducers: {
    setVideoProgress(
      state,
      action: PayloadAction<{
        courseId: string | number
        chapterId: number
        progress: number
        playedSeconds: number
        timeSpent?: number
        completed?: boolean
        userId: string
      }>
    ) {
      const courseKey = String(action.payload.courseId)
      const now = Date.now()
      
      const existing = state.byCourseId[courseKey]
      const currentProgress = existing?.videoProgress || {
        currentChapterId: null,
        currentUnitId: null,
        progress: 0,
        timeSpent: 0,
        playedSeconds: 0,
        isCompleted: false,
        lastAccessedAt: new Date().toISOString(),
        completedChapters: [],
        bookmarks: [],
      }

      // Update video progress
      const updatedProgress: VideoProgress = {
        ...currentProgress,
        currentChapterId: String(action.payload.chapterId), // Convert to string for consistency
        progress: Math.max(0, Math.min(100, action.payload.progress)),
        playedSeconds: Math.max(0, action.payload.playedSeconds),
        timeSpent: (action.payload.timeSpent || currentProgress.timeSpent) + Math.floor(action.payload.playedSeconds / 60),
        isCompleted: action.payload.completed || action.payload.progress >= 90,
        lastAccessedAt: new Date().toISOString(),
        completedChapters: action.payload.completed && !currentProgress.completedChapters.includes(String(action.payload.chapterId))
          ? [...currentProgress.completedChapters, String(action.payload.chapterId)] // Convert to string
          : currentProgress.completedChapters,
      }

      state.byCourseId[courseKey] = {
        courseId: courseKey,
        userId: action.payload.userId,
        videoProgress: {
          ...updatedProgress,
          currentChapterId: updatedProgress.currentChapterId ? String(updatedProgress.currentChapterId) : null,
          completedChapters: updatedProgress.completedChapters.map(String) // Ensure IDs are strings
        },
        lastUpdatedAt: now,
      }
    },

    markChapterCompleted(
      state,
      action: PayloadAction<{ courseId: string | number; chapterId: string | number; userId: string }>
    ) {
      const courseKey = String(action.payload.courseId)
      const existing = state.byCourseId[courseKey]
      
      if (existing) {
        const completedChapters = existing.videoProgress.completedChapters
        const chapterId = String(action.payload.chapterId)

        // Only add if not already completed
        if (!completedChapters.includes(chapterId)) {
          // Ensure all IDs in completedChapters are strings for consistency
          const updatedCompletedChapters = [
            ...completedChapters.map(String),
            chapterId
          ]

          existing.videoProgress = {
            ...existing.videoProgress,
            completedChapters: updatedCompletedChapters,
            isCompleted: true,
            lastAccessedAt: new Date().toISOString(),
          }
          existing.lastUpdatedAt = Date.now()

          // Also update the chapter ID format for consistency
          if (existing.videoProgress.currentChapterId) {
            existing.videoProgress.currentChapterId = String(existing.videoProgress.currentChapterId)
          }
        }
      }
    },

    addBookmark(
      state,
      action: PayloadAction<{ courseId: string | number; bookmark: string; userId: string }>
    ) {
      const courseKey = String(action.payload.courseId)
      const existing = state.byCourseId[courseKey]
      
      if (existing) {
        existing.videoProgress.bookmarks = [...existing.videoProgress.bookmarks, action.payload.bookmark]
        existing.lastUpdatedAt = Date.now()
      }
    },

    removeBookmark(
      state,
      action: PayloadAction<{ courseId: string | number; bookmark: string; userId: string }>
    ) {
      const courseKey = String(action.payload.courseId)
      const existing = state.byCourseId[courseKey]
      
      if (existing) {
        existing.videoProgress.bookmarks = existing.videoProgress.bookmarks.filter(b => b !== action.payload.bookmark)
        existing.lastUpdatedAt = Date.now()
      }
    },

    resetCourseProgress(
      state, 
      action: PayloadAction<{ courseId: string | number }>
    ) {
      const courseKey = String(action.payload.courseId)
      delete state.byCourseId[courseKey]
    },

    resetAll(state) {
      state.byCourseId = {}
      state.error = null
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(persistVideoProgress.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(persistVideoProgress.fulfilled, (state) => {
        state.isLoading = false
        state.error = null
      })
      .addCase(persistVideoProgress.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const {
  setVideoProgress,
  markChapterCompleted,
  
  
  
  
  
  
} = courseProgressSlice.actions

export default courseProgressSlice.reducer

// Memoized selectors
const selectCourseProgressState = (state: RootState) => state.courseProgress

export const selectCourseProgressById = (state: RootState, courseId: string | number) =>
  selectCourseProgressState(state).byCourseId[String(courseId)] || null

// Additional selectors for better type safety
const selectAllCourseProgress = (state: RootState) => state.courseProgress.byCourseId

const selectIncompleteCourses = createSelector(
  [selectAllCourseProgress],
  (courseProgress) => {
    return Object.entries(courseProgress).filter(([_, progress]) => !progress.videoProgress.isCompleted)
  }
)

const selectCompletedCourses = createSelector(
  [selectAllCourseProgress],
  (courseProgress) => {
    return Object.entries(courseProgress).filter(([_, progress]) => progress.videoProgress.isCompleted)
  }
)

const selectCourseProgressByCourseId = (courseId: string | number) =>
  createSelector(
    [selectCourseProgressState],
    (slice) => slice.byCourseId[String(courseId)] || null
  )

// Utility functions for type-safe course progress operations
const getCourseProgress = (state: RootState, courseId: string | number): CourseProgressData | null => {
  return state.courseProgress.byCourseId[String(courseId)] || null
}

const hasCourseProgress = (state: RootState, courseId: string | number): boolean => {
  return !!state.courseProgress.byCourseId[String(courseId)]
}

const isCourseCompleted = (state: RootState, courseId: string | number): boolean => {
  const progress = state.courseProgress.byCourseId[String(courseId)]
  return progress?.videoProgress.isCompleted || false
}

const getCompletedChapters = (state: RootState, courseId: string | number): string[] => {
  const progress = state.courseProgress.byCourseId[String(courseId)]
  return progress?.videoProgress.completedChapters || []
}

const getCurrentChapterId = (state: RootState, courseId: string | number): string | null => {
  const progress = state.courseProgress.byCourseId[String(courseId)]
  return progress?.videoProgress.currentChapterId || null
}

const getPlayedSeconds = (state: RootState, courseId: string | number): number => {
  const progress = state.courseProgress.byCourseId[String(courseId)]
  return progress?.videoProgress.playedSeconds || 0
}

const getVideoProgress = (state: RootState, courseId: string | number): number => {
  const progress = state.courseProgress.byCourseId[String(courseId)]
  return progress?.videoProgress.progress || 0
}