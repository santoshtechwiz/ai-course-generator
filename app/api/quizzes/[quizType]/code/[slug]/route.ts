import { getAuthSession } from "@/lib/auth"
import { NextResponse, NextRequest } from "next/server"
import { CodeQuizService } from "@/app/services/code-quiz.service"
import { QuizServiceFactory } from "@/app/services/quiz-service-factory"

/**
 * GET handler for code quizzes - delegates to unified API handler
 * This maintains backward compatibility while using the unified API structure
 */
export async function GET(req: NextRequest, props: { params: Promise<{ slug: string }> }): Promise<NextResponse> {
  const { slug } = await props.params
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 })
  }

  const session = await getAuthSession()
  const userId = session?.user?.id || ""

  try {
    // Use the QuizServiceFactory to get the appropriate service (unified approach)
    const quizService = QuizServiceFactory.getQuizService('code')
    
    if (!quizService) {
      return NextResponse.json({ error: "Unsupported quiz type: code" }, { status: 400 })
    }
    
    // Fetch the quiz using the unified service approach
    const result = await quizService.getQuizBySlug(slug, userId)
    
    if (!result) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }
    
    return NextResponse.json({
      ...result,
      slug,
      quizId: result.id?.toString(),
      userId,
      ownerId: result.userId || userId,
    })
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
  }
}
