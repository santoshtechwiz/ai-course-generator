import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { createCacheManager } from "@/app/services/cache/cache-manager"

const cache = createCacheManager()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const quizType = searchParams.get("quizType") || undefined
    const difficulty = searchParams.get("difficulty") || undefined
    const exclude = searchParams.get("exclude") || undefined
    const limit = Math.min(12, Math.max(1, Number(searchParams.get("limit") || 6)))

    const cacheKey = `api:quizzes:related:${quizType || 'all'}:${difficulty || 'any'}:${exclude || 'none'}:${limit}`
    const cached = await cache.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json({ quizzes: cached }, { headers: { "X-Cache": "HIT" } })
    }

    const where: any = { isPublic: true }
    if (quizType) where.quizType = quizType
    if (difficulty) where.difficulty = difficulty
    if (exclude) where.slug = { not: exclude }

    const quizzes = await prisma.userQuiz.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        quizType: true,
        difficulty: true,
        _count: { select: { questions: true } },
      },
    })

    const normalized = quizzes.map((q) => ({
      id: String(q.id),
      title: q.title,
      slug: q.slug,
      quizType: q.quizType,
      difficulty: q.difficulty || "medium",
      questionCount: q._count?.questions || 0,
      isPublic: true,
    }))

    await cache.set(cacheKey, normalized, 60) // 60s TTL
    return NextResponse.json({ quizzes: normalized }, { headers: { "X-Cache": "MISS" } })
  } catch (error) {
    console.error("Related quizzes API error:", error)
    return NextResponse.json({ quizzes: [] }, { status: 200 })
  }
}