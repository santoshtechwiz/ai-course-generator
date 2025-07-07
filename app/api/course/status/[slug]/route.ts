import { NextResponse } from "next/server"
import { videoService } from "@/app/services/video.service"

/**
 * GET: Get the video processing status for a course
 */
export async function GET(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params
  try {
    const courseId = Number(params.courseId)
    
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 })
    }
    
    const status = await videoService.getCourseVideoStatus(courseId)
    return NextResponse.json(status)
  } catch (error) {
    console.error("Error fetching course status:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const status = errorMessage === "Course not found" ? 404 : 500
    
    return NextResponse.json({ error: errorMessage }, { status })
  }
}
