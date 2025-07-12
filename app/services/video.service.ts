import { videoRepository } from "@/app/repositories/video.repository";
import YoutubeService from "@/services/youtubeService";
import PQueue from "p-queue";
import pRetry from "p-retry";
import delay from "delay";

// Create a processing queue with concurrency of 1
const queue = new PQueue({ concurrency: 1 });

// Local cache for chapter data
const chapterCache = new Map<
  number,
  {
    id: number;
    youtubeSearchQuery: string;
    videoId: string | null;
    videoStatus: string;
  }
>();

/**
 * Service for handling video processing business logic
 */
export class VideoService {  /**
   * Get the status of a chapter's video
   */
  async getChapterVideoStatus(chapterId: number) {
    const chapter = await videoRepository.findChapterById(chapterId);
    
    if (!chapter) {
      throw new Error("Chapter not found");
    }

    return {
      success: true,
      videoId: chapter.videoId,
      videoStatus: chapter.videoStatus,
      isReady: chapter.videoId !== null,
      failed: chapter.videoStatus === "error",
      timestamp: new Date().toISOString(),
    };
  }
  /**
   * Process a video for a chapter
   */
  async processVideo(chapterId: number) {
    console.log(`[VideoService] Processing video for chapter ${chapterId}`)
    
    // Get chapter from cache or database
    let chapter = chapterCache.get(chapterId);

    if (!chapter) {
      console.log(`[VideoService] Chapter ${chapterId} not in cache, fetching from database`)
      const chapterData = await videoRepository.findChapterById(chapterId);

      if (!chapterData) {
        console.error(`[VideoService] Chapter ${chapterId} not found in database`)
        throw new Error("Chapter not found");
      }

      chapter = {
        id: chapterData.id,
        youtubeSearchQuery: chapterData.youtubeSearchQuery,
        videoId: chapterData.videoId,
        videoStatus: chapterData.videoStatus,
      };

      // Add to cache
      chapterCache.set(chapterId, chapter);
      console.log(`[VideoService] Chapter ${chapterId} added to cache`)
    }

    // If video already exists, return early
    if (chapter.videoId) {
      console.log(`[VideoService] Chapter ${chapterId} already has video: ${chapter.videoId}`)
      return {
        success: true,
        message: "Video already processed.",
        videoId: chapter.videoId,
        videoStatus: "completed",
      };
    }

    // If processing is in progress, return early
    if (chapter.videoStatus === "processing") {
      console.log(`[VideoService] Chapter ${chapterId} already processing`)
      return {
        success: true,
        message: "Video generation already in progress.",
        videoStatus: "processing",
      };
    }

    console.log(`[VideoService] Starting video processing for chapter ${chapterId} with search query: "${chapter.youtubeSearchQuery}"`)

    // Update chapter status to processing
    await videoRepository.updateChapterVideo(chapterId, null, "processing");

    // Update cache
    chapterCache.set(chapterId, { ...chapter, videoStatus: "processing" });

    console.log(`[VideoService] Chapter ${chapterId} marked as processing, adding to queue`)

    // Add the task to the queue
    queue.add(() => this.fetchAndUpdateVideo(chapterId, chapter!.youtubeSearchQuery));

    console.log(`[VideoService] Chapter ${chapterId} added to processing queue (queue size: ${queue.size}, pending: ${queue.pending})`)

    return {
      success: true,
      message: "Video generation task queued.",
      videoStatus: "processing",
    };
  }

  /**
   * Get the status of a course's videos
   */
  async getCourseVideoStatus(slug: string) {
    const status = await videoRepository.getCourseStatus(slug);
    if (!status) {
      throw new Error("Course not found");
    }
    
    return status;
  }

  /**
   * Private method to fetch and update a video
   */
  private async fetchAndUpdateVideo(chapterId: number, youtubeSearchQuery: string) {
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
      console.error(`Error processing video for chapter ${chapterId}:`, error);
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
   */
  private async fetchVideoIdWithRetry(youtubeSearchQuery: string): Promise<string> {
    return pRetry(
      async () => {
        await delay(1000);
        const videoId = await YoutubeService.searchYoutube(youtubeSearchQuery);
        if (!videoId) throw new Error("Failed to fetch video ID");
        return videoId;
      },
      {
        onFailedAttempt: (error) => {
          if (error.response?.status === 403) {
            console.error("403 Forbidden error: Stopping retries.");
            throw new pRetry.AbortError("Access forbidden (403). Cannot fetch video ID.");
          }
          console.log(`Attempt ${error.attemptNumber} failed. Retrying...`);
        },
        retries: 5,
      },
    );
  }
}

export const videoService = new VideoService();
