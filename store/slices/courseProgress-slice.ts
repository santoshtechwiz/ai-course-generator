import { createSlice, type PayloadAction, createSelector, createAsyncThunk } from "@reduxjs/toolkit"
import debounce from "lodash.debounce"
import axios from "axios"
import type { RootState } from "@/store"

export interface PerCourseProgress {
  lastLectureId: string | null
  lastTimestamp: number
  completedLectures: string[]
  isCourseCompleted: boolean
  certificateDownloaded?: boolean
  lastUpdatedAt?: number
}

// Type for course progress state
export type CourseProgressState = Record<string, PerCourseProgress>

// Type for the entire course progress slice
export interface CourseProgressSliceState {
  byCourseId: CourseProgressState
}

export interface CourseProgressRootState {
  byCourseId: Record<string, PerCourseProgress>
}

const initialState: CourseProgressSliceState = {
  byCourseId: {},
}

// Debounced API call for persisting progress
const debouncedPersistProgress = debounce(async (courseId: string, progress: PerCourseProgress) => {
  try {
    await axios.post(`/api/progress/${courseId}`, progress)
  } catch (err) {
    // Optionally handle error (e.g., show toast)
  }
}, 1000)

export const persistCourseProgress = createAsyncThunk(
  "courseProgress/persistCourseProgress",
  async (
    { courseId, progress }: { courseId: string | number; progress: PerCourseProgress },
    { rejectWithValue }
  ) => {
    try {
      await debouncedPersistProgress(String(courseId), progress)
      return { courseId, progress }
    } catch (err) {
      return rejectWithValue(err)
    }
  }
)

const courseProgressSlice = createSlice({
  name: "courseProgress",
  initialState,
  reducers: {
    setLastPosition(
      state,
      action: PayloadAction<{ courseId: string | number; lectureId: string; timestamp: number }>,
    ) {
      const courseKey = String(action.payload.courseId)
      const existing = state.byCourseId[courseKey]
      const now = Date.now()
      const prevTs = existing?.lastTimestamp ?? 0

      // Only update if jumped chapters, progressed forward, or at least 10s have passed
      if (!existing || action.payload.lectureId !== existing.lastLectureId || action.payload.timestamp - prevTs >= 10) {
        const updated = {
          lastLectureId: action.payload.lectureId,
          lastTimestamp: Math.max(0, Math.floor(action.payload.timestamp)),
          completedLectures: existing?.completedLectures ?? [],
          isCourseCompleted: existing?.isCourseCompleted ?? false,
          certificateDownloaded: existing?.certificateDownloaded ?? false,
          lastUpdatedAt: now,
        }
        state.byCourseId[courseKey] = updated
        // Dispatch debounced API persist
        debouncedPersistProgress(courseKey, updated)
      }
    },
    markLectureCompleted(
      state,
      action: PayloadAction<{ courseId: string | number; lectureId: string }>,
    ) {
      const courseKey = String(action.payload.courseId)
      const existing = state.byCourseId[courseKey] || {
        lastLectureId: action.payload.lectureId,
        lastTimestamp: 0,
        completedLectures: [],
        isCourseCompleted: false,
        certificateDownloaded: false,
      }
      if (!existing.completedLectures.includes(action.payload.lectureId)) {
        existing.completedLectures = [...existing.completedLectures, action.payload.lectureId]
      }
      existing.lastLectureId = existing.lastLectureId || action.payload.lectureId
  const updated = { ...existing, lastUpdatedAt: Date.now() }
  state.byCourseId[courseKey] = updated
  debouncedPersistProgress(courseKey, updated)
    },
    setIsCourseCompleted(
      state,
      action: PayloadAction<{ courseId: string | number; isCourseCompleted: boolean }>,
    ) {
      const courseKey = String(action.payload.courseId)
      const existing = state.byCourseId[courseKey] || {
        lastLectureId: null,
        lastTimestamp: 0,
        completedLectures: [],
        isCourseCompleted: false,
        certificateDownloaded: false,
      }
      existing.isCourseCompleted = action.payload.isCourseCompleted
      // Reset certificate downloaded flag when course completion status changes
      if (!action.payload.isCourseCompleted) {
        existing.certificateDownloaded = false
      }
  const updated = { ...existing, lastUpdatedAt: Date.now() }
  state.byCourseId[courseKey] = updated
  debouncedPersistProgress(courseKey, updated)
    },
    setCertificateDownloaded(
      state,
      action: PayloadAction<{ courseId: string | number; downloaded: boolean }>,
    ) {
      const courseKey = String(action.payload.courseId)
      const existing = state.byCourseId[courseKey] || {
        lastLectureId: null,
        lastTimestamp: 0,
        completedLectures: [],
        isCourseCompleted: false,
        certificateDownloaded: false,
      }
      existing.certificateDownloaded = action.payload.downloaded
  const updated = { ...existing, lastUpdatedAt: Date.now() }
  state.byCourseId[courseKey] = updated
  debouncedPersistProgress(courseKey, updated)
    },
    resetCourseProgress(state, action: PayloadAction<{ courseId: string | number }>) {
      const courseKey = String(action.payload.courseId)
  delete state.byCourseId[courseKey]
  // Optionally persist reset to API
    },
    resetAll(state) {
      state.byCourseId = {}
      // Optionally persist reset to API
    },
  },
  extraReducers: (builder) => {
    builder.addCase(persistCourseProgress.fulfilled, (state: CourseProgressSliceState, action: PayloadAction<any>) => {
      // No-op: state already updated by reducers
    })
    builder.addCase(persistCourseProgress.rejected, (state: CourseProgressSliceState, action: PayloadAction<any>) => {
      // Optionally handle error state
    })
  },
})

