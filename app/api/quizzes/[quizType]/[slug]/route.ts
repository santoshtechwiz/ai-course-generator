import { NextRequest, NextResponse } from "next/server"
import { QuizServiceFactory } from "@/app/services/quiz-service-factory"
import { getAuthSession } from "@/lib/auth"
import { createCacheManager } from "@/app/services/cache/cache-manager"

const cache = createCacheManager()

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ quizType: string; slug: string }> }
): Promise<NextResponse> {
  try {
    // Extract parameters - await params first
    const { quizType, slug } = await params

    // Try cache first
    const cacheKey = `api:quiz:${quizType}:${slug}`
    const cached = await cache.get<any>(cacheKey)
    if (cached) {
      const response = NextResponse.json(cached)
      response.headers.set("X-Cache", "HIT")
      response.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
      return response
    }
    
    // Get the user session for authorization if needed
    const session = await getAuthSession()
    const userId = session?.user?.id || ""
    
    // Use the factory to get the appropriate quiz service
    const quizService = QuizServiceFactory.getQuizService(quizType)
    
    if (!quizService) {
      return NextResponse.json({ error: `Unsupported quiz type: ${quizType}` }, { status: 400 })
    }
    
    // Fetch the quiz using the appropriate service
    const quiz = await quizService.getQuizBySlug(slug, userId)
    
    if (!quiz) {
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
      const awaitedParams = await params
      quizType = awaitedParams.quizType
    } catch {}
    console.error(`Error fetching ${quizType} quiz:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ quizType: string; slug: string }> }
): Promise<NextResponse> {
  try {
    // Extract parameters
    const { quizType, slug } = await params
    
    // Get the user session for authorization
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
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
      const awaitedParams = await params
      quizType = awaitedParams.quizType
    } catch {}
    console.error(`Error updating ${quizType} quiz:`, error)
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest, 
  { params }: { params: { quizType: string; slug: string } }
): Promise<NextResponse> {
  try {
    // Extract parameters
    const { quizType, slug } = params
    
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
    console.error(`Error deleting ${params.quizType} quiz:`, error)
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 })
  }
}


export async function POST(
  req: NextRequest, 
  { params }: { params: { quizType: string; slug: string } }
): Promise<NextResponse> {
  try {
    // Extract parameters
    const { quizType, slug } = params

    // Get the user session for authorization
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get the request body with quiz data
    const body = await req.json()

    // Use the factory to get the appropriate quiz service
    const quizService = QuizServiceFactory.getQuizService(quizType)

    if (!quizService) {
      return NextResponse.json({ error: `Unsupported quiz type: ${quizType}` }, { status: 400 })
    }

    // Create the quiz using the appropriate service
    const newQuiz = await quizService.createQuiz(slug, session.user.id, body)

    return NextResponse.json(newQuiz)
  } catch (error) {
    // Await params before using its properties in error logging
    let quizType = "unknown"
    try {
      const awaitedParams = await params
      quizType = awaitedParams.quizType
    } catch {}
    console.error(`Error creating ${quizType} quiz:`, error)
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 })
  }
}