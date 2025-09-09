import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { storageManager } from '@/utils/storage-manager'
import { EventReplayer } from '@/utils/progress-events'

// Event Types
export enum ProgressEventType {
  COURSE_STARTED = 'COURSE_STARTED',
  COURSE_PROGRESS_UPDATED = 'COURSE_PROGRESS_UPDATED',
  QUIZ_STARTED = 'QUIZ_STARTED',
  QUESTION_ANSWERED = 'QUESTION_ANSWERED',
  QUIZ_COMPLETED = 'QUIZ_COMPLETED',
  COURSE_COMPLETED = 'COURSE_COMPLETED',
  VIDEO_WATCHED = 'VIDEO_WATCHED',
  CHAPTER_COMPLETED = 'CHAPTER_COMPLETED'
}

// Event Interfaces
export interface BaseProgressEvent {
  id: string
  userId: string
  timestamp: number
  type: ProgressEventType
  entityId: string // courseId, quizId, etc.
  entityType: 'course' | 'quiz' | 'chapter' | 'question'
  metadata?: Record<string, any>
}

export interface CourseStartedEvent extends BaseProgressEvent {
  type: ProgressEventType.COURSE_STARTED
  entityId: string // courseId
  entityType: 'course'
  metadata: {
    courseSlug: string
    courseTitle: string
  }
}

export interface CourseProgressUpdatedEvent extends BaseProgressEvent {
  type: ProgressEventType.COURSE_PROGRESS_UPDATED
  entityId: string // courseId
  entityType: 'course'
  metadata: {
    progress: number
    completedChapters: number[]
    currentChapterId?: number
    timeSpent: number
  }
}

export interface QuizStartedEvent extends BaseProgressEvent {
  type: ProgressEventType.QUIZ_STARTED
  entityId: string // quizId
  entityType: 'quiz'
  metadata: {
    quizType: string
    quizSlug: string
    totalQuestions: number
  }
}

export interface QuestionAnsweredEvent extends BaseProgressEvent {
  type: ProgressEventType.QUESTION_ANSWERED
  entityId: string // questionId
  entityType: 'question'
  metadata: {
    quizId: string
    questionIndex: number
    selectedOptionId?: string
    userAnswer: string
    isCorrect: boolean
    timeSpent: number
  }
}

export interface QuizCompletedEvent extends BaseProgressEvent {
  type: ProgressEventType.QUIZ_COMPLETED
  entityId: string // quizId
  entityType: 'quiz'
  metadata: {
    score: number
    maxScore: number
    percentage: number
    timeSpent: number
    answers: Array<{
      questionId: string
      isCorrect: boolean
      timeSpent: number
    }>
  }
}

export interface CourseCompletedEvent extends BaseProgressEvent {
  type: ProgressEventType.COURSE_COMPLETED
  entityId: string // courseId
  entityType: 'course'
  metadata: {
    totalTimeSpent: number
    completionDate: string
    finalScore?: number
  }
}

export interface VideoWatchedEvent extends BaseProgressEvent {
  type: ProgressEventType.VIDEO_WATCHED
  entityId: string // chapterId
  entityType: 'chapter'
  metadata: {
    courseId: string
    progress: number
    playedSeconds: number
    duration: number
  }
}

export interface ChapterCompletedEvent extends BaseProgressEvent {
  type: ProgressEventType.CHAPTER_COMPLETED
  entityId: string // chapterId
  entityType: 'chapter'
  metadata: {
    courseId: string
    timeSpent: number
    completedAt: string
  }
}

export type ProgressEvent =
  | CourseStartedEvent
  | CourseProgressUpdatedEvent
  | QuizStartedEvent
  | QuestionAnsweredEvent
  | QuizCompletedEvent
  | CourseCompletedEvent
  | VideoWatchedEvent
  | ChapterCompletedEvent

// State Interface
export interface ProgressEventsState {
  events: ProgressEvent[]
  pendingEvents: ProgressEvent[]
  failedEvents: ProgressEvent[]
  lastSyncedAt: number | null
  isOnline: boolean
  isLoading: boolean
  error: string | null
}

// Initial State
const initialState: ProgressEventsState = {
  events: [],
  pendingEvents: [],
  failedEvents: [],
  lastSyncedAt: null,
  isOnline: true,
  isLoading: false,
  error: null
}

// Async Thunks
export const syncEventsWithServer = createAsyncThunk(
  'progressEvents/syncWithServer',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const { pendingEvents } = state.progressEvents

    if (pendingEvents.length === 0) {
      return { syncedEvents: [], failedEvents: [] }
    }

    try {
      const response = await fetch('/api/progress/events/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: pendingEvents })
      })

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Sync failed')
    }
  }
)

export const loadEventsFromStorage = createAsyncThunk(
  'progressEvents/loadFromStorage',
  async (userId: string) => {
    const stored = storageManager.getProgressEvents(userId)
    return stored || []
  }
)

