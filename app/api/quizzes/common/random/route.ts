import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { createCacheManager, CACHE_TTL } from "@/app/services/cache/cache-manager"

const cache = createCacheManager()

// Static route configuration for better Next.js optimization
export const dynamic = 'force-dynamic'
export const revalidate = 600 // 10 minutes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || 10)))
    const quizType = searchParams.get("quizType") || undefined
    const difficulty = searchParams.get("difficulty") || undefined

    // Enhanced cache key with version
    const cacheKey = `api:quizzes:random:v2:${quizType || 'all'}:${difficulty || 'any'}:${limit}`
    
    // Check cache with proper headers
    const cached = await cache.get<any>(cacheKey)
    if (cached) {
      const response = NextResponse.json({ quizzes: cached })
      response.headers.set("X-Cache", "HIT")
      response.headers.set("Cache-Control", "public, max-age=600, stale-while-revalidate=1200")
      return response
    }

    const where: any = { isPublic: true }
    if (quizType) where.quizType = quizType
    if (difficulty) where.difficulty = difficulty

    // Optimized query with better randomization
    const totalCount = await prisma.userQuiz.count({ where })
    const skip = totalCount > limit ? Math.floor(Math.random() * (totalCount - limit)) : 0

    const quizzes = await prisma.userQuiz.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        quizType: true,
        difficulty: true,
        isPublic: true,
        createdAt: true,
        tags: true,
        _count: {
          select: {
            questions: true
          }
        }
      }
    })

    // Enhanced caching with proper TTL
    await cache.set(cacheKey, quizzes, CACHE_TTL.RANDOM_QUIZZES)

    const response = NextResponse.json({ quizzes })
    response.headers.set("X-Cache", "MISS")
    response.headers.set("Cache-Control", "public, max-age=600, stale-while-revalidate=1200")
    response.headers.set("Vary", "Accept-Encoding")
    response.headers.set("ETag", `"${cacheKey}-${Date.now()}"`)
    return response

  } catch (error) {
    console.error("Error fetching random quizzes:", error)
    return NextResponse.json(
      { error: "Failed to fetch random quizzes" },
      { status: 500 }
    )
  }
}
