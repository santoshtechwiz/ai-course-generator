import { NextResponse } from "next/server"
import { videoService } from "@/app/services/video.service"

/**
 * GET: Get the status of a chapter's video
 */
export async function GET(req: Request, props: { params: Promise<{ chapterId: string }> }) {
  const params = await props.params
  const chapterId = Number.parseInt(params.chapterId)

  if (isNaN(chapterId)) {
    return NextResponse.json({ success: false, error: "Invalid chapter ID" }, { status: 400 })
  }

  // Check for simulation mode
  const isSimulationMode = process.env.NEXT_PUBLIC_SIMULATION_MODE === "true"
  
  if (isSimulationMode) {
    console.log(`[Video Status API] Simulation mode: Returning mock status for chapter ${chapterId}`)
    
    // Return mock status - in simulation mode, videos complete instantly in the frontend
    return NextResponse.json({
      success: true,
      videoId: `sim-video-${chapterId}-${Date.now()}`,
      videoStatus: "completed",
      isReady: true,
      jobId: `sim-job-${chapterId}-${Date.now()}`,
      timestamp: new Date().toISOString()
    })
  }

  try {
    // Get status through service layer
    const status = await videoService.getChapterVideoStatus(chapterId)
    return NextResponse.json(status)
  } catch (error) {
    console.error("Error checking chapter status:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const status = errorMessage === "Chapter not found" ? 404 : 500
    
    return NextResponse.json({ success: false, error: errorMessage }, { status })
  }
}
