/**
 * Test for Redux slice improvements
 * Tests race condition prevention and data preservation
 */

import { configureStore } from '@reduxjs/toolkit'
import { quizReducer } from '../slices/quiz'
import { RequestManager } from '../utils/async-state'

// Mock fetch
global.fetch = jest.fn()

describe('Redux Slice Improvements', () => {
  let store: any

  beforeEach(() => {
    store = configureStore({
      reducer: {
        quiz: quizReducer
      }
    })
    RequestManager.cancelAll()
    ;(fetch as jest.Mock).mockReset()
  })

  afterEach(() => {
    RequestManager.cancelAll()
  })

  describe('Quiz Slice', () => {
    it('should not clear data on cancelled requests', async () => {
      // Set up initial state with data
      const mockQuizData = {
        slug: 'test-quiz',
        quizType: 'mcq',
        questions: [{ id: '1', question: 'Test?', type: 'mcq' }],
        title: 'Test Quiz'
      }

      // Mock successful fetch first
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          questions: mockQuizData.questions,
          title: mockQuizData.title
        })
      })

      // Dispatch successful fetch
      await store.dispatch({
        type: 'quiz/fetch/fulfilled',
        payload: mockQuizData
      })

      const stateAfterSuccess = store.getState().quiz
      expect(stateAfterSuccess.questions).toHaveLength(1)
      expect(stateAfterSuccess.slug).toBe('test-quiz')

      // Now simulate a cancelled request
      store.dispatch({
        type: 'quiz/fetch/rejected',
        payload: 'Request was cancelled'
      })

      const stateAfterCancel = store.getState().quiz
      // Data should still be there after cancelled request
      expect(stateAfterCancel.questions).toHaveLength(1)
      expect(stateAfterCancel.slug).toBe('test-quiz')
    })

    it('should preserve data when subsequent requests fail', async () => {
      // Set up initial successful state
      const mockQuizData = {
        slug: 'test-quiz',
        quizType: 'mcq',
        questions: [{ id: '1', question: 'Test?', type: 'mcq' }],
        title: 'Test Quiz',
        __lastUpdated: Date.now()
      }

      store.dispatch({
        type: 'quiz/fetch/fulfilled',
        payload: mockQuizData
      })

      const stateAfterSuccess = store.getState().quiz
      expect(stateAfterSuccess.questions).toHaveLength(1)

      // Now simulate a network error on subsequent request
      store.dispatch({
        type: 'quiz/fetch/rejected',
        payload: { error: 'Network error' }
      })

      const stateAfterError = store.getState().quiz
      // Data should still be preserved since it was already loaded
      expect(stateAfterError.questions).toHaveLength(1)
      expect(stateAfterError.status).toBe('failed')
      expect(stateAfterError.error).toBe('Network error')
    })

    it('should only update state with newer timestamps', () => {
      const olderTime = Date.now() - 5000
      const newerTime = Date.now()

      // First, add newer data
      store.dispatch({
        type: 'quiz/fetch/fulfilled',
        payload: {
          slug: 'newer-quiz',
          questions: [{ id: 'new', question: 'Newer?' }],
          __lastUpdated: newerTime
        }
      })

      const stateAfterNewer = store.getState().quiz
      expect(stateAfterNewer.slug).toBe('newer-quiz')

      // Then try to update with older data
      store.dispatch({
        type: 'quiz/fetch/fulfilled',
        payload: {
          slug: 'older-quiz',
          questions: [{ id: 'old', question: 'Older?' }],
          __lastUpdated: olderTime
        }
      })

      const stateAfterOlder = store.getState().quiz
      // Should still have newer data
      expect(stateAfterOlder.slug).toBe('newer-quiz')
      expect(stateAfterOlder.questions[0].id).toBe('new')
    })
  })

  describe('Request Manager', () => {
    it('should cancel previous requests when creating new ones', () => {
      const key = 'test-request'
      
      const controller1 = RequestManager.create(key)
      expect(controller1.signal.aborted).toBe(false)

      const controller2 = RequestManager.create(key)
      expect(controller1.signal.aborted).toBe(true) // Previous should be cancelled
      expect(controller2.signal.aborted).toBe(false)
    })

    it('should clean up all requests', () => {
      const controller1 = RequestManager.create('request1')
      const controller2 = RequestManager.create('request2')

      expect(controller1.signal.aborted).toBe(false)
      expect(controller2.signal.aborted).toBe(false)

      RequestManager.cancelAll()

      expect(controller1.signal.aborted).toBe(true)
      expect(controller2.signal.aborted).toBe(true)
    })
  })
})