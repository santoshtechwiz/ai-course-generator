// @ts-nocheck
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import quizReducer, { setQuiz, saveAnswer, submitQuiz, saveQuizResultsToDB } from '../quiz-slice'

function makeStore(initialState = {}) {
  return configureStore({
    reducer: { quiz: quizReducer },
    preloadedState: initialState,
  })
}

describe('quiz critical paths', () => {
  let originalFetch: any

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('returns requiresAuth payload when server responds 401 on submit', async () => {
    const store = makeStore()

    store.dispatch(setQuiz({
      slug: 'auth-quiz',
      quizType: 'mcq' as any,
      title: 'Auth Quiz',
      questions: [ { id: 'q1', question: 'Q1', answer: 'a', options: ['a','b'], type: 'mcq' } ]
    }))

    // No answers to simulate unauthenticated submit -> server returns 401
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '',
      json: async () => ({ error: 'auth required' }),
    })

    const resAction = await store.dispatch(submitQuiz() as any)
    expect(resAction.type.endsWith('/fulfilled')).toBe(true)
    const payload = resAction.payload as any
    expect(payload.requiresAuth).toBe(true)
    expect(payload.tempResults).toBe(true)
  })

  it('rejects submitQuiz when server returns 500', async () => {
    const store = makeStore()

    store.dispatch(setQuiz({
      slug: 'server-err-quiz',
      quizType: 'mcq' as any,
      title: 'Server Err Quiz',
      questions: [ { id: 'q1', question: 'Q1', answer: 'a', options: ['a','b'], type: 'mcq' } ]
    }))

    // Answer first question
    store.dispatch(saveAnswer({ questionId: 'q1', answer: '', selectedOptionId: 'a', timeSpent: 1 }))

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => JSON.stringify({ error: 'server failure' }),
      json: async () => ({ error: 'server failure' }),
    })

    const resAction = await store.dispatch(submitQuiz() as any)
    expect(resAction.type.endsWith('/rejected')).toBe(true)
    const payload = resAction.payload as any
    expect(payload).toBeDefined()
    expect(payload.error).toContain('server failure')
  })

  it('saveQuizResultsToDB fulfills and maps percentage & accuracy from server', async () => {
    const store = makeStore()

    const results = {
      slug: 'save-quiz',
      quizType: 'mcq',
      score: 1,
      maxScore: 2,
      percentage: 50,
      submittedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      answers: [],
      results: [],
      totalTime: 0,
      accuracy: 0,
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { percentageScore: 80, accuracy: 0.8 } }),
      text: async () => JSON.stringify({ result: { percentageScore: 80, accuracy: 0.8 } })
    })

    const resAction = await store.dispatch(saveQuizResultsToDB(results as any) as any)
    expect(resAction.type.endsWith('/fulfilled')).toBe(true)
    const payload = resAction.payload as any
    expect(payload.percentage).toBe(80)
    expect(payload.accuracy).toBe(0.8)
  })
})
