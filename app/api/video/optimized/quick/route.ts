import { NextResponse } from "next/server"
import { z } from "zod"
import { optimizedVideoService } from "@/app/services/optimized-video.service"

// Define request body validation schema
const bodyParser = z.object({
  chapterId: z.number(),
  topic: z.string().optional()
})

/**
 * POST: Process video for a chapter using quick mode (immediate response with fallbacks)
 * 
 * This endpoint uses the fast-response mode of the optimized video service,
 * providing immediate cached or fallback content and continuing processing in the background.
 * It helps prevent frontend timeouts by always responding quickly.
 */
export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const { chapterId, topic } = bodyParser.parse(body)

    
    // Use topic from request or fallback to chapter-based search
    const searchTopic = topic || `programming tutorial chapter ${chapterId}`
    
    // Process the video through the optimized service with quick mode
    const result = await optimizedVideoService.processVideoQuick(chapterId, searchTopic)
    
    // Return detailed response
    return NextResponse.json({
      ...result,
      processingMode: 'quick',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error(`Error in quick video processing:`, error)
    
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
      processingMode: 'quick',
      timestamp: new Date().toISOString()
    }, { status })
  }
}
