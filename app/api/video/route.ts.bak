import { prisma } from "@/lib/db"

import { NextResponse } from "next/server"
import { z } from "zod"
import PQueue from "p-queue"
import pRetry from "p-retry"
import delay from "delay"

import YoutubeService from "@/services/youtubeService"

const queue = new PQueue({ concurrency: 1 })

const bodyParser = z.object({
  chapterId: z.number(),
})

// Local cache for chapter data
const chapterCache = new Map<
  number,
  {
    id: number
    youtubeSearchQuery: string
    videoId: string | null
    videoStatus: string
  }
>()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { chapterId } = bodyParser.parse(body)

    console.log(`Received video generation request for chapter ${chapterId}`)

    let chapter = chapterCache.get(chapterId)

    if (!chapter) {
      const chapterData = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { id: true, youtubeSearchQuery: true, videoId: true, videoStatus: true },
      })

      if (!chapterData) {
        console.error(`Chapter ${chapterId} not found`)
        return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 })
      }

      chapter = chapterData

      // Add to cache
      chapterCache.set(chapterId, chapter)
    }

    if (chapter.videoId) {
      console.log(`Chapter ${chapterId} already has a video: ${chapter.videoId}`)
      return NextResponse.json({
        success: true,
        message: "Video already processed.",
        videoId: chapter.videoId,
        videoStatus: "completed",
      })
    }

    if (chapter.videoStatus === "processing") {
      console.log(`Video generation for chapter ${chapterId} is already in progress`)
      return NextResponse.json({
        success: true,
        message: "Video generation already in progress.",
        videoStatus: "processing",
      })
    }

    // Update chapter status to processing
    await prisma.chapter.update({
      where: { id: chapterId },
      data: { videoStatus: "processing" },
    })

    // Update cache
    chapterCache.set(chapterId, { ...chapter, videoStatus: "processing" })

    console.log(`Queuing video generation task for chapter ${chapterId}`)

    // Add the task to the queue
    queue.add(() => processVideo(chapterId, chapter!.youtubeSearchQuery))

    return NextResponse.json({
      success: true,
      message: "Video generation task queued.",
      videoStatus: "processing",
    })
  } catch (error) {
    console.error(`Error processing video:`, error)
    return handleError(error)
  }
}

async function processVideo(chapterId: number, youtubeSearchQuery: string) {
  try {
    console.log(`Processing video for chapter ${chapterId}...`)
    const videoId = await fetchVideoIdWithRetry(youtubeSearchQuery)

    if (!videoId) {
      console.error(`Failed to fetch video ID for chapter ${chapterId}`)
      await prisma.chapter.update({
        where: { id: chapterId },
        data: { videoStatus: "error" },
      })

      // Update cache
      const cachedChapter = chapterCache.get(chapterId)
      if (cachedChapter) {
        chapterCache.set(chapterId, { ...cachedChapter, videoStatus: "error" })
      }
      return
    }

    await updateChapterVideo(chapterId, videoId)
    console.log(`Video for chapter ${chapterId} processed successfully with ID: ${videoId}`)
  } catch (error) {
    console.error(`Error processing video for chapter ${chapterId}:`, error)
    await prisma.chapter.update({
      where: { id: chapterId },
      data: { videoStatus: "error" },
    })
    // Update cache
    const cachedChapter = chapterCache.get(chapterId)
    if (cachedChapter) {
      chapterCache.set(chapterId, { ...cachedChapter, videoStatus: "error" })
    }
  }
}

async function fetchVideoIdWithRetry(youtubeSearchQuery: string): Promise<string> {
  return pRetry(
    async () => {
      console.log("Fetching video ID...")
      await delay(1000)
      const videoId = await YoutubeService.searchYoutube(youtubeSearchQuery)
      if (!videoId) throw new Error("Failed to fetch video ID")
      return videoId
    },
    {
      onFailedAttempt: (error) => {
        if (error.response?.status === 403) {
          console.error("403 Forbidden error: Stopping retries.")
          throw new pRetry.AbortError("Access forbidden (403). Cannot fetch video ID.")
        }
        console.log(`Attempt ${error.attemptNumber} failed. Retrying...`)
      },
      retries: 5,
    },
  )
}

async function updateChapterVideo(chapterId: number, videoId: string) {
  await prisma.chapter.update({
    where: { id: chapterId },
    data: { videoId, videoStatus: "completed" },
  })
  // Update cache
  const cachedChapter = chapterCache.get(chapterId)
  if (cachedChapter) {
    chapterCache.set(chapterId, { ...cachedChapter, videoId, videoStatus: "completed" })
  }
}

function handleError(error: any) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
  }

  console.error(`Unhandled error:`, error)
  return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
}
