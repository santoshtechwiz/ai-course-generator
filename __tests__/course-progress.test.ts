import { describe, it, expect } from 'vitest'
import reducer, { setVideoProgress, markChapterCompleted } from '@/store/slices/courseProgress-slice'

describe('courseProgress slice', () => {
  it('merges lastPositions when setVideoProgress is called', () => {
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
      userId: 'u1',
      lastPositions: { '433': 100 }
    })

    const next = reducer(initialState as any, action)

    expect(next.byCourseId['36']).toBeDefined()
  expect(next.byCourseId['36'].videoProgress.lastPositions?.['431']).toBe(30)
  expect(next.byCourseId['36'].videoProgress.lastPositions?.['433']).toBe(100)
  })

  it('creates a progress entry when markChapterCompleted is called and none exists', () => {
    const initialState: any = { byCourseId: {}, isLoading: false, error: null }

    const action = markChapterCompleted({ courseId: 36, chapterId: 431, userId: 'user-123' })
    const next = reducer(initialState as any, action)

    expect(next.byCourseId['36']).toBeDefined()
    expect(next.byCourseId['36'].videoProgress.completedChapters).toContain('431')
    expect(next.byCourseId['36'].videoProgress.isCompleted).toBe(true)
  })

  it('does not duplicate chapter ids when marking completed twice', () => {
    const initialState: any = { byCourseId: {}, isLoading: false, error: null }
    const action = markChapterCompleted({ courseId: 36, chapterId: 431, userId: 'user-123' })
    let next = reducer(initialState as any, action)
    next = reducer(next as any, action)

    const arr = next.byCourseId['36'].videoProgress.completedChapters
    const occurrences = arr.filter((x: string) => x === '431').length
    expect(occurrences).toBe(1)
  })
})
