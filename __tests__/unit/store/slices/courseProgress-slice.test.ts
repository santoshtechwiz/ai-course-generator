import { configureStore } from '@reduxjs/toolkit'
import reducer, {
  type CourseProgressSliceState,
  setVideoProgress,
  markChapterCompleted,
  setLoading,
  setError,
} from '@/store/slices/courseProgress-slice'

describe('courseProgress slice - Basic Tests', () => {
  const initialState: CourseProgressSliceState = {
    byCourseId: {},
    isLoading: false,
    error: null,
  }

  it('should handle initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('should update video progress', () => {
    const action = setVideoProgress({
      courseId: '123',
      chapterId: 1,
      progress: 75,
      playedSeconds: 300,
      userId: 'user1',
      completed: false
    })

    const result = reducer(initialState, action)
    
    expect(result.byCourseId['123']).toBeTruthy()
    expect(result.byCourseId['123'].videoProgress.progress).toBe(75)
    expect(result.byCourseId['123'].videoProgress.playedSeconds).toBe(300)
  })

  it('should mark chapter as completed', () => {
    // First add some progress
    let state = reducer(initialState, setVideoProgress({
      courseId: '123',
      chapterId: 1,
      progress: 100,
      playedSeconds: 300,
      userId: 'user1',
      completed: false
    }))

    // Then mark as completed
    state = reducer(state, markChapterCompleted({
      courseId: '123',
      chapterId: '1',
      userId: 'user1'
    }))

    expect(state.byCourseId['123'].videoProgress.completedChapters).toContain('1')
  })

  it('should handle loading states', () => {
    let state = reducer(initialState, setLoading(true))
    expect(state.isLoading).toBe(true)

    state = reducer(state, setLoading(false))
    expect(state.isLoading).toBe(false)
  })

  it('should handle error states', () => {
    let state = reducer(initialState, setError('Test error'))
    expect(state.error).toBe('Test error')

    state = reducer(state, setError(null))
    expect(state.error).toBeNull()
  })
})