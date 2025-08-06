import { NextResponse } from "next/server"
import { QuizListService } from "@/app/services/quiz-list.service"

export async function GET(request: Request) {
  try {
    // Parse URL to get the quiz type filter if any
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || undefined
    const count = parseInt(searchParams.get("count") || "3", 10)
    
    const quizListService = new QuizListService()
    
    // Get random quizzes
    const randomQuizzes = []
    for (let i = 0; i < count; i++) {
      const quiz = await quizListService.getRandomQuiz(type)
      if (quiz) randomQuizzes.push(quiz)
    }

    return NextResponse.json(randomQuizzes)
  } catch (error) {
    console.error("Error fetching random quizzes:", error)
    return NextResponse.json({ error: "Failed to fetch random quizzes" }, { status: 500 })
  }
}
