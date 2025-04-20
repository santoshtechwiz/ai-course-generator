import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import type { Prisma } from "@prisma/client"
import type { CategoryId } from "@/config/categories"
import NodeCache from "node-cache"
import { getAuthSession } from "@/lib/authOptions"
import { generateCourseContent } from "@/lib/chatgpt/generateCourseContent"
import { getUnsplashImage } from "@/lib/unsplash"
import { generateSlug } from "@/lib/utils"
import { createChaptersSchema } from "@/schema/schema"

// Enhanced cache with longer TTL for better performance
const coursesCache = new NodeCache({
  stdTTL: 1800, // 30 minutes cache TTL
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Disable cloning for better performance
  maxKeys: 1000, // Limit cache size
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || undefined
  const category = searchParams.get("category") as CategoryId | undefined
  const userId = searchParams.get("userId") || undefined
  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const limit = Number.parseInt(searchParams.get("limit") || "20", 10)
  const sortBy = searchParams.get("sortBy") || "viewCount"
  const sortOrder = searchParams.get("sortOrder") || "desc"
  const slug = searchParams.get("slug")

  // Handle single course fetch by slug
  if (slug) {
    try {
      if (!slug) {
        return NextResponse.json({ error: "Slug is required" }, { status: 400 })
      }

      // Fetch from database
      const session = await getAuthSession()
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const course = await prisma.course.findUnique({
        where: { slug },
        include: {
          courseUnits: {
            orderBy: { createdAt: "asc" },
            include: {
              chapters: {
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      })

      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 })
      }

      return NextResponse.json(course)
    } catch (error) {
      console.error("Error fetching course:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }

  // Create a cache key based on all request parameters
  const cacheKey = `courses_${search || ""}_${category || ""}_${userId || ""}_${page}_${limit}_${sortBy}_${sortOrder}`

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
              OR: [{ id: isNaN(Number(category)) ? undefined : Number(category) }, { name: category }],
            },
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

async function validateUserCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  })

  if (!user || user.credits <= 0) {
    throw new Error("Insufficient credits")
  }

  return user
}

async function createCategory(category: string) {
  const cacheKey = `category_${category}`
  const cachedCategory = coursesCache.get<number>(cacheKey)

  if (cachedCategory) {
    return cachedCategory
  }

  const existingCategory = await prisma.category.findUnique({
    where: { name: category },
  })

  if (existingCategory) {
    coursesCache.set(cacheKey, existingCategory.id)
    return existingCategory.id
  }

  const createdCategory = await prisma.category.create({
    data: { name: category },
  })

  coursesCache.set(cacheKey, createdCategory.id)
  return createdCategory.id
}

async function generateUniqueSlug(title: string) {
  let slug = generateSlug(title)
  let counter = 1

  while (true) {
    const existingCourse = await prisma.course.findUnique({
      where: { slug },
    })

    if (!existingCourse) break
    slug = generateSlug(title) + `-${counter++}`
  }

  return slug
}

type OutputUnits = {
  title: string
  chapters: {
    youtube_search_query: string
    chapter_title: string
  }[]
}[]

const removeDuplicate = (data: OutputUnits): OutputUnits => {
  const uniqueData = []
  const uniqueUnits = new Set()

  for (const item of data) {
    const unitIdentifier = item.title
    if (!uniqueUnits.has(unitIdentifier)) {
      uniqueUnits.add(unitIdentifier)
      const uniqueItem = {
        ...item,
        chapters: item.chapters.reduce(
          (accChapters, chapter) => {
            const normalizedQuery = chapter.youtube_search_query.trim()?.toLowerCase()
            const existingChapter = accChapters.find(
              (c) => c.youtube_search_query.trim()?.toLowerCase() === normalizedQuery,
            )
            if (!existingChapter) {
              accChapters.push(chapter)
            }
            return accChapters
          },
          [] as (typeof item)["chapters"],
        ),
      }
      uniqueData.push(uniqueItem)
    }
  }

  return uniqueData
}

async function createCourseWithUnits(
  courseData: {
    title: string
    description: string
    image: string
    userId: string
    categoryId: number
    slug: string
  },
  outputUnits: OutputUnits,
) {
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
  })

  const outputUnitsClone = removeDuplicate(outputUnits)

  for (const unit of outputUnitsClone) {
    const prismaUnit = await prisma.courseUnit.create({
      data: {
        name: unit.title,
        courseId: course.id,
      },
    })

    await prisma.chapter.createMany({
      data: unit.chapters.map((chapter) => ({
        title: chapter.chapter_title,
        youtubeSearchQuery: chapter.youtube_search_query,
        unitId: prismaUnit.id,
      })),
    })
  }

  return course
}

