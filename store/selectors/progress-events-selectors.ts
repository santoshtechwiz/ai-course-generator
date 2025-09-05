import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { ProgressEvent, ProgressEventType } from './progress-events-slice'

// Base selectors
export const selectProgressEventsState = (state: RootState) => state.progressEvents
export const selectAllEvents = (state: RootState) => state.progressEvents.events
export const selectPendingEvents = (state: RootState) => state.progressEvents.pendingEvents
export const selectFailedEvents = (state: RootState) => state.progressEvents.failedEvents

// Memoized selectors for derived state

// Course completion percentage
export const selectCourseCompletionPercentage = createSelector(
  [selectAllEvents, (state: RootState, courseId: string) => courseId],
  (events, courseId) => {
    const courseEvents = events.filter(
      event => event.entityId === courseId && event.entityType === 'course'
    )

    const progressEvent = courseEvents
      .filter(event => event.type === ProgressEventType.COURSE_PROGRESS_UPDATED)
      .sort((a, b) => b.timestamp - a.timestamp)[0]

    return progressEvent?.metadata?.progress || 0
  }
)

// Quiz completion percentage
export const selectQuizCompletionPercentage = createSelector(
  [selectAllEvents, (state: RootState, quizId: string) => quizId],
  (events, quizId) => {
    const quizEvents = events.filter(
      event => event.entityId === quizId && event.entityType === 'quiz'
    )

    const completedEvent = quizEvents.find(
      event => event.type === ProgressEventType.QUIZ_COMPLETED
    )

    return completedEvent ? 100 : 0
  }
)

// Current answers per question for a quiz
export const selectCurrentQuizAnswers = createSelector(
  [selectAllEvents, (state: RootState, quizId: string) => quizId],
  (events, quizId) => {
    const answerEvents = events.filter(
      event =>
        event.type === ProgressEventType.QUESTION_ANSWERED &&
        event.metadata?.quizId === quizId
    )

    const answers: Record<string, {
      selectedOptionId?: string
      userAnswer: string
      isCorrect: boolean
      timeSpent: number
      timestamp: number
    }> = {}

    answerEvents.forEach(event => {
      const metadata = event.metadata
      answers[event.entityId] = {
        selectedOptionId: metadata.selectedOptionId,
        userAnswer: metadata.userAnswer,
        isCorrect: metadata.isCorrect,
        timeSpent: metadata.timeSpent,
        timestamp: event.timestamp
      }
    })

    return answers
  }
)

// Pending events count
export const selectPendingEventsCount = createSelector(
  [selectPendingEvents],
  (pendingEvents) => pendingEvents.length
)

// Failed events count
export const selectFailedEventsCount = createSelector(
  [selectFailedEvents],
  (failedEvents) => failedEvents.length
)

// Course progress summary
export const selectCourseProgressSummary = createSelector(
  [selectAllEvents, (state: RootState, courseId: string) => courseId],
  (events, courseId) => {
    const courseEvents = events.filter(
      event => event.entityId === courseId && event.entityType === 'course'
    )

    const startedEvent = courseEvents.find(
      event => event.type === ProgressEventType.COURSE_STARTED
    )

    const progressEvent = courseEvents
      .filter(event => event.type === ProgressEventType.COURSE_PROGRESS_UPDATED)
      .sort((a, b) => b.timestamp - a.timestamp)[0]

    const completedEvent = courseEvents.find(
      event => event.type === ProgressEventType.COURSE_COMPLETED
    )

    return {
      isStarted: !!startedEvent,
      startedAt: startedEvent?.timestamp,
      progress: progressEvent?.metadata?.progress || 0,
      completedChapters: progressEvent?.metadata?.completedChapters || [],
      currentChapterId: progressEvent?.metadata?.currentChapterId,
      timeSpent: progressEvent?.metadata?.timeSpent || 0,
      isCompleted: !!completedEvent,
      completedAt: completedEvent?.timestamp
    }
  }
)

