import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { createCacheManager, CACHE_TTL } from "@/app/services/cache/cache-manager"

const cache = createCacheManager()

// Static route for better Next.js optimization
export const dynamic = 'force-dynamic'
export const revalidate = 900 // 15 minutes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const quizType = searchParams.get("quizType") || undefined
    const difficulty = searchParams.get("difficulty") || undefined
    const exclude = searchParams.get("exclude") || undefined
    const limit = Math.min(12, Math.max(1, Number(searchParams.get("limit") || 6)))
    const tagsParam = searchParams.get("tags") || ""
    const tags = tagsParam ? tagsParam.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5) : []

    // Enhanced cache key with version for cache busting
    const cacheKey = `api:quizzes:related:v2:${quizType || 'all'}:${difficulty || 'any'}:${exclude || 'none'}:${tags.join('|')}:${limit}`
    
    // Check cache first
    const cached = await cache.get<any>(cacheKey)
    if (cached) {
      const response = NextResponse.json({ quizzes: cached })
      response.headers.set("X-Cache", "HIT")
      response.headers.set("Cache-Control", "public, max-age=900, stale-while-revalidate=1800")
      return response
    }

    // Build optimized query
    const where: any = { isPublic: true }
    if (quizType) where.quizType = quizType
    if (difficulty) where.difficulty = difficulty
    if (exclude) where.slug = { not: exclude }
    
    // Enhanced tag matching with better performance
    if (tags.length > 0) {
      where.OR = [
        { tags: { hasSome: tags } },
        { title: { contains: tags[0], mode: 'insensitive' } },
        { description: { contains: tags[0], mode: 'insensitive' } },
      ]
    }

    // Optimized query with selective includes
    const quizzes = await prisma.userQuiz.findMany({
      where,
      take: limit * 2, // Fetch more to account for filtering
      orderBy: [
        { createdAt: 'desc' }, // More reliable than lastAttempted
        { id: 'desc' }, // Secondary sort for consistency
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        quizType: true,
        difficulty: true,
        isPublic: true,
        tags: true,
        createdAt: true,
        _count: {
          select: {
            questions: true
          }
        }
      },
    })

    // Normalize and filter results
    const normalized = quizzes
      .filter(q => q.slug !== exclude) // Additional client-side filtering
      .slice(0, limit) // Trim to requested limit
      .map((q) => ({
        id: String(q.id),
        title: q.title,
        slug: q.slug,
        quizType: q.quizType,
        difficulty: q.difficulty || "medium",
        questionCount: q._count?.questions || 0,
        isPublic: true,
        tags: q.tags || [],
        createdAt: q.createdAt,
      }))

    // Enhanced caching with longer TTL
    await cache.set(cacheKey, normalized, CACHE_TTL.RELATED_QUIZZES)
    
    const response = NextResponse.json({ quizzes: normalized })
    response.headers.set("X-Cache", "MISS")
    response.headers.set("Cache-Control", "public, max-age=900, stale-while-revalidate=1800")
    response.headers.set("Vary", "Accept-Encoding")
    return response
  } catch (error) {
    console.error("Related quizzes API error:", error)
    return NextResponse.json({ quizzes: [] }, { status: 200 })
  }
}