'use client';

import { useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  addEvent,
  syncEventsWithServer,
  selectQuizProgressFromEvents,
  selectCurrentQuizAnswers,
  selectQuizCompletionPercentage,
  selectCourseProgressFromEvents,
  selectCourseCompletionPercentage
} from '@/store/slices/progress-events-slice'
import { 
  ProgressEvent,
  ProgressEventType,
  BaseProgressEvent,
  CourseProgressUpdatedEvent,
  QuizCompletedEvent,
  QuestionAnsweredEvent
} from '@/types/progress-events'
import { useCallback } from 'react'

// Event creation utilities
const DEBOUNCE_DELAYS: Record<ProgressEventType, number> = {
  [ProgressEventType.COURSE_STARTED]: 0,
  [ProgressEventType.COURSE_PROGRESS_UPDATED]: 2000,  // 2s for progress updates
  [ProgressEventType.QUIZ_STARTED]: 0,
  [ProgressEventType.QUESTION_ANSWERED]: 500,
  [ProgressEventType.QUIZ_COMPLETED]: 0,
  [ProgressEventType.COURSE_COMPLETED]: 0,
  [ProgressEventType.VIDEO_WATCHED]: 5000,           // 5s for video progress
  [ProgressEventType.CHAPTER_COMPLETED]: 0,          // No delay for completion events
}
const DEFAULT_DEBOUNCE = 1000

export class ProgressEventFactory {
  static createEvent<T extends ProgressEvent>(
    type: ProgressEventType,
    userId: string,
    entityId: string,
    entityType: T['entityType'],
    metadata: T['metadata']
  ): T {
    const batchId = uuidv4();
    const debounceKey = `${type}-${entityId}-${userId}`;
    const priority = type === ProgressEventType.CHAPTER_COMPLETED ? 1 : 0;
    
    return {
      id: uuidv4(),
      userId,
      timestamp: Date.now(),
      type,
      entityId,
      entityType,
      metadata,
      batchId,
      priority,
      debounceKey
    } as T
  }

  static courseStarted(userId: string, courseId: string, courseSlug: string, courseTitle: string) {
    return this.createEvent(
      ProgressEventType.COURSE_STARTED,
      userId,
      courseId,
      'course',
      { courseSlug, courseTitle }
    )
  }

  static courseProgressUpdated(
    userId: string,
    courseId: string,
    progress: number,
    completedChapters: number[],
    currentChapterId?: number,
    timeSpent: number = 0
  ) {
    return this.createEvent(
      ProgressEventType.COURSE_PROGRESS_UPDATED,
      userId,
      courseId,
      'course',
      { progress, completedChapters, currentChapterId, timeSpent }
    )
  }

  static quizStarted(userId: string, quizId: string, quizType: string, quizSlug: string, totalQuestions: number) {
    return this.createEvent(
      ProgressEventType.QUIZ_STARTED,
      userId,
      quizId,
      'quiz',
      { quizType, quizSlug, totalQuestions }
    )
  }

  static questionAnswered(
    userId: string,
    questionId: string,
    quizId: string,
    questionIndex: number,
    selectedOptionId: string | undefined,
    userAnswer: string,
    isCorrect: boolean,
    timeSpent: number
  ) {
    return this.createEvent(
      ProgressEventType.QUESTION_ANSWERED,
      userId,
      questionId,
      'question',
      { quizId, questionIndex, selectedOptionId, userAnswer, isCorrect, timeSpent }
    )
  }

  static quizCompleted(
    userId: string,
    quizId: string,
    score: number,
    maxScore: number,
    percentage: number,
    timeSpent: number,
    answers: Array<{ questionId: string; isCorrect: boolean; timeSpent: number }>
  ) {
    return this.createEvent(
      ProgressEventType.QUIZ_COMPLETED,
      userId,
      quizId,
      'quiz',
      { score, maxScore, percentage, timeSpent, answers }
    )
  }

  static courseCompleted(userId: string, courseId: string, totalTimeSpent: number, finalScore?: number) {
    return this.createEvent(
      ProgressEventType.COURSE_COMPLETED,
      userId,
      courseId,
      'course',
      { totalTimeSpent, completionDate: new Date().toISOString(), finalScore }
    )
  }

  static videoWatched(
    userId: string,
    chapterId: string,
    courseId: string,
    progress: number,
    playedSeconds: number,
    duration: number
  ) {
    return this.createEvent(
      ProgressEventType.VIDEO_WATCHED,
      userId,
      chapterId,
      'chapter',
      { courseId, progress, playedSeconds, duration }
    )
  }

