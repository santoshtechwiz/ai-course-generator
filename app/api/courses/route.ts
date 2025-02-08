import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import type { Prisma } from "@prisma/client"
import type { CategoryId } from "@/config/categories"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || undefined
  const category = searchParams.get("category") as CategoryId | undefined
  const userId = searchParams.get("userId") || undefined
  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const limit = Number.parseInt(searchParams.get("limit") || "20", 10)


  try {
    const where: Prisma.CourseWhereInput = {
      ...(userId ? { userId } : { isPublic: true }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
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

    console.log("Prisma where clause:", JSON.stringify(where, null, 2)) // Debug log

    const [courses, totalCount] = await Promise.all([
      prisma.course.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          slug: true,
          userId: true,
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.course.count({ where }),
    ])

    console.log("Fetched courses count:", courses.length) // Debug log

    const formattedCourses = courses.map((course) => ({
      id: course.id.toString(),
      name: course.name,
      description: course.description || "No description available",
      image: course.image,
      rating: course.ratings[0]?.rating || 0,
      slug: course.slug || "",
      categoryId: course.category?.name as CategoryId,
      category: course.category
        ? {
            id: course.category.id.toString(),
            name: course.category.name as CategoryId,
          }
        : null,
      unitCount: course._count.courseUnits,
      lessonCount: course.courseUnits.reduce((acc, unit) => acc + unit._count.chapters, 0),
      quizCount: course.courseUnits.reduce(
        (acc, unit) =>
          acc + unit.chapters.reduce((chapterAcc, chapter) => chapterAcc + chapter._count.courseQuizzes, 0),
        0,
      ),
      userId: course.userId,
    }))

    return NextResponse.json({ courses: formattedCourses, totalCount })
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

