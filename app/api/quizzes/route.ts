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
  isFavorite?: boolean
}

interface ErrorResponse {
  error: string
}

/**
 * GET endpoint for listing quizzes with optional filters
 * - Returns a list of quizzes with optional type, search, limit filters
 */
export async function GET(req: NextRequest): Promise<NextResponse<QuizListItem[] | ErrorResponse>> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const quizType = searchParams.get("type") || undefined
    const search = searchParams.get("search") || undefined
    const favorites = searchParams.get("favorites") === "true"

    // Get the user session for authorization if needed
    const session = await getAuthSession()
    const userId = session?.user?.id || ""

    // Use the service to get the quiz list
    const quizListService = new QuizListService()
    const quizzes = await quizListService.listQuizzes({
      limit,
      quizType,
      search,
      userId,
      favoritesOnly: favorites,
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error("Error fetching quizzes:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
