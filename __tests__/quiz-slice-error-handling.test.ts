import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import quizReducer, {
  fetchQuiz,
  selectQuizSliceError,
  selectQuizStatus,
  resetQuiz
} from '@/store/slices/quiz/quiz-slice'
import type { RootState } from '@/store'

// Mock fetch globally
const fetchMock = vi.fn()
global.fetch = fetchMock

describe('Quiz Slice Error Handling', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        quiz: quizReducer
      }
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchQuiz Thunk Error Handling', () => {
    it('handles missing payload error', async () => {
      const result = await store.dispatch(fetchQuiz(null as any))

      expect(result.type).equal('quiz/fetch/rejected')
      expect(result.payload).deep.equal({
        status: 400,
        code: 'INVALID_PAYLOAD',
        message: 'No payload provided'
      })
    })

    it('handles missing parameters error', async () => {
      const result = await store.dispatch(fetchQuiz({}))

      expect(result.type).equal('quiz/fetch/rejected')
      expect(result.payload).deep.equal({
        status: 400,
        code: 'MISSING_PARAMS',
        message: 'Missing required parameters: slug and quizType are required'
      })
    })

    it('handles invalid quiz type error', async () => {
      const result = await store.dispatch(fetchQuiz({
        slug: 'test-quiz',
        quizType: 'invalid-type' as any
      }))

      expect(result.type).equal('quiz/fetch/rejected')
      expect(result.payload).deep.equal({
        status: 500,
        code: 'UNKNOWN_ERROR',
        message: 'Cannot read properties of undefined (reading \'ok\')'
      })
    })

    it('handles 404 not found error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(JSON.stringify({ error: 'Quiz not found' }))
      })

      const result = await store.dispatch(fetchQuiz({
        slug: 'nonexistent-quiz',
        quizType: 'code'
      }))

      expect(result.type).equal('quiz/fetch/rejected')
      expect(result.payload).deep.equal({
        status: 404,
        code: 'NOT_FOUND',
        message: 'Quiz not found'
      })
    })

    it('handles 403 private quiz error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({ error: 'Access denied' }))
      })

      const result = await store.dispatch(fetchQuiz({
        slug: 'private-quiz',
        quizType: 'code'
      }))

      expect(result.type).equal('quiz/fetch/rejected')
      expect(result.payload).deep.equal({
        status: 403,
        code: 'PRIVATE_QUIZ',
        message: 'Access denied'
      })
    })

    it('handles server error (5xx)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve(JSON.stringify({ error: 'Internal server error' }))
      })

      const result = await store.dispatch(fetchQuiz({
        slug: 'test-quiz',
        quizType: 'code'
      }))

      expect(result.type).equal('quiz/fetch/rejected')
      expect(result.payload).deep.equal({
        status: 500,
        code: 'SERVER_ERROR',
        message: 'Server error. Please try again later.'
      })
    })

    it('handles network error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Failed to fetch'))

      const result = await store.dispatch(fetchQuiz({
        slug: 'test-quiz',
        quizType: 'code'
      }))

      expect(result.type).equal('quiz/fetch/rejected')
      expect(result.payload).deep.equal({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.'
      })
    })

    it('handles request cancellation', async () => {
      // Mock a cancelled request by throwing AbortError
      fetchMock.mockRejectedValueOnce(new Error('aborted'))

      const result = await store.dispatch(fetchQuiz({
        slug: 'cancelled-quiz',
        quizType: 'code'
      }))

      expect(result.type).equal('quiz/fetch/rejected')
      expect(result.payload).deep.equal({
        status: 499,
        code: 'CANCELLED',
        message: 'Request was cancelled'
      })
    })

    it('handles invalid response format', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve('invalid json')
      })

      const result = await store.dispatch(fetchQuiz({
        slug: 'test-quiz',
        quizType: 'code'
      }))

      expect(result.type).equal('quiz/fetch/rejected')
      expect(result.payload).deep.equal({
        status: 500,
        code: 'INVALID_RESPONSE',
        message: 'Invalid response format'
      })
    })

    it('handles invalid quiz data (no questions array)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ title: 'Test Quiz' }) // Missing questions array
      })

      const result = await store.dispatch(fetchQuiz({
        slug: 'test-quiz',
        quizType: 'code'
      }))

      expect(result.type).equal('quiz/fetch/rejected')
      expect(result.payload).deep.equal({
        status: 500,
        code: 'INVALID_QUIZ_DATA',
        message: 'Invalid quiz data: questions array is required'
      })
    })

    it('handles timeout error', async () => {
      // Mock AbortError for timeout
      fetchMock.mockRejectedValueOnce(new Error('aborted'))

      const result = await store.dispatch(fetchQuiz({
        slug: 'test-quiz',
        quizType: 'code'
      }))

      expect(result.type).equal('quiz/fetch/rejected')
      expect(result.payload.code).equal('CANCELLED')
    })
  })

  describe('State Management for Errors', () => {
    it('sets status to "not-found" for NOT_FOUND errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(JSON.stringify({ error: 'Not found' }))
      })

      await store.dispatch(fetchQuiz({
        slug: 'not-found-quiz',
        quizType: 'code'
      }))

      const state = store.getState() as RootState
      expect(state.quiz.status).equal('not-found')
      expect(state.quiz.error).to.have.property('code', 'NOT_FOUND')
      expect(state.quiz.error).to.have.property('message', 'Not found')
      expect(state.quiz.error).to.have.property('status', 404)
      expect(state.quiz.error).to.have.property('timestamp').that.is.a('number')
    })

    it('sets status to "requires-auth" for PRIVATE_QUIZ errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({ error: 'Private quiz' }))
      })

      await store.dispatch(fetchQuiz({
        slug: 'private-quiz',
        quizType: 'code'
      }))

      const state = store.getState() as RootState
      expect(state.quiz.status).equal('requires-auth')
      expect(state.quiz.error?.code).equal('PRIVATE_QUIZ')
    })

    it('sets status to "failed" for other errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve(JSON.stringify({ error: 'Server error' }))
      })

      await store.dispatch(fetchQuiz({
        slug: 'error-quiz',
        quizType: 'code'
      }))

      const state = store.getState() as RootState
      expect(state.quiz.status).equal('failed')
      expect(state.quiz.error?.code).equal('SERVER_ERROR')
    })

    it('sets status to "idle" for cancelled requests', async () => {
      fetchMock.mockRejectedValueOnce(new Error('aborted'))

      await store.dispatch(fetchQuiz({
        slug: 'cancelled-quiz',
        quizType: 'code'
      }))

      const state = store.getState() as RootState
      expect(state.quiz.status).equal('idle')
      expect(state.quiz.error).to.be.null
    })

    it('clears error when resetQuiz is dispatched', async () => {
      // First set an error
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(JSON.stringify({ error: 'Not found' }))
      })

      await store.dispatch(fetchQuiz({
        slug: 'not-found-quiz',
        quizType: 'code'
      }))

      expect(store.getState().quiz.error).not.to.be.null

      // Then reset
      store.dispatch(resetQuiz())

      expect(store.getState().quiz.error).to.be.null
      expect(store.getState().quiz.status).equal('idle')
    })
  })

  describe('Selectors', () => {
    it('selectQuizSliceError returns the error from state', () => {
      const mockError = {
        code: 'NOT_FOUND',
        message: 'Quiz not found',
        status: 404,
        timestamp: Date.now()
      }

      // Set up state with error
      store = configureStore({
        reducer: {
          quiz: quizReducer
        },
        preloadedState: {
          quiz: {
            ...store.getState().quiz,
            error: mockError
          }
        } as any
      })

      const error = selectQuizSliceError(store.getState() as RootState)
      expect(error).deep.equal(mockError)
    })

    it('selectQuizSliceError returns null when no error', () => {
      const error = selectQuizSliceError(store.getState() as RootState)
      expect(error).to.be.null
    })

    it('selectQuizStatus returns the current status', () => {
      const status = selectQuizStatus(store.getState() as RootState)
      expect(status).equal('idle')
    })
  })

  describe('Successful fetchQuiz', () => {
    it('clears error on successful fetch', async () => {
      // First set an error
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(JSON.stringify({ error: 'Not found' }))
      })

      await store.dispatch(fetchQuiz({
        slug: 'not-found-quiz',
        quizType: 'code'
      }))

      expect(store.getState().quiz.error).not.to.be.null

      // Then successfully fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          title: 'Test Quiz',
          questions: [{ id: '1', question: 'Test question?' }]
        })
      })

      await store.dispatch(fetchQuiz({
        slug: 'success-quiz',
        quizType: 'code'
      }))

      const state = store.getState() as RootState
      expect(state.quiz.error).to.be.null
      expect(state.quiz.status).equal('succeeded')
    })
  })
})