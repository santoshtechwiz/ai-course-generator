import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(req: Request, props: { params: Promise<{ chapterId: string }> }) {
  const params = await props.params
  const chapterId = Number.parseInt(params.chapterId)

  if (isNaN(chapterId)) {
    return NextResponse.json({ success: false, error: "Invalid chapter ID" }, { status: 400 })
  }

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        videoId: true,
        videoStatus: true,
        summary: true,
        summaryStatus: true,
      },
    })

    if (!chapter) {
      return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 })
    }

    // Return more detailed status information
    return NextResponse.json({
      success: true,
      videoId: chapter.videoId,
      videoStatus: chapter.videoStatus,
      isReady: chapter.videoId !== null,
      failed: chapter.videoStatus === "error",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking chapter status:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
