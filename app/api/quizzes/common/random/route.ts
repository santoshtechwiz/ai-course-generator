import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { createCacheManager } from "@/app/services/cache/cache-manager"

const cache = createCacheManager()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || 10)))
    const quizType = searchParams.get("quizType") || undefined
    const difficulty = searchParams.get("difficulty") || undefined

    const cacheKey = `api:quizzes:random:${quizType || 'all'}:${difficulty || 'any'}:${limit}`
    const cached = await cache.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json({ quizzes: cached }, { headers: { "X-Cache": "HIT" } })
    }

    const where: any = { isPublic: true }
    if (quizType) where.quizType = quizType
    if (difficulty) where.difficulty = difficulty

    // Use a lock to prevent stampeding and double database fetches
    const quizzes = await cache.acquireLock(cacheKey, async () => {
      // Another concurrent operation may have populated the cache
      const cachedAfterLock = await cache.get<any>(cacheKey)
      if (cachedAfterLock) return cachedAfterLock

      // Use Prisma's findMany with orderBy for better compatibility
      const results = await prisma.userQuiz.findMany({
        where,
        take: limit,
        orderBy: {
          createdAt: 'desc' // Fallback to recent since RANDOM() isn't supported in all DBs
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

      // Cache for a short duration (60s) because this endpoint is inexpensive and non-critical
      await cache.set(cacheKey, results, 60)
      return results
    })

    // Return response with caching headers
    const response = NextResponse.json({ quizzes })
    response.headers.set("X-Cache", "MISS")
    response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=120")
    return response

  } catch (error) {
    console.error("Error fetching random quizzes:", error)
    return NextResponse.json(
      { error: "Failed to fetch random quizzes" },
      { status: 500 }
    )
  }
}
