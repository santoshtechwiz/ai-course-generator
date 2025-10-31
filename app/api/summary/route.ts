import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import NodeCache from "node-cache"
import { CourseService } from "@/app/services"
import YoutubeService from "@/services/youtubeService"
import { generateVideoSummaryFromTranscript } from "@/lib/ai/services/video-summary.service"

const summaryCache = new NodeCache({ stdTTL: 3600 }) // Cache summaries for 1 hour
const processingCache = new NodeCache({ stdTTL: 300 }) // Cache processing status for 5 minutes

const bodyParser = z.object({
  chapterId: z.number(),
})

const SUMMARY_GENERATION_TIMEOUT = 60000 // 1 minute timeout

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { chapterId } = bodyParser.parse(body)

    const courseService = new CourseService()
    const chapter = await courseService.getChapterById(chapterId)

    if (!chapter) {
      return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 })
    }

    // If summary already exists and is completed, return it
    if (chapter.summary && chapter.summaryStatus === "completed") {
      return NextResponse.json({ success: true, data: chapter.summary })
    }

    if (!chapter.videoId) {
      await courseService.updateChapterSummaryStatus(chapterId, "no_summary_available")
      return NextResponse.json({ success: false, message: "No video ID available for summary generation" })
    }

    // Check if summary generation is already in progress
    if (processingCache.get<boolean>(chapter.videoId as string)) {
      return NextResponse.json({ success: true, message: "Summary generation in progress", status: "processing" })
    }

    // Only generate if status is PENDING
    if (chapter.summaryStatus !== "PENDING") {
      return NextResponse.json({ success: false, message: `Summary status is ${chapter.summaryStatus}` })
    }

    // Set processing status
    processingCache.set(chapter.videoId as string, true)

    try {
      const summary = await generateAndSaveSummary(chapterId, chapter.videoId as string, chapter.transcript)
      return NextResponse.json({ success: true, data: summary })
    } catch (error) {
      console.error(`Error in summary generation for chapter ${chapterId}:`, error)
      return NextResponse.json({ success: false, message: "Summary generation failed", status: "error" })
    }
  } catch (error) {
    console.error(`Error processing summary:`, error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

async function generateAndSaveSummary(chapterId: number, videoId: string, existingTranscript?: string | null): Promise<string> {
  try {
    const summary = await fetchAndGenerateSummary(videoId, existingTranscript, chapterId)
    if (summary) {
      summaryCache.set(videoId, summary)
      await updateChapterSummary(chapterId, summary)
      return summary
    } else {
      throw new Error("Failed to generate summary")
    }
  } catch (error) {
    console.error(`Error processing summary for chapter ${chapterId}:`, error)
    await updateChapterSummaryStatus(chapterId, "error")
    throw error
  } finally {
    processingCache.del(videoId)
  }
}

async function fetchAndGenerateSummary(videoId: string, existingTranscript?: string | null, chapterId?: number): Promise<string | null> {
  let transcript: string | null = existingTranscript

  // Fetch transcript if not provided
  if (!transcript) {
    const transcriptResponse = await YoutubeService.getTranscript(videoId)

    if (transcriptResponse.status !== 200 || !transcriptResponse.transcript) {
      return null
    }

    transcript = transcriptResponse.transcript

    // Save transcript to database if chapterId provided
    if (chapterId && transcript) {
      const courseService = new CourseService()
      await courseService.updateChapterTranscript(chapterId, transcript)
    }
  }

  if (!transcript) {
    return null
  }

  try {
    const summary = await generateVideoSummaryFromTranscript(transcript.slice(0, 10000))
    return summary
  } catch (error) {
    console.error(`Error generating summary for video ID ${videoId}:`, error)
    return null
  }
}

async function updateChapterSummary(chapterId: number, summary: string) {
  const courseService = new CourseService()
  await courseService.updateChapterSummary(chapterId, summary)
}

async function updateChapterSummaryStatus(
  chapterId: number,
  status: "processing" | "completed" | "error" | "no_summary_available",
) {
  const courseService = new CourseService()
  await courseService.updateChapterSummaryStatus(chapterId, status)
}
