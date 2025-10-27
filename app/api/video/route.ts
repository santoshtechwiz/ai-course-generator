import { NextResponse } from "next/server"
import { z } from "zod"
import { videoService } from "@/app/services/video.service"

// Define request body validation schema
const bodyParser = z.object({
  chapterId: z.number(),
})

/**
 * POST: Process video for a chapter
 */
export async function POST(req: Request) {
  try {
    console.log("[Video API] Received video processing request")
    
    // Check for simulation mode
    const isSimulationMode = process.env.NEXT_PUBLIC_SIMULATION_MODE === "true"
    
    // Parse and validate request body
    const body = await req.json()
    const { chapterId } = bodyParser.parse(body)

    if (isSimulationMode) {
      console.log(`[Video API] Simulation mode: Mocking video processing for chapter ${chapterId}`)
      
      // Return mock successful response instantly
      const response = {
        success: true,
        queueStatus: "queued",
        chapterId: chapterId,
        videoId: null,
        jobId: `sim-job-${chapterId}-${Date.now()}`
      }
      return NextResponse.json({ data: response }, { status: 200 })
    }
    
    console.log(`[Video API] Processing video for chapter ${chapterId}`)
    
    // Process the video through the service layer
    const result = await videoService.processVideo(chapterId)
    
    console.log(`[Video API] Video processing completed for chapter ${chapterId}:`, result)
    const response={
      success: result.success,
      queueStatus: result.videoStatus,
      chapterId: chapterId,
      videoId: result.videoId,
      jobId: result.jobId
    }
    return NextResponse.json({data:response}, { status: 200 })
  } catch (error) {
    console.error(`[Video API] Error processing video:`, error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.error("[Video API] Validation error:", error.errors)
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const status = errorMessage === "Chapter not found" ? 404 : 500
    
    console.error(`[Video API] Returning error response with status ${status}:`, errorMessage)
    return NextResponse.json({ success: false, error: errorMessage }, { status })
  }
}
