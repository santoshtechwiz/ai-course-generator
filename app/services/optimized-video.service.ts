import PQueue from 'p-queue'
import pRetry from 'p-retry'
import pTimeout from 'p-timeout'
import axios, { AxiosError } from 'axios'
import { createCacheManager, logger, CACHE_TTL, CACHE_KEYS, type MemoryCache } from './cache/cache-manager-clean'
import { videoRepository } from '@/app/repositories/video.repository'
import YoutubeService from '@/services/youtubeService'

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const { leading = false, trailing = true } = options
  let timeoutId: NodeJS.Timeout | null = null
  let lastArgs: Parameters<T> | null = null
  let result: ReturnType<T>

  return function (this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve) => {
      const callNow = leading && !timeoutId

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      lastArgs = args

      timeoutId = setTimeout(() => {
        timeoutId = null
        if (trailing && lastArgs) {
          result = func.apply(this, lastArgs)
          resolve(result)
        }
      }, wait)

      if (callNow) {
        result = func.apply(this, args)
        resolve(result)
      }
    })
  }
}

// Types
interface VideoProcessingRequest {
  chapterId: number
  topic: string
  requestId: string
  timestamp: number
}

interface VideoProcessingResult {
  success: boolean
  videoId?: string
  error?: string
  fromCache?: boolean
  processingTime?: number
}

interface FallbackContent {
  videoId: string
  title: string
  source: 'placeholder' | 'cached' | 'default'
}

// Configuration
const CONFIG = {
  QUEUE_CONCURRENCY: 3,
  MAX_RETRIES: 2,
  TIMEOUT_MS: 15000, // Reduced from 30s to 15s
  DEBOUNCE_MS: 300, // Reduced from 500ms to 300ms
  MAX_PROCESSING_TIME: 45000, // Reduced from 60s to 45s
  FALLBACK_VIDEOS: [
    { videoId: 'dQw4w9WgXcQ', title: 'Generic Programming Tutorial', source: 'placeholder' as const },
    { videoId: 'L_LUpnjgPso', title: 'Learning Basics', source: 'placeholder' as const }
  ],
  FAST_FAIL_TIMEOUT: 5000, // Quick timeout for immediate feedback
  CACHE_FIRST_TIMEOUT: 2000 // Even faster for cache-first operations
}

/**
 * Optimized Video Processing Service
 * 
 * Features:
 * - Request debouncing and deduplication
 * - Multi-level caching strategy
 * - Graceful fallback mechanisms
 * - Comprehensive error handling and monitoring
 * - Request queuing with concurrency control
 * - Timeout handling with cancellation
 */
export class OptimizedVideoService {  private cache: MemoryCache
  private processingQueue: PQueue
  private debouncedProcessors: Map<string, any>
  private activeRequests: Map<string, { cancelled: boolean }>
  private metrics: {
    totalRequests: number
    cacheHits: number
    cacheMisses: number
    errors: number
    timeouts: number
    fallbacks: number
  }

  constructor() {
    this.cache = createCacheManager()
    this.processingQueue = new PQueue({ 
      concurrency: CONFIG.QUEUE_CONCURRENCY,
      interval: 1000,
      intervalCap: 10
    })
    this.debouncedProcessors = new Map()
    this.activeRequests = new Map()
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      timeouts: 0,
      fallbacks: 0
    }

    // Setup monitoring
    this.setupMonitoring()
    
