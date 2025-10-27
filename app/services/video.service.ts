import { videoRepository } from "@/app/repositories/video.repository";
import YoutubeService from "@/services/youtubeService";
import PQueue from "p-queue";
import pRetry from "p-retry";
import delay from "delay";
import { randomUUID } from "crypto";
import { quotaManager } from "@/services/quotaManager";

// ============= Type Definitions =============

interface ChapterVideoData {
  id: number;
  youtubeSearchQuery: string;
  videoId: string | null;
  videoStatus: 'pending' | 'processing' | 'completed' | 'error';
}

interface VideoProcessingResponse {
  success: boolean;
  message?: string;
  videoId?: string | null;
  videoStatus?: 'pending' | 'processing' | 'completed' | 'error';
  isReady?: boolean;
  failed?: boolean;
  timestamp?: string;
  jobId?: string; // Add job ID for tracking
}

interface ChapterVideoStatusResponse {
  success: boolean;
  videoId: string | null;
  videoStatus: 'pending' | 'processing' | 'completed' | 'error';
  isReady: boolean;
  failed: boolean;
  timestamp: string;
  jobId?: string; // Add job ID to status response
}

interface CourseVideoStatusResponse {
  [key: string]: any;
}

// ============= Cache and Queue Setup =============

/**
 * Processing queue with concurrency of 1 to prevent duplicate video fetches
 */
const queue = new PQueue({ concurrency: 1 });

/**
 * Local cache for chapter data to reduce database queries
 */
const chapterCache = new Map<number, ChapterVideoData>();

/**
 * Active jobs tracking - maps chapterId to jobId
 */
const activeJobs = new Map<number, string>();

/**
 * Job status tracking - maps jobId to status
 */
const jobStatuses = new Map<string, { status: 'queued' | 'processing' | 'completed' | 'error', chapterId: number, startTime: number }>();

// ============= Video Service Class =============

/**
 * Service for handling video processing business logic
 * Manages YouTube video fetching, caching, and status tracking
 */
class VideoService {
  /**
   * Get the status of a chapter's video
   * @param chapterId - The ID of the chapter
   * @returns Video status information
   * @throws Error if chapter not found
   */
  async getChapterVideoStatus(chapterId: number): Promise<ChapterVideoStatusResponse> {
    const chapter = await videoRepository.findChapterById(chapterId) as any;

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    // Check if there's an active job for this chapter
    const jobId = activeJobs.get(chapterId);
    const jobStatus = jobId ? jobStatuses.get(jobId) : null;

    return {
      success: true,
      videoId: chapter.videoId || null,
      videoStatus: (chapter.videoStatus || 'pending') as 'pending' | 'processing' | 'completed' | 'error',
      isReady: chapter.videoId !== null,
      failed: chapter.videoStatus === "error",
      timestamp: new Date().toISOString(),
      jobId: jobId || undefined,
    };
  }

