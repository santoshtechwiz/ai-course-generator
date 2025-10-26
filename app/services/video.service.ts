import { videoRepository } from "@/app/repositories/video.repository";
import YoutubeService from "@/services/youtubeService";
import PQueue from "p-queue";
import pRetry from "p-retry";
import delay from "delay";

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
}

interface ChapterVideoStatusResponse {
  success: boolean;
  videoId: string | null;
  videoStatus: 'pending' | 'processing' | 'completed' | 'error';
  isReady: boolean;
  failed: boolean;
  timestamp: string;
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

    return {
      success: true,
      videoId: chapter.videoId || null,
      videoStatus: (chapter.videoStatus || 'pending') as 'pending' | 'processing' | 'completed' | 'error',
      isReady: chapter.videoId !== null,
      failed: chapter.videoStatus === "error",
      timestamp: new Date().toISOString(),
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

    // If processing is in progress, return early
    if (chapter.videoStatus === "processing") {
      console.log(`[VideoService] Chapter ${chapterId} already processing`);
      return {
        success: true,
        message: "Video generation already in progress.",
        videoStatus: "processing",
      };
    }

    console.log(`[VideoService] Starting video processing for chapter ${chapterId} with search query: "${chapter.youtubeSearchQuery}"`);

    // Validate search query
    if (!chapter.youtubeSearchQuery || chapter.youtubeSearchQuery.trim() === '') {
      console.error(`[VideoService] Chapter ${chapterId} has empty search query`);
      throw new Error("Chapter has no search query for video generation");
    }

    // Update chapter status to processing
    await videoRepository.updateChapterVideo(chapterId, null, "processing");

    // Update cache
    chapterCache.set(chapterId, { ...chapter, videoStatus: "processing" });

    console.log(`[VideoService] Chapter ${chapterId} marked as processing, adding to queue`);

    // Add the task to the queue
    queue.add(() => this.fetchAndUpdateVideo(chapterId, chapter!.youtubeSearchQuery));

    console.log(`[VideoService] Chapter ${chapterId} added to processing queue (queue size: ${queue.size}, pending: ${queue.pending})`);

    return {
      success: true,
      message: "Video generation task queued.",
      videoStatus: "processing",
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
   * @private
   */
  private async fetchAndUpdateVideo(chapterId: number, youtubeSearchQuery: string): Promise<void> {
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
    try {
      return await pRetry(
        async () => {
          await delay(1000);
          const videoId = await YoutubeService.searchYoutube(youtubeSearchQuery);
          if (!videoId) throw new Error("Failed to fetch video ID");
          return videoId;
        },
        {
          onFailedAttempt: (error: any) => {
            const attemptNum = error.attemptNumber || 0;
            const remaining = (5 - attemptNum) || 0;
            console.log(`[VideoService] Attempt ${attemptNum} failed. ${remaining} retries remaining...`);
          },
          retries: 5,
        } as any
      );
    } catch (error: any) {
      if (error?.message?.includes('403')) {
        console.error("[VideoService] 403 Forbidden error: Cannot fetch video ID.");
        throw new Error("Access forbidden (403). Cannot fetch video ID.");
      }
      throw error;
    }
  }
}

// ============= Service Singleton Export =============

/**
 * Singleton instance of VideoService for use throughout the application
 */
export const videoService = new VideoService();
