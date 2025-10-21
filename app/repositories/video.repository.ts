import { BaseRepository } from "./base.repository";
import prisma from "@/lib/db";
import NodeCache from "node-cache";

// Cache for video-related operations
const videoCache = new NodeCache({
  stdTTL: 900, // 15 minutes cache TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Disable cloning for better performance
  maxKeys: 500, // Limit cache size
});

/**
 * Repository for handling video data operations
 */
class VideoRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.chapter); // Using chapter as the base entity since videos are part of chapters
  }

  /**
   * Find a chapter by its ID
   */
  async findChapterById(chapterId: number) {
    const cacheKey = `chapter_${chapterId}`;
    const cachedChapter = videoCache.get(cacheKey);
    
    if (cachedChapter) {
      return cachedChapter;
    }
    
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { 
        id: true, 
        youtubeSearchQuery: true, 
        videoId: true, 
        videoStatus: true,
        summary: true,
        summaryStatus: true,
      },
    });

    if (chapter) {
      videoCache.set(cacheKey, chapter);
    }
    
    return chapter;
  }

  /**
   * Update a chapter's video ID and status
   */
  async updateChapterVideo(chapterId: number, videoId: string | null, status: string = "completed") {
    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: { 
        videoId,
        videoStatus: status,
      },
    });

    // Clear cache for this chapter
    videoCache.del(`chapter_${chapterId}`);
    
    return chapter;
  }

  /**
   * Get all chapters for a course
   */
  async getChaptersByCourseId(courseId: number) {
    const cacheKey = `course_chapters_${courseId}`;
    const cachedChapters = videoCache.get(cacheKey);
    
    if (cachedChapters) {
      return cachedChapters;
    }
    
    const chapters = await prisma.chapter.findMany({
      where: {
        unit: {
          courseId: courseId,
        },
      },
      select: {
        id: true,
        title: true,
        youtubeSearchQuery: true,
        videoId: true,
        videoStatus: true,
        summary: true,
        summaryStatus: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    videoCache.set(cacheKey, chapters);
    
    return chapters;
  }

  /**
   * Get course status information
   */
  async getCourseStatus(slug: string) {
    const course = await prisma.course.findUnique({
      where: { slug: slug },
      include: {
        courseUnits: {
          include: {
            chapters: true,
          },
        },
      },
    });

    if (!course) {
      return null;
    }

    let totalChapters = 0;
    let completedChapters = 0;
    let hasError = false;

    course.courseUnits.forEach((unit) => {
      totalChapters += unit.chapters.length;
      completedChapters += unit.chapters.filter((chapter) => chapter.videoStatus === "completed").length;
      if (unit.chapters.some((chapter) => chapter.videoStatus === "error")) {
        hasError = true;
      }
    });

    const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    let status: "pending" | "processing" | "completed" | "error" = "processing";

    if (progress === 0) {
      status = "pending";
    } else if (progress === 100) {
      status = "completed";
    } else if (hasError) {
      status = "error";
    }

    return { status, progress };
  }

  /**
   * Find chapters by their video status
   */
  async findChaptersWithStatus(status: 'idle' | 'processing' | 'completed' | 'error') {
    const cacheKey = `chapters_status_${status}`;
    const cachedChapters = videoCache.get(cacheKey);
    
    if (cachedChapters) {
      return cachedChapters;
    }
    
    try {
      const chapters = await prisma.chapter.findMany({
        where: { videoStatus: status },
        select: { 
          id: true, 
          title: true,
          youtubeSearchQuery: true, 
          videoId: true, 
          videoStatus: true,
          summary: true,
          summaryStatus: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Cache for a shorter time for status-based queries
      videoCache.set(cacheKey, chapters, 300); // 5 minutes
      
      return chapters;
    } catch (error) {
      console.error(`Error finding chapters with status ${status}:`, error);
      return null;
    }
  }
}

export const videoRepository = new VideoRepository();