export const {
  setLastPosition,
  markLectureCompleted,
  setIsCourseCompleted,
  setCertificateDownloaded,
  resetCourseProgress,
  resetAll,
} = courseProgressSlice.actions

export default courseProgressSlice.reducer

// Memoized selectors
export const selectCourseProgressState = (state: RootState) => state.courseProgress

export const makeSelectCourseProgressById = () =>
  createSelector(
    [selectCourseProgressState, (_: RootState, courseId: string | number) => String(courseId)],
    (slice, id) => slice.byCourseId[id] || null,
  )

export const selectCourseProgressById = (state: RootState, courseId: string | number) =>
  selectCourseProgressState(state).byCourseId[String(courseId)] || null

// Additional selectors for better type safety
export const selectAllCourseProgress = (state: RootState) => state.courseProgress.byCourseId

export const selectIncompleteCourses = createSelector(
  [selectAllCourseProgress],
  (courseProgress) => {
    return Object.entries(courseProgress).filter(([_, progress]) => !progress.isCourseCompleted)
  }
)

export const selectCompletedCourses = createSelector(
  [selectAllCourseProgress],
  (courseProgress) => {
    return Object.entries(courseProgress).filter(([_, progress]) => progress.isCourseCompleted)
  }
)

export const selectCourseProgressByCourseId = (courseId: string | number) =>
  createSelector(
    [selectCourseProgressState],
    (slice) => slice.byCourseId[String(courseId)] || null
  )

// Utility functions for type-safe course progress operations
export const getCourseProgress = (state: RootState, courseId: string | number): PerCourseProgress | null => {
  return state.courseProgress.byCourseId[String(courseId)] || null
}

export const hasCourseProgress = (state: RootState, courseId: string | number): boolean => {
  return !!state.courseProgress.byCourseId[String(courseId)]
}

export const isCourseCompleted = (state: RootState, courseId: string | number): boolean => {
  const progress = state.courseProgress.byCourseId[String(courseId)]
  return progress?.isCourseCompleted || false
}

export const getCompletedLectures = (state: RootState, courseId: string | number): string[] => {
  const progress = state.courseProgress.byCourseId[String(courseId)]
  return progress?.completedLectures || []
}