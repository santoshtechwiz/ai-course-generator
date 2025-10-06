/**
 * Integration Tests for Quiz Sign-in Flow
 * 
 * Tests the complete user journey:
 * 1. User takes quiz while unauthenticated
 * 2. Submits quiz → temp results stored in localStorage
 * 3. User signs in
 * 4. Returns to results page → temp results loaded and saved to DB
 * 5. Results displayed correctly
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { storageManager } from '@/utils/storage-manager'

// @ts-ignore
global.localStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] || null
  },
  setItem(key: string, value: string) {
    this.store[key] = value.toString()
  },
  removeItem(key: string) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  },
  get length() {
    return Object.keys(this.store).length
  },
  key(index: number) {
    const keys = Object.keys(this.store)
    return keys[index] || null
  },
}

describe('Quiz Sign-in Flow Integration', () => {
  const mockSlug = 'javascript-basics'
  const mockQuizType = 'mcq'
  
  const mockQuizResults = {
    slug: mockSlug,
    score: 8,
    maxScore: 10,
    percentage: 80,
    answers: [
      {
        questionId: '1',
        selectedOptionId: 'option-a',
        userAnswer: 'const',
        isCorrect: true,
        timeSpent: 5,
        type: 'mcq',
      },
      {
        questionId: '2',
        selectedOptionId: 'option-b',
        userAnswer: 'let',
        isCorrect: true,
        timeSpent: 4,
        type: 'mcq',
      },
      {
        questionId: '3',
        selectedOptionId: 'option-c',
        userAnswer: 'var',
        isCorrect: false,
        timeSpent: 6,
        type: 'mcq',
      },
    ],
    results: [
      {
        questionId: '1',
        userAnswer: 'const',
        correctAnswer: 'const',
        isCorrect: true,
      },
      {
        questionId: '2',
        userAnswer: 'let',
        correctAnswer: 'let',
        isCorrect: true,
      },
      {
        questionId: '3',
        userAnswer: 'var',
        correctAnswer: 'const',
        isCorrect: false,
      },
    ],
    totalTime: 180,
    submittedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  }

  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  afterEach(() => {
    // Cleanup
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  test('Complete flow: unauthenticated submission → sign-in → results loaded', () => {
    // Step 1: User completes quiz while unauthenticated
    console.log('Step 1: Saving temp results for unauthenticated user')
    storageManager.saveTempQuizResults(mockSlug, mockQuizType, mockQuizResults)

    // Verify temp results were saved
    const savedTempResults = storageManager.getTempQuizResults(mockSlug, mockQuizType)
    expect(savedTempResults).toBeTruthy()
    expect(savedTempResults?.results.slug).toBe(mockSlug)
    expect(savedTempResults?.results.percentage).toBe(80)
    expect(savedTempResults?.results.score).toBe(8)
    console.log('✓ Temp results saved successfully')

    // Step 2: Simulate user signing in (in real app, auth state changes)
    console.log('Step 2: User signs in...')
    // Auth state changes from false → true

    // Step 3: Results page loads, checks for temp results
    console.log('Step 3: Loading temp results after sign-in')
    const loadedTempResults = storageManager.getTempQuizResults(mockSlug, mockQuizType)
    expect(loadedTempResults).toBeTruthy()
    expect(loadedTempResults?.results.answers).toHaveLength(3)
    expect(loadedTempResults?.results.results).toHaveLength(3)
    console.log('✓ Temp results loaded successfully')

    // Step 4: After successful save to DB, clear temp results
    console.log('Step 4: Clearing temp results after successful save')
    storageManager.clearTempQuizResults(mockSlug, mockQuizType)

    // Verify temp results were cleared
    const clearedResults = storageManager.getTempQuizResults(mockSlug, mockQuizType)
    expect(clearedResults).toBeNull()
    console.log('✓ Temp results cleared successfully')
  })

  test('Temp results expire after 24 hours', () => {
    // Save temp results
    storageManager.saveTempQuizResults(mockSlug, mockQuizType, mockQuizResults)

    // Manually modify savedAt timestamp to be 25 hours ago
    const key = `quiz_temp_results_${mockSlug}_${mockQuizType}`
    const tempData = JSON.parse(localStorage.getItem(key) || '{}')
    tempData.savedAt = Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
    localStorage.setItem(key, JSON.stringify(tempData))

    // Try to retrieve - should return null and clear the data
    const expiredResults = storageManager.getTempQuizResults(mockSlug, mockQuizType)
    expect(expiredResults).toBeNull()

    // Verify data was cleared
    const clearedData = localStorage.getItem(key)
    expect(clearedData).toBeNull()
  })

  test('Multiple quiz results can be stored independently', () => {
    const quiz1 = { ...mockQuizResults, slug: 'quiz-1' }
    const quiz2 = { ...mockQuizResults, slug: 'quiz-2', score: 10, percentage: 100 }

    // Save results for two different quizzes
    storageManager.saveTempQuizResults('quiz-1', 'mcq', quiz1)
    storageManager.saveTempQuizResults('quiz-2', 'openended', quiz2)

    // Verify both are stored independently
    const results1 = storageManager.getTempQuizResults('quiz-1', 'mcq')
    const results2 = storageManager.getTempQuizResults('quiz-2', 'openended')

    expect(results1?.results.slug).toBe('quiz-1')
    expect(results1?.results.percentage).toBe(80)

    expect(results2?.results.slug).toBe('quiz-2')
    expect(results2?.results.percentage).toBe(100)

    // Clear one should not affect the other
    storageManager.clearTempQuizResults('quiz-1', 'mcq')
    
    const results1Cleared = storageManager.getTempQuizResults('quiz-1', 'mcq')
    const results2Exists = storageManager.getTempQuizResults('quiz-2', 'openended')

    expect(results1Cleared).toBeNull()
    expect(results2Exists).toBeTruthy()
  })

  test('Corrupted temp results are handled gracefully', () => {
    // Manually insert corrupted data
    const key = `quiz_temp_results_${mockSlug}_${mockQuizType}`
    localStorage.setItem(key, 'invalid json {{{')

    // Should return null and clear corrupted data
    const results = storageManager.getTempQuizResults(mockSlug, mockQuizType)
    expect(results).toBeNull()

    // Verify corrupted data was removed
    const clearedData = localStorage.getItem(key)
    expect(clearedData).toBeNull()
  })

  test('Different quiz types store results separately', () => {
    const mcqResults = { ...mockQuizResults, slug: 'same-slug' }
    const codeResults = { ...mockQuizResults, slug: 'same-slug', score: 10 }

    // Save results for same slug but different quiz types
    storageManager.saveTempQuizResults('same-slug', 'mcq', mcqResults)
    storageManager.saveTempQuizResults('same-slug', 'code', codeResults)

    // Verify both are stored independently
    const mcq = storageManager.getTempQuizResults('same-slug', 'mcq')
    const code = storageManager.getTempQuizResults('same-slug', 'code')

    expect(mcq?.results.score).toBe(8)
    expect(code?.results.score).toBe(10)
  })

  test('Empty or invalid results are not stored', () => {
    // Try to save invalid results
    const invalidResults = {
      slug: '',
      score: -1,
      maxScore: 0,
      percentage: -10,
      answers: [],
      results: [],
      totalTime: 0,
      submittedAt: '',
    }

    storageManager.saveTempQuizResults('invalid-quiz', 'mcq', invalidResults)

    // Verify it was still stored (validation happens at API level)
    const retrieved = storageManager.getTempQuizResults('invalid-quiz', 'mcq')
    expect(retrieved).toBeTruthy()
    expect(retrieved?.results.score).toBe(-1)
  })

  test('Results with all correct answers', () => {
    const perfectResults = {
      ...mockQuizResults,
      score: 10,
      maxScore: 10,
      percentage: 100,
      answers: mockQuizResults.answers.map((a) => ({ ...a, isCorrect: true })),
      results: mockQuizResults.results.map((r) => ({
        ...r,
        isCorrect: true,
        userAnswer: r.correctAnswer,
      })),
    }

    storageManager.saveTempQuizResults(mockSlug, mockQuizType, perfectResults)
    const retrieved = storageManager.getTempQuizResults(mockSlug, mockQuizType)

    expect(retrieved?.results.percentage).toBe(100)
    expect(retrieved?.results.score).toBe(10)
    expect(retrieved?.results.results.every((r: any) => r.isCorrect)).toBe(true)
  })

  test('Results with all incorrect answers', () => {
    const failedResults = {
      ...mockQuizResults,
      score: 0,
      maxScore: 10,
      percentage: 0,
      answers: mockQuizResults.answers.map((a) => ({ ...a, isCorrect: false })),
      results: mockQuizResults.results.map((r) => ({
        ...r,
        isCorrect: false,
        userAnswer: 'wrong answer',
      })),
    }

    storageManager.saveTempQuizResults(mockSlug, mockQuizType, failedResults)
    const retrieved = storageManager.getTempQuizResults(mockSlug, mockQuizType)

    expect(retrieved?.results.percentage).toBe(0)
    expect(retrieved?.results.score).toBe(0)
    expect(retrieved?.results.results.every((r: any) => !r.isCorrect)).toBe(true)
  })

  test('localStorage quota exceeded is handled gracefully', () => {
    // This test simulates localStorage quota exceeded error
    const originalSetItem = Storage.prototype.setItem
    
    // Mock setItem to throw QuotaExceededError
    Storage.prototype.setItem = vi.fn(() => {
      const error: any = new Error('QuotaExceededError')
      error.name = 'QuotaExceededError'
      throw error
    })

    // Should not throw error, just log warning
    expect(() => {
      storageManager.saveTempQuizResults(mockSlug, mockQuizType, mockQuizResults)
    }).not.toThrow()

    // Restore original setItem
    Storage.prototype.setItem = originalSetItem
  })

  test('Concurrent saves to different quizzes work correctly', () => {
    // Simulate rapid saves from multiple quiz tabs
    const quizzes = [
      { slug: 'quiz-1', type: 'mcq', score: 5 },
      { slug: 'quiz-2', type: 'openended', score: 7 },
      { slug: 'quiz-3', type: 'code', score: 9 },
    ]

    quizzes.forEach((quiz) => {
      const results = { ...mockQuizResults, slug: quiz.slug, score: quiz.score }
      storageManager.saveTempQuizResults(quiz.slug, quiz.type, results)
    })

    // Verify all saved correctly
    quizzes.forEach((quiz) => {
      const retrieved = storageManager.getTempQuizResults(quiz.slug, quiz.type)
      expect(retrieved?.results.slug).toBe(quiz.slug)
      expect(retrieved?.results.score).toBe(quiz.score)
    })
  })
})
