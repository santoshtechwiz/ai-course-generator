/**
 * CourseAI Service Unit Tests
 * Tests the unified AI service interface with proper error handling and enum validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateMCQ,
  generateFlashcards,
  generateOrderingQuiz,
  generateFillInBlanks,
  generateOpenEnded,
  generateCourse,
  generateVideoQuiz,
  AIServiceMethod
} from '@/lib/ai/course-ai-service'

// Mock the AIServiceFactory
vi.mock('@/lib/ai/services/AIServiceFactory', () => ({
  AIServiceFactory: {
    createService: vi.fn()
  }
}))

import { AIServiceFactory } from '@/lib/ai/services/AIServiceFactory'

describe('CourseAI Service', () => {
  const mockContext = {
    userId: 'test-user',
    subscriptionPlan: 'FREE' as const,
    isAuthenticated: true,
    credits: 100
  }

  const mockService = {
    generateMultipleChoiceQuiz: vi.fn(),
    generateFlashcards: vi.fn(),
    generateOrderingQuiz: vi.fn(),
    generateFillInTheBlanksQuiz: vi.fn(),
    generateOpenEndedQuestionsQuiz: vi.fn(),
    generateCourseContent: vi.fn(),
    generateSummary: vi.fn(),
    generateVideoQuiz: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(AIServiceFactory.createService as any).mockReturnValue(mockService)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('AIServiceMethod Enum', () => {
    it('should have all required method names', () => {
      expect(AIServiceMethod.GENERATE_MULTIPLE_CHOICE_QUIZ).toBe('generateMultipleChoiceQuiz')
      expect(AIServiceMethod.GENERATE_FLASHCARDS).toBe('generateFlashcards')
      expect(AIServiceMethod.GENERATE_ORDERING_QUIZ).toBe('generateOrderingQuiz')
      expect(AIServiceMethod.GENERATE_FILL_IN_THE_BLANKS_QUIZ).toBe('generateFillInTheBlanksQuiz')
      expect(AIServiceMethod.GENERATE_OPEN_ENDED_QUESTIONS_QUIZ).toBe('generateOpenEndedQuestionsQuiz')
      expect(AIServiceMethod.GENERATE_COURSE_CONTENT).toBe('generateCourseContent')
      expect(AIServiceMethod.GENERATE_SUMMARY).toBe('generateSummary')
      expect(AIServiceMethod.GENERATE_VIDEO_QUIZ).toBe('generateVideoQuiz')
    })
  })

  describe('generateMCQ', () => {
    it('should successfully generate quiz', async () => {
      const mockResult = { success: true, data: { questions: [] } }
      mockService.generateMultipleChoiceQuiz.mockResolvedValue(mockResult)

      const result = await generateMCQ(
        'Test Topic',
        5,
        'medium',
        'user123',
        'FREE',
        100
      )

      expect(result).toEqual([])
      expect(mockService.generateMultipleChoiceQuiz).toHaveBeenCalledWith({
        topic: 'Test Topic',
        numberOfQuestions: 5,
        difficulty: 'medium'
      })
    })

    it('should handle service failure', async () => {
      const mockResult = { success: false, error: 'API Error' }
      mockService.generateMultipleChoiceQuiz.mockResolvedValue(mockResult)

      await expect(generateMCQ(
        'Test Topic',
        5
      )).rejects.toThrow('API Error')
    })

    it('should handle rate limit errors', async () => {
      const mockResult = { success: false, error: 'Rate limit exceeded' }
      mockService.generateMultipleChoiceQuiz.mockResolvedValue(mockResult)

      await expect(generateMCQ(
        'Test Topic',
        5
      )).rejects.toThrow('Rate limit exceeded')
    })

    it('should handle quota exceeded errors', async () => {
      const mockResult = { success: false, error: 'Quota exceeded for this month' }
      mockService.generateMultipleChoiceQuiz.mockResolvedValue(mockResult)

      await expect(generateMCQ(
        'Test Topic',
        5
      )).rejects.toThrow('API quota exceeded. Please upgrade your plan.')
    })

    it('should handle feature unavailable errors', async () => {
      const mockResult = { success: false, error: 'ACCESS_DENIED_FEATURE FLAG NOT FOUND' }
      mockService.generateMultipleChoiceQuiz.mockResolvedValue(mockResult)

      await expect(generateMCQ(
        'Test Topic',
        5
      )).rejects.toThrow('This feature is currently unavailable. Please try again later or contact support.')
    })
  })

  describe('generateFlashcards', () => {
    it('should successfully generate flashcards', async () => {
      const mockResult = { success: true, data: { flashcards: [] } }
      mockService.generateFlashcards.mockResolvedValue(mockResult)

      const result = await generateFlashcards(
        'Test Topic',
        10,
        'user123',
        'FREE',
        100
      )

      expect(result).toEqual({ flashcards: [] })
      expect(mockService.generateFlashcards).toHaveBeenCalledWith({
        topic: 'Test Topic',
        count: 10
      })
    })
  })

  describe('generateOrderingQuiz', () => {
    it('should successfully generate ordering quiz', async () => {
      const mockResult = { success: true, data: {
        title: 'Test Ordering Quiz',
        description: 'Test description',
        steps: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5']
      } }
      mockService.generateOrderingQuiz.mockResolvedValue(mockResult)

      const result = await generateOrderingQuiz(
        'Test Topic',
        'medium',
        'user123',
        'FREE',
        100,
        3
      )

      expect(result).toHaveProperty('questions')
      expect(result.questions).toHaveLength(1)
      expect(result.questions[0]).toHaveProperty('title')
      expect(result.questions[0]).toHaveProperty('steps')
      expect(mockService.generateOrderingQuiz).toHaveBeenCalledWith({
        topic: 'Test Topic',
        difficulty: 'medium',
        numberOfSteps: 5,
        numberOfQuestions: 3
      })
    })
  })

  describe('generateFillInBlanks', () => {
    it('should successfully generate fill-in-the-blanks quiz', async () => {
      const mockResult = { success: true, data: { questions: [] } }
      mockService.generateFillInTheBlanksQuiz.mockResolvedValue(mockResult)

      const result = await generateFillInBlanks(
        'Test Topic',
        5,
        'medium',
        'user123',
        'FREE',
        100
      )

      expect(result).toHaveProperty('questions')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('id')
      expect(mockService.generateFillInTheBlanksQuiz).toHaveBeenCalledWith({
        topic: 'Test Topic',
        numberOfQuestions: 5,
        difficulty: 'medium'
      })
    })
  })

  describe('generateOpenEnded', () => {
    it('should successfully generate open-ended questions', async () => {
      const mockResult = { success: true, data: { questions: [] } }
      mockService.generateOpenEndedQuestionsQuiz.mockResolvedValue(mockResult)

      const result = await generateOpenEnded(
        'Test Topic',
        3,
        'medium',
        'user123',
        'PREMIUM',
        100
      )

      expect(result).toHaveProperty('questions')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('id')
      expect(mockService.generateOpenEndedQuestionsQuiz).toHaveBeenCalledWith({
        topic: 'Test Topic',
        numberOfQuestions: 3,
        difficulty: 'medium'
      })
    })

    it('should reject non-premium users', async () => {
      await expect(generateOpenEnded(
        'Test Topic',
        3,
        'medium',
        'user123',
        'FREE'
      )).rejects.toThrow('Open-ended questions are only available for PREMIUM users. Please upgrade your subscription.')
    })
  })

  describe('generateCourse', () => {
    it('should successfully generate course content', async () => {
      const mockResult = { success: true, data: { content: 'Generated content' } }
      mockService.generateCourseContent.mockResolvedValue(mockResult)

      const result = await generateCourse(
        'Test Topic',
        ['Unit 1', 'Unit 2'],
        'user123',
        'FREE',
        100
      )

      expect(result).toEqual({ content: 'Generated content' })
      expect(mockService.generateCourseContent).toHaveBeenCalledWith({
        topic: 'Test Topic',
        units: ['Unit 1', 'Unit 2']
      })
    })
  })

  describe('generateVideoQuiz', () => {
    it('should successfully generate video quiz', async () => {
      const mockResult = { success: true, data: { questions: [] } }
      mockService.generateVideoQuiz.mockResolvedValue(mockResult)

      const result = await generateVideoQuiz(
        'Test Course',
        'Test transcript',
        5
      )

      expect(result).toEqual({ questions: [] })
      expect(mockService.generateVideoQuiz).toHaveBeenCalledWith({
        courseTitle: 'Test Course',
        transcript: 'Test transcript',
        numberOfQuestions: 5,
        quizType: 'mcq'
      })
    })

    it('should handle network errors gracefully', async () => {
      // Mock a network error
      const networkError = new Error('Network timeout')
      mockService.generateVideoQuiz.mockRejectedValue(networkError)

      await expect(generateVideoQuiz(
        'Test Course',
        'Test transcript',
        5
      )).rejects.toThrow('Network error. Please check your connection and try again.')
    })

    it('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed')
      mockService.generateVideoQuiz.mockRejectedValue(authError)

      await expect(generateVideoQuiz(
        'Test Course',
        'Test transcript',
        5
      )).rejects.toThrow('Authentication failed')
    })

    it('should handle subscription errors', async () => {
      const subscriptionError = new Error('Subscription plan does not support this feature')
      mockService.generateVideoQuiz.mockRejectedValue(subscriptionError)

      await expect(generateVideoQuiz(
        'Test Course',
        'Test transcript',
        5
      )).rejects.toThrow('Subscription plan does not support this feature.')
    })

    it('should handle unknown errors with generic message', async () => {
      const unknownError = new Error('Some unknown error')
      mockService.generateVideoQuiz.mockRejectedValue(unknownError)

      await expect(generateVideoQuiz(
        'Test Course',
        'Test transcript',
        5
      )).rejects.toThrow('Some unknown error')
    })
  })

  describe('Error Handling', () => {
    it('should handle method not found errors', async () => {
      // Temporarily remove the method from the mock service
      const originalMethod = mockService.generateVideoQuiz
      mockService.generateVideoQuiz = undefined as any

      await expect(generateVideoQuiz(
        'Test Course',
        'Test transcript',
        5
      )).rejects.toThrow('Method generateVideoQuiz not found on AI service')

      // Restore the method
      mockService.generateVideoQuiz = originalMethod
    })

    it('should handle service creation failures', async () => {
      ;(AIServiceFactory.createService as any).mockImplementation(() => {
        throw new Error('Service creation failed')
      })

      await expect(generateVideoQuiz(
        'Test Course',
        'Test transcript',
        5
      )).rejects.toThrow('Service creation failed')
    })
  })

  describe('Context Validation', () => {
    it('should validate subscription plans', async () => {
      const mockResult = { success: true, data: { questions: [] } }
      mockService.generateVideoQuiz.mockResolvedValue(mockResult)

      // Test with invalid plan (should default to FREE)
      await generateVideoQuiz(
        'Test Course',
        'Test transcript',
        5,
        'user123',
        'INVALID_PLAN' as any
      )

      // Verify the service was created with FREE plan as fallback
      const { AIServiceFactory } = await import('@/lib/ai/services/AIServiceFactory')
      expect((AIServiceFactory.createService as any)).toHaveBeenCalledWith(
        expect.objectContaining({ subscriptionPlan: 'FREE' })
      )
    })

    it('should handle unauthenticated users', async () => {
      const mockResult = { success: true, data: { questions: [] } }
      mockService.generateVideoQuiz.mockResolvedValue(mockResult)

      await generateVideoQuiz(
        'Test Course',
        'Test transcript',
        5,
        undefined, // No user ID
        'FREE',
        0 // No credits
      )

      const { AIServiceFactory } = await import('@/lib/ai/services/AIServiceFactory')
      expect((AIServiceFactory.createService as any)).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined,
          isAuthenticated: false,
          credits: 0
        })
      )
    })
  })
})