  /**
   * Process a video for a chapter
   * Queues video fetching and returns processing status
   * @param chapterId - The ID of the chapter to process
   * @returns Processing response with status
   * @throws Error if chapter not found
   */
  async processVideo(chapterId: number): Promise<VideoProcessingResponse> {
    console.log(`[VideoService] Processing video for chapter ${chapterId}`);

    // Check if there's already an active job for this chapter
    const existingJobId = activeJobs.get(chapterId);
    if (existingJobId) {
      const jobStatus = jobStatuses.get(existingJobId);
      console.log(`[VideoService] Chapter ${chapterId} already has active job ${existingJobId}, status: ${jobStatus?.status}`);
      return {
        success: true,
        message: "Video generation already in progress.",
        videoStatus: jobStatus?.status === 'processing' ? 'processing' : 'queued',
        jobId: existingJobId,
      };
    }

    // Get chapter from cache or database
    let chapter = chapterCache.get(chapterId);

    if (!chapter) {
      console.log(`[VideoService] Chapter ${chapterId} not in cache, fetching from database`);
      const chapterData = await videoRepository.findChapterById(chapterId) as any;

      if (!chapterData) {
        console.error(`[VideoService] Chapter ${chapterId} not found in database`);
        throw new Error("Chapter not found");
      }

      chapter = {
        id: chapterData.id || chapterId,
        youtubeSearchQuery: chapterData.youtubeSearchQuery || '',
        videoId: chapterData.videoId || null,
        videoStatus: (chapterData.videoStatus || 'pending') as 'pending' | 'processing' | 'completed' | 'error',
      };

      // Add to cache
      chapterCache.set(chapterId, chapter);
      console.log(`[VideoService] Chapter ${chapterId} added to cache`);
    }

    // If video already exists, return early
    if (chapter.videoId) {
      console.log(`[VideoService] Chapter ${chapterId} already has video: ${chapter.videoId}`);
      return {
        success: true,
        message: "Video already processed.",
        videoId: chapter.videoId,
        videoStatus: "completed",
      };
    }

    console.log(`[VideoService] Starting video processing for chapter ${chapterId} with search query: "${chapter.youtubeSearchQuery}"`);

    // Validate search query
    if (!chapter.youtubeSearchQuery || chapter.youtubeSearchQuery.trim() === '') {
      console.error(`[VideoService] Chapter ${chapterId} has empty search query`);
      throw new Error("Chapter has no search query for video generation");
    }

    // Generate a unique job ID
    const jobId = randomUUID();
    console.log(`[VideoService] Generated job ID ${jobId} for chapter ${chapterId}`);

    // Track the job
    activeJobs.set(chapterId, jobId);
    jobStatuses.set(jobId, { status: 'queued', chapterId, startTime: Date.now() });

    // Update chapter status to processing
    await videoRepository.updateChapterVideo(chapterId, null, "processing");

    // Update cache
    chapterCache.set(chapterId, { ...chapter, videoStatus: "processing" });

    console.log(`[VideoService] Chapter ${chapterId} marked as processing, adding to queue`);

    // Add the task to the queue with job tracking
    queue.add(async () => {
      try {
        // Update job status to processing
        jobStatuses.set(jobId, { status: 'processing', chapterId, startTime: Date.now() });
        console.log(`[VideoService] Job ${jobId} started processing for chapter ${chapterId}`);

        await this.fetchAndUpdateVideo(chapterId, chapter!.youtubeSearchQuery, jobId);

        // Mark job as completed
        jobStatuses.set(jobId, { status: 'completed', chapterId, startTime: Date.now() });
        console.log(`[VideoService] Job ${jobId} completed for chapter ${chapterId}`);
      } catch (error) {
        // Mark job as error
        jobStatuses.set(jobId, { status: 'error', chapterId, startTime: Date.now() });
        console.error(`[VideoService] Job ${jobId} failed for chapter ${chapterId}:`, error);
      } finally {
        // Clean up job tracking
        activeJobs.delete(chapterId);
        // Keep job status for a while for status queries, but clean up old jobs
        setTimeout(() => {
          jobStatuses.delete(jobId);
        }, 300000); // Clean up after 5 minutes
      }
    });

    console.log(`[VideoService] Chapter ${chapterId} added to processing queue (queue size: ${queue.size}, pending: ${queue.pending})`);

    return {
      success: true,
      message: "Video generation task queued.",
      videoStatus: "queued",
      jobId,
    };
  }

  /**
   * Get the status of a course's videos
   * @param slug - The course slug
   * @returns Course video status information
   * @throws Error if course not found
   */
  async getCourseVideoStatus(slug: string): Promise<CourseVideoStatusResponse> {
    const status = await videoRepository.getCourseStatus(slug);
    if (!status) {
      throw new Error("Course not found");
    }
    
    return status;
  }

