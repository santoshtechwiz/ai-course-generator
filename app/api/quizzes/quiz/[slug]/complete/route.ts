import { getAuthSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import { QuizServiceFactory } from "@/app/services/quiz-service-factory"
import { QuizRepository } from "@/app/repositories/quiz.repository"
import type { QuizType } from "@/app/types/quiz-types"

// This is a simplified version of the quiz completion endpoint using our new service pattern
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = params
    const { score, totalTime, type } = await req.json()

    // Get the quiz
    const quizRepository = new QuizRepository()
    const quiz = await quizRepository.findBySlug(slug)

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Get the appropriate service
    const quizService = QuizServiceFactory.getQuizService(quiz.quizType)

    // Complete the quiz
    await quizService.completeQuiz(slug, session.user.id, score)

    return NextResponse.json({
      success: true,
      result: {
        score,
        totalTime,
        percentageScore: score,
        totalQuestions: quiz.questions.length,
      },
    })
  } catch (error) {
    console.error("Error completing quiz:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete quiz",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
