/**
 * BasicAIService Tests
 * Tests for BasicAIService methods including course generation
 *
 * Run: npm run test -- basic-ai.service.test.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { BasicAIService } from '@/lib/ai/services/BasicAIService'
import type { AIServiceContext } from '@/lib/ai/services/AIBaseService'

// Mock the AI provider
const mockGenerateChatCompletion = vi.fn()
const mockProvider = {
  generateChatCompletion: mockGenerateChatCompletion,
}

// Mock dependencies
vi.mock('@/lib/ai/providers/provider-factory', () => ({
  getDefaultAIProvider: vi.fn(() => mockProvider),
}))

vi.mock('@/config/ai.config', () => ({
  getModelConfig: vi.fn(() => ({
    primaryModel: 'gpt-3.5-turbo',
    fallbackModel: 'gpt-3.5-turbo',
    maxTokens: 4096,
    temperature: 0.7,
  })),
  getPlanLimits: vi.fn(() => ({ maxItems: 10 })),
  getRateLimits: vi.fn(() => ({ requestsPerHour: 100 })),
  AI_ERROR_MESSAGES: {},
}))

vi.mock('@/lib/featureAccess', () => ({
  checkFeatureAccess: vi.fn(() => ({
    canAccess: true,
    isExplorable: true,
    reason: null,
  })),
}))

describe.skip('BasicAIService', () => {
  let service: BasicAIService
  let context: AIServiceContext

  beforeEach(() => {
    context = {
      userId: 'test-user-123',
      subscriptionPlan: 'FREE' as const,
      isAuthenticated: true,
      credits: 100,
    }

    service = new BasicAIService(context)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // COURSE GENERATION TESTS
  // ============================================================================

  describe('generateCourse()', () => {
    it('should generate course with valid parameters', async () => {
      // Mock AI response
      const mockResponse = {
        content: null,
        functionCall: {
          name: 'generate_course_content',
          arguments: JSON.stringify({
            title: 'React Development Course',
            units: [
              {
                unit_title: 'Introduction to React',
                chapters: [
                  {
                    chapter_title: 'What is React?',
                    youtube_search_query: 'react js tutorial for beginners 2024',
                  },
                  {
                    chapter_title: 'Setting up Development Environment',
                    youtube_search_query: 'how to install react js and create first app',
                  },
                ],
              },
              {
                unit_title: 'Components and Props',
                chapters: [
                  {
                    chapter_title: 'Creating Components',
                    youtube_search_query: 'react components tutorial functional class components',
                  },
                ],
              },
            ],
          }),
        },
        usage: { totalTokens: 500 },
      }

      mockGenerateChatCompletion.mockResolvedValue(mockResponse)

      const result = await service.generateCourse({
        title: 'React Development',
        units: ['Introduction to React', 'Components and Props'],
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.title).toBe('React Development Course')
      expect(result.data.units).toHaveLength(2)
      expect(result.data.units[0].chapters).toHaveLength(2)
      expect(result.usage?.creditsUsed).toBeDefined()
      expect(result.usage?.tokensUsed).toBe(500)
    })

    it('should handle function call parsing errors gracefully', async () => {
      // Mock AI response with invalid JSON
      const mockResponse = {
        content: 'Fallback content',
        functionCall: {
          name: 'generate_course_content',
          arguments: 'invalid json',
        },
        usage: { totalTokens: 300 },
      }

      mockGenerateChatCompletion.mockResolvedValue(mockResponse)

      const result = await service.generateCourse({
        title: 'JavaScript Basics',
        units: ['Variables and Data Types'],
      })

      expect(result.success).toBe(true)
      expect(result.data).toBe('Fallback content')
    })

    it('should validate title input', async () => {
      const result = await service.generateCourse({
        title: '', // Empty title should fail
        units: ['Unit 1'],
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Title is required')
    })

    it('should validate units array', async () => {
      const result = await service.generateCourse({
        title: 'Test Course',
        units: [], // Empty units should fail
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Units array is required')
    })

    it('should limit maximum units', async () => {
      const tooManyUnits = Array.from({ length: 15 }, (_, i) => `Unit ${i + 1}`)

      const result = await service.generateCourse({
        title: 'Test Course',
        units: tooManyUnits,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Maximum 10 units allowed')
    })

    it('should validate unit names', async () => {
      const result = await service.generateCourse({
        title: 'Test Course',
        units: ['Valid Unit', ''], // Empty unit name should fail
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid unit name')
    })

    it('should pass correct parameters to AI provider', async () => {
      const mockResponse = {
        content: null,
        functionCall: {
          name: 'generate_course_content',
          arguments: JSON.stringify({
            title: 'Python Programming',
            units: [
              {
                unit_title: 'Basics',
                chapters: [
                  {
                    chapter_title: 'Hello World',
                    youtube_search_query: 'python hello world tutorial',
                  },
                ],
              },
            ],
          }),
        },
        usage: { totalTokens: 400 },
      }

      mockGenerateChatCompletion.mockResolvedValue(mockResponse)

      await service.generateCourse({
        title: 'Python Programming',
        units: ['Basics', 'Data Structures'],
      })

      expect(mockGenerateChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.any(Array),
          functions: expect.any(Array),
          functionCall: { name: 'generate_course_content' },
        })
      )

      const callArgs = mockGenerateChatCompletion.mock.calls[0][0]
      expect(callArgs.messages).toHaveLength(1)
      expect(callArgs.messages[0].role).toBe('user')
      expect(callArgs.messages[0].content).toContain('Python Programming')
      expect(callArgs.messages[0].content).toContain('Basics')
      expect(callArgs.messages[0].content).toContain('Data Structures')
    })

    it('should handle AI provider errors', async () => {
      mockGenerateChatCompletion.mockRejectedValue(new Error('AI service unavailable'))

      const result = await service.generateCourse({
        title: 'Test Course',
        units: ['Unit 1'],
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('AI service unavailable')
    })
  })

  // ============================================================================
  // SERVICE INFO TESTS
  // ============================================================================

  describe('Service Information', () => {
    it('should return correct subscription plan', () => {
      expect(service.getSubscriptionPlan()).toBe('FREE')
    })

    it('should return correct service name', () => {
      expect(service.getServiceName()).toBe('BasicAIService')
    })
  })
})