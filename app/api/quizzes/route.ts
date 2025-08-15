import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import NodeCache from "node-cache"
import type { NextRequest } from "next/server"
import { QuizListService } from "@/app/services/quiz-list.service"
import { getAuthSession } from "@/lib/auth"
import { createQuizForType } from "@/app/api/quizzes/_helpers/create-quiz"

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

// Create a cache for quizzes with 15 minute TTL
const quizzesCache = new NodeCache({
  stdTTL: 900, // 15 minutes
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Disable cloning for better performance
})

/**
 * Unified entry point for all quiz operations
 * - GET returns a list of quizzes with optional type, search, limit filters
 * - POST creates a new quiz based on the type field in the request body
 */
export async function GET(req: NextRequest): Promise<NextResponse<QuizListItem[] | ErrorResponse>> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const quizType = searchParams.get("type") || undefined
    const search = searchParams.get("search") || undefined
    const slug = searchParams.get("slug") || undefined
    const favorites = searchParams.get("favorites") === "true"

    // If there's a slug parameter, redirect to the specific quiz endpoint
    if (slug) {
      // Determine the quiz type from the slug if not provided
      let type = quizType
      if (!type) {
        const quiz = await prisma.userQuiz.findUnique({
          where: { slug },
          select: { quizType: true }
        })
        type = quiz?.quizType || "mcq" // Default to mcq if not found
      }

      return NextResponse.redirect(
        new URL(`/api/quizzes/${type}/${slug}`, req.url)
      )
    }

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

/**
 * Create a new quiz based on the quiz type
 * Delegates to the appropriate specialized endpoint
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse body once to detect type
    let body: any = null
    try {
      const text = await req.text()
      body = text ? JSON.parse(text) : {}
    } catch {
      body = await req.json().catch(() => ({}))
    }

    const quizType = (body?.type || body?.quizType || "mcq").toString().toLowerCase()

    // Delegate to shared creator (handles auth, credits, persistence)
    return await createQuizForType(req, quizType)
  } catch (error) {
    console.error("Error creating quiz:", error)
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 })
  }
}
