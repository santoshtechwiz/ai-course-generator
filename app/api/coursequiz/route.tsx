import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { courseQuizService } from "@/app/services/course-quiz.service"

export const dynamic = "force-dynamic"

// Define interface for request body
interface QuizRequestBody {
  videoId: string
  chapterId: number
  chapterName: string
}

export async function POST(req: Request) {
  try {
    // Authenticate user
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as QuizRequestBody
    const { videoId, chapterId, chapterName } = body

    // Use service to get or generate quiz questions
    const questions = await courseQuizService.getOrGenerateQuizQuestions({
      videoId,
      chapterId,
      chapterName,
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error("Error in POST handler:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const status = errorMessage.includes("Missing required fields") ? 400 : 500
    
    return NextResponse.json(
      {
        error: "An error occurred while processing your request.",
        details: errorMessage,
      },
      { status },
    )
  }
}
