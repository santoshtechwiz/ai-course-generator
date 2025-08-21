import { NextResponse } from "next/server"
import { z } from "zod"
import { enhancedVideoProcessingService } from "@/app/services/video-processing.service"

// Define request body validation schema
const bodyParser = z.object({
  chapterIds: z.array(z.number()),
  options: z.object({
    useOptimizedService: z.boolean().optional(),
    timeout: z.number().optional(),
    retries: z.number().optional(),
  }).optional(),
})

/**
 * POST: Process multiple videos in parallel with batching
 */
export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const { chapterIds, options } = bodyParser.parse(body)

    
    if (chapterIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No chapters provided",
      }, { status: 400 })
    }
    
    // Process the videos through the enhanced service layer
    const result = await enhancedVideoProcessingService.processMultipleVideos(chapterIds, options)
    
    return NextResponse.json({
      ...result,
      queueStatus: enhancedVideoProcessingService.getQueueStatus(),
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error(`Error processing batch videos:`, error)
    
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
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
