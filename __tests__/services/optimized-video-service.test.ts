import { OptimizedVideoService } from '@/app/services/optimized-video.service'
import { createCacheManager } from '@/app/services/cache/cache-manager'
import YoutubeService from '@/services/youtubeService'
import { videoRepository } from '@/app/repositories/video.repository'

// Mock dependencies
jest.mock('@/app/services/cache/cache-manager-clean', () => ({
  createCacheManager: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    acquireLock: jest.fn(async (key, fn) => fn()),
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
  })),
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  CACHE_TTL: {
    VIDEO_ID: 86400000,
    CHAPTER_STATUS: 600000,
    FALLBACK_CONTENT: 7200000
  },
  CACHE_KEYS: {
    VIDEO_ID: (topic: string) => `video:${topic}`,
    CHAPTER_STATUS: (chapterId: number) => `chapter:${chapterId}:status`,
    PROCESSING_LOCK: (chapterId: number) => `lock:chapter:${chapterId}`,
    TOPIC_SEARCH: (topic: string) => `topic:${topic}`
  }
}))

jest.mock('@/services/youtubeService', () => ({
  __esModule: true,
  default: {
    searchYoutube: jest.fn()
  }
}))

jest.mock('@/app/repositories/video.repository', () => ({
  videoRepository: {
    findChapterById: jest.fn(),
    updateChapterVideo: jest.fn()
  }
}))

describe('OptimizedVideoService', () => {
  let service: OptimizedVideoService
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Create a new instance for each test
    service = new OptimizedVideoService()
  })
  
  describe('processVideoForChapter', () => {
    it('should return cached video from chapter if available', async () => {
      // Arrange
      const chapterId = 123
      const videoId = 'abc123'
      
      // Mock findChapterById to return a chapter with videoId
      const mockChapter = { videoId, title: 'Test Chapter' }
      jest.spyOn(videoRepository, 'findChapterById').mockResolvedValue(mockChapter)
      
      // Act
      const result = await service.processVideoForChapter(chapterId, 'test topic')
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.videoId).toBe(videoId)
      expect(result.fromCache).toBe(true)
      expect(videoRepository.findChapterById).toHaveBeenCalledWith(chapterId)
    })
    
    it('should fetch new video when nothing is cached', async () => {
      // Arrange
      const chapterId = 123
      const topic = 'test topic'
      const videoId = 'xyz789'
      
      // Mock chapter with no videoId
      jest.spyOn(videoRepository, 'findChapterById').mockResolvedValue({ title: 'Test Chapter' })
      
      // Mock cache miss
      const cacheMock = createCacheManager()
      jest.spyOn(cacheMock, 'get').mockResolvedValue(null)
      
      // Mock YouTube search success
      jest.spyOn(YoutubeService, 'searchYoutube').mockResolvedValue(videoId)
      
      // Act
      const result = await service.processVideoForChapter(chapterId, topic)
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.videoId).toBe(videoId)
      expect(result.fromCache).toBeFalsy()
      expect(YoutubeService.searchYoutube).toHaveBeenCalledWith(topic)
      expect(videoRepository.updateChapterVideo).toHaveBeenCalledWith(chapterId, videoId, 'completed')
    })
    
    it('should provide fallback when YouTube API fails', async () => {
      // Arrange
      const chapterId = 123
      const topic = 'test topic'
      
      // Mock chapter with no videoId
      jest.spyOn(videoRepository, 'findChapterById').mockResolvedValue({ title: 'Test Chapter' })
      
      // Mock cache miss
      const cacheMock = createCacheManager()
      jest.spyOn(cacheMock, 'get').mockResolvedValue(null)
      
      // Mock YouTube search failure
      jest.spyOn(YoutubeService, 'searchYoutube').mockRejectedValue(new Error('API failure'))
      
      // Act
      const result = await service.processVideoForChapter(chapterId, topic)
      
      // Assert
      expect(result.success).toBe(true) // Should still succeed with fallback
      expect(result.videoId).toBeDefined() // Should have a fallback videoId
      expect(videoRepository.updateChapterVideo).toHaveBeenCalled() // Should update with fallback
    })
  })
  
  describe('processVideoQuick', () => {
    it('should return immediately with fallback when no cache hits', async () => {
      // Arrange
      const chapterId = 123
      const topic = 'test topic'
      
      // Mock chapter with no videoId
      jest.spyOn(videoRepository, 'findChapterById').mockResolvedValue({ title: 'Test Chapter' })
      
      // Mock cache miss
      const cacheMock = createCacheManager()
      jest.spyOn(cacheMock, 'get').mockResolvedValue(null)
      
      // Act
      const startTime = Date.now()
      const result = await service.processVideoQuick(chapterId, topic)
      const processingTime = Date.now() - startTime
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.videoId).toBeDefined() // Should have fallback video
      expect(processingTime).toBeLessThan(1000) // Should respond quickly (within 1 second)
      
      // YouTube shouldn't be called directly - should be queued for background
      expect(YoutubeService.searchYoutube).not.toHaveBeenCalled()
    })
  })
})