  /**
   * Private method to fetch and update a video
   * Handles retry logic and cache updates
   * @param chapterId - The ID of the chapter
   * @param youtubeSearchQuery - The YouTube search query
   * @param jobId - The job ID for tracking
   * @private
   */
  private async fetchAndUpdateVideo(chapterId: number, youtubeSearchQuery: string, jobId: string): Promise<void> {
    try {
      const videoId = await this.fetchVideoIdWithRetry(youtubeSearchQuery);

      if (!videoId) {
        await videoRepository.updateChapterVideo(chapterId, null, "error");
        
        // Update cache
        const cachedChapter = chapterCache.get(chapterId);
        if (cachedChapter) {
          chapterCache.set(chapterId, { ...cachedChapter, videoStatus: "error" });
        }
        return;
      }

      // Update chapter with video ID
      await videoRepository.updateChapterVideo(chapterId, videoId);
      
      // Update cache
      const cachedChapter = chapterCache.get(chapterId);
      if (cachedChapter) {
        chapterCache.set(chapterId, { ...cachedChapter, videoId, videoStatus: "completed" });
      }
    } catch (error) {
      console.error(`[VideoService] Error processing video for chapter ${chapterId}:`, error);
      await videoRepository.updateChapterVideo(chapterId, null, "error");
      
      // Update cache
      const cachedChapter = chapterCache.get(chapterId);
      if (cachedChapter) {
        chapterCache.set(chapterId, { ...cachedChapter, videoStatus: "error" });
      }
    }
  }

  /**
   * Private method to fetch video ID with retry logic
   * Implements exponential backoff and handles errors gracefully
   * @param youtubeSearchQuery - The YouTube search query
   * @returns Video ID or empty string if not found
   * @private
   */
  private async fetchVideoIdWithRetry(youtubeSearchQuery: string): Promise<string> {
    const maxRetries = 3
    const baseDelay = 2000 // 2 seconds
    let lastError: Error | null = null

    // Check if quota is disabled before attempting any searches
    // if (quotaManager.isDisabled()) {
    //   console.error("[VideoService] YouTube API quota disabled - cannot search for videos")
    //   throw new Error("quota_exceeded")
    // }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[VideoService] Attempt ${attempt}/${maxRetries} for query: "${youtubeSearchQuery}"`)

        const videoId = await YoutubeService.searchYoutube(youtubeSearchQuery)

        if (videoId) {
          console.log(`[VideoService] Success on attempt ${attempt} for "${youtubeSearchQuery}": ${videoId}`)
          return videoId
        }

        // If no video found but no error, continue to next attempt
        console.warn(`[VideoService] No video found on attempt ${attempt} for "${youtubeSearchQuery}"`)

      } catch (error: any) {
        lastError = error

        // Check for quota exceeded - stop immediately
        if (error?.message?.includes('quota')) {
          console.error("[VideoService] YouTube API quota exceeded - stopping retries")
          throw new Error("quota_exceeded")
        }

        // Check for network/timeout errors that should be retried
        const isRetryableError = error?.message?.includes('timeout') ||
                                error?.message?.includes('network') ||
                                error?.message?.includes('5') || // 5xx server errors
                                (error?.message?.includes('rateLimit') && error?.message?.includes('Retry-After'))

        if (!isRetryableError) {
          console.error(`[VideoService] Non-retryable error on attempt ${attempt}:`, error.message)
          break // Don't retry non-retryable errors
        }

        console.warn(`[VideoService] Retryable error on attempt ${attempt}:`, error.message)

        // Don't delay on the last attempt
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1) // Exponential backoff
          console.log(`[VideoService] Waiting ${delay}ms before retry ${attempt + 1}`)
          await delay(delay)
        }
      }
    }

    // If we get here, all retries failed
    if (lastError?.message?.includes('quota')) {
      throw new Error("quota_exceeded")
    }

    console.error(`[VideoService] All ${maxRetries} attempts failed for "${youtubeSearchQuery}":`, lastError)
    throw lastError || new Error("Failed to fetch video ID after all retries")
  }
}

// ============= Service Singleton Export =============

/**
 * Singleton instance of VideoService for use throughout the application
 */
export const videoService = new VideoService();
