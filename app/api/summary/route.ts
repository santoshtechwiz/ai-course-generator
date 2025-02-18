import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import NodeCache from "node-cache"
import { prisma } from "@/lib/db"
import YoutubeService from "@/services/youtubeService"
import { generateVideoSummary } from "@/lib/chatgptAndGoogleAi"

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

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, videoId: true, summary: true, summaryStatus: true },
    })

    if (!chapter) {
      return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 })
    }

    if (chapter.summary) {
      return NextResponse.json({ success: true, data: chapter.summary })
    }

    if (!chapter.videoId) {
      await updateChapterSummaryStatus(chapterId, "no_summary_available")
      return NextResponse.json({ success: false, message: "No video ID available for summary generation" })
    }

    // Check cache first
    const cachedSummary = summaryCache.get<string>(chapter.videoId)
    if (cachedSummary) {
      await updateChapterSummary(chapterId, cachedSummary)
      return NextResponse.json({ success: true, data: cachedSummary })
    }

    // Use processingCache as a lock
    if (processingCache.get<boolean>(chapter.videoId)) {
      return NextResponse.json({ success: true, message: "Summary generation in progress", status: "processing" })
    }

    // Set processing status in cache
    processingCache.set(chapter.videoId, true)

    // Generate summary
    try {
      const summary = await generateAndSaveSummary(chapterId, chapter.videoId)
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

async function generateAndSaveSummary(chapterId: number, videoId: string): Promise<string> {
  try {
    const summary = await fetchAndGenerateSummary(videoId)
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

async function fetchAndGenerateSummary(videoId: string): Promise<string | null> {
  const transcriptResponse = await YoutubeService.getTranscript(videoId)

  if (transcriptResponse.status !== 200 || !transcriptResponse.transcript) {
    console.log(`No valid transcript for video ID ${videoId}.`)
    return null
  }

  try {
    return await generateVideoSummary(transcriptResponse.transcript.slice(0, 10000));
  } catch (error) {
    console.error(`Error generating summary for video ID ${videoId}:`, error)
    return null
  }
}

async function updateChapterSummary(chapterId: number, summary: string) {
  await prisma.chapter.update({
    where: { id: chapterId },
    data: { summary, summaryStatus: "completed" },
  })
}

async function updateChapterSummaryStatus(
  chapterId: number,
  status: "processing" | "completed" | "error" | "no_summary_available",
) {
  await prisma.chapter.update({
    where: { id: chapterId },
    data: { summaryStatus: status },
  })
}

