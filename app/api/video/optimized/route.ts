import { NextResponse } from "next/server"
import { z } from "zod"
import { optimizedVideoService } from "@/app/services/optimized-video.service"

// Define request body validation schema
const bodyParser = z.object({
  chapterId: z.number(),
  topic: z.string().optional()
})

/**
 * POST: Process video for a chapter using optimized pipeline
 */
export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const { chapterId, topic } = bodyParser.parse(body)

    
    // Use topic from request or fallback to chapter-based search
    const searchTopic = topic || `programming tutorial chapter ${chapterId}`
    
    // Process the video through the optimized service
    const result = await optimizedVideoService.processVideoForChapter(chapterId, searchTopic)
    
    // Return detailed response
    return NextResponse.json({
      ...result,
      metrics: optimizedVideoService.getMetrics(),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error(`Error in optimized video processing:`, error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid request body",
        details: error.errors 
      }, { status: 400 })
    }

    // Handle other errors with detailed information
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const status = errorMessage === "Chapter not found" ? 404 : 500
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status })
  }
}

/**
 * GET: Get metrics and health status
 */
export async function GET() {
  try {
    const metrics = optimizedVideoService.getMetrics()
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      metrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting video service metrics:', error)
    
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
