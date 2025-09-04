/**
 * Storage Manager Unit Tests
 *
 * Tests the storage manager functionality for quiz persistence
 */

import { storageManager } from '@/utils/storage-manager'
import { createMockQuiz } from '../utils/test-utils'

describe('Storage Manager', () => {
  const mockQuiz = createMockQuiz()
  const mockResults = {
    slug: mockQuiz.slug,
    quizType: mockQuiz.quizType,
    score: 8,
    maxScore: 10,
    percentage: 80,
    submittedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    answers: [
      {
        questionId: 'q1',
        selectedOptionId: 'option1',
        userAnswer: 'test answer',
        isCorrect: true,
        timeSpent: 30,
      },
    ],
    results: [],
    totalTime: 90,
  }

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('Quiz Progress Storage', () => {
    it('should save quiz progress', () => {
      const progress = {
        courseId: mockQuiz.slug,
        quizType: mockQuiz.quizType,
        currentQuestionIndex: 1,
        answers: {
          'q1': {
            questionId: 'q1',
            selectedOptionId: 'option1',
            userAnswer: 'test',
            isCorrect: true,
            type: 'mcq',
            timestamp: Date.now(),
            timeSpent: 30,
          },
        },
        lastUpdated: Date.now(),
      }

      storageManager.saveQuizProgress(mockQuiz.slug, mockQuiz.quizType, progress)

      const saved = storageManager.getQuizProgress(mockQuiz.slug, mockQuiz.quizType)
      expect(saved).toEqual(progress)
    })

    it('should retrieve quiz progress', () => {
      const progress = {
        courseId: mockQuiz.slug,
        quizType: mockQuiz.quizType,
        currentQuestionIndex: 2,
        answers: {},
        lastUpdated: Date.now(),
      }

      storageManager.saveQuizProgress(mockQuiz.slug, mockQuiz.quizType, progress)

      const retrieved = storageManager.getQuizProgress(mockQuiz.slug, mockQuiz.quizType)
      expect(retrieved).toEqual(progress)
    })

    it('should return null for non-existent quiz progress', () => {
      const progress = storageManager.getQuizProgress('non-existent', 'code')
      expect(progress).toBeNull()
    })

    it('should clear quiz progress', () => {
      const progress = {
        courseId: mockQuiz.slug,
        quizType: mockQuiz.quizType,
        currentQuestionIndex: 1,
        answers: {},
        lastUpdated: Date.now(),
      }

      storageManager.saveQuizProgress(mockQuiz.slug, mockQuiz.quizType, progress)
      expect(storageManager.getQuizProgress(mockQuiz.slug, mockQuiz.quizType)).toEqual(progress)

      storageManager.clearQuizProgress(mockQuiz.slug, mockQuiz.quizType)
      expect(storageManager.getQuizProgress(mockQuiz.slug, mockQuiz.quizType)).toBeNull()
    })
  })

  describe('Temp Quiz Results Storage', () => {
    it('should save temp quiz results', () => {
      storageManager.saveTempQuizResults(mockQuiz.slug, mockQuiz.quizType, mockResults)

      const saved = storageManager.getTempQuizResults(mockQuiz.slug, mockQuiz.quizType)
      expect(saved).toEqual(mockResults)
    })

    it('should retrieve temp quiz results', () => {
      storageManager.saveTempQuizResults(mockQuiz.slug, mockQuiz.quizType, mockResults)

      const retrieved = storageManager.getTempQuizResults(mockQuiz.slug, mockQuiz.quizType)
      expect(retrieved).toEqual(mockResults)
    })

    it('should return null for non-existent temp results', () => {
      const results = storageManager.getTempQuizResults('non-existent', 'code')
      expect(results).toBeNull()
    })

    it('should clear temp quiz results', () => {
      storageManager.saveTempQuizResults(mockQuiz.slug, mockQuiz.quizType, mockResults)
      expect(storageManager.getTempQuizResults(mockQuiz.slug, mockQuiz.quizType)).toEqual(mockResults)

      storageManager.clearTempQuizResults(mockQuiz.slug, mockQuiz.quizType)
      expect(storageManager.getTempQuizResults(mockQuiz.slug, mockQuiz.quizType)).toBeNull()
    })

    it('should handle expired temp results', () => {
      // Mock Date.now to return a time in the past
      const originalDateNow = Date.now
      const pastTime = Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago

      // Create a mock result with old timestamp
      const oldResults = {
        ...mockResults,
        __timestamp: pastTime,
      }

      // Manually set localStorage to simulate old data
      localStorage.setItem(
        `temp_quiz_results_${mockQuiz.slug}_${mockQuiz.quizType}`,
        JSON.stringify(oldResults)
      )

      // Mock Date.now to current time
      Date.now = jest.fn(() => pastTime + (25 * 60 * 60 * 1000))

      const retrieved = storageManager.getTempQuizResults(mockQuiz.slug, mockQuiz.quizType)
      expect(retrieved).toBeNull() // Should be null because it's expired

      // Restore original Date.now
      Date.now = originalDateNow
    })
  })

  describe('General Storage Operations', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded')
      })

      expect(() => {
        storageManager.saveQuizProgress(mockQuiz.slug, mockQuiz.quizType, {
          courseId: mockQuiz.slug,
          quizType: mockQuiz.quizType,
          currentQuestionIndex: 0,
          answers: {},
          lastUpdated: Date.now(),
        })
      }).not.toThrow()

      // Restore original localStorage
      localStorage.setItem = originalSetItem
    })

    it('should handle corrupted localStorage data', () => {
      // Set corrupted JSON data
      localStorage.setItem(
        `quiz_progress_${mockQuiz.slug}_${mockQuiz.quizType}`,
        'invalid json'
      )

      const progress = storageManager.getQuizProgress(mockQuiz.slug, mockQuiz.quizType)
      expect(progress).toBeNull()
    })

    it('should handle missing localStorage', () => {
      // Mock localStorage as undefined
      const originalLocalStorage = global.localStorage
      delete (global as any).localStorage

      expect(() => {
        storageManager.saveQuizProgress(mockQuiz.slug, mockQuiz.quizType, {
          courseId: mockQuiz.slug,
          quizType: mockQuiz.quizType,
          currentQuestionIndex: 0,
          answers: {},
          lastUpdated: Date.now(),
        })
      }).not.toThrow()

      // Restore localStorage
      global.localStorage = originalLocalStorage
    })
  })

  describe('Storage Cleanup', () => {
    it('should clean up expired data', () => {
      const currentTime = Date.now()

      // Set up some data with different timestamps
      const recentData = {
        courseId: mockQuiz.slug,
        quizType: mockQuiz.quizType,
        currentQuestionIndex: 0,
        answers: {},
        lastUpdated: currentTime,
      }

      const oldData = {
        courseId: 'old-quiz',
        quizType: 'code',
        currentQuestionIndex: 0,
        answers: {},
        lastUpdated: currentTime - (8 * 24 * 60 * 60 * 1000), // 8 days ago
      }

      storageManager.saveQuizProgress(mockQuiz.slug, mockQuiz.quizType, recentData)
      storageManager.saveQuizProgress('old-quiz', 'code', oldData)

      // Mock Date.now to be 7 days later
      const originalDateNow = Date.now
      Date.now = jest.fn(() => currentTime + (7 * 24 * 60 * 60 * 1000))

      storageManager.cleanup()

      // Recent data should still exist
      expect(storageManager.getQuizProgress(mockQuiz.slug, mockQuiz.quizType)).toEqual(recentData)

      // Old data should be cleaned up
      expect(storageManager.getQuizProgress('old-quiz', 'code')).toBeNull()

      // Restore Date.now
      Date.now = originalDateNow
    })

    it('should limit stored items', () => {
      // Save many quiz progress items
      for (let i = 0; i < 150; i++) {
        const progress = {
          courseId: `quiz-${i}`,
          quizType: 'code',
          currentQuestionIndex: 0,
          answers: {},
          lastUpdated: Date.now(),
        }
        storageManager.saveQuizProgress(`quiz-${i}`, 'code', progress)
      }

      // Should have cleaned up old items to stay within limit
      let itemCount = 0
      for (let i = 0; i < 150; i++) {
        if (storageManager.getQuizProgress(`quiz-${i}`, 'code')) {
          itemCount++
        }
      }

      // Should be close to the max limit (allowing some buffer)
      expect(itemCount).toBeLessThanOrEqual(110) // Max is 100, allowing some buffer
    })
  })

  describe('Data Integrity', () => {
    it('should validate quiz progress data structure', () => {
      const invalidProgress = {
        courseId: mockQuiz.slug,
        // Missing required fields
      }

      // Should handle invalid data gracefully
      localStorage.setItem(
        `quiz_progress_${mockQuiz.slug}_${mockQuiz.quizType}`,
        JSON.stringify(invalidProgress)
      )

      const retrieved = storageManager.getQuizProgress(mockQuiz.slug, mockQuiz.quizType)
      expect(retrieved).toBeNull()
    })

    it('should handle large data sets', () => {
      const largeAnswers = {}
      for (let i = 0; i < 100; i++) {
        largeAnswers[`q${i}`] = {
          questionId: `q${i}`,
          selectedOptionId: `option${i}`,
          userAnswer: `Answer ${i}`.repeat(100), // Large answer
          isCorrect: i % 2 === 0,
          type: 'code',
          timestamp: Date.now(),
          timeSpent: 30,
        }
      }

      const largeProgress = {
        courseId: mockQuiz.slug,
        quizType: mockQuiz.quizType,
        currentQuestionIndex: 50,
        answers: largeAnswers,
        lastUpdated: Date.now(),
      }

      expect(() => {
        storageManager.saveQuizProgress(mockQuiz.slug, mockQuiz.quizType, largeProgress)
      }).not.toThrow()

      const retrieved = storageManager.getQuizProgress(mockQuiz.slug, mockQuiz.quizType)
      expect(retrieved).toEqual(largeProgress)
    })
  })
})
