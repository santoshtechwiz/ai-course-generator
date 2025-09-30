// @ts-nocheck
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import quizReducer, { setQuiz, saveAnswer, submitQuiz } from '../quiz-slice'

function makeStore(initialState = {}) {
  return configureStore({
    reducer: { quiz: quizReducer },
    preloadedState: initialState,
  })
}

describe('quiz submission - extra types', () => {
  let originalFetch: any

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('submits true/false style MCQ correctly', async () => {
    const store = makeStore()

    store.dispatch(setQuiz({
      slug: 'tf-quiz',
      quizType: 'mcq' as any,
      title: 'True False Quiz',
      questions: [
        { id: 'q1', question: 'Is sky blue?', answer: 'True', options: ['True', 'False'], type: 'mcq' },
        { id: 'q2', question: 'Is grass red?', answer: 'False', options: ['True', 'False'], type: 'mcq' },
      ],
    }))

    // Answer first correct, second incorrect
    store.dispatch(saveAnswer({ questionId: 'q1', answer: '', selectedOptionId: 'True', timeSpent: 3 }))
    store.dispatch(saveAnswer({ questionId: 'q2', answer: '', selectedOptionId: 'True', timeSpent: 2 }))

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ result: { percentageScore: 50, accuracy: 0.5 } }),
    })

    const resAction = await store.dispatch(submitQuiz() as any)
    expect(resAction.type.endsWith('/fulfilled')).toBe(true)
    const payload = resAction.payload as any

    expect(payload.results).toHaveLength(2)
    expect(payload.score).toBe(1)
    const r1 = payload.results.find((r: any) => r.questionId === 'q1')
    const r2 = payload.results.find((r: any) => r.questionId === 'q2')
    expect(r1.skipped).toBe(false)
    expect(r2.skipped).toBe(false)
  })

  it('submits blanks quiz and marks skipped answers', async () => {
    const store = makeStore()

    store.dispatch(setQuiz({
      slug: 'blanks-quiz',
      quizType: 'blanks' as any,
      title: 'Blanks Quiz',
      questions: [
        { id: 'b1', question: 'Fill: Hello _', answer: 'World', type: 'blanks' },
        { id: 'b2', question: 'Fill: Foo _', answer: 'Bar', type: 'blanks' },
      ],
    }))

    // Answer only first (case-insensitive)
    store.dispatch(saveAnswer({ questionId: 'b1', answer: 'World', timeSpent: 4 }))

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ result: { percentageScore: 50, accuracy: 0.5 } }),
    })

    const resAction = await store.dispatch(submitQuiz() as any)
    expect(resAction.type.endsWith('/fulfilled')).toBe(true)
    const payload = resAction.payload as any

    expect(payload.results).toHaveLength(2)
    const r1 = payload.results.find((r: any) => r.questionId === 'b1')
    const r2 = payload.results.find((r: any) => r.questionId === 'b2')
    expect(r1.isCorrect).toBe(true)
    expect(r2.skipped).toBe(true)
    expect(payload.score).toBe(1)
  })

  it('submits openended quiz with explicit correctness', async () => {
    const store = makeStore()

    store.dispatch(setQuiz({
      slug: 'oe-quiz',
      quizType: 'openended' as any,
      title: 'Open Ended Quiz',
      questions: [
        { id: 'o1', question: 'Explain X', answer: 'Answer A', type: 'openended' },
        { id: 'o2', question: 'Explain Y', answer: 'Answer B', type: 'openended' },
      ],
    }))

    // For openended, saveAnswer will compare userAnswer to correct answer
    store.dispatch(saveAnswer({ questionId: 'o1', answer: 'Answer A', timeSpent: 6 }))
    // leave o2 unanswered

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ result: { percentageScore: 50, accuracy: 0.5 } }),
    })

    const resAction = await store.dispatch(submitQuiz() as any)
    expect(resAction.type.endsWith('/fulfilled')).toBe(true)
    const payload = resAction.payload as any

    expect(payload.results).toHaveLength(2)
    const r1 = payload.results.find((r: any) => r.questionId === 'o1')
    const r2 = payload.results.find((r: any) => r.questionId === 'o2')
    expect(r1.isCorrect).toBe(true)
    expect(r2.skipped).toBe(true)
    expect(payload.score).toBe(1)
  })
})
