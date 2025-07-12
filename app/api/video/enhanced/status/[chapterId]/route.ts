import { NextResponse } from "next/server"
import { videoRepository } from "@/app/repositories/video.repository"

/**
 * GET: Get the status of a chapter's video using enhanced service
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
    // Get chapter from database
    const chapter = await videoRepository.findChapterById(chapterId)
    
    if (!chapter) {
      return NextResponse.json({ 
        success: false, 
        error: "Chapter not found" 
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      chapterId,
      videoId: chapter.videoId,
      videoStatus: chapter.videoStatus,
      isReady: chapter.videoId !== null,
      failed: chapter.videoStatus === "error",
      title: chapter.title,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("Error checking enhanced chapter status:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
