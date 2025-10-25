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

// Cache configuration
const CACHE_DURATION = {
  PUBLIC_LIST: 300, // 5 minutes for public quiz lists
  USER_SPECIFIC: 60, // 1 minute for user-specific data (favorites)
  SEARCH_RESULTS: 180, // 3 minutes for search results
}

/**
 * GET endpoint for listing quizzes with optional filters
 * - Returns a list of quizzes with optional type, search, limit filters
 * - Implements Next.js cache with revalidation
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

    // Determine cache duration based on request type
    let cacheDuration = CACHE_DURATION.PUBLIC_LIST
    if (favorites || userId) {
      cacheDuration = CACHE_DURATION.USER_SPECIFIC
    } else if (search) {
      cacheDuration = CACHE_DURATION.SEARCH_RESULTS
    }

    // Use the service to get the quiz list (service has its own caching layer)
    const quizListService = new QuizListService()
    const quizzes = await quizListService.listQuizzes({
      limit,
      quizType,
      search,
      userId,
      favoritesOnly: favorites,
    })

    // Return with cache headers
    return NextResponse.json(quizzes, {
      headers: {
        'Cache-Control': `public, s-maxage=${cacheDuration}, stale-while-revalidate=${cacheDuration * 2}`,
        'CDN-Cache-Control': `public, s-maxage=${cacheDuration}`,
        'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheDuration}`,
      }
    })
  } catch (error) {
    console.error("Error fetching quizzes:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
