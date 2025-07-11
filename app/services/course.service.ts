import { courseRepository } from "@/app/repositories/course.repository";
import { generateCourseContent } from "@/lib/chatgpt/generateCourseContent";
import { getUnsplashImage } from "@/lib/unsplash";
import type { OutputUnits, CourseUpdateData, CourseChaptersUpdate } from "@/app/types/course-types";
import { z } from "zod";
import { createChaptersSchema } from "@/schema/schema";
import { Course, Chapter, Favorite } from "@prisma/client";

/**
 * Type for course with extended relations
 */
export type CourseWithRelations = Course & {
  courseUnits: Array<{
    id: number;
    chapters: Array<Chapter>;
    _count: { chapters: number };
  }>;
  ratings?: Array<{ rating: number }>;
  category?: { id: number; name: string } | null;
  _count: { courseUnits: number };
  favorites?: Array<Favorite>;
};

/**
 * Type for formatted course data returned to clients
 */
export interface FormattedCourse {
  id: string;
  name: string;
  title: string;
  description: string;
  image: string | null;
  rating: number;
  slug: string;
  viewCount: number;
  categoryId: string | undefined;
  difficulty: string;
  estimatedHours: number;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  } | null;
  unitCount: number;
  lessonCount: number;
  quizCount: number;
  userId: string;
}

/**
 * Interface for course creation response
 */
export interface CourseCreationResult {
  slug: string;
}

/**
 * Interface for chapter video update response
 */
export interface ChapterVideoUpdateResult {
  success: boolean;
  message: string;
  chapter: Chapter;
}

/**
 * Interface for course status response
 */
export interface CourseStatusResult {
  isPublic: boolean;
  isFavorite: boolean;
}

/**
 * Interface for course update response
 */
export interface CourseUpdateResult {
  success: boolean;
  course: CourseWithRelations;
}

/**
 * Interface for course deletion response
 */
export interface CourseDeletionResult {
  success: boolean;
  message: string;
}

/**
 * Interface for pagination and filtering options
 */
