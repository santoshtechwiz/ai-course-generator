import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { ProgressEventFactory } from '@/utils/progress-events'
import { ProgressEventType } from './progress-events-slice'

// Enhanced Types for centralized progress tracking
export interface CourseProgressState {
  courseId: string
  userId: string
  status: 'not_started' | 'in_progress' | 'completed'
  totalChapters: number
  completedChapters: number[]
  inProgressChapters: number[]
  currentChapterId: number | null
  chapterLeft: number | null // Resume point
  overallProgress: number // 0-100
  timeSpent: number // in minutes
  isCompleted: boolean
  lastAccessedAt: string
  startedAt?: string
  completedAt?: string
}

export interface ChapterProgressState {
  chapterId: number
  courseId: string
  userId: string
  progress: number // 0-100
  timeSpent: number // in seconds
  isCompleted: boolean
  isInProgress: boolean
  lastAccessedAt: string
  startedAt?: string
  completedAt?: string
  playedSeconds: number
  duration: number
}

export interface EnhancedProgressState {
  courses: Record<string, CourseProgressState> // courseId -> progress
  chapters: Record<string, ChapterProgressState> // chapterId -> progress
  isLoading: boolean
  error: string | null
  lastSyncedAt: number | null
  batchQueue: ProgressEvent[]
  syncInProgress: boolean
}

// Extended progress event interface
interface ProgressEvent {
  id: string
  type: ProgressEventType
  userId: string
  entityId: string
  entityType: 'course' | 'chapter'
  metadata: Record<string, any>
  timestamp: number
}

const initialState: EnhancedProgressState = {
  courses: {},
  chapters: {},
  isLoading: false,
  error: null,
  lastSyncedAt: null,
  batchQueue: [],
  syncInProgress: false
}

