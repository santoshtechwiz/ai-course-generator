import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { QuizListService } from "@/app/services/quiz-list.service"
import { getAuthSession } from "@/lib/auth"

// Define response types for better type safety
interface QuizListItem {
  id: number
  title: string
  quizType: string
  isPublic: boolean
  timeStarted: Date
  slug: string
  questionCount: number
  isFavorite: boolean
  difficulty: string
}

interface ErrorResponse {
  error: string
}

export async function GET(req: NextRequest): Promise<NextResponse<QuizListItem[] | ErrorResponse>> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const quizType = searchParams.get("type") || undefined
    const search = searchParams.get("search") || undefined
    const favorites = searchParams.get("favorites") === "true"

    // Get user from session if available
    const session = await getAuthSession()
    const userId = session?.user?.id

    const quizListService = new QuizListService()

    const quizzes = await quizListService.listQuizzes({
      limit,
      quizType,
      search,
      userId,
      favoritesOnly: favorites,
    })

    // Shuffle the quizzes
    const shuffledQuizzes = [...quizzes].sort(() => Math.random() - 0.5)

    return NextResponse.json(shuffledQuizzes)
  } catch (error) {
    console.error("Error fetching quizzes:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