  static chapterCompleted(userId: string, chapterId: string, courseId: string, timeSpent: number) {
    return this.createEvent(
      ProgressEventType.CHAPTER_COMPLETED,
      userId,
      chapterId,
      'chapter',
      { courseId, timeSpent, completedAt: new Date().toISOString() }
    )
  }
}

// Hook for dispatching events
export function useProgressEvents() {
  const dispatch = useAppDispatch()
  
  // Create refs for debouncing
  const videoWatchDebounceRef = useRef<{
    timerId: ReturnType<typeof setTimeout> | null;
    lastProgress: Record<string, { progress: number; timestamp: number }>;
  }>({
    timerId: null,
    lastProgress: {}
  })

  const dispatchEvent = useCallback((event: ProgressEvent) => {
    // Special handling for video watch events with improved deduplication
    if (event.type === ProgressEventType.VIDEO_WATCHED) {
      const { entityId, metadata } = event
      const lastState = videoWatchDebounceRef.current.lastProgress[entityId]
      const now = Date.now()
      
      // Enhanced deduplication logic
      if (lastState) {
        const progressDiff = Math.abs(lastState.progress - metadata.progress)
        const timeDiff = now - lastState.timestamp
        
        // Skip if:
        // 1. Progress hasn't changed significantly (<2%) in the last 3 seconds
        // 2. Same progress value within 1 second (duplicate call)
        if ((progressDiff < 0.02 && timeDiff < 3000) || 
            (progressDiff < 0.001 && timeDiff < 1000)) {
          console.debug(`Skipping duplicate video progress event for ${entityId}: progress=${metadata.progress}`)
          return
        }
      }

      // Clear existing timer
      if (videoWatchDebounceRef.current.timerId) {
        clearTimeout(videoWatchDebounceRef.current.timerId)
      }

      // Update last progress state
      videoWatchDebounceRef.current.lastProgress[entityId] = {
        progress: metadata.progress,
        timestamp: now
      }

      // Debounce the event dispatch with smart delay
      const debounceDelay = metadata.progress > 0.9 ? 500 : 2000 // Faster for near-completion
      videoWatchDebounceRef.current.timerId = setTimeout(() => {
        dispatch(addEvent(event))
        dispatch(syncEventsWithServer())
        console.log(`Video watch event dispatched: progress=${metadata.progress} for chapter ${entityId}`)
      }, debounceDelay)

      return
    }

    // Enhanced handling for other events with deduplication
    const eventKey = `${event.type}-${event.entityId}-${event.userId}`
    const lastEventTime = lastEventTimestamps.current[eventKey]
    const now = Date.now()
    
    // Prevent duplicate events within configured delays
    const debounceDelay = DEBOUNCE_DELAYS[event.type] || DEFAULT_DEBOUNCE
    if (lastEventTime && (now - lastEventTime) < debounceDelay) {
      console.debug(`Debouncing ${event.type} event for ${event.entityId}`)
      return
    }
    
    // Update timestamp
    lastEventTimestamps.current[eventKey] = now

    // Normal handling for other events
    dispatch(addEvent(event))
    
    // Batch sync to reduce server calls
    if (batchSyncTimeoutRef.current) {
      clearTimeout(batchSyncTimeoutRef.current)
    }
    batchSyncTimeoutRef.current = setTimeout(() => {
      dispatch(syncEventsWithServer())
    }, 1000) // 1 second batching window
    
    // Log for debugging
    console.log(`Progress event dispatched: ${event.type} for ${event.entityType} ${event.entityId}`)
  }, [dispatch])

  // Add refs for deduplication tracking
  const lastEventTimestamps = useRef<Record<string, number>>({})
  const batchSyncTimeoutRef = useRef<NodeJS.Timeout>()
  const lastFlushTimeRef = useRef<number>(0)
  const FLUSH_COOLDOWN_MS = 1000 // 1s cooldown to prevent rapid consecutive forced syncs

  const flushSync = useCallback((): Promise<any> => {
    const now = Date.now()
    if (now - lastFlushTimeRef.current < FLUSH_COOLDOWN_MS) {
      console.debug('flushSync skipped due to cooldown')
      return Promise.resolve({ skipped: true })
    }
    lastFlushTimeRef.current = now
    try {
      return Promise.resolve(dispatch(syncEventsWithServer()))
    } catch (err) {
      return Promise.reject(err)
    }
  }, [dispatch])

  const dispatchCourseStarted = (userId: string, courseId: string, courseSlug: string, courseTitle: string) => {
    const event = ProgressEventFactory.courseStarted(userId, courseId, courseSlug, courseTitle)
    dispatchEvent(event)
  }

  const dispatchCourseProgressUpdated = (
    userId: string,
    courseId: string,
    progress: number,
    completedChapters: number[],
    currentChapterId?: number,
    timeSpent: number = 0
  ) => {
    const event = ProgressEventFactory.courseProgressUpdated(
      userId, courseId, progress, completedChapters, currentChapterId, timeSpent
    )
    dispatchEvent(event)
  }

  const dispatchQuizStarted = (
    userId: string,
    quizId: string,
    quizType: string,
    quizSlug: string,
    totalQuestions: number
  ) => {
    const event = ProgressEventFactory.quizStarted(userId, quizId, quizType, quizSlug, totalQuestions)
    dispatchEvent(event)
  }

  const dispatchQuestionAnswered = (
    userId: string,
    questionId: string,
    quizId: string,
    questionIndex: number,
    selectedOptionId: string | undefined,
    userAnswer: string,
    isCorrect: boolean,
    timeSpent: number
  ) => {
    const event = ProgressEventFactory.questionAnswered(
      userId, questionId, quizId, questionIndex, selectedOptionId, userAnswer, isCorrect, timeSpent
    )
    dispatchEvent(event)
  }

  const dispatchQuizCompleted = (
    userId: string,
    quizId: string,
    score: number,
    maxScore: number,
    percentage: number,
    timeSpent: number,
    answers: Array<{ questionId: string; isCorrect: boolean; timeSpent: number }>
  ) => {
    const event = ProgressEventFactory.quizCompleted(
      userId, quizId, score, maxScore, percentage, timeSpent, answers
    )
    dispatchEvent(event)
  }

  const dispatchCourseCompleted = (userId: string, courseId: string, totalTimeSpent: number, finalScore?: number) => {
    const event = ProgressEventFactory.courseCompleted(userId, courseId, totalTimeSpent, finalScore)
    dispatchEvent(event)
  }

  const dispatchVideoWatched = (
    userId: string,
    chapterId: string,
    courseId: string,
    progress: number,
    playedSeconds: number,
    duration: number
  ) => {
    const event = ProgressEventFactory.videoWatched(userId, chapterId, courseId, progress, playedSeconds, duration)
    dispatchEvent(event)
  }

  const dispatchChapterCompleted = (userId: string, chapterId: string, courseId: string, timeSpent: number) => {
    const event = ProgressEventFactory.chapterCompleted(userId, chapterId, courseId, timeSpent)
    dispatchEvent(event)
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (videoWatchDebounceRef.current.timerId) {
        clearTimeout(videoWatchDebounceRef.current.timerId)
      }
      if (batchSyncTimeoutRef.current) {
        clearTimeout(batchSyncTimeoutRef.current)
      }
    }
  }, [])

  return {
    dispatchEvent,
    dispatchCourseStarted,
    dispatchCourseProgressUpdated,
    dispatchQuizStarted,
    dispatchQuestionAnswered,
    dispatchQuizCompleted,
    dispatchCourseCompleted,
    dispatchVideoWatched,
    dispatchChapterCompleted
    , flushSync
  }
}

