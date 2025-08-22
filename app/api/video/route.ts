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
    // Parse and validate request body
    const body = await req.json()
    const { chapterId } = bodyParser.parse(body)

    
    // Process the video through the service layer
    const result = await videoService.processVideo(chapterId)
    return NextResponse.json(result)
  } catch (error) {
    console.error(`Error processing video:`, error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const status = errorMessage === "Chapter not found" ? 404 : 500
    
    return NextResponse.json({ success: false, error: errorMessage }, { status })
  }
}
