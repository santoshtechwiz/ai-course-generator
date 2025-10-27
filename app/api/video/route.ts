/**
 * app/api/video/route.ts
 * 
 * REFACTORED: Standard video processing API
 * - Consistent with frontend VideoStatus types
 * - Clean error handling
 * - Proper logging for debugging
 * - Queue status included in responses
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { videoService } from "@/app/services/video.service"

// Request validation schema
const bodyParser = z.object({
  chapterId: z.number(),
})

/**
 * POST: Process video for a chapter
 * 
 * This is the PRIMARY endpoint for video generation.
 * Use this instead of /enhanced or /optimized endpoints.
 * 
 * @returns Processing response with queue status
 */
export async function POST(req: Request) {
  const startTime = Date.now()
  
  try {
    console.log("[Video API] Received video processing request")
    
    // Parse and validate request body
    const body = await req.json()
    const { chapterId } = bodyParser.parse(body)

    console.log(`[Video API] Processing video for chapter ${chapterId}`)
    
    // Process the video through the service layer
    const result = await videoService.processVideo(chapterId)
    
    const duration = Date.now() - startTime
    console.log(`[Video API] Video processing request completed for chapter ${chapterId} in ${duration}ms:`, {
      success: result.success,
      videoStatus: result.videoStatus,
      jobId: result.jobId,
      queueSize: result.queueSize,
      queuePending: result.queuePending,
    })
    
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Video API] Error processing video (${duration}ms):`, error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.error("[Video API] Validation error:", error.errors)
      return NextResponse.json({ 
        success: false, 
        error: "Invalid request body",
        details: error.errors,
        timestamp: new Date().toISOString(),
      }, { status: 400 })
    }

    // Handle specific error messages
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    let status = 500
    
    // Map specific errors to appropriate status codes
    if (errorMessage === "Chapter not found") {
      status = 404
    } else if (errorMessage.includes("search query")) {
      status = 400
    } else if (errorMessage.includes("quota")) {
      status = 429 // Too Many Requests
    }
    
    console.error(`[Video API] Returning error response with status ${status}:`, errorMessage)
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      videoStatus: 'error',
      timestamp: new Date().toISOString(),
    }, { status })
  }
}

/**
 * GET: Get queue statistics
 * 
 * Useful for monitoring the processing queue
 * 
 * @returns Queue status information
 */
export async function GET() {
  try {
    const queueStatus = videoService.getQueueStatus()
    
    return NextResponse.json({
      success: true,
      queueStatus,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error("[Video API] Error getting queue status:", error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get queue status",
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}