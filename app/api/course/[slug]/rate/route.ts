import { NextResponse } from "next/server"
import { z } from "zod"
import { getAuthSession } from "@/lib/auth"
import { courseService } from "@/app/services/course.service"
import { handleApiError } from "@/lib/api-error-handler"

// Define validation schema for rating
const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
})

/**
 * POST: Submit a rating for a course
 */
export async function POST(req: Request, props: { params: Promise<{ slug: string }> }) {
  try {
    // Check authentication
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate input
    const { slug } = await props.params
    const body = await req.json()
    const { rating } = ratingSchema.parse(body)

    // Submit the rating through service layer
    const result = await courseService.rateCourse(slug, session.user.id, rating)
    
    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
      userRating: result.userRating
    })
  } catch (error) {
    console.error("Error submitting course rating:", error)
    return handleApiError(error)
  }
}