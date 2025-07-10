import { NextResponse } from "next/server"
import { courseService } from "@/app/services/course.service"
import { getAuthSession } from "@/lib/auth"

/**
 * GET: Get the course status (public/private, favorite, etc.)
 */
export async function GET(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  try {
    const slug = params.slug
    
    if (!slug) {
      return NextResponse.json({ error: "Invalid course slug" }, { status: 400 })
    }

    // Get the current user session
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const status = await courseService.getCourseStatus(slug, session.user.id)
    
    // Add rating field (currently not implemented in service, so default to null)
    const response = {
      ...status,
      rating: null // TODO: Implement rating retrieval in course service
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching course status:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const status = errorMessage === "Course not found" ? 404 : 500
    
    return NextResponse.json({ error: errorMessage }, { status })
  }
}
