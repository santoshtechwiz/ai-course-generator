import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"

// Define validation schema
const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  isFavorite: z.boolean().optional(),
  progress: z.number().min(0).max(100).optional(),
  isPublic: z.boolean().optional(),
})

// Centralized error handling
function handleError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : "Internal Server Error"
  const status =
    {
      Unauthorized: 401,
      "Course not found": 404,
      Forbidden: 403,
    }[errorMessage] || 500

  return NextResponse.json({ error: errorMessage }, { status })
}

// Helper functions
async function getCourseBySlug(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    select: { id: true, userId: true },
  })
}

async function validateCourseAccess(courseId: number, userId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { userId: true },
  })

  if (!course) {
    throw new Error("Course not found")
  }

  if (course.userId !== userId) {
    throw new Error("Forbidden")
  }
}

// Handle favorite status updates
async function handleFavoriteUpdate(userId: string, courseId: number, isFavorite: boolean) {
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
    })
  } else {
    return prisma.favorite.deleteMany({
      where: { userId, courseId },
    })
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await props.params
    const course = await getCourseBySlug(slug)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    await validateCourseAccess(course.id, session.user.id)

    const body = await req.json()
    const validatedData = updateSchema.parse(body)

    const updates: Record<string, any> = { ...validatedData }
    const { isFavorite, progress, isPublic } = validatedData

    if (isFavorite !== undefined) {
      await handleFavoriteUpdate(session.user.id, course.id, isFavorite)
      delete updates.isFavorite
    }

    if (progress === 100) {
      updates.isCompleted = true
    }

    if (isPublic !== undefined) {
      updates.isPublic = isPublic
    }

    const updatedCourse = await prisma.course.update({
      where: { id: course.id },
      data: updates,
      include: {
        courseUnits: true,
        category: true,
      },
    })

    return NextResponse.json({ success: true, course: updatedCourse })
  } catch (error) {
    console.error("Error updating course:", error)
    return handleError(error)
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await props.params
    const course = await getCourseBySlug(slug)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    await validateCourseAccess(course.id, session.user.id)

    await prisma.$transaction(async (tx) => {
      // Delete related data first
      await tx.favorite.deleteMany({ where: { courseId: course.id } })
      await tx.courseProgress.deleteMany({ where: { courseId: course.id } })

      // Delete course units and their chapters
      const courseUnits = await tx.courseUnit.findMany({
        where: { courseId: course.id },
        select: { id: true },
      })

      for (const unit of courseUnits) {
        const chapters = await tx.chapter.findMany({
          where: { unitId: unit.id },
          select: { id: true },
        })

        for (const chapter of chapters) {
          await tx.courseQuiz.deleteMany({ where: { chapterId: chapter.id } })
        }

        await tx.chapter.deleteMany({ where: { unitId: unit.id } })
      }

      await tx.courseUnit.deleteMany({ where: { courseId: course.id } })

      // Finally, delete the course
      await tx.course.delete({ where: { id: course.id } })
    })

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting course:", error)
    return handleError(error)
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await params
    const course = await prisma.course.findUnique({
      where: { slug: slug },
      include: { favorites: { where: { userId: session.user.id } } },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({
      isPublic: course.isPublic,
      isFavorite: course.favorites.length > 0,
    })
  } catch (error) {
    console.error("Error fetching course status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
