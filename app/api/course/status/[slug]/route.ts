import { NextResponse } from "next/server"
import { videoService } from "@/app/services/video.service"

/**
 * GET: Get the video processing status for a course
 */
export async function GET(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  try {
    const slug = params.slug
    
    if (!slug) {
      return NextResponse.json({ error: "Invalid course slug" }, { status: 400 })
    }
    
    const status = await videoService.getCourseVideoStatus(slug)
    return NextResponse.json(status)
  } catch (error) {
    console.error("Error fetching course status:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const status = errorMessage === "Course not found" ? 404 : 500
    
    return NextResponse.json({ error: errorMessage }, { status })
  }
}
