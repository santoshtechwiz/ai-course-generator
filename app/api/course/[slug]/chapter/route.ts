import { NextResponse } from "next/server"
import { courseService } from "@/app/services/course.service"
import { getAuthSession } from "@/lib/auth"

/**
 * GET: Get chapters for a course
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    // Check authentication
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get course ID from URL search params
    const { searchParams } = new URL(req.url)
    const courseIdParam = searchParams.get("courseId")
    
    if (!courseIdParam) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    const courseId = Number(courseIdParam)
    
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 })
    }

    // Get chapters through service layer
    const chapters = await courseService.getChaptersByCourseId(courseId)
    return NextResponse.json(chapters)
  } catch (error) {
    console.error("Error fetching chapters:", error)
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    )
  }
}
