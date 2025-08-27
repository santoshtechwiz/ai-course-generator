import { createSlice, type PayloadAction, createSelector, createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { 
  RequestManager,
  getErrorMessage
} from '../utils/async-state'

export interface VideoProgress {
  currentChapterId: number | null
  currentUnitId: number | null
  progress: number // 0-100 percentage
  timeSpent: number // in minutes
  playedSeconds: number // current position in seconds
  isCompleted: boolean
  lastAccessedAt: string
  completedChapters: number[]
  bookmarks: string[]
}

export interface CourseProgressData {
  courseId: string
  userId: string
  videoProgress: VideoProgress
  lastUpdatedAt: number
}

// Type for course progress state
export type CourseProgressState = Record<string, CourseProgressData>

// Type for the entire course progress slice
export interface CourseProgressSliceState {
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
export const persistVideoProgress = createAsyncThunk(
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
    { rejectWithValue, signal }
  ) => {
    const requestKey = `progress-${courseId}-${chapterId}`
    
    try {
      // Check if request was already cancelled
      if (signal?.aborted) {
        return rejectWithValue('Request was cancelled')
      }

      // Set up abort controller for this specific request
      const abortController = RequestManager.create(requestKey)
      
      // Combine signals
      if (signal?.aborted) {
        RequestManager.cancel(requestKey)
        return rejectWithValue('Request was cancelled')
      }
      
      signal?.addEventListener('abort', () => {
        RequestManager.cancel(requestKey)
      })

      const response = await fetch(`/api/progress/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentChapterId: Number(chapterId),
          progress: Math.max(0, Math.min(100, progress)),
          playedSeconds: Math.max(0, playedSeconds),
          isCompleted: completed,
          completedChapters: completed ? [Number(chapterId)] : [],
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        RequestManager.cancel(requestKey)
        throw new Error(`Failed to save progress: ${response.statusText}`)
      }

      const result = await response.json()
      RequestManager.cancel(requestKey)
      return result
    } catch (err) {
      RequestManager.cancel(requestKey)
      
      // Handle abort errors gracefully
      if (err instanceof Error && err.name === 'AbortError') {
        return rejectWithValue('Request was cancelled')
      }
      
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
        currentChapterId: action.payload.chapterId,
        progress: Math.max(0, Math.min(100, action.payload.progress)),
        playedSeconds: Math.max(0, action.payload.playedSeconds),
        timeSpent: (action.payload.timeSpent || currentProgress.timeSpent) + Math.floor(action.payload.playedSeconds / 60),
        isCompleted: action.payload.completed || action.payload.progress >= 90,
        lastAccessedAt: new Date().toISOString(),
        completedChapters: action.payload.completed && !currentProgress.completedChapters.includes(action.payload.chapterId)
          ? [...currentProgress.completedChapters, action.payload.chapterId]
          : currentProgress.completedChapters,
      }

      state.byCourseId[courseKey] = {
        courseId: courseKey,
        userId: action.payload.userId,
        videoProgress: updatedProgress,
        lastUpdatedAt: now,
      }
    },

    markChapterCompleted(
      state,
      action: PayloadAction<{ courseId: string | number; chapterId: number; userId: string }>
    ) {
      const courseKey = String(action.payload.courseId)
      const existing = state.byCourseId[courseKey]
      
      if (existing) {
        const completedChapters = existing.videoProgress.completedChapters
        if (!completedChapters.includes(action.payload.chapterId)) {
          existing.videoProgress.completedChapters = [...completedChapters, action.payload.chapterId]
          existing.videoProgress.isCompleted = true
          existing.videoProgress.lastAccessedAt = new Date().toISOString()
          existing.lastUpdatedAt = Date.now()
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
  addBookmark,
  removeBookmark,
  resetCourseProgress,
  resetAll,
  setLoading,
  setError,
} = courseProgressSlice.actions

export default courseProgressSlice.reducer

// Memoized selectors
export const selectCourseProgressState = (state: RootState) => state.courseProgress

export const selectCourseProgressById = (state: RootState, courseId: string | number) =>
  selectCourseProgressState(state).byCourseId[String(courseId)] || null

// Additional selectors for better type safety
export const selectAllCourseProgress = (state: RootState) => state.courseProgress.byCourseId

export const selectIncompleteCourses = createSelector(
  [selectAllCourseProgress],
  (courseProgress) => {
    return Object.entries(courseProgress).filter(([_, progress]) => !progress.videoProgress.isCompleted)
  }
)

export const selectCompletedCourses = createSelector(
  [selectAllCourseProgress],
  (courseProgress) => {
    return Object.entries(courseProgress).filter(([_, progress]) => progress.videoProgress.isCompleted)
  }
)

export const selectCourseProgressByCourseId = (courseId: string | number) =>
  createSelector(
    [selectCourseProgressState],
    (slice) => slice.byCourseId[String(courseId)] || null
  )

// Utility functions for type-safe course progress operations
export const getCourseProgress = (state: RootState, courseId: string | number): CourseProgressData | null => {
  return state.courseProgress.byCourseId[String(courseId)] || null
}

export const hasCourseProgress = (state: RootState, courseId: string | number): boolean => {
  return !!state.courseProgress.byCourseId[String(courseId)]
}

export const isCourseCompleted = (state: RootState, courseId: string | number): boolean => {
  const progress = state.courseProgress.byCourseId[String(courseId)]
  return progress?.videoProgress.isCompleted || false
}

export const getCompletedChapters = (state: RootState, courseId: string | number): number[] => {
  const progress = state.courseProgress.byCourseId[String(courseId)]
  return progress?.videoProgress.completedChapters || []
}

export const getCurrentChapterId = (state: RootState, courseId: string | number): number | null => {
  const progress = state.courseProgress.byCourseId[String(courseId)]
  return progress?.videoProgress.currentChapterId || null
}

export const getPlayedSeconds = (state: RootState, courseId: string | number): number => {
  const progress = state.courseProgress.byCourseId[String(courseId)]
  return progress?.videoProgress.playedSeconds || 0
}

export const getVideoProgress = (state: RootState, courseId: string | number): number => {
  const progress = state.courseProgress.byCourseId[String(courseId)]
  return progress?.videoProgress.progress || 0
}