/**
 * app/services/video.service.ts
 * 
 * REFACTORED: Aligned with video processing refactor
 * - Consistent status types with frontend
 * - Improved job tracking
 * - Better error handling
 * - Removed redundant caching (database is source of truth)
 * - Clear logging for debugging
 */

import { videoRepository } from "@/app/repositories/video.repository";
import YoutubeService from "@/services/youtubeService";
import PQueue from "p-queue";
import { randomUUID } from "crypto";
import { quotaManager } from "@/services/quotaManager";

// ============= Type Definitions =============

/**
 * Video status types - aligned with frontend VideoStatus
 */
type VideoStatusType = 'idle' | 'queued' | 'processing' | 'completed' | 'error';

interface ChapterVideoData {
  id: number;
  youtubeSearchQuery: string;
  videoId: string | null;
  videoStatus: VideoStatusType;
}

interface VideoProcessingResponse {
  success: boolean;
  message?: string;
  videoId?: string | null;
  videoStatus?: VideoStatusType;
  isReady?: boolean;
  failed?: boolean;
  timestamp?: string;
  jobId?: string;
  queueSize?: number;
  queuePending?: number;
}

interface ChapterVideoStatusResponse {
  success: boolean;
  videoId: string | null;
  videoStatus: VideoStatusType;
  isReady: boolean;
  failed: boolean;
  timestamp: string;
  jobId?: string;
  progress?: number;
  message?: string;
}

interface CourseVideoStatusResponse {
  [key: string]: any;
}

interface JobStatus {
  status: 'queued' | 'processing' | 'completed' | 'error';
  chapterId: number;
  startTime: number;
  videoId?: string | null;
  error?: string;
  progress?: number;
}

// ============= Queue Setup =============

/**
 * Processing queue with concurrency of 1 to ensure sequential processing
 * This prevents race conditions and API quota issues
 */
const queue = new PQueue({ 
  concurrency: 1,
  timeout: 10 * 60 * 1000, // 10 minute timeout per job
  throwOnTimeout: true
});

/**
 * Active jobs tracking - maps chapterId to jobId
 */
const activeJobs = new Map<number, string>();

/**
 * Job status tracking - maps jobId to status
 * This allows status queries without hitting the database constantly
 */
const jobStatuses = new Map<string, JobStatus>();

// ============= Video Service Class =============

/**
 * Service for handling video processing business logic
 * Manages YouTube video fetching, job tracking, and status updates
 */