    logger.info('OptimizedVideoService initialized', {
      queueConcurrency: CONFIG.QUEUE_CONCURRENCY,
      cacheEnabled: true,
      fallbackVideos: CONFIG.FALLBACK_VIDEOS.length
    })
  }

  /**
   * Main entry point for video processing
   */
  async processVideoForChapter(chapterId: number, topic: string): Promise<VideoProcessingResult> {
    const requestId = `${chapterId}-${Date.now()}`
    const startTime = Date.now()
    
    this.metrics.totalRequests++
    
    logger.info('Processing video request', { chapterId, topic, requestId })

    try {
      // Check if chapter already has a video
      const existingVideo = await this.getExistingVideo(chapterId)
      if (existingVideo) {
        this.metrics.cacheHits++
        return {
          success: true,
          videoId: existingVideo,
          fromCache: true,
          processingTime: Date.now() - startTime
        }
      }

      // Check cache for topic-based video
      const cachedVideoId = await this.getCachedVideoForTopic(topic)
      if (cachedVideoId) {
        this.metrics.cacheHits++
        await this.updateChapterVideo(chapterId, cachedVideoId)
        return {
          success: true,
          videoId: cachedVideoId,
          fromCache: true,
          processingTime: Date.now() - startTime
        }
      }

      this.metrics.cacheMisses++

      // Use debounced processing to prevent duplicate requests
      const result = await this.getDebouncedProcessor(topic)(chapterId, topic, requestId)
      
      return {
        ...result,
        processingTime: Date.now() - startTime
      }

    } catch (error) {
      this.metrics.errors++
      logger.error('Video processing failed', { chapterId, topic, requestId, error })
      
      // Try fallback
      const fallbackResult = await this.getFallbackVideo(chapterId, topic)
      if (fallbackResult.success) {
        this.metrics.fallbacks++
        return {
          ...fallbackResult,
          processingTime: Date.now() - startTime
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Fast processing mode for immediate response
   * Returns quickly with cache or queues for background processing
   */
  async processVideoQuick(chapterId: number, topic: string): Promise<VideoProcessingResult> {
    const requestId = `quick-${chapterId}-${Date.now()}`
    const startTime = Date.now()
    
    this.metrics.totalRequests++
    
    logger.info('Quick video processing request', { chapterId, topic, requestId })

    try {
      // Check if chapter already has a video (fastest)
      const existingVideo = await this.getExistingVideo(chapterId)
      if (existingVideo) {
        this.metrics.cacheHits++
        return {
          success: true,
          videoId: existingVideo,
          fromCache: true,
          processingTime: Date.now() - startTime
        }
      }

      // Check cache for topic-based video (fast)
      const cachedVideoId = await Promise.race([
        this.getCachedVideoForTopic(topic),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Cache timeout')), CONFIG.CACHE_FIRST_TIMEOUT)
        )
      ]).catch(() => null)

      if (cachedVideoId) {
        this.metrics.cacheHits++
        // Update chapter in background
        this.updateChapterVideo(chapterId, cachedVideoId).catch(err => 
          logger.error('Background chapter update failed', { chapterId, error: err })
        )
        return {
          success: true,
          videoId: cachedVideoId,
          fromCache: true,
          processingTime: Date.now() - startTime
        }
      }

      // No cache hit - queue for background processing and return fallback immediately
      this.metrics.cacheMisses++
      
      // Queue the actual processing in background
      this.processingQueue.add(() => 
        this.fetchVideoWithTimeoutAndRetry(chapterId, topic, requestId)
          .catch(err => logger.error('Background video processing failed', { chapterId, error: err }))
      )

      // Return fallback immediately for quick response
      const fallbackResult = await this.getFallbackVideo(chapterId, topic)
      if (fallbackResult.success) {
        this.metrics.fallbacks++
        return {
          ...fallbackResult,
          processingTime: Date.now() - startTime,
          note: 'Fallback video provided, processing real video in background'
        }
      }

      // If even fallback fails, return error
      return {
        success: false,
        error: 'Unable to provide video content',
        processingTime: Date.now() - startTime
      }

    } catch (error) {
      this.metrics.errors++
      logger.error('Quick video processing failed', { chapterId, topic, requestId, error })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Get status of video processing
   */
  async getVideoStatus(chapterId: number) {
    const cacheKey = CACHE_KEYS.CHAPTER_STATUS(chapterId)
    
    // Check cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return cached
    }    // Get from database
    try {
      const chapter = await videoRepository.findChapterById(chapterId) as any
      if (!chapter) {
        throw new Error('Chapter not found')
      }

      const status = {
        success: true,
        videoId: chapter.videoId,
        videoStatus: chapter.videoStatus,
        isReady: chapter.videoId !== null,
        failed: chapter.videoStatus === 'error',
        timestamp: new Date().toISOString()
      }

      // Cache the result
      await this.cache.set(cacheKey, status, CACHE_TTL.CHAPTER_STATUS)
      
      return status
    } catch (error) {
      logger.error('Failed to get video status', { chapterId, error })
      throw error
    }
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.processingQueue.size,
      queuePending: this.processingQueue.pending,
      activeRequests: this.activeRequests.size,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0
    }
  }
  private async getExistingVideo(chapterId: number): Promise<string | null> {
    try {
      const chapter = await videoRepository.findChapterById(chapterId) as any
      return chapter?.videoId || null
    } catch (error) {
      logger.error('Error checking existing video', { chapterId, error })
      return null
    }
  }

  private async getCachedVideoForTopic(topic: string): Promise<string | null> {
    const cacheKey = CACHE_KEYS.VIDEO_ID(topic)
    return await this.cache.get<string>(cacheKey)
  }

  private getDebouncedProcessor(topic: string) {
    if (!this.debouncedProcessors.has(topic)) {
      const processor = debounce(
        (chapterId: number, topic: string, requestId: string) => 
          this.processVideoWithQueue(chapterId, topic, requestId),
        CONFIG.DEBOUNCE_MS,
        { leading: true, trailing: false }
      )
      this.debouncedProcessors.set(topic, processor)
    }
    return this.debouncedProcessors.get(topic)
  }

  private async processVideoWithQueue(
    chapterId: number, 
    topic: string, 
    requestId: string
  ): Promise<VideoProcessingResult> {
    return this.processingQueue.add(async () => {
      // Use cache locking to prevent duplicate processing
      const lockKey = CACHE_KEYS.PROCESSING_LOCK(chapterId)
      
      return this.cache.acquireLock(lockKey, async () => {
        return this.fetchVideoWithTimeoutAndRetry(chapterId, topic, requestId)
      })
    })
  }
  private async fetchVideoWithTimeoutAndRetry(
    chapterId: number,
    topic: string,
    requestId: string
  ): Promise<VideoProcessingResult> {
    const requestTracker = { cancelled: false }
    this.activeRequests.set(requestId, requestTracker)

    try {
      // Update chapter status to processing
      await this.updateChapterStatus(chapterId, 'processing')

      const result = await pTimeout(
        pRetry(
          async () => {
            if (requestTracker.cancelled) {
              throw new Error('Request cancelled')
            }

            const videoId = await YoutubeService.searchYoutube(topic)
            if (!videoId) {
              throw new Error('No video found for topic')
            }

            return videoId
          },
          {
            retries: CONFIG.MAX_RETRIES,
            onFailedAttempt: (error) => {
              logger.warn('Retry attempt failed', { 
                chapterId, 
                topic, 
                attempt: error.attemptNumber,
                error: error.message 
              })
            }
          }
        ),
        { milliseconds: CONFIG.TIMEOUT_MS }
      )

      // Cache the result
      const cacheKey = CACHE_KEYS.VIDEO_ID(topic)
      await this.cache.set(cacheKey, result, CACHE_TTL.VIDEO_ID)

      // Update chapter
      await this.updateChapterVideo(chapterId, result)

      logger.info('Video processing completed', { chapterId, topic, videoId: result })

      return {
        success: true,
        videoId: result
      }

    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'TimeoutError') {
        this.metrics.timeouts++
        logger.error('Video processing timeout', { chapterId, topic, requestId })
      }
      
      await this.updateChapterStatus(chapterId, 'error')
      throw error
    } finally {
      this.activeRequests.delete(requestId)
    }
  }

  private async getFallbackVideo(chapterId: number, topic: string): Promise<VideoProcessingResult> {
    logger.info('Attempting fallback video', { chapterId, topic })

    try {
      // First, try to find a related cached video
      const relatedCacheKey = CACHE_KEYS.TOPIC_SEARCH(topic.split(' ')[0]) // Use first word
      const relatedVideo = await this.cache.get<string>(relatedCacheKey)
      
      if (relatedVideo) {
        await this.updateChapterVideo(chapterId, relatedVideo)
        logger.info('Used related cached video as fallback', { chapterId, videoId: relatedVideo })
        return { success: true, videoId: relatedVideo }
      }

      // Use default fallback video
      const fallbackVideo = CONFIG.FALLBACK_VIDEOS[Math.floor(Math.random() * CONFIG.FALLBACK_VIDEOS.length)]
      await this.updateChapterVideo(chapterId, fallbackVideo.videoId)
      
      // Cache for future use
      const fallbackCacheKey = CACHE_KEYS.VIDEO_ID(`fallback:${topic}`)
      await this.cache.set(fallbackCacheKey, fallbackVideo.videoId, CACHE_TTL.FALLBACK_CONTENT)

      logger.info('Used default fallback video', { chapterId, videoId: fallbackVideo.videoId })
      
      return { 
        success: true, 
        videoId: fallbackVideo.videoId 
      }

    } catch (error) {
      logger.error('Fallback video failed', { chapterId, topic, error })
      return { 
        success: false, 
        error: 'All fallback mechanisms failed' 
      }
    }
  }

  private async updateChapterVideo(chapterId: number, videoId: string): Promise<void> {
    await videoRepository.updateChapterVideo(chapterId, videoId, 'completed')
    
    // Invalidate cache
    const cacheKey = CACHE_KEYS.CHAPTER_STATUS(chapterId)
    await this.cache.del(cacheKey)
  }

  private async updateChapterStatus(chapterId: number, status: string): Promise<void> {
    await videoRepository.updateChapterVideo(chapterId, null, status)
    
    // Invalidate cache
    const cacheKey = CACHE_KEYS.CHAPTER_STATUS(chapterId)
    await this.cache.del(cacheKey)
  }

  private setupMonitoring(): void {
    // Log metrics every 5 minutes
    setInterval(() => {
      const metrics = this.getMetrics()
      logger.info('Video service metrics', metrics)
      
      // Alert on high error rate
      if (metrics.totalRequests > 10 && (metrics.errors / metrics.totalRequests) > 0.5) {
        logger.error('High error rate detected', metrics)
      }
      
      // Alert on high timeout rate
      if (metrics.totalRequests > 10 && (metrics.timeouts / metrics.totalRequests) > 0.3) {
        logger.error('High timeout rate detected', metrics)
      }
      
    }, 5 * 60 * 1000)

    // Cleanup old debounced processors
    setInterval(() => {
      // Clear processors that haven't been used recently
      this.debouncedProcessors.clear()
      logger.info('Cleaned up debounced processors')
    }, 30 * 60 * 1000) // Every 30 minutes
  }
}

// Create singleton instance
export const optimizedVideoService = new OptimizedVideoService()
