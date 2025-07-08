import { NextResponse } from "next/server"
import { optimizedVideoService } from "@/app/services/optimized-video.service"

/**
 * GET: Get the status of a chapter's video using optimized service
 */
export async function GET(req: Request, props: { params: Promise<{ chapterId: string }> }) {
  const params = await props.params
  const chapterId = Number.parseInt(params.chapterId)

  if (isNaN(chapterId)) {
    return NextResponse.json({ 
      success: false, 
      error: "Invalid chapter ID" 
    }, { status: 400 })
  }

  try {
    // Get status through optimized service
    const status = await optimizedVideoService.getVideoStatus(chapterId)
    
    return NextResponse.json({
      ...status,
      fromOptimizedService: true,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("Error checking optimized chapter status:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const status = errorMessage === "Chapter not found" ? 404 : 500
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status })
  }
}
