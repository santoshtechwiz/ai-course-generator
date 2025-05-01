import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import NodeCache from "node-cache"
import type { NextRequest } from "next/server"

// Define response types for better type safety
interface QuizListItem {
  id: number
  title: string
  quizType: string
  isPublic: boolean
  timeStarted: Date
  slug: string
  questionCount: number
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

export async function GET(req: NextRequest): Promise<NextResponse<QuizListItem[] | ErrorResponse>> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const quizType = searchParams.get("type") || undefined
    const search = searchParams.get("search") || undefined

    // Create a cache key based on the request parameters
    const cacheKey = `quizzes_${limit}_${quizType || "all"}_${search || ""}`

    // Check if we have a cached response
    const cachedResponse = quizzesCache.get<QuizListItem[]>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse)
    }

    // Build the query
    const where: any = {
      isPublic: true,
      ...(quizType ? { quizType } : {}),
      ...(search
        ? {
            title: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {}),
    }

    const quizzes = await prisma.userQuiz.findMany({
      take: limit,
      orderBy: {
        timeStarted: "desc",
      },
      select: {
        id: true,
        title: true,
        quizType: true,
        isPublic: true,
        timeStarted: true,
        slug: true,
        _count: {
          select: { questions: true },
        },
      },
      where,
    })

    // Transform the data to include questionCount
    const transformedQuizzes = quizzes.map((quiz) => ({
      ...quiz,
      questionCount: quiz._count.questions,
    }))

    // Filter quizzes with questionCount > 0
    const filteredQuizzes = transformedQuizzes.filter((quiz) => quiz.questionCount > 0)

    // Shuffle the filtered quizzes array
    const shuffledQuizzes = filteredQuizzes.sort(() => Math.random() - 0.5)

    // Cache the response
    quizzesCache.set(cacheKey, shuffledQuizzes)

    return NextResponse.json(shuffledQuizzes)
  } catch (error) {
    console.error("Error fetching quizzes:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
