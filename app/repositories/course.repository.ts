import { BaseRepository } from "./base.repository";
import prisma from "@/lib/db";
import { generateSlug } from "@/lib/utils";
import NodeCache from "node-cache";
import type { OutputUnits, CourseChaptersUpdate } from "@/app/types/course-types";

// Enhanced cache for course operations
const courseCache = new NodeCache({
  stdTTL: 1800, // 30 minutes cache TTL
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Disable cloning for better performance
  maxKeys: 1000, // Limit cache size
});

/**
 * Repository for handling course data operations
 */
export class CourseRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.course);
  }

  /**
   * Find a course by its slug
   */
  async findBySlug(slug: string, includeUnits: boolean = false) {
    const cacheKey = `course_${slug}_${includeUnits}`;
    const cachedCourse = courseCache.get(cacheKey);
    
    if (cachedCourse) {
      return cachedCourse;
    }
    
    const course = await prisma.course.findUnique({
      where: { slug },
      include: includeUnits ? {
        courseUnits: {
          orderBy: { createdAt: "asc" },
          include: {
            chapters: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      } : undefined,
    });

    if (course) {
      courseCache.set(cacheKey, course);
    }
    
    return course;
  }

  /**
   * Find courses with pagination and filtering
   */
  async findCourses({
    search,
    category,
    userId,
    page = 1,
    limit = 20,
    sortBy = "viewCount",
    sortOrder = "desc"
  }: {
    search?: string;
    category?: string;
    userId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    // Create a cache key based on all parameters
    const cacheKey = `courses_${search || ""}_${category || ""}_${userId || ""}_${page}_${limit}_${sortBy}_${sortOrder}`;
    
    // Check if we have a cached response
    const cachedResponse = courseCache.get(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    const where: any = {
      OR: [
        { isPublic: true }, // Public courses
        { userId: userId }, // Courses created by the user
      ],
    };

    // Add search filter if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add category filter if provided
    if (category) {
      where.category = {
        OR: [
          { id: isNaN(Number(category)) ? undefined : Number(category) },
          { name: category }
        ],
      };
    }

    // Determine the order by configuration
    const orderBy: any = {};
    if (sortBy === "title") {
      orderBy.title = sortOrder;
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === "updatedAt") {
      orderBy.updatedAt = sortOrder;
    } else {
      // Default to createdAt if viewCount doesn't exist
      orderBy.createdAt = sortOrder;
    }

    const [courses, totalCount] = await Promise.all([
      prisma.course.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
          slug: true,
          userId: true,
       
          difficulty: true,
          estimatedHours: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          ratings: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              courseUnits: true,
            },
          },
          courseUnits: {
            select: {
              _count: {
                select: {
                  chapters: true,
                },
              },
              chapters: {
                select: {
                  _count: {
                    select: {
                      courseQuizzes: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    const result = {
      courses,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };

    // Cache the result
    courseCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Generate a unique slug for a course
   */
  async generateUniqueSlug(title: string) {
    let slug = generateSlug(title);
    let counter = 1;

    while (true) {
      const existingCourse = await prisma.course.findUnique({
        where: { slug },
      });

      if (!existingCourse) break;
      slug = generateSlug(title) + `-${counter++}`;
    }

    return slug;
  }

  /**
   * Create a course with units and chapters
   */
  async createCourseWithUnits(
    courseData: {
      title: string;
      description: string;
      image: string;
      userId: string;
      categoryId: number;
      slug: string;
    },
    outputUnits: OutputUnits
  ) {
    // Remove duplicate units and chapters
    const uniqueOutputUnits = this.removeDuplicate(outputUnits);

    // Create the course
    const course = await prisma.course.create({
      data: {
        title: courseData.title,
        image: courseData.image,
        description: courseData.description,
        userId: courseData.userId,
        categoryId: courseData.categoryId,
        slug: courseData.slug,
        isPublic: false,
      },
    });

    // Create units and chapters
    for (const unit of uniqueOutputUnits) {
      const prismaUnit = await prisma.courseUnit.create({
        data: {
          name: unit.title,
          courseId: course.id,
        },
      });

      // Create chapters for this unit
      await prisma.chapter.createMany({
        data: unit.chapters.map((chapter) => ({
          title: chapter.chapter_title,
          youtubeSearchQuery: chapter.youtube_search_query,
          unitId: prismaUnit.id,
        })),
      });
    }

    // Cache the new course
    courseCache.set(`course_${course.id}`, course);
    courseCache.set(`course_${course.slug}`, course);

    return course;
  }

  /**
   * Update a course by its ID
   */
  async updateCourse(id: number, data: any) {
    const course = await prisma.course.update({
      where: { id },
      data,
    });

    // Update cache
    courseCache.set(`course_${course.id}`, course);
    courseCache.set(`course_${course.slug}`, course);

    return course;
  }

  /**
   * Get or create a category by name
   */
  async getOrCreateCategory(categoryName: string) {
    const cacheKey = `category_${categoryName}`;
    const cachedCategory = courseCache.get<number>(cacheKey);

    if (cachedCategory) {
      return cachedCategory;
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name: categoryName },
    });

    if (existingCategory) {
      courseCache.set(cacheKey, existingCategory.id);
      return existingCategory.id;
    }

    const createdCategory = await prisma.category.create({
      data: { name: categoryName },
    });

    courseCache.set(cacheKey, createdCategory.id);
    return createdCategory.id;
  }

  /**
   * Update chapter video information
   */
  async updateChapterVideo(chapterId: number, videoId: string, status: string = "success") {
    return prisma.chapter.update({
      where: { id: chapterId },
      data: {
        videoId,
        videoStatus: status,
      },
    });
  }

  /**
   * Find a chapter by ID
   */
  async findChapterById(chapterId: number) {
    return prisma.chapter.findUnique({
      where: { id: chapterId },
    });
  }

  /**
   * Get chapters by course ID
   */
  async getChaptersByCourseId(courseId: number) {
    const cacheKey = `chapters_course_${courseId}`;
    const cachedChapters = courseCache.get(cacheKey);
    
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
      },
      orderBy: {
        id: "asc",
      },
    });

    courseCache.set(cacheKey, chapters, 900); // 15 minutes cache
    return chapters;
  }
  /**
   * Update chapter summary
   */
  async updateChapterSummary(chapterId: number, summary: string | null) {
    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: { 
        summary,
        summaryStatus: summary ? "completed" : "error"
      },
    });

    // Clear chapter cache
    courseCache.del(`chapter_${chapterId}`);
    
    return chapter;
  }
  /**
   * Get chapter by ID with specific fields
   */
  async getChapterById(chapterId: number, selectFields?: any): Promise<any> {
    const defaultSelect = {
      id: true,
      videoId: true,
      summary: true,
      summaryStatus: true,
    };

    return await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: selectFields || defaultSelect,
    });
  }

  /**
   * Update chapter summary status
   */
  async updateChapterSummaryStatus(
    chapterId: number,
    status: "processing" | "completed" | "error" | "no_summary_available"
  ) {
    // Clear cache for this chapter
    courseCache.del(`chapter_${chapterId}`);
    
    return await prisma.chapter.update({
      where: { id: chapterId },
      data: { summaryStatus: status },
    });
  }

  /**
   * Verify course ownership
   */
  async verifyCourseOwnership(courseId: number, userId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { userId: true },
    });

    return course && course.userId === userId;
  }
  /**
   * Update course chapters (batch update for course editor)
   */
  async updateCourseChapters(data: CourseChaptersUpdate) {
    try {
      // Use transaction options with a longer timeout
      await prisma.$transaction(async (tx) => {
        // Log start of transaction
        console.log(`Starting transaction for course chapters update - courseId: ${data.courseId}`);
        
        // Process chapters by unit
        for (const unit of data.units) {
          // Process chapters for this unit
          for (const [index, chapter] of unit.chapters.entries()) {
            try {
              if (chapter.id) {
                // Update existing chapter
                await tx.chapter.update({
                  where: { id: chapter.id },
                  data: {
                    title: chapter.title,
                    videoId: chapter.videoId,
                    order: index, // Use the existing 'order' field instead of 'position'
                    youtubeSearchQuery: chapter.youtubeSearchQuery || chapter.title,
                    // Mark as custom chapter in the summary field if isCustom is true
                    summary: chapter.isCustom ? `Custom chapter: ${chapter.title}` : null,
                  },
                });
              } else {
                // Create new chapter
                await tx.chapter.create({
                  data: {
                    title: chapter.title,
                    videoId: chapter.videoId,
                    unitId: unit.id,
                    order: index, // Use the existing 'order' field
                    youtubeSearchQuery: chapter.youtubeSearchQuery || chapter.title,
                    videoStatus: chapter.videoId ? "completed" : "idle",
                    // Mark as custom chapter in the summary field
                    summary: chapter.isCustom ? "Custom chapter created by user" : null,
                    summaryStatus: "COMPLETED", // Set appropriate status
                  },
                });
              }
            } catch (chapterError) {
              console.error(`Error processing chapter for unit ${unit.id}, chapter ${chapter.title}:`, chapterError);
              // Throw the error to fail the transaction
              throw chapterError;
            }
          }
        }
      }, {
        maxWait: 15000, // 15s max waiting time
        timeout: 60000   // 60s transaction timeout - increased for larger batches
      });

      // Clear course cache after successful transaction
      courseCache.del(`course_${data.courseId}`);
      courseCache.del(`course_${data.slug}`);
      courseCache.del(`chapters_course_${data.courseId}`);

      return { success: true, message: "Course chapters updated successfully" };    } catch (error: any) {
      console.error(`Failed to update course chapters for courseId: ${data.courseId}`, error);
      return { success: false, message: `Failed to update chapters: ${error?.message || 'Unknown error'}` };
    }
  }

  /**
   * Decrement user credits
   */
  async decrementUserCredits(userId: string, amount: number = 1) {
    return prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    });
  }

  /**
   * Check if user has sufficient credits
   */
  async checkUserCredits(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user || user.credits <= 0) {
      throw new Error("Insufficient credits");
    }

    return user;
  }

  /**
   * Remove duplicate units and chapters
   */
  private removeDuplicate(data: OutputUnits): OutputUnits {
    const uniqueData: OutputUnits = [];
    const uniqueUnits = new Set<string>();

    for (const item of data) {
      const unitIdentifier = item.title;
      if (!uniqueUnits.has(unitIdentifier)) {
        uniqueUnits.add(unitIdentifier);

        // Create a map of normalized queries to avoid O(n²) complexity
        const uniqueQueries = new Map<string, boolean>();
        const uniqueChapters = [];

        for (const chapter of item.chapters) {
          const normalizedQuery = chapter.youtube_search_query.trim().toLowerCase();
          if (!uniqueQueries.has(normalizedQuery)) {
            uniqueQueries.set(normalizedQuery, true);
            uniqueChapters.push(chapter);
          }
        }

        uniqueData.push({
          ...item,
          chapters: uniqueChapters,
        });
      }
    }

    return uniqueData;
  }
}

export const courseRepository = new CourseRepository();
