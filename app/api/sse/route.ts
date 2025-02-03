import prisma from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"




export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const chapterId = searchParams.get("chapterId")

  if (!chapterId) {
    return new NextResponse("Chapter ID is required", { status: 400 })
  }

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  })

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const sendEvent = async (data: any) => {
    await writer.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Simulate video generation process
  void (async () => {
    try {
      const chapter = await prisma.chapter.findUnique({
        where: { id: Number.parseInt(chapterId) },
      })

      if (!chapter) {
        await sendEvent({ error: "Chapter not found" })
        writer.close()
        return
      }

      await sendEvent({ videoStatus: "processing", message: "Starting video generation" })
      await prisma.chapter.update({
        where: { id: Number.parseInt(chapterId) },
        data: { videoStatus: "PROCESSING" },
      })

      // Simulate processing steps
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await sendEvent({ videoStatus: "processing", message: "Processing audio" })

      await new Promise((resolve) => setTimeout(resolve, 2000))
      await sendEvent({ videoStatus: "processing", message: "Generating video frames" })

      await new Promise((resolve) => setTimeout(resolve, 2000))
      await sendEvent({ videoStatus: "processing", message: "Finalizing video" })

      // Update the chapter with a mock videoId
      const mockVideoId = `video_${Date.now()}`
      await prisma.chapter.update({
        where: { id: Number.parseInt(chapterId) },
        data: {
          videoId: mockVideoId,
          videoStatus: "COMPLETED",
          isCompleted: true,
        },
      })

      await new Promise((resolve) => setTimeout(resolve, 2000))
      await sendEvent({
        videoStatus: "completed",
        message: "Video generation complete",
        videoId: mockVideoId,
      })
    } catch (error) {
      console.error("Error in SSE:", error)
      await sendEvent({ error: "An error occurred during video generation" })
    } finally {
      await prisma.$disconnect()
      writer.close()
    }
  })()

  return new NextResponse(stream.readable, { headers })
}

