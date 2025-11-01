import { courseRepository } from "@/app/repositories/course.repository";
import { creditService, CreditOperationType } from "@/services/credit-service";
import type { OutputUnits, CourseUpdateData, CourseChaptersUpdate } from "@/app/types/course-types";
import { z } from "zod";
import { createChaptersSchema } from "@/schema/schema";
import { Course, Chapter, Favorite } from "@prisma/client";

/**
 * Type for course with extended relations
 */
type CourseWithRelations = Course & {
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
interface FormattedCourse {
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
interface CourseCreationResult {
  slug: string;
}

/**
 * Interface for chapter video update response
 */
interface ChapterVideoUpdateResult {
  success: boolean;
  message: string;
  chapter: Chapter;
}

/**
 * Interface for course status response
 */
interface CourseStatusResult {
  isPublic: boolean;
  isFavorite: boolean;
  rating: number | null;
}

/**
 * Interface for course update response
 */
interface CourseUpdateResult {
  success: boolean;
  course: CourseWithRelations;
}

/**
 * Interface for course deletion response
 */
interface CourseDeletionResult {
  success: boolean;
  message: string;
}

/**
 * Interface for pagination and filtering options
 */
interface CourseQueryOptions {
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
interface PaginatedCoursesResult {
  courses: FormattedCourse[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Get existing course image based on category
 * Uses pre-existing SVG images instead of making external API calls
 */
function getExistingCourseImage(category: string): string {
  const normalizedCategory = category?.toLowerCase().trim() || '';

  // Map categories to existing images
  const imageMap: Record<string, string> = {
    'programming': '/generic-course-tech-improved.svg',
    'web-development': '/generic-course-tech-improved.svg',
    'data-science': '/generic-course-tech-improved.svg',
    'machine-learning': '/generic-course-tech-improved.svg',
    'ai': '/generic-course-tech-improved.svg',
    'cloud': '/generic-course-tech-improved.svg',
    'devops': '/generic-course-tech-improved.svg',
    'cybersecurity': '/generic-course-tech-improved.svg',
    'mobile': '/generic-course-tech-improved.svg',
    'business': '/generic-course-business-improved.svg',
    'marketing': '/generic-course-business-improved.svg',
    'finance': '/generic-course-business-improved.svg',
    'management': '/generic-course-business-improved.svg',
    'design': '/generic-course-creative-improved.svg',
    'creative': '/generic-course-creative-improved.svg',
    'art': '/generic-course-creative-improved.svg',
    'photography': '/generic-course-creative-improved.svg',
  };

  // Return mapped image or default
  return imageMap[normalizedCategory] || '/generic-course-improved.svg';
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
      sortBy = "createdAt",
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
        viewCount: 0,
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
  async createCourse(userId: string, courseData: z.infer<typeof createChaptersSchema>, userType: string = 'FREE'): Promise<CourseCreationResult> {
    const { title, units, category, description } = courseData;

    // SECURE: Atomic credit validation and deduction to prevent race conditions
    const creditDeduction = 1 // Standard 1 credit for course creation
    const creditResult = await creditService.executeCreditsOperation(
      userId,
      creditDeduction,
      CreditOperationType.COURSE_GENERATION,
      {
        description: `Course creation: ${title}`,
        courseTitle: title,
        unitCount: units.length,
        category
      }
    )

    if (!creditResult.success) {
      throw new Error(creditResult.error || "Insufficient credits")
    }

    // Generate unique slug
    const slug = await courseRepository.generateUniqueSlug(title);

    // Generate course content using simple AI service
    const { generateCourse } = await import("@/lib/ai/course-ai-service");
    
    const generatedCourse = await generateCourse(
     title,
      units,
      userId,
      "BASIC" ,
      +creditResult.newBalance
    );  
    
    const outputUnits = generatedCourse.units;

    // Use existing image instead of Unsplash API call
    const courseImage = getExistingCourseImage(category);

    // Create or get category
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

    // NOTE: Credits already deducted atomically above - no need to call decrementUserCredits

    console.log(`[Course Service] Successfully created course ${course.slug} for user ${userId}. Credits remaining: ${creditResult.newBalance}`)

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
   * Update chapter transcript
   */
  async updateChapterTranscript(chapterId: number, transcript: string | null) {
    return courseRepository.updateChapterTranscript(chapterId, transcript);
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

    // Get user's rating for this course
    const userRating = await this.getUserCourseRating(slug, userId);

    return {
      isPublic: course.isPublic || false,
      isFavorite: false, // Note: Favorites functionality needs to be implemented separately
      rating: userRating,
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
   * Rate a course
   */
  async rateCourse(slug: string, userId: string, rating: number): Promise<{ success: boolean; userRating: number }> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Get course by slug
      const course = await courseRepository.getCourseBySlug(slug);
      if (!course) {
        throw new Error("Course not found");
      }

      // Upsert rating (create or update)
      const courseRating = await courseRepository.upsertCourseRating(course.id, userId, rating);

      return {
        success: true,
        userRating: courseRating.rating
      };
    } catch (error) {
      console.error("Error rating course:", error);
      throw error;
    }
  }

  /**
   * Get user's rating for a course
   */
  async getUserCourseRating(slug: string, userId: string): Promise<number | null> {
    try {
      const course = await courseRepository.getCourseBySlug(slug);
      if (!course) {
        return null;
      }

      const rating = await courseRepository.getUserCourseRating(course.id, userId);
      return rating?.rating || null;
    } catch (error) {
      console.error("Error getting user course rating:", error);
      return null;
    }
  }

  /**
   * Get chapters by course ID
   */
  async getChaptersByCourseId(courseId: number) {
    return courseRepository.getChaptersByCourseId(courseId);
  }
}

export const courseService = new CourseService();
