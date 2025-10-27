import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { z } from "zod"
import { courseService } from "@/app/services/course.service"
import type { CourseChaptersUpdate } from "@/app/types/course-types"

// Define validation schema
const chapterSchema = z.object({
  id: z.number().nullable(), // null for new chapters
  title: z.string().min(1, "Chapter title is required"),
  videoId: z.string().nullable(),
  unitId: z.number(),
  position: z.number(), // This will map to the 'order' field in the database
  isCustom: z.boolean().optional(),
  youtubeSearchQuery: z.string().optional(),
})

const unitSchema = z.object({
  id: z.number(),
  chapters: z.array(chapterSchema),
})

const updateChaptersSchema = z.object({
  courseId: z.number(),
  slug: z.string(),
  units: z.array(unitSchema),
})

export async function POST(req: Request) {
  try {
    // Authenticate user
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body = await req.json()

    let validatedData
    try {
      validatedData = updateChaptersSchema.parse(body)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation error",
            details: validationError.errors,
          },
          { status: 400 },
        )
      }
      return NextResponse.json(
        {
          error: "Invalid request data",
        },
        { status: 400 },
      )
    }

    // Use service to update course chapters
    try {
      const result = await courseService.updateCourseChapters(validatedData, session.user.id)

      return NextResponse.json({
        data: {
          success: true,
          message: "Course chapters updated successfully",
          slug: validatedData.slug,
        }
      })
    } catch (serviceError) {
      if ((serviceError as Error).message === "Unauthorized access to this course") {
        return NextResponse.json({ error: "Unauthorized access to this course" }, { status: 403 })
      }
      throw serviceError
    }
  } catch (error) {
    console.error("Error updating course chapters:", error)

    return NextResponse.json(
      {
        error: "Failed to update course chapters",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
