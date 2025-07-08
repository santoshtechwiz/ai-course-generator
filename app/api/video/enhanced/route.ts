import { NextResponse } from "next/server"
import { z } from "zod"
import { enhancedVideoProcessingService } from "@/app/services/enhanced-video-processing.service"

// Define request body validation schema
const bodyParser = z.object({
  chapterId: z.number(),
  options: z.object({
    useOptimizedService: z.boolean().optional(),
    timeout: z.number().optional(),
    retries: z.number().optional(),
    priority: z.number().optional(),
  }).optional(),
})

/**
 * POST: Process video for a chapter with enhanced capabilities
 */
export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const { chapterId, options } = bodyParser.parse(body)

    console.log(`Received enhanced video generation request for chapter ${chapterId}`)
    
    // Process the video through the enhanced service layer
    const result = await enhancedVideoProcessingService.processVideo(chapterId, options)
    
    return NextResponse.json({
      ...result,
      queueStatus: enhancedVideoProcessingService.getQueueStatus(),
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error(`Error processing enhanced video:`, error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid request body",
        details: error.errors,
      }, { status: 400 })
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const status = errorMessage === "Chapter not found" ? 404 : 500
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }, { status })
  }
}

/**
 * DELETE: Cancel video processing for a chapter
 */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const chapterIdParam = url.searchParams.get("chapterId")
    
    if (!chapterIdParam || isNaN(Number(chapterIdParam))) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid chapter ID" 
      }, { status: 400 })
    }
    
    const chapterId = Number(chapterIdParam)
    const cancelled = enhancedVideoProcessingService.cancelProcessing(chapterId)
    
    if (cancelled) {
      return NextResponse.json({
        success: true,
        message: `Processing cancelled for chapter ${chapterId}`,
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `No active processing found for chapter ${chapterId}`,
        timestamp: new Date().toISOString(),
      }, { status: 404 })
    }
    
  } catch (error) {
    console.error(`Error cancelling video processing:`, error)
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error",
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

/**
 * GET: Get queue status
 */
export async function GET() {
  try {
    const status = enhancedVideoProcessingService.getQueueStatus()
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error(`Error getting queue status:`, error)
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error",
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
