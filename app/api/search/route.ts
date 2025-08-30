import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

// Simple in-memory cache for search results
const searchCache = new Map<string, any>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Fuzzy search helper function
function fuzzyMatch(text: string, query: string): number {
  if (!text || !query) return 0

  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  // Exact match gets highest score
  if (textLower === queryLower) return 100

  // Starts with query gets high score
  if (textLower.startsWith(queryLower)) return 90

  // Contains query gets medium score
  if (textLower.includes(queryLower)) return 70

  // Fuzzy match - check if all query characters exist in order
  let queryIndex = 0
  let matchCount = 0

  for (const char of textLower) {
    if (char === queryLower[queryIndex]) {
      queryIndex++
      matchCount++
      if (queryIndex === queryLower.length) break
    }
  }

  if (queryIndex === queryLower.length) {
    return Math.max(30, (matchCount / textLower.length) * 50)
  }

  return 0
}

// Search result interface
interface SearchResult {
  id: number
  title: string
  description?: string
  slug: string
  type: 'course' | 'quiz'
  score: number
  metadata?: {
    quizType?: string
    chapterName?: string
    courseTitle?: string
  }
}

// GET handler with improved search
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")?.trim()
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)

  if (!query || query.length < 2) {
    return NextResponse.json({
      error: "Search query must be at least 2 characters long",
      courses: [],
      games: []
    }, { status: 400 })
  }

  // Check cache first
  const cacheKey = `${query.toLowerCase()}_${limit}`
  if (searchCache.has(cacheKey)) {
    const cached = searchCache.get(cacheKey)
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }
  }

  try {
    const results: SearchResult[] = []

    // Search courses with better performance
    const courses = await prisma.course.findMany({
      where: {
        AND: [
          { isPublic: true },
          {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } }
            ]
          }
        ]
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true
      },
      take: limit
    })

    // Process courses with scoring
    courses.forEach(course => {
      const titleScore = fuzzyMatch(course.title, query)
      const descScore = course.description ? fuzzyMatch(course.description, query) : 0

      const maxScore = Math.max(titleScore, descScore)

      if (maxScore > 10) { // Only include relevant results
        results.push({
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          type: 'course',
          score: maxScore
        })
      }
    })

    // Search quizzes with better performance
    const games = await prisma.userQuiz.findMany({
      where: {
        AND: [
          { isPublic: true },
          { title: { contains: query, mode: "insensitive" } }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true,
        quizType: true
      },
      take: limit
    })

    // Process games with scoring
    games.forEach(game => {
      const titleScore = fuzzyMatch(game.title, query)

      if (titleScore > 10) { // Only include relevant results
        results.push({
          id: game.id,
          title: game.title,
          slug: game.slug,
          type: 'quiz',
          score: titleScore,
          metadata: {
            quizType: game.quizType
          }
        })
      }
    })

    // Sort by score and limit results
    results.sort((a, b) => b.score - a.score)
    const limitedResults = results.slice(0, limit)

    // Separate courses and games
    const courseResults = limitedResults.filter(r => r.type === 'course')
    const gameResults = limitedResults.filter(r => r.type === 'quiz')

    const responseData = {
      courses: courseResults,
      games: gameResults,
      total: limitedResults.length,
      query: query
    }

    // Cache the results
    searchCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    })

    // Clean up old cache entries
    if (searchCache.size > 100) {
      const oldestKey = searchCache.keys().next().value
      searchCache.delete(oldestKey)
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({
      error: "An error occurred while searching",
      courses: [],
      games: []
    }, { status: 500 })
  }
}
