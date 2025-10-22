import { describe, it, expect } from 'vitest'
import reducer, { setVideoProgress, markChapterCompleted } from '@/store/slices/courseProgress-slice'

describe('courseProgress slice - edge cases', () => {
  it('payload lastPositions overrides existing keys but preserves other keys', () => {
    const initialState: any = {
      byCourseId: {
        '36': {
          courseId: '36',
          userId: 'u1',
          videoProgress: {
            currentChapterId: '10',
            currentUnitId: null,
            progress: 20,
            timeSpent: 0,
            playedSeconds: 0,
            isCompleted: false,
            lastAccessedAt: new Date().toISOString(),
            completedChapters: [],
            bookmarks: [],
            lastPositions: { '431': 30, '433': 50 }
          },
          lastUpdatedAt: Date.now()
        }
      },
      isLoading: false,
      error: null
    }

    const action = setVideoProgress({
      courseId: 36,
      chapterId: 433,
      progress: 10,
      playedSeconds: 5,
      userId: 'u1',
      lastPositions: { '433': 100 }
    })

    const next = reducer(initialState as any, action)
    expect(next.byCourseId['36']).toBeDefined()
    // existing key preserved
    expect(next.byCourseId['36'].videoProgress.lastPositions?.['431']).toBe(30)
    // overridden
    expect(next.byCourseId['36'].videoProgress.lastPositions?.['433']).toBe(100)
  })

  it('does not clear existing lastPositions when payload lastPositions is empty or undefined', () => {
    const initialState: any = {
      byCourseId: {
        '36': {
          courseId: '36',
          userId: 'u1',
          videoProgress: {
            currentChapterId: '10',
            currentUnitId: null,
            progress: 20,
            timeSpent: 0,
            playedSeconds: 0,
            isCompleted: false,
            lastAccessedAt: new Date().toISOString(),
            completedChapters: [],
            bookmarks: [],
            lastPositions: { '431': 30 }
          },
          lastUpdatedAt: Date.now()
        }
      },
      isLoading: false,
      error: null
    }

    const action = setVideoProgress({
      courseId: 36,
      chapterId: 433,
      progress: 10,
      playedSeconds: 5,
      userId: 'u1'
      // no lastPositions provided
    })

    const next = reducer(initialState as any, action)
    expect(next.byCourseId['36'].videoProgress.lastPositions?.['431']).toBe(30)
  })

  it('setVideoProgress with completed true adds to completedChapters only once', () => {
    const initialState: any = {
      byCourseId: {
        '36': {
          courseId: '36',
          userId: 'u1',
          videoProgress: {
            currentChapterId: '10',
            currentUnitId: null,
            progress: 20,
            timeSpent: 0,
            playedSeconds: 0,
            isCompleted: false,
            lastAccessedAt: new Date().toISOString(),
            completedChapters: ['431'],
            bookmarks: [],
            lastPositions: {}
          },
          lastUpdatedAt: Date.now()
        }
      },
      isLoading: false,
      error: null
    }

    const action = setVideoProgress({
      courseId: 36,
      chapterId: 431,
      progress: 100,
      playedSeconds: 10,
      userId: 'u1',
      completed: true,
    })

    const next = reducer(initialState as any, action)
    const arr = next.byCourseId['36'].videoProgress.completedChapters
    const occurrences = arr.filter((x: string) => x === '431').length
    expect(occurrences).toBe(1)
  })

  it('markChapterCompleted when entry exists appends and when called twice does not duplicate', () => {
    const initialState: any = {
      byCourseId: {
        '36': {
          courseId: '36',
          userId: 'u1',
          videoProgress: {
            currentChapterId: '10',
            currentUnitId: null,
            progress: 20,
            timeSpent: 0,
            playedSeconds: 0,
            isCompleted: false,
            lastAccessedAt: new Date().toISOString(),
            completedChapters: [],
            bookmarks: [],
            lastPositions: {}
          },
          lastUpdatedAt: Date.now()
        }
      },
      isLoading: false,
      error: null
    }

    const act = markChapterCompleted({ courseId: 36, chapterId: 431, userId: 'user-123' })
    let next = reducer(initialState as any, act)
    expect(next.byCourseId['36'].videoProgress.completedChapters).toContain('431')
    next = reducer(next as any, act)
    const arr = next.byCourseId['36'].videoProgress.completedChapters
    const occurrences = arr.filter((x: string) => x === '431').length
    expect(occurrences).toBe(1)
  })
})