class VideoService {
  /**
   * Get the status of a chapter's video
   * Returns current processing status with job tracking
   * 
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

    // Calculate progress based on job status
    let progress = 0;
    let message = "";
    
    if (chapter.videoId) {
      progress = 100;
      message = "Video ready";
    } else if (jobStatus) {
      switch (jobStatus.status) {
        case 'queued':
          progress = 10;
          message = "Queued for processing...";
          break;
        case 'processing':
          // Estimate progress based on time elapsed (capped at 90%)
          const elapsed = Date.now() - jobStatus.startTime;
          const estimatedTotal = 60000; // Estimate 60 seconds
          progress = Math.min(90, 30 + (elapsed / estimatedTotal) * 60);
          message = "Processing video...";
          break;
        case 'completed':
          progress = 100;
          message = "Video ready";
          break;
        case 'error':
          progress = 0;
          message = jobStatus.error || "Video generation failed";
          break;
      }
    } else if (chapter.videoStatus === 'processing') {
      // Legacy processing state without job tracking
      progress = 50;
      message = "Processing video...";
    } else if (chapter.videoStatus === 'error') {
      progress = 0;
      message = "Video generation failed";
    }

    // Determine final video status
    const videoStatus: VideoStatusType = (() => {
      if (chapter.videoId) return 'completed';
      if (jobStatus?.status === 'queued') return 'queued';
      if (jobStatus?.status === 'processing') return 'processing';
      if (chapter.videoStatus === 'error' || jobStatus?.status === 'error') return 'error';
      if (chapter.videoStatus === 'processing') return 'processing';
      return 'idle';
    })();

    return {
      success: true,
      videoId: chapter.videoId || null,
      videoStatus,
      isReady: chapter.videoId !== null,
      failed: videoStatus === 'error',
      timestamp: new Date().toISOString(),
      jobId: jobId || undefined,
      progress,
      message,
    };
  }

  /**
   * Process a video for a chapter
   * Queues video fetching and returns processing status
   * 
   * @param chapterId - The ID of the chapter to process
   * @returns Processing response with status and queue info
   * @throws Error if chapter not found or invalid
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
        message: jobStatus?.status === 'queued' 
          ? "Video generation queued" 
          : "Video generation in progress",
        videoStatus: jobStatus?.status === 'processing' ? 'processing' : 'queued',
        jobId: existingJobId,
        queueSize: queue.size,
        queuePending: queue.pending,
      };
    }

    // Get chapter from database (always fresh data)
    const chapterData = await videoRepository.findChapterById(chapterId) as any;

    if (!chapterData) {
      console.error(`[VideoService] Chapter ${chapterId} not found in database`);
      throw new Error("Chapter not found");
    }

    // If video already exists, return early
    if (chapterData.videoId) {
      console.log(`[VideoService] Chapter ${chapterId} already has video: ${chapterData.videoId}`);
      return {
        success: true,
        message: "Video already processed",
        videoId: chapterData.videoId,
        videoStatus: "completed",
        isReady: true,
      };
    }

    // Validate search query
    const searchQuery = chapterData.youtubeSearchQuery?.trim();
    if (!searchQuery) {
      console.error(`[VideoService] Chapter ${chapterId} has empty search query`);
      
      // Mark as error in database
      await videoRepository.updateChapterVideo(chapterId, null, "error");
      
      throw new Error("Chapter has no search query for video generation");
    }

    console.log(`[VideoService] Starting video processing for chapter ${chapterId} with search query: "${searchQuery}"`);

    // Generate a unique job ID
    const jobId = randomUUID();
    console.log(`[VideoService] Generated job ID ${jobId} for chapter ${chapterId}`);

    // Track the job
    activeJobs.set(chapterId, jobId);
    jobStatuses.set(jobId, { 
      status: 'queued', 
      chapterId, 
      startTime: Date.now(),
      progress: 10
    });

    // Update chapter status to processing (queued initially, will be processing when job starts)
    await videoRepository.updateChapterVideo(chapterId, null, "processing");

    console.log(`[VideoService] Chapter ${chapterId} marked as processing, adding to queue`);

    // Add the task to the queue with job tracking
    queue.add(async () => {
      try {
        // Update job status to processing
        const jobInfo = jobStatuses.get(jobId);
        if (jobInfo) {
          jobInfo.status = 'processing';
          jobInfo.progress = 30;
          jobStatuses.set(jobId, jobInfo);
        }
        
        console.log(`[VideoService] Job ${jobId} started processing for chapter ${chapterId}`);

        const videoId = await this.fetchAndUpdateVideo(chapterId, searchQuery, jobId);

        // Mark job as completed
        const finalJobInfo = jobStatuses.get(jobId);
        if (finalJobInfo) {
          finalJobInfo.status = 'completed';
          finalJobInfo.videoId = videoId;
          finalJobInfo.progress = 100;
          jobStatuses.set(jobId, finalJobInfo);
        }
        
        console.log(`[VideoService] Job ${jobId} completed for chapter ${chapterId}, videoId: ${videoId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        // Mark job as error
        const errorJobInfo = jobStatuses.get(jobId);
        if (errorJobInfo) {
          errorJobInfo.status = 'error';
          errorJobInfo.error = errorMessage;
          errorJobInfo.progress = 0;
          jobStatuses.set(jobId, errorJobInfo);
        }
        
        console.error(`[VideoService] Job ${jobId} failed for chapter ${chapterId}:`, error);
        
        // Ensure database is updated with error state
        await videoRepository.updateChapterVideo(chapterId, null, "error");
      } finally {
        // Clean up job tracking
        activeJobs.delete(chapterId);
        
        // Keep job status for a while for status queries
        setTimeout(() => {
          jobStatuses.delete(jobId);
          console.log(`[VideoService] Cleaned up job ${jobId} for chapter ${chapterId}`);
        }, 5 * 60 * 1000); // Clean up after 5 minutes
      }
    }).catch((error) => {
      // Handle queue timeout or other queue errors
      console.error(`[VideoService] Queue error for chapter ${chapterId}:`, error);
      
      // Update job status
      const jobInfo = jobStatuses.get(jobId);
      if (jobInfo) {
        jobInfo.status = 'error';
        jobInfo.error = error instanceof Error ? error.message : "Queue timeout";
        jobStatuses.set(jobId, jobInfo);
      }
      
      // Update database
      videoRepository.updateChapterVideo(chapterId, null, "error");
    });

    console.log(`[VideoService] Chapter ${chapterId} added to processing queue (size: ${queue.size}, pending: ${queue.pending})`);

    return {
      success: true,
      message: "Video generation task queued",
      videoStatus: "queued",
      jobId,
      queueSize: queue.size,
      queuePending: queue.pending,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get the status of a course's videos
   * 
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
   * Get current queue statistics
   * Useful for monitoring and debugging
   * 
   * @returns Queue status information
   */
  getQueueStatus() {
    return {
      size: queue.size,
      pending: queue.pending,
      isPaused: queue.isPaused,
      activeJobs: Array.from(activeJobs.entries()).map(([chapterId, jobId]) => ({
        chapterId,
        jobId,
        status: jobStatuses.get(jobId)?.status || 'unknown',
      })),
    };
  }

