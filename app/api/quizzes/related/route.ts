import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { createCacheManager } from "@/app/services/cache/cache-manager"

const cache = createCacheManager()

// Increase cache TTL for related quizzes - they don't change frequently
const CACHE_TTL = 900 // 15 minutes (was 60s)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const quizType = searchParams.get("quizType") || undefined
    const difficulty = searchParams.get("difficulty") || undefined
    const exclude = searchParams.get("exclude") || undefined
    const limit = Math.min(12, Math.max(1, Number(searchParams.get("limit") || 6)))
    const tagsParam = searchParams.get("tags") || ""
    const tags = tagsParam ? tagsParam.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5) : []

    const cacheKey = `api:quizzes:related:${quizType || 'all'}:${difficulty || 'any'}:${exclude || 'none'}:${tags.join('|')}:${limit}`
    
    // Check cache first
    const cached = await cache.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json(
        { quizzes: cached }, 
        { 
          headers: { 
            "X-Cache": "HIT",
            'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
          } 
        }
      )
    }

    const where: any = { isPublic: true }
    if (quizType) where.quizType = quizType
    if (difficulty) where.difficulty = difficulty
    if (exclude) where.slug = { not: exclude }
    // Prefer tag overlap when available (assuming tags is a string[] column)
    if (tags.length > 0) {
      where.OR = [
        { tags: { hasSome: tags } },
        { title: { contains: tags[0], mode: 'insensitive' } },
      ]
    }

    // Try ordering by recent activity first, then fallback to createdAt
      const quizzes = await prisma.userQuiz.findMany({
        where,
        take: limit,
        orderBy: [
          // @ts-ignore: optional columns depending on schema
          { lastAttempted: 'desc' as any },
          { createdAt: 'desc' },
        ],
        include: {
          questions: true,
        },
      })

    const normalized = quizzes.map((q) => ({
      id: String(q.id),
      title: q.title,
      slug: q.slug,
      quizType: q.quizType,
      difficulty: q.difficulty || "medium",
      questionCount: Array.isArray(q.questions) ? q.questions.length : 0,
      isPublic: true,
    }))

    // Cache with longer TTL
    await cache.set(cacheKey, normalized, CACHE_TTL)
    
    return NextResponse.json(
      { quizzes: normalized }, 
      { 
        headers: { 
          "X-Cache": "MISS",
          'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
          'CDN-Cache-Control': `public, s-maxage=${CACHE_TTL}`,
        } 
      }
    )
  } catch (error) {
    console.error("Related quizzes API error:", error)
    return NextResponse.json({ quizzes: [] }, { status: 200 })
  }
}