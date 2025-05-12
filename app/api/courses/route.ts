import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import type { Prisma } from "@prisma/client"
import NodeCache from "node-cache"

// Enhanced cache with longer TTL for better performance
const coursesCache = new NodeCache({
  stdTTL: 1800, // 30 minutes cache TTL
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Disable cloning for better performance
  maxKeys: 1000, // Limit cache size
})

// Reuse the determineDifficulty function
function determineDifficulty(lessonCount: number, quizCount: number): string {
  const totalItems = lessonCount + quizCount
  if (totalItems < 15) return "Beginner"
  if (totalItems < 30) return "Intermediate"
  return "Advanced"
}

// Add this helper function to calculate average rating
function calculateAverageRating(ratings: { rating: number }[]): number {
  if (!ratings || ratings.length === 0) return 0
  return Number.parseFloat((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || undefined
  const categoryParam = searchParams.get("category")
  const userId = searchParams.get("userId") || undefined
  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const limit = Number.parseInt(searchParams.get("limit") || "20", 10)
  const sortBy = searchParams.get("sortBy") || "viewCount" // New sorting parameter
  const sortOrder = searchParams.get("sortOrder") || "desc" // New sorting order parameter
  const minRating = Number.parseFloat(searchParams.get("minRating") || "0") // New rating filter

  // Create a cache key based on all request parameters
  const cacheKey = `courses_${search || ""}_${categoryParam || ""}_${userId || ""}_${page}_${limit}_${sortBy}_${sortOrder}_${minRating}`

  // Check if we have a cached response
  const cachedResponse = coursesCache.get(cacheKey)
  if (cachedResponse) {
    return NextResponse.json(cachedResponse)
  }

  try {
    // Determine if categoryParam is an ID (number) or name
    let categoryId: number | undefined
    let categoryName: string | undefined

    if (categoryParam) {
      // Try to parse as number for ID
      const parsedId = Number.parseInt(categoryParam, 10)
      if (!isNaN(parsedId)) {
        categoryId = parsedId
      } else {
        // If not a number, treat as name
        categoryName = categoryParam
      }
    }

    console.log("Category filter:", { categoryId, categoryName, categoryParam })

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
      ...(categoryId || categoryName
        ? {
            category: categoryId
              ? { id: categoryId }
              : categoryName
                ? { name: { equals: categoryName, mode: "insensitive" } }
                : undefined,
          }
        : {}),
    }

    // Determine the order by configuration based on sortBy and sortOrder
    const orderBy: Prisma.CourseOrderByWithRelationInput = {}

    // Set the sort field and direction
    if (sortBy === "title") {
      orderBy.title = sortOrder as "asc" | "desc"
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder as "asc" | "desc"
    } else if (sortBy === "updatedAt") {
      orderBy.updatedAt = sortOrder as "asc" | "desc"
    } else {
      // Default to viewCount
      orderBy.viewCount = sortOrder as "asc" | "desc"
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
    ])

    // In the GET function, replace the course formatting logic with this more efficient version:
    const formattedCourses = courses
      .map((course) => {
        // Calculate average rating
        const avgRating = calculateAverageRating(course.ratings || [])

        // Calculate total lessons and quizzes more efficiently
        const lessonCount = course.courseUnits.reduce((acc, unit) => acc + unit._count.chapters, 0)
        const quizCount = course.courseUnits.reduce(
          (acc, unit) =>
            acc + unit.chapters.reduce((chapterAcc, chapter) => chapterAcc + chapter._count.courseQuizzes, 0),
          0,
        )

        // Estimate duration based on content
        const estimatedHours =
          course.estimatedHours || Math.max(1, Math.ceil((lessonCount * 0.5 + quizCount * 0.25) / 2))

        return {
          id: course.id.toString(),
          name: course.title,
          title: course.title,
          description: course.description || "No description available",
          image: course.image,
          rating: avgRating,
          slug: course.slug || "",
          viewCount: course.viewCount,
          categoryId: course.category?.id.toString(),
          difficulty: course.difficulty || determineDifficulty(lessonCount, quizCount),
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
        }
      })
      // Filter by minimum rating if specified
      .filter((course) => minRating <= 0 || course.rating >= minRating)

    const response = {
      courses: formattedCourses,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    }

    // Cache the response
    coursesCache.set(cacheKey, response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses", details: error }, { status: 500 })
  }
}
