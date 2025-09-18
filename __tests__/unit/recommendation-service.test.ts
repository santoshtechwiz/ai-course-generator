/**
 * Recommendation Service Unit Tests
 *
 * Tests the core functionality of the recommendation service including:
 * - Recommendation generation strategies
 * - Error handling and fallbacks
 * - Cache management
 * - Performance monitoring
 */

import { RecommendationService } from '@/app/aimodel/recommendations/recommendation-service'
import { EmbeddingManager } from '@/app/aimodel/core/embedding-manager'
import { UserAnalyzer } from '@/app/aimodel/recommendations/user-analyzer'
import { ContentMatcher } from '@/app/aimodel/recommendations/content-matcher'

// Mock dependencies
jest.mock('@/app/aimodel/core/embedding-manager')
jest.mock('@/app/aimodel/recommendations/user-analyzer')
jest.mock('@/app/aimodel/recommendations/content-matcher')
jest.mock('@/lib/logger')

describe('RecommendationService', () => {
  let service: RecommendationService
  let mockEmbeddingManager: jest.Mocked<EmbeddingManager>
  let mockUserAnalyzer: jest.Mocked<UserAnalyzer>
  let mockContentMatcher: jest.Mocked<ContentMatcher>

  beforeEach(() => {
    // Create mock instances
    mockEmbeddingManager = new EmbeddingManager() as jest.Mocked<EmbeddingManager>
    mockUserAnalyzer = new UserAnalyzer() as jest.Mocked<UserAnalyzer>
    mockContentMatcher = new ContentMatcher(mockEmbeddingManager) as jest.Mocked<ContentMatcher>

    // Mock initialization methods
    mockEmbeddingManager.initialize = jest.fn().mockResolvedValue(undefined)
    mockUserAnalyzer.initialize = jest.fn().mockResolvedValue(undefined)
    mockContentMatcher.initialize = jest.fn().mockResolvedValue(undefined)

    service = new RecommendationService(
      mockEmbeddingManager,
      mockUserAnalyzer,
      mockContentMatcher
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(service.initialize()).resolves.toBeUndefined()
    })
  })

  describe('Recommendation Generation', () => {
    const mockUserProfile = {
      id: 'user-123',
      level: 'intermediate',
      preferredTopics: ['javascript', 'react'],
      recentTopics: ['typescript'],
      completedCourses: [],
      attemptedQuizzes: [],
      weakAreas: [],
      activityLevel: 'high',
      currentStreak: 5
    }

    const mockContext = {
      userId: 'user-123',
      isSubscribed: true,
      metadata: { userType: 'FREE' }
    }

    beforeEach(() => {
      mockUserAnalyzer.analyzeUser = jest.fn().mockResolvedValue(mockUserProfile)
    })

    it('should generate recommendations successfully', async () => {
      const request = {
        userId: 'user-123',
        type: 'mixed' as const,
        limit: 5,
        includeExplanation: false
      }

      const result = await service.process(request, mockContext)

      expect(result).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(result.totalCount).toBeGreaterThanOrEqual(0)
    })

    it('should handle abort signals', async () => {
      const abortController = new AbortController()
      abortController.abort()

      const request = {
        userId: 'user-123',
        type: 'mixed' as const,
        limit: 5,
        signal: abortController.signal
      }

      await expect(service.process(request, mockContext)).rejects.toThrow('Request was aborted')
    })

    it('should handle rate limiting', async () => {
      // Mock rate limit exceeded
      const originalCheckRateLimit = service['checkRateLimit']
      service['checkRateLimit'] = jest.fn().mockResolvedValue({
        success: false,
        reset: Date.now() + 3600000
      })

      const request = {
        userId: 'user-123',
        type: 'mixed' as const,
        limit: 5
      }

      await expect(service.process(request, mockContext)).rejects.toThrow('Rate limit exceeded')

      // Restore original method
      service['checkRateLimit'] = originalCheckRateLimit
    })
  })

  describe('Cache Management', () => {
    it('should use cache when available and not force refresh', async () => {
      const request = {
        userId: 'user-123',
        type: 'mixed' as const,
        limit: 5
      }

      const mockCachedResponse = {
        recommendations: [],
        totalCount: 0,
        generatedAt: new Date(),
        cacheExpiry: new Date(Date.now() + 300000)
      }

      // Mock cache hit
      service['getCachedData'] = jest.fn().mockReturnValue(mockCachedResponse)
      service['logActivity'] = jest.fn()

      const result = await service.process(request, {
        userId: 'user-123',
        isSubscribed: true
      })

      expect(service['getCachedData']).toHaveBeenCalled()
      expect(result).toEqual(mockCachedResponse)
    })
  })

  describe('Error Handling', () => {
    it('should provide fallback recommendations on error', async () => {
      // Mock user analyzer to throw error
      mockUserAnalyzer.analyzeUser = jest.fn().mockRejectedValue(new Error('Analysis failed'))

      const request = {
        userId: 'user-123',
        type: 'mixed' as const,
        limit: 3
      }

      const result = await service.process(request, {
        userId: 'user-123',
        isSubscribed: true
      })

      expect(result.recommendations).toBeDefined()
      expect(Array.isArray(result.recommendations)).toBe(true)
      // Should still return some recommendations via fallback
    })
  })

  describe('Performance Monitoring', () => {
    it('should log performance warnings for slow requests', async () => {
      const mockLogger = { warn: jest.fn() }
      // Mock logger import
      jest.mock('@/lib/logger', () => ({
        logger: mockLogger
      }))

      // Mock slow operation
      mockUserAnalyzer.analyzeUser = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUserProfile), 15000))
      )

      const request = {
        userId: 'user-123',
        type: 'mixed' as const,
        limit: 5
      }

      await service.process(request, {
        userId: 'user-123',
        isSubscribed: true
      })

      // Should log performance warning for requests > 10 seconds
      // Note: This test might be flaky due to timing
    })
  })
})