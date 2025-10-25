import { videoRepository } from "@/app/repositories/video.repository"
import YoutubeService from "@/services/youtubeService"
import { optimizedVideoService } from "@/app/services/optimized-video.service"
import PQueue from "p-queue"
import pRetry, { AbortError, FailedAttemptError } from "p-retry"
import pTimeout from "p-timeout"
import delay from "delay"
import { Subject } from "rxjs"
import { Chapter } from "@/app/types/course-types"

// Types
interface VideoProcessingOptions {
  useOptimizedService?: boolean
  priority?: number
  timeout?: number
  retries?: number
}

interface VideoGenerationStatus {
  chapterId: number
  status: "queued" | "processing" | "completed" | "error"
  progress?: number
  videoId?: string | null
  message?: string
  error?: string
  startTime?: number
  endTime?: number
  processingTime?: number
}

interface VideoProcessingEvents {
  onStatusChange?: (status: VideoGenerationStatus) => void
  onComplete?: (status: VideoGenerationStatus) => void
  onError?: (status: VideoGenerationStatus) => void
}

// Configuration
const DEFAULT_CONFIG = {
  CONCURRENCY: 3,
  TIMEOUT_MS: 45000,
  RETRIES: 3,
  USE_OPTIMIZED_SERVICE: true,
  STATUS_EVENT_INTERVAL_MS: 1000,
}

/**
 * Enhanced Video Processing Service
 * 
 * Features:
 * - Parallel processing with configurable concurrency
 * - Real-time status updates
 * - Improved error handling and retry logic
 * - Integration with optimized video service
 * - Ability to cancel pending requests
 */
class VideoProcessingService {
  private processingQueue: PQueue
  private statusUpdates = new Subject<VideoGenerationStatus>()
  private activeProcesses = new Map<number, { cancel: () => void }>()
  
  constructor(config = DEFAULT_CONFIG) {
    this.processingQueue = new PQueue({
      concurrency: config.CONCURRENCY,
      autoStart: true,
      intervalCap: 10,
      interval: 1000,
    })
    
    console.log(`EnhancedVideoProcessingService initialized with concurrency: ${config.CONCURRENCY}`)
    
    // Setup monitoring
    setInterval(() => {
      if (this.processingQueue.size > 0 || this.processingQueue.pending > 0) {
        console.log(`Video processing queue: ${this.processingQueue.size} pending, ${this.processingQueue.pending} in progress`)
      }
    }, 10000)
  }
  
  /**
   * Subscribe to status updates for all video processing
   */
  subscribeToStatusUpdates(callback: (status: VideoGenerationStatus) => void) {
    return this.statusUpdates.subscribe(callback)
  }
  
  /**
   * Process a video for a chapter with improved flow
   */
  async processVideo(
    chapterId: number,
    options: VideoProcessingOptions = {},
    events?: VideoProcessingEvents
  ) {
    const startTime = Date.now();
    const priority = options.priority || 0;

    // Create status update
    const updateStatus = (status: Partial<VideoGenerationStatus>) => {
      const updatedStatus = {
        chapterId,
        ...status,
        startTime,
        processingTime: Date.now() - startTime,
      } as VideoGenerationStatus;

      // Emit status update
      this.statusUpdates.next(updatedStatus);

      // Call event callback if provided
      if (events?.onStatusChange) {
        events.onStatusChange(updatedStatus);
      }

      // Call specific event callbacks
      if (status.status === "completed" && events?.onComplete) {
        events.onComplete(updatedStatus);
      }

      if (status.status === "error" && events?.onError) {
        events.onError(updatedStatus);
      }

      return updatedStatus;
    };

    try {
      // Get chapter data
      const chapter = (await videoRepository.findChapterById(chapterId)) as Chapter | null;

      if (!chapter) {
        return updateStatus({
          status: "error",
          error: "Chapter not found",
          endTime: Date.now(),
        });
      }

      // Check if video already exists
      if (chapter.videoId) {
        return updateStatus({
          status: "completed",
          videoId: chapter.videoId,
          message: "Video already processed",
          endTime: Date.now(),
        });
      }

      // Check if already processing
      if (chapter.videoStatus === "processing") {
        return updateStatus({
          status: "processing",
          message: "Video generation already in progress",
        });
      }

      // Update chapter status to processing
      await videoRepository.updateChapterVideo(chapterId, null, "processing");
      updateStatus({ status: "queued", message: "Video generation task queued" });

      // Add the task to the queue with priority
      const processPromise = this.processingQueue.add(
        () => this.processVideoTask(chapterId, chapter.youtubeSearchQuery || "", options, updateStatus),
        { priority }
      );

      // Return initial status
      return {
        success: true,
        message: "Video generation task queued",
        videoStatus: "processing",
      };
    } catch (error) {
      console.error(`Error processing video for chapter ${chapterId}:`, error);
      return updateStatus({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        endTime: Date.now(),
      });
    }
  }
  