// Hook for quiz progress using event-driven system
export function useQuizProgressEvents(quizId: string) {
  const dispatch = useAppDispatch()
  const { dispatchQuizStarted, dispatchQuestionAnswered, dispatchQuizCompleted } = useProgressEvents()
  
  const quizProgress = useAppSelector((state) => selectQuizProgressFromEvents(state))
  const currentAnswers = useAppSelector((state) => selectCurrentQuizAnswers(state, quizId))
  const completionPercentage = useAppSelector((state) => selectQuizCompletionPercentage(state, quizId))

  const startQuiz = useCallback((userId: string, quizType: string, quizSlug: string, totalQuestions: number) => {
    dispatchQuizStarted(userId, quizId, quizType, quizSlug, totalQuestions)
  }, [dispatchQuizStarted, quizId])

  const answerQuestion = useCallback((
    userId: string,
    questionId: string,
    questionIndex: number,
    selectedOptionId: string | undefined,
    userAnswer: string,
    isCorrect: boolean,
    timeSpent: number
  ) => {
    dispatchQuestionAnswered(userId, questionId, quizId, questionIndex, selectedOptionId, userAnswer, isCorrect, timeSpent)
  }, [dispatchQuestionAnswered, quizId])

  const completeQuiz = useCallback((
    userId: string,
    score: number,
    maxScore: number,
    percentage: number,
    timeSpent: number,
    answers: Array<{ questionId: string; isCorrect: boolean; timeSpent: number }>
  ) => {
    dispatchQuizCompleted(userId, quizId, score, maxScore, percentage, timeSpent, answers)
  }, [dispatchQuizCompleted, quizId])

  return {
    quizProgress: quizProgress[quizId],
    currentAnswers,
    completionPercentage,
    startQuiz,
    answerQuestion,
    completeQuiz
  }
}

