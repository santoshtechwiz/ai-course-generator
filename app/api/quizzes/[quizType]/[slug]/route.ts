import { NextRequest, NextResponse } from "next/server"
import { QuizServiceFactory } from "@/app/services/quiz-service-factory"
import { getAuthSession } from "@/lib/auth"
import { createCacheManager } from "@/app/services/cache/cache-manager"
import { prisma } from "@/lib/db"
import { createQuizForType } from "@/app/api/quizzes/_helpers/create-quiz"

const cache = createCacheManager()

export async function GET(
  req: NextRequest, 
  context: { params: Promise<{ quizType: string; slug: string }> }
): Promise<NextResponse> {
  try {
    // Extract parameters - await params first
    const { quizType, slug } = await context.params

    // Try cache first
    const cacheKey = `api:quiz:${quizType}:${slug}`
    const cached = await cache.get<any>(cacheKey)
    if (cached) {
      const response = NextResponse.json(cached)
      response.headers.set("X-Cache", "HIT")
      response.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
      return response
    }
    
    // Get the user session for authorization and subscription validation
    const session = await getAuthSession()
    const userId = session?.user?.id || ""
    
    // For quiz viewing, we don't need to validate subscription or credits
    // Users should be able to view and take quizzes freely
    // Only quiz submission/results require authentication and credits
    
    // Use the factory to get the appropriate quiz service
    const quizService = QuizServiceFactory.getQuizService(quizType)
    
    if (!quizService) {
      return NextResponse.json({ error: `Unsupported quiz type: ${quizType}` }, { status: 400 })
    }
    
    // Fetch the quiz using the appropriate service
    const quiz = await quizService.getQuizBySlug(slug, userId)
    
    if (!quiz) {
      console.error(`Quiz not found: ${quizType}/${slug}, userId: ${userId}`)
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }
    
    // Save to memory cache
    await cache.set(cacheKey, quiz, 60) // 60s TTL for API-level cache

    // Debug log the quiz data
    console.log(`Quiz data for ${quizType}/${slug}:`, JSON.stringify(quiz, null, 2));
    
    // Add caching headers to the response
    const response = NextResponse.json(quiz)
    response.headers.set("X-Cache", "MISS")
    response.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
    return response
  } catch (error) {
    // Await params before using its properties in error logging
    let quizType = "unknown"
    try {
      const awaitedParams = await context.params
      quizType = awaitedParams.quizType
    } catch {}
    console.error(`Error fetching ${quizType} quiz:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest, 
  context: { params: Promise<{ quizType: string; slug: string }> }
): Promise<NextResponse> {
  try {
    // Extract parameters
    const { quizType, slug } = await context.params
    
    // Get the user session for authorization
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Block inactive users from updating quizzes (consistent server-side guard)
    try {
      // Get the typed isActive flag first
      const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isActive: true } })
      if (dbUser && dbUser.isActive === false) {
        console.warn(`[Quiz API] Blocked inactive user ${session.user.id} from updating quiz ${quizType}/${slug}`)
        return NextResponse.json({ error: "Account inactive. Reactivate to continue." }, { status: 403 })
      }

      // Rely on typed isActive flag; raw SQL checks for legacy subscriptionActive column removed
    } catch (err) {
      console.error('[Quiz API] Failed to verify user status', err)
    }
    
    // Get the request body with update parameters
    const body = await req.json()
    
    // Use the factory to get the appropriate quiz service
    const quizService = QuizServiceFactory.getQuizService(quizType)
    
    if (!quizService) {
      return NextResponse.json({ error: `Unsupported quiz type: ${quizType}` }, { status: 400 })
    }
    
    // Update the quiz using the appropriate service
    const updatedQuiz = await quizService.updateQuizProperties(
      slug,
      session.user.id,
      body
    )
    
    // Invalidate cache entry
    const cacheKey = `api:quiz:${quizType}:${slug}`
    await cache.del(cacheKey)
    
    return NextResponse.json(updatedQuiz)
  } catch (error) {
    // Await params before using its properties in error logging
    let quizType = "unknown"
    try {
      const awaitedParams = await context.params
      quizType = awaitedParams.quizType
    } catch {}
    console.error(`Error updating ${quizType} quiz:`, error)
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest, 
  context: { params: Promise<{ quizType: string; slug: string }> }
): Promise<NextResponse> {
  try {
    // Extract parameters
    const { quizType, slug } = await context.params
    
    // Get the user session for authorization
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    // Use the factory to get the appropriate quiz service
    const quizService = QuizServiceFactory.getQuizService(quizType)
    
    if (!quizService) {
      return NextResponse.json({ error: `Unsupported quiz type: ${quizType}` }, { status: 400 })
    }
    
    // Delete the quiz using the appropriate service
    await quizService.delete(slug, session.user.id)

    // Invalidate cache entry
    const cacheKey = `api:quiz:${quizType}:${slug}`
    await cache.del(cacheKey)

    return NextResponse.json({ message: "Quiz deleted successfully" })
  } catch (error) {
    // Await params before using its properties in error logging
    let quizType = "unknown"
    try {
      const awaitedParams = await context.params
      quizType = awaitedParams.quizType
    } catch {}
    console.error(`Error deleting ${quizType} quiz:`, error)
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 })
  }
}


export async function POST(
  req: NextRequest, 
  context: { params: Promise<{ quizType: string; slug: string }> }
): Promise<NextResponse> {
  try {
    // Extract parameters
    const { quizType, slug } = await context.params

    // Get the user session for authorization
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Delegate to the central create handler which handles credits, subscription checks and backfill
    // The helper will perform the proper credit deduction and creation flow.
    return await createQuizForType(req, quizType)
  } catch (error) {
    // Await params before using its properties in error logging
    let quizType = "unknown"
    try {
      const awaitedParams = await context.params
      quizType = awaitedParams.quizType
    } catch {}
    console.error(`Error creating ${quizType} quiz:`, error)
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 })
  }
}