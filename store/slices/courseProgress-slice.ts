import { createSlice, type PayloadAction, createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"

export interface PerCourseProgress {
  lastLectureId: string | null
  lastTimestamp: number
  completedLectures: string[]
  isCourseCompleted: boolean
  certificateDownloaded?: boolean
  lastUpdatedAt?: number
}

export interface CourseProgressRootState {
  byCourseId: Record<string, PerCourseProgress>
}

const initialState: CourseProgressRootState = {
  byCourseId: {},
}

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
        state.byCourseId[courseKey] = {
          lastLectureId: action.payload.lectureId,
          lastTimestamp: Math.max(0, Math.floor(action.payload.timestamp)),
          completedLectures: existing?.completedLectures ?? [],
          isCourseCompleted: existing?.isCourseCompleted ?? false,
          certificateDownloaded: existing?.certificateDownloaded ?? false,
          lastUpdatedAt: now,
        }
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
      state.byCourseId[courseKey] = { ...existing, lastUpdatedAt: Date.now() }
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
      state.byCourseId[courseKey] = { ...existing, lastUpdatedAt: Date.now() }
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
      state.byCourseId[courseKey] = { ...existing, lastUpdatedAt: Date.now() }
    },
    resetCourseProgress(state, action: PayloadAction<{ courseId: string | number }>) {
      const courseKey = String(action.payload.courseId)
      delete state.byCourseId[courseKey]
    },
    resetAll(state) {
      state.byCourseId = {}
    },
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