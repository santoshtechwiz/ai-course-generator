import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import type { Prisma } from "@prisma/client"
import type { CategoryId } from "@/config/categories"
import NodeCache from "node-cache"

// Cache instance with 10 minutes TTL for course listings
const coursesCache = new NodeCache({
  stdTTL: 600,
  checkperiod: 60,
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || undefined
  const category = searchParams.get("category") as CategoryId | undefined
  const userId = searchParams.get("userId") || undefined
  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const limit = Number.parseInt(searchParams.get("limit") || "20", 10)

  // Create a cache key based on the request parameters
  const cacheKey = `courses_${search || ""}_${category || ""}_${userId || ""}_${page}_${limit}`

  // Check if we have a cached response
  const cachedResponse = coursesCache.get(cacheKey)
  if (cachedResponse) {
    return NextResponse.json(cachedResponse)
  }

  try {
    const where: Prisma.CourseWhereInput = {
      OR: [
        { isPublic: true }, // Public courses
        { userId: userId }, // Courses created by the user
      ],
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(category
        ? {
            category: {
              name: category,
            },
          }
        : {}),
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
        orderBy: {
          viewCount: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.course.count({ where }),
    ])

    const formattedCourses = courses.map((course) => {
      // Calculate average rating
      const ratings = course.ratings || []
      const avgRating = ratings.length ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0

      // Calculate total lessons and quizzes
      const lessonCount = course.courseUnits.reduce((acc, unit) => acc + unit._count.chapters, 0)
      const quizCount = course.courseUnits.reduce(
        (acc, unit) =>
          acc + unit.chapters.reduce((chapterAcc, chapter) => chapterAcc + chapter._count.courseQuizzes, 0),
        0,
      )

      // Estimate duration based on content
      const estimatedHours = course.estimatedHours || Math.max(1, Math.ceil((lessonCount * 0.5 + quizCount * 0.25) / 2))

      return {
        id: course.id.toString(),
        name: course.title,
        title: course.title,
        description: course.description || "No description available",
        image: course.image,
        rating: avgRating,
        slug: course.slug || "",
        viewCount: course.viewCount,
        categoryId: course.category?.name as CategoryId,
        difficulty: course.difficulty || determineDifficulty(lessonCount, quizCount),
        estimatedHours,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        category: course.category
          ? {
              id: course.category.id.toString(),
              name: course.category.name as CategoryId,
            }
          : null,
        unitCount: course._count.courseUnits,
        lessonCount,
        quizCount,
        userId: course.userId,
      }
    })

    const response = { courses: formattedCourses, totalCount }

    // Cache the response
    coursesCache.set(cacheKey, response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

// Helper function to determine course difficulty based on content
function determineDifficulty(lessonCount: number, quizCount: number): string {
  const totalItems = lessonCount + quizCount
  if (totalItems < 15) return "Beginner"
  if (totalItems < 30) return "Intermediate"
  return "Advanced"
}