// Async thunks for API operations
export const loadCourseProgress = createAsyncThunk(
  'enhancedProgress/loadCourseProgress',
  async ({ courseId, userId }: { courseId: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/progress/${courseId}`)
      if (!response.ok) {
        throw new Error(`Failed to load course progress: ${response.statusText}`)
      }
      
      const data = await response.json()
      const progress = data.progress
      
      if (!progress) {
        return null
      }

      return {
        courseId: String(courseId),
        userId,
        progress: {
          currentChapterId: progress.currentChapterId,
          completedChapters: progress.completedChapters || [],
          progress: progress.progress || 0,
          timeSpent: progress.timeSpent || 0,
          isCompleted: progress.isCompleted || false,
          lastAccessedAt: progress.lastAccessedAt || new Date().toISOString()
        }
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load progress')
    }
  }
)

export const syncProgressBatch = createAsyncThunk(
  'enhancedProgress/syncProgressBatch',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const { batchQueue } = state.enhancedProgress

    if (batchQueue.length === 0) {
      return { syncedEvents: [], failedEvents: [] }
    }

    try {
      const response = await fetch('/api/progress/events/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batchQueue })
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

const enhancedProgressSlice = createSlice({
  name: 'enhancedProgress',
  initialState,
  reducers: {
    // Course Progress Actions
    setCourseStatus: (state, action: PayloadAction<{
      courseId: string
      userId: string
      status: CourseProgressState['status']
      totalChapters: number
    }>) => {
      const { courseId, userId, status, totalChapters } = action.payload
      const courseKey = `${userId}_${courseId}`
      
      if (!state.courses[courseKey]) {
        state.courses[courseKey] = {
          courseId,
          userId,
          status: 'not_started',
          totalChapters: 0,
          completedChapters: [],
          inProgressChapters: [],
          currentChapterId: null,
          chapterLeft: null,
          overallProgress: 0,
          timeSpent: 0,
          isCompleted: false,
          lastAccessedAt: new Date().toISOString()
        }
      }
      
      const course = state.courses[courseKey]
      course.status = status
      course.totalChapters = totalChapters
      course.lastAccessedAt = new Date().toISOString()
      
      if (status === 'in_progress' && !course.startedAt) {
        course.startedAt = new Date().toISOString()
      }
      
      if (status === 'completed' && !course.completedAt) {
        course.completedAt = new Date().toISOString()
        course.isCompleted = true
        course.overallProgress = 100
      }
    },

    setChapterLeft: (state, action: PayloadAction<{
      courseId: string
      userId: string
      chapterId: number
    }>) => {
      const { courseId, userId, chapterId } = action.payload
      const courseKey = `${userId}_${courseId}`
      
      if (state.courses[courseKey]) {
        state.courses[courseKey].chapterLeft = chapterId
        state.courses[courseKey].currentChapterId = chapterId
        state.courses[courseKey].lastAccessedAt = new Date().toISOString()
      }
    },

    updateCourseProgress: (state, action: PayloadAction<{
      courseId: string
      userId: string
      completedChapters: number[]
      inProgressChapters: number[]
      currentChapterId?: number
      timeSpent?: number
    }>) => {
      const { courseId, userId, completedChapters, inProgressChapters, currentChapterId, timeSpent } = action.payload
      const courseKey = `${userId}_${courseId}`
      
      if (!state.courses[courseKey]) {
        return // Course not initialized
      }
      
      const course = state.courses[courseKey]
      course.completedChapters = [...completedChapters]
      course.inProgressChapters = [...inProgressChapters]
      
      if (currentChapterId !== undefined) {
        course.currentChapterId = currentChapterId
        course.chapterLeft = currentChapterId
      }
      
      if (timeSpent !== undefined) {
        course.timeSpent = timeSpent
      }
      
      // Calculate overall progress
      if (course.totalChapters > 0) {
        course.overallProgress = Math.round((completedChapters.length / course.totalChapters) * 100)
      }
      
      // Update status based on progress
      if (completedChapters.length === 0 && inProgressChapters.length === 0) {
        course.status = 'not_started'
      } else if (completedChapters.length === course.totalChapters) {
        course.status = 'completed'
        course.isCompleted = true
        if (!course.completedAt) {
          course.completedAt = new Date().toISOString()
        }
      } else {
        course.status = 'in_progress'
        if (!course.startedAt) {
          course.startedAt = new Date().toISOString()
        }
      }
      
      course.lastAccessedAt = new Date().toISOString()
    },

    // Chapter Progress Actions
    setChapterProgress: (state, action: PayloadAction<{
      chapterId: number
      courseId: string
      userId: string
      progress: number
      timeSpent?: number
      playedSeconds?: number
      duration?: number
      isCompleted?: boolean
    }>) => {
      const { chapterId, courseId, userId, progress, timeSpent, playedSeconds, duration, isCompleted } = action.payload
      const chapterKey = `${userId}_${courseId}_${chapterId}`
      
      if (!state.chapters[chapterKey]) {
        state.chapters[chapterKey] = {
          chapterId,
          courseId,
          userId,
          progress: 0,
          timeSpent: 0,
          isCompleted: false,
          isInProgress: false,
          lastAccessedAt: new Date().toISOString(),
          playedSeconds: 0,
          duration: 0
        }
      }
      
      const chapter = state.chapters[chapterKey]
      chapter.progress = Math.max(0, Math.min(100, progress))
      
      if (timeSpent !== undefined) {
        chapter.timeSpent = timeSpent
      }
      
      if (playedSeconds !== undefined) {
        chapter.playedSeconds = playedSeconds
      }
      
      if (duration !== undefined) {
        chapter.duration = duration
      }
      
      if (isCompleted !== undefined) {
        chapter.isCompleted = isCompleted
        if (isCompleted && !chapter.completedAt) {
          chapter.completedAt = new Date().toISOString()
        }
      }
      
      // Update status based on progress
      if (chapter.progress === 0) {
        chapter.isInProgress = false
      } else if (chapter.progress >= 100 || chapter.isCompleted) {
        chapter.isCompleted = true
        chapter.isInProgress = false
        if (!chapter.completedAt) {
          chapter.completedAt = new Date().toISOString()
        }
      } else {
        chapter.isInProgress = true
        if (!chapter.startedAt) {
          chapter.startedAt = new Date().toISOString()
        }
      }
      
      chapter.lastAccessedAt = new Date().toISOString()
    },

    markChapterStarted: (state, action: PayloadAction<{
      chapterId: number
      courseId: string
      userId: string
    }>) => {
      const { chapterId, courseId, userId } = action.payload
      const chapterKey = `${userId}_${courseId}_${chapterId}`
      
      if (!state.chapters[chapterKey]) {
        state.chapters[chapterKey] = {
          chapterId,
          courseId,
          userId,
          progress: 0,
          timeSpent: 0,
          isCompleted: false,
          isInProgress: true,
          lastAccessedAt: new Date().toISOString(),
          playedSeconds: 0,
          duration: 0,
          startedAt: new Date().toISOString()
        }
      } else {
        const chapter = state.chapters[chapterKey]
        chapter.isInProgress = true
        chapter.lastAccessedAt = new Date().toISOString()
        if (!chapter.startedAt) {
          chapter.startedAt = new Date().toISOString()
        }
      }
    },

    markChapterCompleted: (state, action: PayloadAction<{
      chapterId: number
      courseId: string
      userId: string
      timeSpent?: number
    }>) => {
      const { chapterId, courseId, userId, timeSpent } = action.payload
      const chapterKey = `${userId}_${courseId}_${chapterId}`
      
      if (!state.chapters[chapterKey]) {
        state.chapters[chapterKey] = {
          chapterId,
          courseId,
          userId,
          progress: 100,
          timeSpent: timeSpent || 0,
          isCompleted: true,
          isInProgress: false,
          lastAccessedAt: new Date().toISOString(),
          playedSeconds: 0,
          duration: 0,
          completedAt: new Date().toISOString()
        }
      } else {
        const chapter = state.chapters[chapterKey]
        chapter.isCompleted = true
        chapter.isInProgress = false
        chapter.progress = 100
        chapter.lastAccessedAt = new Date().toISOString()
        
        if (timeSpent !== undefined) {
          chapter.timeSpent = timeSpent
        }
        
        if (!chapter.completedAt) {
          chapter.completedAt = new Date().toISOString()
        }
      }
    },

    // Event Management
    addEventToBatch: (state, action: PayloadAction<ProgressEvent>) => {
      state.batchQueue.push(action.payload)
      
      // Auto-trigger sync if batch gets too large
      if (state.batchQueue.length >= 10) {
        state.syncInProgress = true
      }
    },

    clearBatchQueue: (state) => {
      state.batchQueue = []
      state.syncInProgress = false
    },

    // State Management
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    clearError: (state) => {
      state.error = null
    },

    // Sync progress from events (event replay functionality)
    syncFromEvents: (state, action: PayloadAction<{
      courseProgress: Record<string, any>
      chapterProgress: Record<string, any>
    }>) => {
      const { courseProgress, chapterProgress } = action.payload
      
      // Update course progress from events
      Object.entries(courseProgress).forEach(([courseId, progress]: [string, any]) => {
        const courseKey = `${progress.userId || 'unknown'}_${courseId}`
        
        if (!state.courses[courseKey]) {
          state.courses[courseKey] = {
            courseId,
            userId: progress.userId || 'unknown',
            status: 'not_started',
            totalChapters: 0,
            completedChapters: [],
            inProgressChapters: [],
            currentChapterId: null,
            chapterLeft: null,
            overallProgress: 0,
            timeSpent: 0,
            isCompleted: false,
            lastAccessedAt: new Date().toISOString()
          }
        }
        
        const course = state.courses[courseKey]
        course.overallProgress = progress.progress || 0
        course.completedChapters = progress.completedChapters || []
        course.currentChapterId = progress.currentChapterId || null
        course.chapterLeft = progress.currentChapterId || null
        course.timeSpent = progress.timeSpent || 0
        course.isCompleted = progress.isCompleted || false
        
        // Update status
        if (course.completedChapters.length === 0) {
          course.status = 'not_started'
        } else if (course.isCompleted) {
          course.status = 'completed'
        } else {
          course.status = 'in_progress'
        }
      })
      
      // Update chapter progress from events
      Object.entries(chapterProgress).forEach(([chapterId, progress]: [string, any]) => {
        const chapterKey = `${progress.userId || 'unknown'}_${progress.courseId}_${chapterId}`
        
        if (!state.chapters[chapterKey]) {
          state.chapters[chapterKey] = {
            chapterId: Number(chapterId),
            courseId: progress.courseId,
            userId: progress.userId || 'unknown',
            progress: 0,
            timeSpent: 0,
            isCompleted: false,
            isInProgress: false,
            lastAccessedAt: new Date().toISOString(),
            playedSeconds: 0,
            duration: 0
          }
        }
        
        const chapter = state.chapters[chapterKey]
        chapter.progress = progress.progress || 0
        chapter.playedSeconds = progress.playedSeconds || 0
        chapter.duration = progress.duration || 0
        chapter.isCompleted = progress.isCompleted || false
        chapter.isInProgress = !progress.isCompleted && progress.progress > 0
      })
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCourseProgress.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loadCourseProgress.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload) {
          const { courseId, userId, progress } = action.payload
          const courseKey = `${userId}_${courseId}`
          
          if (!state.courses[courseKey]) {
            state.courses[courseKey] = {
              courseId,
              userId,
              status: 'not_started',
              totalChapters: 0,
              completedChapters: [],
              inProgressChapters: [],
              currentChapterId: null,
              chapterLeft: null,
              overallProgress: 0,
              timeSpent: 0,
              isCompleted: false,
              lastAccessedAt: new Date().toISOString()
            }
          }
          
          const course = state.courses[courseKey]
          course.currentChapterId = progress.currentChapterId
          course.chapterLeft = progress.currentChapterId
          course.completedChapters = progress.completedChapters
          course.overallProgress = progress.progress
          course.timeSpent = progress.timeSpent
          course.isCompleted = progress.isCompleted
          course.lastAccessedAt = progress.lastAccessedAt
          
          // Update status
          if (course.completedChapters.length === 0) {
            course.status = 'not_started'
          } else if (course.isCompleted) {
            course.status = 'completed'
          } else {
            course.status = 'in_progress'
          }
        }
      })
      .addCase(loadCourseProgress.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(syncProgressBatch.pending, (state) => {
        state.syncInProgress = true
      })
      .addCase(syncProgressBatch.fulfilled, (state) => {
        state.syncInProgress = false
        state.batchQueue = []
        state.lastSyncedAt = Date.now()
      })
      .addCase(syncProgressBatch.rejected, (state, action) => {
        state.syncInProgress = false
        state.error = action.payload as string
      })
  }
})

export const {
  setCourseStatus,
  setChapterLeft,
  updateCourseProgress,
  setChapterProgress,
  markChapterStarted,
  markChapterCompleted,
  addEventToBatch,
  clearBatchQueue,
  setLoading,
  setError,
  clearError,
  syncFromEvents
} = enhancedProgressSlice.actions

export default enhancedProgressSlice.reducer

// Memoized Selectors
export const selectEnhancedProgressState = (state: RootState) => state.enhancedProgress

export const selectCourseProgress = createSelector(
  [selectEnhancedProgressState, (_: RootState, courseId: string, userId: string) => `${userId}_${courseId}`],
  (progressState, courseKey) => progressState.courses[courseKey] || null
)

export const selectChapterProgress = createSelector(
  [selectEnhancedProgressState, (_: RootState, courseId: string, chapterId: number, userId: string) => `${userId}_${courseId}_${chapterId}`],
  (progressState, chapterKey) => progressState.chapters[chapterKey] || null
)

export const selectCourseChapters = createSelector(
  [selectEnhancedProgressState, (_: RootState, courseId: string, userId: string) => ({ courseId, userId })],
  (progressState, { courseId, userId }) => {
    const chapters = Object.values(progressState.chapters).filter(
      chapter => chapter.courseId === courseId && chapter.userId === userId
    )
    
    const completed = chapters.filter(ch => ch.isCompleted)
    const inProgress = chapters.filter(ch => ch.isInProgress && !ch.isCompleted)
    const notStarted = chapters.filter(ch => !ch.isInProgress && !ch.isCompleted)
    
    return {
      all: chapters,
      completed,
      inProgress,
      notStarted,
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      notStartedCount: notStarted.length,
      totalCount: chapters.length
    }
  }
)

export const selectResumePoint = createSelector(
  [selectCourseProgress],
  (courseProgress) => courseProgress?.chapterLeft || null
)

export const selectCourseStatus = createSelector(
  [selectCourseProgress],
  (courseProgress) => courseProgress?.status || 'not_started'
)

export const selectCourseCompletion = createSelector(
  [selectCourseProgress, selectCourseChapters],
  (courseProgress, chapters) => ({
    percentage: courseProgress?.overallProgress || 0,
    isCompleted: courseProgress?.isCompleted || false,
    completedChapters: chapters.completedCount,
    inProgressChapters: chapters.inProgressCount,
    totalChapters: chapters.totalCount,
    remainingChapters: chapters.totalCount - chapters.completedCount
  })
)

export const selectSyncStatus = createSelector(
  [selectEnhancedProgressState],
  (state) => ({
    isLoading: state.isLoading,
    syncInProgress: state.syncInProgress,
    pendingEvents: state.batchQueue.length,
    lastSyncedAt: state.lastSyncedAt,
    error: state.error
  })
)
