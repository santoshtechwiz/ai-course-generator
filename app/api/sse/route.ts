import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const chapterId = searchParams.get("chapterId")

  if (!chapterId) {
    return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
      }

      const intervalId = setInterval(async () => {
        const chapter = await prisma.chapter.findUnique({
          where: { id: Number.parseInt(chapterId) },
          select: { videoId: true, videoStatus: true },
        })

        if (chapter) {
          sendEvent({ videoId: chapter.videoId, videoStatus: chapter.videoStatus })

          if (chapter.videoStatus === "completed" || chapter.videoStatus === "error") {
            clearInterval(intervalId)
            controller.close()
          }
        }
      }, 5000)

      // Clean up the interval when the client closes the connection
      req.signal.addEventListener("abort", () => {
        clearInterval(intervalId)
        controller.close()
      })
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
