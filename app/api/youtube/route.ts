import Semaphore from "@/lib/semaphore"

import { getQuestionsFromTranscript } from "@/services/videoProcessor"
import YoutubeService from "@/services/youtubeService"
import { CourseQuizService } from "@/app/services"
import { NextResponse } from "next/server"

export async function POST(req: Request): Promise<Response> {
  try {
    // Get user session
    const { getAuthSession } = await import("@/lib/auth")
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { videoId, chapterId, chapterName } = body

    const courseQuizService = new CourseQuizService()
    const questions = await courseQuizService.getOrGenerateQuizQuestions({
      videoId,
      chapterId,
      chapterName,
      userId: session.user.id,
      subscriptionPlan: session.user.subscriptionPlan || 'FREE',
      credits: session.user.credits || 0,
    })

    return NextResponse.json({ questions })
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: "An error occurred while processing your request." })
  }
}
