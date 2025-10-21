import { prisma } from "@/lib/db"
import NodeCache from "node-cache"

// Add a simple cache to improve performance
const courseCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }) // 5 minute cache

// Get course by slug with caching
export const getCourses = async (slug: string) => {
  try {
    const cacheKey = `course_${slug}`
    const cachedCourse = courseCache.get(cacheKey)

    if (cachedCourse) {
      return cachedCourse
    }

    const course = await prisma.course.findUnique({
      where: {
        slug: slug,
      },
      include: {
        courseUnits: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            chapters: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    })

    if (course) {
      courseCache.set(cacheKey, course)
    }

    return course
  } catch (error) {
    console.error("Error fetching course by slug:", error)
    return null
  }
}

// Get all courses with caching
const getAllCourses = async () => {
  try {
    const cacheKey = "all_courses"
    const cachedCourses = courseCache.get(cacheKey)

    if (cachedCourses) {
      return cachedCourses
    }

    const courses = await prisma.course.findMany({
      include: {
        courseUnits: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            chapters: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    })

    courseCache.set(cacheKey, courses)
    return courses
  } catch (error) {
    console.error("Error fetching all courses:", error)
    return null
  }
}

// Add a function to get public courses for better performance in listings
const getPublicCourses = async (limit = 10, offset = 0) => {
  try {
    const cacheKey = `public_courses_${limit}_${offset}`
    const cachedCourses = courseCache.get(cacheKey)

    if (cachedCourses) {
      return cachedCourses
    }

    const courses = await prisma.course.findMany({
      where: {
        isPublic: true,
      },
      include: {
        category: true,
        _count: {
          select: {
            courseUnits: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    })

    courseCache.set(cacheKey, courses)
    return courses
  } catch (error) {
    console.error("Error fetching public courses:", error)
    return null
  }
}

// Add a function to invalidate cache when courses are updated
const invalidateCourseCache = (slug?: string) => {
  if (slug) {
    courseCache.del(`course_${slug}`)
  }
  courseCache.del("all_courses")
  // Delete all public course cache entries
  const keys = courseCache.keys()
  keys.forEach((key) => {
    if (key.startsWith("public_courses_")) {
      courseCache.del(key)
    }
  })
}
