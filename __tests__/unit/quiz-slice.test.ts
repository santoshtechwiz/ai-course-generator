/**
 * Quiz Slice Unit Tests
 *
 * Tests Redux slice actions, reducers, and selectors
 */

import { configureStore } from '@reduxjs/toolkit'
import { quizSlice, fetchQuiz, submitQuiz, resetQuiz, saveAnswer, setCurrentQuestionIndex } from '@/store/slices/quiz/quiz-slice'
import { createMockQuiz, mockFetch, mockFetchError } from '../../utils/test-utils'
import { waitFor } from '@testing-library/react'

describe('Quiz Slice', () => {
  const mockQuiz = createMockQuiz()

  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        quiz: quizSlice.reducer,
      },
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().quiz

      expect(state.slug).toBeNull()
      expect(state.quizType).toBeNull()
      expect(state.title).toBe('')
      expect(state.questions).toEqual([])
      expect(state.currentQuestionIndex).toBe(0)
      expect(state.answers).toEqual({})
      expect(state.results).toBeNull()
      expect(state.isCompleted).toBe(false)
      expect(state.status).toBe('idle')
      expect(state.error).toBeNull()
      expect(state.requiresAuth).toBe(false)
      expect(state.redirectAfterLogin).toBeNull()
      expect(state.userId).toBeNull()
    })
  })

  describe('fetchQuiz', () => {
    it('should handle fetchQuiz.pending', () => {
      store.dispatch(fetchQuiz({ slug: 'test-slug', quizType: 'code' }))

      const state = store.getState().quiz
      expect(state.status).toBe('loading')
      expect(state.error).toBeNull()
    })

    it('should handle fetchQuiz.fulfilled', async () => {
      mockFetch(mockQuiz)

      await store.dispatch(fetchQuiz({ slug: mockQuiz.slug, quizType: 'code' }))

      const state = store.getState().quiz
      expect(state.status).toBe('succeeded')
      expect(state.slug).toBe(mockQuiz.slug)
      expect(state.quizType).toBe('code')
      expect(state.title).toBe(mockQuiz.title)
      expect(state.questions).toEqual(mockQuiz.questions)
      expect(state.isInitialized).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should handle fetchQuiz.rejected', async () => {
      mockFetchError('Network error')

      try {
        await store.dispatch(fetchQuiz({ slug: 'test-slug', quizType: 'code' }))
      } catch (error) {
        // Expected to reject
      }

      const state = store.getState().quiz
      expect(state.status).toBe('failed')
      expect(state.error).toBe('Network error')
      expect(state.isInitialized).toBe(true)
    })
  })

  describe('saveAnswer', () => {
    beforeEach(async () => {
      mockFetch(mockQuiz)
      await store.dispatch(fetchQuiz({ slug: mockQuiz.slug, quizType: 'code' }))
    })

    it('should save MCQ answer', () => {
      const answer = {
        questionId: 'q1',
        selectedOptionId: 'option1',
        userAnswer: 'Option 1',
        isCorrect: true,
        type: 'mcq',
        timestamp: Date.now(),
        timeSpent: 30,
      }

      store.dispatch(saveAnswer(answer))

      const state = store.getState().quiz
      expect(state.answers['q1']).toEqual(answer)
    })

    it('should save code answer', () => {
      const answer = {
        questionId: 'q2',
        selectedOptionId: null,
        userAnswer: 'function test() { return true; }',
        isCorrect: false,
        type: 'code',
        timestamp: Date.now(),
        timeSpent: 120,
      }

      store.dispatch(saveAnswer(answer))

      const state = store.getState().quiz
      expect(state.answers['q2']).toEqual(answer)
    })

    it('should update existing answer', () => {
      const initialAnswer = {
        questionId: 'q1',
        selectedOptionId: 'option1',
        userAnswer: 'Option 1',
        isCorrect: false,
        type: 'mcq',
        timestamp: Date.now(),
        timeSpent: 30,
      }

      const updatedAnswer = {
        ...initialAnswer,
        selectedOptionId: 'option2',
        userAnswer: 'Option 2',
        isCorrect: true,
        timeSpent: 60,
      }

      store.dispatch(saveAnswer(initialAnswer))
      store.dispatch(saveAnswer(updatedAnswer))

      const state = store.getState().quiz
      expect(state.answers['q1']).toEqual(updatedAnswer)
    })
  })

  describe('setCurrentQuestionIndex', () => {
    beforeEach(async () => {
      mockFetch(mockQuiz)
      await store.dispatch(fetchQuiz({ slug: mockQuiz.slug, quizType: 'code' }))
    })

    it('should set current question index', () => {
      store.dispatch(setCurrentQuestionIndex(1))

      const state = store.getState().quiz
      expect(state.currentQuestionIndex).toBe(1)
    })

    it('should not set index out of bounds', () => {
      store.dispatch(setCurrentQuestionIndex(10)) // Beyond array length

      const state = store.getState().quiz
      expect(state.currentQuestionIndex).toBe(0) // Should remain at 0
    })

    it('should not set negative index', () => {
      store.dispatch(setCurrentQuestionIndex(-1))

      const state = store.getState().quiz
      expect(state.currentQuestionIndex).toBe(0) // Should remain at 0
    })
  })

  describe('resetQuiz', () => {
    beforeEach(async () => {
      mockFetch(mockQuiz)
      await store.dispatch(fetchQuiz({ slug: mockQuiz.slug, quizType: 'code' }))

      // Add some state changes
      store.dispatch(saveAnswer({
        questionId: 'q1',
        selectedOptionId: 'option1',
        userAnswer: 'test',
        isCorrect: true,
        type: 'mcq',
        timestamp: Date.now(),
        timeSpent: 30,
      }))
      store.dispatch(setCurrentQuestionIndex(1))
    })

    it('should reset quiz state', () => {
      store.dispatch(resetQuiz())

      const state = store.getState().quiz
      expect(state.answers).toEqual({})
      expect(state.currentQuestionIndex).toBe(0)
      expect(state.isCompleted).toBe(false)
      expect(state.results).toBeNull()
      expect(state.status).toBe('idle')
      expect(state.error).toBeNull()
      expect(state.requiresAuth).toBe(false)
      expect(state.redirectAfterLogin).toBeNull()
    })

    it('should preserve quiz data when keepResults is true', () => {
      // Mark quiz as completed with results
      const mockResults = {
        slug: mockQuiz.slug,
        quizType: 'code',
        score: 8,
        maxScore: 10,
        percentage: 80,
        submittedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        answers: [],
        results: [],
      }

      store.dispatch(quizSlice.actions.setQuizResults(mockResults))
      store.dispatch(quizSlice.actions.setQuizCompleted(true))

      store.dispatch(resetQuiz({ keepResults: true }))

      const state = store.getState().quiz
      expect(state.results).toEqual(mockResults)
      expect(state.isCompleted).toBe(true)
      expect(state.answers).toEqual({}) // Answers should still be cleared
    })
  })

  describe('submitQuiz', () => {
    beforeEach(async () => {
      mockFetch(mockQuiz)
      await store.dispatch(fetchQuiz({ slug: mockQuiz.slug, quizType: 'code' }))

      // Answer questions
      store.dispatch(saveAnswer({
        questionId: 'q1',
        selectedOptionId: 'option1',
        userAnswer: 'test answer 1',
        isCorrect: true,
        type: 'mcq',
        timestamp: Date.now(),
        timeSpent: 30,
      }))

      store.dispatch(saveAnswer({
        questionId: 'q2',
        selectedOptionId: null,
        userAnswer: 'test answer 2',
        isCorrect: false,
        type: 'code',
        timestamp: Date.now(),
        timeSpent: 60,
      }))
    })

    it('should handle submitQuiz.pending', () => {
      store.dispatch(submitQuiz())

      const state = store.getState().quiz
      expect(state.status).toBe('submitting')
    })

    it('should handle submitQuiz.fulfilled', async () => {
      const mockResults = {
        slug: mockQuiz.slug,
        quizType: 'code',
        score: 8,
        maxScore: 10,
        percentage: 80,
        submittedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        answers: [],
        results: [],
        totalTime: 90,
      }

      // Mock successful submission
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResults),
          text: () => Promise.resolve(JSON.stringify(mockResults)),
        })
      ) as jest.MockedFunction<typeof fetch>

      await store.dispatch(submitQuiz())

      const state = store.getState().quiz
      expect(state.status).toBe('succeeded')
      expect(state.isCompleted).toBe(true)
      expect(state.results).toEqual(mockResults)
    })

    it('should handle submitQuiz.rejected', async () => {
      // Mock submission failure
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' }),
          text: () => Promise.resolve('Server error'),
        })
      ) as jest.MockedFunction<typeof fetch>

      try {
        await store.dispatch(submitQuiz())
      } catch (error) {
        // Expected to reject
      }

      const state = store.getState().quiz
      expect(state.status).toBe('failed')
      expect(state.error).toBe('Failed to submit quiz')
    })
  })

  describe('Selectors', () => {
    beforeEach(async () => {
      mockFetch(mockQuiz)
      await store.dispatch(fetchQuiz({ slug: mockQuiz.slug, quizType: 'code' }))
    })

    it('should select quiz questions', () => {
      const { selectQuizQuestions } = require('@/store/slices/quiz/quiz-slice')
      const questions = selectQuizQuestions(store.getState())

      expect(questions).toEqual(mockQuiz.questions)
    })

    it('should select current question', () => {
      const { selectCurrentQuestion } = require('@/store/slices/quiz/quiz-slice')
      const currentQuestion = selectCurrentQuestion(store.getState())

      expect(currentQuestion).toEqual(mockQuiz.questions[0])
    })

    it('should select quiz answers', () => {
      const { selectQuizAnswers } = require('@/store/slices/quiz/quiz-slice')
      const answers = selectQuizAnswers(store.getState())

      expect(answers).toEqual({})
    })

    it('should select quiz status', () => {
      const { selectQuizStatus } = require('@/store/slices/quiz/quiz-slice')
      const status = selectQuizStatus(store.getState())

      expect(status).toBe('succeeded')
    })

    it('should select quiz title', () => {
      const { selectQuizTitle } = require('@/store/slices/quiz/quiz-slice')
      const title = selectQuizTitle(store.getState())

      expect(title).toBe(mockQuiz.title)
    })

    it('should select current question index', () => {
      const { selectCurrentQuestionIndex } = require('@/store/slices/quiz/quiz-slice')
      const index = selectCurrentQuestionIndex(store.getState())

      expect(index).toBe(0)
    })

    it('should select if quiz is complete', () => {
      const { selectIsQuizComplete } = require('@/store/slices/quiz/quiz-slice')
      const isComplete = selectIsQuizComplete(store.getState())

      expect(isComplete).toBe(false)
    })
  })
})
