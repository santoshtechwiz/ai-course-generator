import { CourseService } from "@/app/services"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, context: { params: Promise<{ chapterId?: string }> }) {
  const { chapterId } = (await context.params) || {}

  const chapterIdNumber = Number(chapterId)
  if (isNaN(chapterIdNumber)) {
    return NextResponse.json({ success: false, error: "Invalid chapter ID" }, { status: 400 })
  }

  try {
    const courseService = new CourseService()
    const chapter = await courseService.getChapterById(chapterIdNumber, {
      summary: true,
      summaryStatus: true,
      videoId: true,
    })

    if (!chapter) {
      return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      summaryReady: !!chapter.summary,
      summaryStatus: chapter.summaryStatus,
      videoReady: !!chapter.videoId,
      isReady: !!chapter.summary && !!chapter.videoId,
    })
  } catch (error) {
    console.error("Error checking summary status:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
