import { BaseRepository } from "./base.repository";
import prisma from "@/lib/db";
import { generateSlug } from "@/lib/utils";
import NodeCache from "node-cache";
import type { OutputUnits } from "@/app/types/course-types";

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
      orderBy.viewCount = sortOrder;
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
          viewCount: true,
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
   * Update course details
   */
  async update(courseId: number, data: any) {
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data,
      include: {
        courseUnits: true,
        category: true,
      },
    });
    
    // Clear cache entries for this course
    courseCache.del(`course_${courseId}`);
    courseCache.del(`course_${updatedCourse.slug}`);
    courseCache.del(`course_${updatedCourse.slug}_true`);
    
    return updatedCourse;
  }
  
  /**
   * Update favorite status for a course
   */
  async updateFavoriteStatus(userId: string, courseId: number, isFavorite: boolean) {
    if (isFavorite) {
      return prisma.favorite.upsert({
        where: {
          unique_user_course: {
            userId,
            courseId,
          },
        },
        create: { userId, courseId },
        update: {},
      });
    } else {
      return prisma.favorite.deleteMany({
        where: { userId, courseId },
      });
    }
  }
  
  /**
   * Get course status for a user (public and favorite status)
   */
  async getCourseStatusForUser(slug: string, userId: string) {
    const cacheKey = `course_status_${slug}_${userId}`;
    const cachedStatus = courseCache.get(cacheKey);
    
    if (cachedStatus) {
      return cachedStatus;
    }
    
    const course = await prisma.course.findUnique({
      where: { slug: slug },
      include: { favorites: { where: { userId } } },
    });
    
    if (course) {
      courseCache.set(cacheKey, course, 300); // 5 minutes TTL for status
    }
    
    return course;
  }
  
  /**
   * Delete a course and all related data
   */
  async deleteCourse(courseId: number) {
    // Get the course to clear cache later
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { slug: true },
    });
    
    await prisma.$transaction(async (tx) => {
      // Delete related data first
      await tx.favorite.deleteMany({ where: { courseId } });
      await tx.courseProgress.deleteMany({ where: { courseId } });

      // Delete course units and their chapters
      const courseUnits = await tx.courseUnit.findMany({
        where: { courseId },
        select: { id: true },
      });

      for (const unit of courseUnits) {
        const chapters = await tx.chapter.findMany({
          where: { unitId: unit.id },
          select: { id: true },
        });

        for (const chapter of chapters) {
          await tx.courseQuiz.deleteMany({ where: { chapterId: chapter.id } });
        }

        await tx.chapter.deleteMany({ where: { unitId: unit.id } });
      }

      await tx.courseUnit.deleteMany({ where: { courseId } });

      // Finally, delete the course
      await tx.course.delete({ where: { id: courseId } });
    });
    
    // Clear cache entries
    if (course) {
      courseCache.del(`course_${courseId}`);
      courseCache.del(`course_${course.slug}`);
      courseCache.del(`course_${course.slug}_true`);
    }
    
    return true;
  }

  /**
   * Get all categories for a course
   */
  async getAllCategories() {
    return prisma.category.findMany();
  }

  /**
   * Get all courses for a user
   */
  async getAllCoursesForUser(userId: string) {
    return prisma.course.findMany({
      where: { userId },
      include: {
        category: true,
        ratings: true,
        _count: {
          select: {
            courseUnits: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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
   * Update chapters for a course
   */
  async updateCourseChapters(data: {
    courseId: number;
    slug: string;
    units: Array<{
      id: number;
      chapters: Array<{
        id: number | null;
        title: string;
        videoId: string | null;
        unitId: number;
        position: number;
        isCustom?: boolean;
        youtubeSearchQuery?: string;
      }>;
    }>;
  }) {
    // Find the course to verify it exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // Process each unit and its chapters
    for (const unit of data.units) {
      // Process each chapter
      for (const chapter of unit.chapters) {
        if (chapter.id) {
          // Update existing chapter
          await prisma.chapter.update({
            where: { id: chapter.id },
            data: {
              title: chapter.title,
              videoId: chapter.videoId,
              youtubeSearchQuery: chapter.youtubeSearchQuery,
              order: chapter.position,
            },
          });
        } else {
          // Create new chapter
          await prisma.chapter.create({
            data: {
              title: chapter.title,
              videoId: chapter.videoId,
              youtubeSearchQuery: chapter.youtubeSearchQuery,
              unitId: unit.id,
              order: chapter.position,
            },
          });
        }
      }
    }

    // Clear cache for this course
    courseCache.del(`course_${course.id}`);
    courseCache.del(`course_${course.slug}`);

    return course;
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
   async getOrCreateCategory(name: string) {
    let category = await prisma.category.findUnique({
      where: { name },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name },
      });
    }

    return category;
  }
}

export const courseRepository = new CourseRepository();