  /**
   * Private method to fetch and update a video
   * Handles the actual YouTube API call and database updates
   * 
   * @param chapterId - The ID of the chapter
   * @param youtubeSearchQuery - The YouTube search query
   * @param jobId - The job ID for tracking
   * @returns The fetched video ID or null
   * @private
   */
  private async fetchAndUpdateVideo(
    chapterId: number, 
    youtubeSearchQuery: string, 
    jobId: string
  ): Promise<string | null> {
    try {
      console.log(`[VideoService] Fetching video for chapter ${chapterId}, query: "${youtubeSearchQuery}"`);
      
      const videoId = await this.fetchVideoIdWithRetry(youtubeSearchQuery);

      if (!videoId) {
        console.warn(`[VideoService] No video found for chapter ${chapterId}`);
        await videoRepository.updateChapterVideo(chapterId, null, "error");
        throw new Error("No video found for search query");
      }

      // Update chapter with video ID
      console.log(`[VideoService] Updating chapter ${chapterId} with videoId: ${videoId}`);
      await videoRepository.updateChapterVideo(chapterId, videoId, "completed");
      
      return videoId;
    } catch (error) {
      console.error(`[VideoService] Error processing video for chapter ${chapterId}:`, error);
      
      // Ensure error state is saved
      await videoRepository.updateChapterVideo(chapterId, null, "error");
      
      throw error;
    }
  }

  /**
   * Private method to fetch video ID with retry logic
   * Implements exponential backoff and handles API quota limits
   * 
   * @param youtubeSearchQuery - The YouTube search query
   * @returns Video ID or null if not found
   * @throws Error for non-retryable errors or quota exceeded
   * @private
   */
  private async fetchVideoIdWithRetry(youtubeSearchQuery: string): Promise<string | null> {
    const maxRetries = 2;
    const baseDelay = 2000; // 2 seconds
    let lastError: Error | null = null;

    // Check if quota is disabled before attempting any searches
    if (quotaManager.isDisabled()) {
      console.error("[VideoService] YouTube API quota disabled - cannot search for videos");
      throw new Error("YouTube API quota exceeded");
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[VideoService] Search attempt ${attempt}/${maxRetries} for query: "${youtubeSearchQuery}"`);

        const videoId = await YoutubeService.searchYoutube(youtubeSearchQuery);

        if (videoId) {
          console.log(`[VideoService] ✓ Found video on attempt ${attempt}: ${videoId}`);
          return videoId;
        }

        // If no video found but no error, log and continue
        console.warn(`[VideoService] ✗ No video found on attempt ${attempt} for query: "${youtubeSearchQuery}"`);

      } catch (error: any) {
        lastError = error;

        // Check for quota exceeded - stop immediately
        if (error?.message?.includes('quota')) {
          console.error("[VideoService] YouTube API quota exceeded - stopping retries");
          // Disable quota to prevent further attempts
          quotaManager.disableQuota();
          throw new Error("YouTube API quota exceeded");
        }

        // Check for retryable errors
        const isRetryableError = 
          error?.message?.includes('timeout') ||
          error?.message?.includes('network') ||
          error?.message?.includes('ECONNRESET') ||
          error?.message?.includes('ETIMEDOUT') ||
          /5\d{2}/.test(error?.message || '') || // 5xx server errors
          (error?.message?.includes('rateLimit') && error?.message?.includes('Retry-After'));

        if (!isRetryableError) {
          console.error(`[VideoService] Non-retryable error on attempt ${attempt}:`, error.message);
          throw error; // Don't retry non-retryable errors
        }

        console.warn(`[VideoService] Retryable error on attempt ${attempt}:`, error.message);

        // Don't delay on the last attempt
        if (attempt < maxRetries) {
          const delayMs = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`[VideoService] Waiting ${delayMs}ms before retry ${attempt + 1}`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // If we get here, all retries failed
    if (lastError?.message?.includes('quota')) {
      throw new Error("YouTube API quota exceeded");
    }

    console.error(`[VideoService] All ${maxRetries} attempts failed for query: "${youtubeSearchQuery}"`, lastError);
    
    // Return null instead of throwing for "no results" scenarios
    if (!lastError || lastError.message.includes('No video found')) {
      return null;
    }
    
    throw lastError;
  }

  /**
   * Clean up old job statuses
   * Should be called periodically or on server shutdown
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [jobId, jobStatus] of jobStatuses.entries()) {
      if (now - jobStatus.startTime > maxAge) {
        jobStatuses.delete(jobId);
        console.log(`[VideoService] Cleaned up old job ${jobId}`);
      }
    }
  }
}

// ============= Service Singleton Export =============

/**
 * Singleton instance of VideoService for use throughout the application
 */
export const videoService = new VideoService();

// Cleanup old jobs every 5 minutes
setInterval(() => {
  videoService.cleanup();
}, 5 * 60 * 1000);