export async function POST(req: Request) {
  try {
    // Real implementation
    const session = await getAuthSession()
    if (!session?.user) {
      return new NextResponse("unauthorised", { status: 401 })
    }

    // Validate user credits before starting expensive operations
    await validateUserCredits(session.user.id)

    const data = await req.json()
    const { title, units, category, description } = createChaptersSchema.parse(data)

    // Generate unique slug
    const slug = await generateUniqueSlug(title)

    // Generate course content
    const outputUnits = await generateCourseContent(title, units)

    // Get course image
    const courseImage = await getUnsplashImage(title)

    // Create or get category
    const categoryId = await createCategory(category)

    // Create course and its units
    const course = await createCourseWithUnits(
      {
        title,
        description,
        image: courseImage,
        userId: session.user.id,
        categoryId,
        slug,
      },
      outputUnits,
    )

    // Only deduct credits after successful course creation
    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: 1 } },
    })

    // Cache the new course
    coursesCache.set(`course_${course.id}`, course)

    return NextResponse.json({ slug: course.slug })
  } catch (error: any) {
    console.error(`Course creation error: ${error.message}`)

    if (error.message === "Insufficient credits") {
      return new NextResponse("Insufficient credits", { status: 402 })
    }

    console.error("Error updating course:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update course",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { chapterId, videoId } = await req.json()

    if (!chapterId) {
      return NextResponse.json(
        {
          success: false,
          message: "Chapter ID is required",
        },
        { status: 400 },
      )
    }

    // Authenticate user
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the chapter
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    })

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }

    // If videoId is provided, use it directly
    if (videoId) {
      await prisma.chapter.update({
        where: { id: chapterId },
        data: {
          videoId,
          videoStatus: "success",
        },
      })

      return NextResponse.json({
        success: true,
        message: "Video ID set successfully",
        chapter: {
          ...chapter,
          videoId,
          videoStatus: "success",
        },
      })
    }

    // Otherwise, update the chapter status to processing for generation
    await prisma.chapter.update({
      where: { id: chapterId },
      data: { videoStatus: "processing" },
    })

    // Return immediate response that processing has started
    const response = NextResponse.json({
      success: true,
      message: "Video generation started",
      chapter: {
        ...chapter,
        videoStatus: "processing",
      },
    })

    // In a real implementation, you would trigger an async job here
    // For this example, we'll simulate it with setTimeout
    const processingTime = 3000 + Math.random() * 2000
    setTimeout(async () => {
      try {
        // Update the chapter with completed status
        await prisma.chapter.update({
          where: { id: chapterId },
          data: {
            videoId: `video-${Math.random().toString(36).substring(2, 10)}`,
            videoStatus: "success",
          },
        })

        console.log(`Video generation completed for chapter ${chapterId}`)
      } catch (error) {
        console.error(`Error completing video generation for chapter ${chapterId}:`, error)

        // Update the chapter with error status
        try {
          await prisma.chapter.update({
            where: { id: chapterId },
            data: {
              videoStatus: "error",
            },
          })
        } catch (updateError) {
          console.error(`Error updating chapter status to error: ${updateError}`)
        }
      }
    }, processingTime)

    return response
  } catch (error) {
    console.error("Error generating video:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate video",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
