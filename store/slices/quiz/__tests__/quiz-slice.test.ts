// @ts-nocheck
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import quizReducer, { setQuiz, saveAnswer, submitQuiz } from '../quiz-slice'

// Small helper to create a store with the quiz reducer
function makeStore(initialState = {}) {
  return configureStore({
    reducer: {
      quiz: quizReducer,
    },
    preloadedState: initialState,
  })
}

describe('quiz submit flow', () => {
  let originalFetch: any

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('handles missing answers without throwing and marks skipped questions', async () => {
    const store = makeStore()

    // Create a quiz with two questions
    store.dispatch(setQuiz({
      slug: 'test-quiz',
      quizType: 'mcq' as any,
      title: 'Test Quiz',
      questions: [
        { id: 'q1', question: 'Q1', answer: 'a', options: ['a', 'b'], type: 'mcq' },
        { id: 'q2', question: 'Q2', answer: 'b', options: ['a', 'b'], type: 'mcq' },
      ],
    }))

    // Only answer the first question
    store.dispatch(saveAnswer({ questionId: 'q1', answer: '', selectedOptionId: 'a', timeSpent: 5 }))

    // Mock fetch to accept submission and return empty body
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ result: { percentageScore: 50, accuracy: 0.5 } }),
    })

    const resAction = await store.dispatch(submitQuiz() as any)

    // Should be fulfilled
    expect(resAction.type.endsWith('/fulfilled')).toBe(true)

    const payload = resAction.payload as any

    // Expect results for both questions
    expect(payload.results).toHaveLength(2)

    // First question should not be skipped
    const r1 = payload.results.find((r: any) => r.questionId === 'q1')
    const r2 = payload.results.find((r: any) => r.questionId === 'q2')

    expect(r1.skipped).toBe(false)
    // Second question was not answered -> skipped true
    expect(r2.skipped).toBe(true)

    // Score should be computed (first answer correct -> score >= 0)
    expect(typeof payload.score).toBe('number')
  })

  it('computes score correctly for fully answered quiz', async () => {
    const store = makeStore()

    // Create a quiz with two questions
    store.dispatch(setQuiz({
      slug: 'test-quiz-2',
      quizType: 'mcq' as any,
      title: 'Test Quiz 2',
      questions: [
        { id: 'q1', question: 'Q1', answer: 'a', options: ['a', 'b'], type: 'mcq' },
        { id: 'q2', question: 'Q2', answer: 'b', options: ['a', 'b'], type: 'mcq' },
      ],
    }))

    // Answer both questions (one correct, one incorrect)
    store.dispatch(saveAnswer({ questionId: 'q1', answer: '', selectedOptionId: 'a', timeSpent: 2 }))
    store.dispatch(saveAnswer({ questionId: 'q2', answer: '', selectedOptionId: 'a', timeSpent: 3 }))

    // Mock fetch response
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ result: { percentageScore: 50, accuracy: 0.5 } }),
    })

    const resAction = await store.dispatch(submitQuiz() as any)
    expect(resAction.type.endsWith('/fulfilled')).toBe(true)

    const payload = resAction.payload as any

    // score should be 1 (only q1 correct)
    expect(payload.score).toBe(1)
    expect(payload.maxScore).toBe(2)
    expect(payload.results).toHaveLength(2)
  })
})
