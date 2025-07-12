import type { Question } from "@/app/types/types"
import Semaphore from "@/lib/semaphore"

import { getQuestionsFromTranscript } from "@/services/videoProcessor"
import YoutubeService from "@/services/youtubeService"
import { CourseQuizService } from "@/app/services"
import { NextResponse } from "next/server"

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const { videoId, chapterId, chapterName } = body

    const courseQuizService = new CourseQuizService()
    const questions = await courseQuizService.getOrGenerateQuizQuestions({
      videoId,
      chapterId,
      chapterName
    })

    return NextResponse.json({ questions })
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: "An error occurred while processing your request." })
  }
}