// Hook for course progress using event-driven system
export function useCourseProgressEvents(courseId: string) {
  const dispatch = useAppDispatch()
  const { dispatchCourseStarted, dispatchCourseProgressUpdated, dispatchCourseCompleted } = useProgressEvents()
  
  const courseProgress = useAppSelector((state) => selectCourseProgressFromEvents(state))
  const completionPercentage = useAppSelector((state) => selectCourseCompletionPercentage(state, courseId))

  const startCourse = useCallback((userId: string, courseSlug: string, courseTitle: string) => {
    dispatchCourseStarted(userId, courseId, courseSlug, courseTitle)
  }, [dispatchCourseStarted, courseId])

  const updateProgress = useCallback((
    userId: string,
    progress: number,
    completedChapters: number[],
    currentChapterId?: number,
    timeSpent: number = 0
  ) => {
    dispatchCourseProgressUpdated(userId, courseId, progress, completedChapters, currentChapterId, timeSpent)
  }, [dispatchCourseProgressUpdated, courseId])

  const completeCourse = useCallback((userId: string, totalTimeSpent: number, finalScore?: number) => {
    dispatchCourseCompleted(userId, courseId, totalTimeSpent, finalScore)
  }, [dispatchCourseCompleted, courseId])

  return {
    courseProgress: courseProgress[courseId],
    completionPercentage,
    startCourse,
    updateProgress,
    completeCourse
  }
}

// Utility functions for event replay
export class EventReplayer {
  static replayEvents(events: ProgressEvent[]): {
    courseProgress: Record<string, any>
    quizProgress: Record<string, any>
    chapterProgress: Record<string, any>
  } {
    const courseProgress: Record<string, any> = {}
    const quizProgress: Record<string, any> = {}
    const chapterProgress: Record<string, any> = {}

    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp)

    sortedEvents.forEach(event => {
      switch (event.type) {
        case ProgressEventType.COURSE_STARTED:
          if (!courseProgress[event.entityId]) {
            courseProgress[event.entityId] = {
              courseId: event.entityId,
              isStarted: true,
              startedAt: event.timestamp,
              progress: 0,
              completedChapters: [],
              timeSpent: 0
            }
          }
          break

        case ProgressEventType.COURSE_PROGRESS_UPDATED:
          courseProgress[event.entityId] = {
            ...courseProgress[event.entityId],
            progress: event.metadata.progress,
            completedChapters: event.metadata.completedChapters,
            currentChapterId: event.metadata.currentChapterId,
            timeSpent: event.metadata.timeSpent,
            lastUpdated: event.timestamp
          }
          break

        case ProgressEventType.QUIZ_STARTED:
          if (!quizProgress[event.entityId]) {
            quizProgress[event.entityId] = {
              quizId: event.entityId,
              isStarted: true,
              startedAt: event.timestamp,
              answers: {},
              totalQuestions: event.metadata.totalQuestions
            }
          }
          break

        case ProgressEventType.QUESTION_ANSWERED:
          if (quizProgress[event.metadata.quizId]) {
            quizProgress[event.metadata.quizId].answers[event.entityId] = {
              selectedOptionId: event.metadata.selectedOptionId,
              userAnswer: event.metadata.userAnswer,
              isCorrect: event.metadata.isCorrect,
              timeSpent: event.metadata.timeSpent,
              timestamp: event.timestamp
            }
          }
          break

        case ProgressEventType.VIDEO_WATCHED:
          if (!chapterProgress[event.entityId]) {
            chapterProgress[event.entityId] = {
              chapterId: event.entityId,
              courseId: event.metadata.courseId,
              progress: 0,
              playedSeconds: 0,
              duration: event.metadata.duration
            }
          }
          chapterProgress[event.entityId] = {
            ...chapterProgress[event.entityId],
            progress: Math.max(chapterProgress[event.entityId].progress, event.metadata.progress),
            playedSeconds: Math.max(chapterProgress[event.entityId].playedSeconds, event.metadata.playedSeconds),
            lastWatched: event.timestamp
          }
          break

        case ProgressEventType.CHAPTER_COMPLETED:
          if (chapterProgress[event.entityId]) {
            chapterProgress[event.entityId] = {
              ...chapterProgress[event.entityId],
              isCompleted: true,
              completedAt: event.timestamp,
              timeSpent: event.metadata.timeSpent
            }
          }
          break
      }
    })

    return { courseProgress, quizProgress, chapterProgress }
  }
}
