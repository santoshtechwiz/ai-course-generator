import { NextResponse } from "next/server"
import { z } from "zod"
import { getAuthSession } from "@/lib/auth"
import { courseService } from "@/app/services/course.service"

// Define validation schema
const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  isFavorite: z.boolean().optional(),
  progress: z.number().min(0).max(100).optional(),
  isPublic: z.boolean().optional(),
})

/**
 * Centralized error handling
 */
function handleError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : "Internal Server Error"
  const status =
    {
      Unauthorized: 401,
      "Course not found": 404,
      Forbidden: 403,
      "Insufficient credits": 402,
    }[errorMessage] || 500

  return NextResponse.json({ error: errorMessage }, { status })
}

/**
 * PATCH: Update course information by slug
 */
export async function PATCH(req: Request, props: { params: Promise<{ slug: string }> }) {
  try {
    // Check authentication
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate input
    const { slug } = await props.params
    const body = await req.json()
    const validatedData = updateSchema.parse(body)

    // Update the course through service layer
    const result = await courseService.updateCourseBySlug(slug, session.user.id, validatedData)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating course:", error)
    return handleError(error)
  }
}

/**
 * DELETE: Delete a course by slug
 */
export async function DELETE(req: Request, props: { params: Promise<{ slug: string }> }) {
  try {
    // Check authentication
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse params and delete the course
    const { slug } = await props.params
    const result = await courseService.deleteCourseBySlug(slug, session.user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error deleting course:", error)
    return handleError(error)
  }
}

/**
 * GET: Get course status information
 */
export async function GET(req: Request, props: { params: Promise<{ slug: string }> }) {
  try {
    // Check authentication
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get course status through service layer
    const { slug } = await props.params
    const status = await courseService.getCourseStatus(slug, session.user.id)
    return NextResponse.json(status)
  } catch (error) {
    console.error("Error fetching course status:", error)
    return handleError(error)
  }
}
