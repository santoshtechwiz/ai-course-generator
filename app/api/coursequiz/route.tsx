import { NextResponse } from "next/server"

// 👇 Tell Next.js this route is always dynamic
export const dynamic = "force-dynamic"

// Define interface for request body
interface QuizRequestBody {
  videoId: string
  chapterId: number
  chapterName: string
}

export async function POST(req: Request) {
  try {
    // 👇 Lazy import (so it’s not executed at build time)
    const { getAuthSession } = await import("@/lib/auth")
    const { courseQuizService } = await import("@/app/services/course-quiz.service")

    // Authenticate user
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse body
    const body = (await req.json()) as QuizRequestBody
    const { videoId, chapterId, chapterName } = body

    if (!videoId || !chapterId || !chapterName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Use service to get or generate quiz questions
    const questions = await courseQuizService.getOrGenerateQuizQuestions({
      videoId,
      chapterId,
      chapterName,
      userId: session.user.id,
      subscriptionPlan: session.user.subscriptionPlan || 'FREE',
      credits: session.user.credits || 0,
    })
    console.log(questions);

    return NextResponse.json(questions)
  } catch (error) {
    console.error("Error in POST /api/coursequiz:", error)

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        error: "An error occurred while processing your request.",
        details: errorMessage,
      },
      {
        status: errorMessage.includes("Missing required fields") ? 400 : 500,
      }
    )
  }
}