// Slice
const progressEventsSlice = createSlice({
  name: 'progressEvents',
  initialState,
  reducers: {
    addEvent: (state, action: PayloadAction<ProgressEvent>) => {
      const event = action.payload

      // Add to events log
      state.events.push(event)

      // Add to pending events for sync
      state.pendingEvents.push(event)

      // Keep events sorted by timestamp
      state.events.sort((a, b) => a.timestamp - b.timestamp)

      // Limit event history to prevent memory issues
      if (state.events.length > 1000) {
        state.events = state.events.slice(-1000)
      }

      // Persist to localStorage
      storageManager.saveProgressEvents(event.userId, state.events)

      // Auto-sync if online and we have pending events
      if (state.isOnline && state.pendingEvents.length > 0) {
        // Note: We'll dispatch the sync action from the component that adds events
        // This prevents circular dependencies in the slice
      }
    },

    markEventSynced: (state, action: PayloadAction<string>) => {
      const eventId = action.payload
      const eventIndex = state.pendingEvents.findIndex(e => e.id === eventId)

      if (eventIndex !== -1) {
        state.pendingEvents.splice(eventIndex, 1)
        state.lastSyncedAt = Date.now()
      }
    },

    markEventFailed: (state, action: PayloadAction<string>) => {
      const eventId = action.payload
      const eventIndex = state.pendingEvents.findIndex(e => e.id === eventId)

      if (eventIndex !== -1) {
        const failedEvent = state.pendingEvents.splice(eventIndex, 1)[0]
        state.failedEvents.push(failedEvent)
      }
    },

    retryFailedEvents: (state) => {
      state.pendingEvents.push(...state.failedEvents)
      state.failedEvents = []
    },

    clearOldEvents: (state, action: PayloadAction<number>) => {
      const cutoffTime = action.payload
      state.events = state.events.filter(event => event.timestamp > cutoffTime)
      storageManager.saveProgressEvents(state.events[0]?.userId || '', state.events)
    },

    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload
    },

    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncEventsWithServer.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(syncEventsWithServer.fulfilled, (state, action) => {
        state.isLoading = false
        const { syncedEvents, failedEvents } = action.payload

        // Remove synced events from pending
        syncedEvents.forEach((eventId: string) => {
          const index = state.pendingEvents.findIndex(e => e.id === eventId)
          if (index !== -1) {
            state.pendingEvents.splice(index, 1)
          }
        })

        // Move failed events to failed list
        failedEvents.forEach((eventId: string) => {
          const index = state.pendingEvents.findIndex(e => e.id === eventId)
          if (index !== -1) {
            const failedEvent = state.pendingEvents.splice(index, 1)[0]
            state.failedEvents.push(failedEvent)
          }
        })

        state.lastSyncedAt = Date.now()
      })
      .addCase(syncEventsWithServer.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(loadEventsFromStorage.fulfilled, (state, action) => {
        state.events = action.payload
      })
  }
})

export const {
  addEvent,
  markEventSynced,
  markEventFailed,
  retryFailedEvents,
  clearOldEvents,
  setOnlineStatus,
  clearError
} = progressEventsSlice.actions

export default progressEventsSlice.reducer

// Selectors for derived state from event log
export const selectEventLog = (state: RootState) => state.progressEvents.events
export const selectPendingEvents = (state: RootState) => state.progressEvents.pendingEvents
export const selectFailedEvents = (state: RootState) => state.progressEvents.failedEvents
export const selectLastSyncedAt = (state: RootState) => state.progressEvents.lastSyncedAt
export const selectIsOnline = (state: RootState) => state.progressEvents.isOnline

// Memoized selectors for derived progress state
export const selectCourseProgressFromEvents = createSelector(
  [selectEventLog],
  (events) => EventReplayer.replayEvents(events).courseProgress
)

export const selectQuizProgressFromEvents = createSelector(
  [selectEventLog],
  (events) => EventReplayer.replayEvents(events).quizProgress
)

export const selectChapterProgressFromEvents = createSelector(
  [selectEventLog],
  (events) => EventReplayer.replayEvents(events).chapterProgress
)

// Specific selectors for common use cases
export const selectCourseCompletionPercentage = createSelector(
  [selectCourseProgressFromEvents, (_state: RootState, courseId: string) => courseId],
  (courseProgress, courseId) => {
    const progress = courseProgress[courseId]
    return progress?.progress || 0
  }
)

export const selectQuizCompletionPercentage = createSelector(
  [selectQuizProgressFromEvents, (_state: RootState, quizId: string) => quizId],
  (quizProgress, quizId) => {
    const progress = quizProgress[quizId]
    if (!progress) return 0
    const answeredCount = Object.keys(progress.answers).length
    return progress.totalQuestions > 0 ? (answeredCount / progress.totalQuestions) * 100 : 0
  }
)

export const selectCurrentQuizAnswers = createSelector(
  [selectQuizProgressFromEvents, (_state: RootState, quizId: string) => quizId],
  (quizProgress, quizId) => {
    const progress = quizProgress[quizId]
    return progress?.answers || {}
  }
)

export const selectPendingEventCount = createSelector(
  [selectPendingEvents],
  (pendingEvents) => pendingEvents.length
)

export const selectFailedEventCount = createSelector(
  [selectFailedEvents],
  (failedEvents) => failedEvents.length
)

export const selectSyncedEventCount = createSelector(
  [selectEventLog, selectLastSyncedAt],
  (events, lastSyncedAt) => {
    if (!lastSyncedAt) return 0
    return events.filter((event: ProgressEvent) => event.timestamp <= lastSyncedAt).length
  }
)