export interface CourseQueryOptions {
  search?: string;
  category?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Interface for pagination results
 */
export interface PaginatedCoursesResult {
  courses: FormattedCourse[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Service for handling course business logic
 */
export class CourseService {
  /**
   * Get courses with filtering and pagination
   */
  async getCourses(options: CourseQueryOptions): Promise<PaginatedCoursesResult> {
    const {
      search,
      category,
      userId,
      page = 1,
      limit = 20,
      sortBy = "viewCount",
      sortOrder = "desc",
    } = options;    const result = await courseRepository.findCourses({
      search,
      category,
      userId,
      page,
      limit,
      sortBy,
      sortOrder,
    }) as {
      courses: CourseWithRelations[];
      totalCount: number;
      page: number;
      limit: number;
      totalPages: number;
    };

    // Process courses to add calculated fields
    const formattedCourses = result.courses.map((course: CourseWithRelations) => {
      // Calculate average rating
      const ratings = course.ratings || [];
      const avgRating = ratings.length ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length : 0;

      // Calculate total lessons and quizzes
      const lessonCount = course.courseUnits.reduce((acc: number, unit: any) => acc + unit._count.chapters, 0);
      const quizCount = course.courseUnits.reduce(
        (acc: number, unit: any) =>
          acc + unit.chapters.reduce((chapterAcc: number, chapter: any) => chapterAcc + chapter._count.courseQuizzes, 0),
        0,
      );

      // Estimate duration based on content
      const estimatedHours = course.estimatedHours || Math.max(1, Math.ceil((lessonCount * 0.5 + quizCount * 0.25) / 2));

      return {
        id: course.id.toString(),
        name: course.title,
        title: course.title,
        description: course.description || "No description available",
        image: course.image,
        rating: avgRating,
        slug: course.slug || "",
        viewCount: course.viewCount,
        categoryId: course.category?.name,
        difficulty: course.difficulty || this.determineDifficulty(lessonCount, quizCount),
        estimatedHours,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        category: course.category
          ? {
              id: course.category.id.toString(),
              name: course.category.name,
            }
          : null,
        unitCount: course._count.courseUnits,
        lessonCount,
        quizCount,
        userId: course.userId,
      };
    });

    return {
      courses: formattedCourses,
      totalCount: result.totalCount,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Get a course by its slug
   */
  async getCourseBySlug(slug: string): Promise<CourseWithRelations> {
    const course = await courseRepository.findBySlug(slug, true) as CourseWithRelations;
    if (!course) {
      throw new Error("Course not found");
    }
    return course;
  }

  /**
   * Create a new course from title, units, and category
   */
  async createCourse(userId: string, courseData: z.infer<typeof createChaptersSchema>): Promise<CourseCreationResult> {
    // Validate user credits
    await courseRepository.checkUserCredits(userId);

    const { title, units, category, description } = courseData;

    // Generate unique slug
    const slug = await courseRepository.generateUniqueSlug(title);

    // Generate course content
    const outputUnits = await generateCourseContent(title, units);

    // Get course image
    const courseImage = await getUnsplashImage(title);    // Create or get category
    const categoryId = await courseRepository.getOrCreateCategory(category);

    // Create course and its units
    const course = await courseRepository.createCourseWithUnits(
      {
        title,
        description,
        image: courseImage,
        userId,
        categoryId: categoryId,
        slug,
      },
      outputUnits,
    );

    // Decrement user credits
    await courseRepository.decrementUserCredits(userId);

    return { slug: course.slug! };
  }

  /**
   * Update a chapter's video ID or status
   */
  async updateChapterVideo(chapterId: number, videoId?: string): Promise<ChapterVideoUpdateResult> {
    // Find the chapter
    const chapter = await courseRepository.findChapterById(chapterId);
    if (!chapter) {
      throw new Error("Chapter not found");
    }

    // If videoId is provided, update directly
    if (videoId) {
      const updatedChapter = await courseRepository.updateChapterVideo(chapterId, videoId);
      return {
        success: true,
        message: "Video ID set successfully",
        chapter: updatedChapter,
      };
    }

    // Mark as processing
    const processingChapter = await courseRepository.updateChapterVideo(chapterId, "", "processing");

    // In a real implementation, trigger an async job here
    // Simulate with setTimeout for demo
    this.simulateVideoGeneration(chapterId);

    return {
      success: true,
      message: "Video generation started",
      chapter: processingChapter,
    };
  }

  /**
   * Update chapter summary
   */
  async updateChapterSummary(chapterId: number, summary: string | null) {
    return courseRepository.updateChapterSummary(chapterId, summary);
  }
    /**
   * Get chapter by ID
   */
  async getChapterById(chapterId: number, selectFields?: any): Promise<any> {
    return courseRepository.getChapterById(chapterId, selectFields);
  }

  /**
   * Update chapter summary status
   */
  async updateChapterSummaryStatus(
    chapterId: number,
    status: "processing" | "completed" | "error" | "no_summary_available"
  ) {
    return courseRepository.updateChapterSummaryStatus(chapterId, status);
  }

  /**
   * Update course chapters (for course editor)
   */
  async updateCourseChapters(data: CourseChaptersUpdate, userId: string) {
    // Verify course ownership first
    const hasAccess = await courseRepository.verifyCourseOwnership(data.courseId, userId);
    
    if (!hasAccess) {
      throw new Error("Unauthorized access to this course");
    }

    // Use the existing repository method
    return courseRepository.updateCourseChapters(data);
  }

  /**
   * Update a course by its slug
   */
  async updateCourseBySlug(slug: string, userId: string, updateData: CourseUpdateData): Promise<CourseUpdateResult> {
    const course = await courseRepository.findBySlug(slug) as CourseWithRelations;

    if (!course) {
      throw new Error("Course not found");
    }

    if (course.userId !== userId) {
      throw new Error("Forbidden");
    }

    // Create updates object, removing undefined values
    const updates: Record<string, any> = { ...updateData };

    // Handle favorite status separately if present
    if (updateData.isFavorite !== undefined) {
      await this.updateFavoriteStatus(userId, course.id, updateData.isFavorite);
      delete updates.isFavorite;
    }

    // Set completion status if progress is 100%
    if (updateData.progress === 100) {
      updates.isCompleted = true;
    }

    // Update the course
    const updatedCourse = await courseRepository.update(course.id, updates);

    return { success: true, course: updatedCourse as unknown as CourseWithRelations };
  }

  /**
   * Delete a course by its slug
   */
  async deleteCourseBySlug(slug: string, userId: string): Promise<CourseDeletionResult> {
    const course = await courseRepository.findBySlug(slug) as CourseWithRelations;

    if (!course) {
      throw new Error("Course not found");
    }

    if (course.userId !== userId) {
      throw new Error("Forbidden");
    }    await courseRepository.delete(course.id);

    return { success: true, message: "Course deleted successfully" };
  }
  /**
   * Get course public status and favorite status
   */
  async getCourseStatus(slug: string, userId: string): Promise<CourseStatusResult> {
    const course = await courseRepository.findBySlug(slug, true) as CourseWithRelations;

    if (!course) {
      throw new Error("Course not found");
    }

    // Check if the user has access to this course
    if (course.userId !== userId && !course.isPublic) {
      throw new Error("Forbidden");
    }

    return {
      isPublic: course.isPublic || false,
      isFavorite: false, // Note: Favorites functionality needs to be implemented separately
    };
  }

  /**
   * Update favorite status for a course
   */
  private async updateFavoriteStatus(userId: string, courseId: number, isFavorite: boolean): Promise<unknown> {
    // This would need to be implemented in the repository
    // For now, we'll just return a placeholder
    return { success: true };
  }

  /**
   * Helper method to determine course difficulty based on content
   */
  private determineDifficulty(lessonCount: number, quizCount: number): string {
    const totalItems = lessonCount + quizCount;
    if (totalItems < 15) return "Beginner";
    if (totalItems < 30) return "Intermediate";
    return "Advanced";
  }

  /**
   * Helper method to simulate video generation asynchronously
   */
  private simulateVideoGeneration(chapterId: number): void {
    const processingTime = 3000 + Math.random() * 2000;
    setTimeout(async () => {
      try {
        await courseRepository.updateChapterVideo(
          chapterId,
          `video-${Math.random().toString(36).substring(2, 10)}`,
        );
        console.log(`Video generation completed for chapter ${chapterId}`);
      } catch (error) {
        console.error(`Error completing video generation for chapter ${chapterId}:`, error);

        // Update with error status
        try {
          await courseRepository.updateChapterVideo(chapterId, "", "error");
        } catch (updateError) {
          console.error(`Error updating chapter status to error: ${updateError}`);
        }
      }    }, processingTime);
  }

  /**
   * Get chapters by course ID
   */
  async getChaptersByCourseId(courseId: number) {
    return courseRepository.getChaptersByCourseId(courseId);
  }
}

export const courseService = new CourseService();