  /**
   * Cancel processing for a chapter
   */
  cancelProcessing(chapterId: number) {
    const process = this.activeProcesses.get(chapterId)
    if (process) {
      process.cancel()
      this.activeProcesses.delete(chapterId)
      return true
    }
    return false
  }
  
  /**
   * Get the status of all active processes
   */
  getQueueStatus() {
    return {
      size: this.processingQueue.size,
      pending: this.processingQueue.pending,
      activeProcesses: Array.from(this.activeProcesses.keys()),
    }
  }
  
  /**
   * Process multiple videos in parallel with improved batching
   */
  async processMultipleVideos(chapterIds: number[], options: VideoProcessingOptions = {}) {
    if (chapterIds.length === 0) {
      return { success: true, message: "No chapters to process", processed: 0 }
    }
    
    // Process with different priorities to stagger the requests
    const results = await Promise.all(
      chapterIds.map((chapterId, index) =>
        this.processVideo(
          chapterId,
          { ...options, priority: -index }, // Higher index = lower priority
          {
            onStatusChange: (status) => {
              console.log(`Chapter ${chapterId} status: ${status.status}`);
            },
          }
        )
      )
    );

    const successful = results.filter((r) => (r as any).success).length;

    return {
      success: successful > 0,
      message: `Processed ${successful} out of ${chapterIds.length} videos`,
      processed: successful,
      total: chapterIds.length,
    };
  }
  
  /**
   * Process a single video with improved error handling and retry logic
   */
  private async processVideoTask(
    chapterId: number,
    searchQuery: string,
    options: VideoProcessingOptions,
    updateStatus: (status: Partial<VideoGenerationStatus>) => VideoGenerationStatus
  ): Promise<VideoGenerationStatus> {
    let abortController = new AbortController();
    let videoId: string | null = null;

    // Register the process for possible cancellation
    this.activeProcesses.set(chapterId, {
      cancel: () => {
        abortController.abort('Processing cancelled by user');
        updateStatus({
          status: "error",
          error: "Processing cancelled",
          endTime: Date.now(),
        });
      },
    });

    try {
      updateStatus({ status: "processing", message: "Fetching video..." });

      // Check if should use optimized service
      if (options.useOptimizedService ?? DEFAULT_CONFIG.USE_OPTIMIZED_SERVICE) {
        const result = await pTimeout(
          optimizedVideoService.processVideoQuick(chapterId, searchQuery),
          { milliseconds: options.timeout || DEFAULT_CONFIG.TIMEOUT_MS, signal: abortController.signal }
        );

        videoId = result.videoId ?? null;
      } else {
        // Use standard video processing with retries
        videoId = await this.fetchVideoWithRetries(searchQuery, options, abortController.signal);
      }

      if (!videoId) {
        throw new Error("Failed to find a suitable video");
      }

      // Update the chapter with the video ID
      await videoRepository.updateChapterVideo(chapterId, videoId, "completed");

      // Update status and clean up
      const result = updateStatus({
        status: "completed",
        videoId,
        message: "Video generation completed successfully",
        endTime: Date.now(),
      });

      this.activeProcesses.delete(chapterId);
      return result;
    } catch (error) {
      console.error(`Error processing video for chapter ${chapterId}:`, error);

      // Update chapter with error status
      await videoRepository.updateChapterVideo(chapterId, null, "error");

      // Update status and clean up
      const result = updateStatus({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        endTime: Date.now(),
      });

      this.activeProcesses.delete(chapterId);
      return result;
    }
  }
  
  /**
   * Fetch video with improved retry logic
   */
  private async fetchVideoWithRetries(
    searchQuery: string,
    options: VideoProcessingOptions,
    signal?: AbortSignal
  ): Promise<string> {
    return pRetry(
      async () => {
        // Add small delay between attempts
        await delay(1000);

        // Check for abort
        if (signal?.aborted) {
          throw new AbortError("Operation cancelled");
        }

        // Fetch video ID
        const videoId = await pTimeout(
          YoutubeService.searchYoutube(searchQuery),
          { milliseconds: options.timeout || DEFAULT_CONFIG.TIMEOUT_MS, signal }
        );

        if (!videoId) {
          throw new Error("Failed to fetch video ID");
        }

        return videoId;
      },
      {
        retries: options.retries || DEFAULT_CONFIG.RETRIES,
        onFailedAttempt: (error: FailedAttemptError) => {
          console.log(`Attempt failed for "${searchQuery}". ${error.retriesLeft} retries left.`);

          // Abort retries on certain conditions
          if (
            signal?.aborted ||
            (typeof (error as any).response?.status !== "undefined" && (error as any).response.status === 403) ||
            error instanceof AbortError
          ) {
            throw new AbortError(error.message);
          }
        },
        signal,
      }
    );
  }
}

// Create singleton instance
export const enhancedVideoProcessingService = new VideoProcessingService()