// Quiz progress summary
export const selectQuizProgressSummary = createSelector(
  [selectAllEvents, (state: RootState, quizId: string) => quizId],
  (events, quizId) => {
    const quizEvents = events.filter(
      event => event.entityId === quizId && event.entityType === 'quiz'
    )

    const startedEvent = quizEvents.find(
      event => event.type === ProgressEventType.QUIZ_STARTED
    )

    const answerEvents = quizEvents.filter(
      event => event.type === ProgressEventType.QUESTION_ANSWERED
    )

    const completedEvent = quizEvents.find(
      event => event.type === ProgressEventType.QUIZ_COMPLETED
    )

    const totalQuestions = startedEvent?.metadata?.totalQuestions || 0
    const answeredQuestions = new Set(answerEvents.map(e => e.entityId)).size

    return {
      isStarted: !!startedEvent,
      startedAt: startedEvent?.timestamp,
      totalQuestions,
      answeredQuestions,
      progress: totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0,
      isCompleted: !!completedEvent,
      completedAt: completedEvent?.timestamp,
      score: completedEvent?.metadata?.score,
      maxScore: completedEvent?.metadata?.maxScore,
      percentage: completedEvent?.metadata?.percentage,
      timeSpent: completedEvent?.metadata?.timeSpent
    }
  }
)

// Chapter completion status
export const selectChapterCompletionStatus = createSelector(
  [selectAllEvents, (state: RootState, courseId: string, chapterId: string) => ({ courseId, chapterId })],
  (events, { courseId, chapterId }) => {
    const chapterEvents = events.filter(
      event =>
        event.entityId === chapterId &&
        event.entityType === 'chapter' &&
        event.metadata?.courseId === courseId
    )

    const watchedEvents = chapterEvents.filter(
      event => event.type === ProgressEventType.VIDEO_WATCHED
    )

    const completedEvent = chapterEvents.find(
      event => event.type === ProgressEventType.CHAPTER_COMPLETED
    )

    const latestWatchEvent = watchedEvents.sort((a, b) => b.timestamp - a.timestamp)[0]

    return {
      isCompleted: !!completedEvent,
      completedAt: completedEvent?.timestamp,
      progress: latestWatchEvent?.metadata?.progress || 0,
      playedSeconds: latestWatchEvent?.metadata?.playedSeconds || 0,
      duration: latestWatchEvent?.metadata?.duration || 0,
      timeSpent: completedEvent?.metadata?.timeSpent || 0
    }
  }
)

// Sync status
export const selectSyncStatus = createSelector(
  [selectProgressEventsState],
  (state) => ({
    isOnline: state.isOnline,
    isLoading: state.isLoading,
    lastSyncedAt: state.lastSyncedAt,
    pendingCount: state.pendingEvents.length,
    failedCount: state.failedEvents.length,
    error: state.error
  })
)

// Recent activity
export const selectRecentActivity = createSelector(
  [selectAllEvents, (state: RootState, limit: number = 10) => limit],
  (events, limit) => {
    return events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(event => ({
        id: event.id,
        type: event.type,
        entityType: event.entityType,
        entityId: event.entityId,
        timestamp: event.timestamp,
        metadata: event.metadata
      }))
  }
)

// Course completion status
export const selectIsCourseCompleted = createSelector(
  [selectAllEvents, (state: RootState, courseId: string) => courseId],
  (events, courseId) => {
    return events.some(
      event =>
        event.entityId === courseId &&
        event.entityType === 'course' &&
        event.type === ProgressEventType.COURSE_COMPLETED
    )
  }
)

// Quiz completion status
export const selectIsQuizCompleted = createSelector(
  [selectAllEvents, (state: RootState, quizId: string) => quizId],
  (events, quizId) => {
    return events.some(
      event =>
        event.entityId === quizId &&
        event.entityType === 'quiz' &&
        event.type === ProgressEventType.QUIZ_COMPLETED
    )
  }
)</content>
<parameter name="filePath">c:\Work\Projects\ai-learning\store\selectors\progress-events-selectors.ts
