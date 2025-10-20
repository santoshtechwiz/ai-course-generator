/**
 * POST /api/ordering-quizzes/generate
 * Generate an ordering/sequencing quiz based on topic
 * Handles subscription limits and authentication
 * Uses UserQuiz table with quizType='ordering'
 */

import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"

interface GenerateQuizRequest {
  topic: string
  numberOfSteps: number
  difficulty: "easy" | "medium" | "hard"
}

interface GenerateQuizResponse {
  success: boolean
  quiz?: any
  message: string
  error?: string
  remainingQuizzes?: number
}

/**
 * Validate request payload
 */
function validateRequest(body: unknown): {
  valid: boolean
  data?: GenerateQuizRequest
  error?: string
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body is required" }
  }

  const req = body as Record<string, unknown>

  // Validate topic
  if (typeof req.topic !== "string" || req.topic.trim().length < 3) {
    return { valid: false, error: "Topic must be at least 3 characters" }
  }

  // Validate numberOfSteps
  if (
    typeof req.numberOfSteps !== "number" ||
    req.numberOfSteps < 4 ||
    req.numberOfSteps > 7
  ) {
    return {
      valid: false,
      error: "Number of steps must be between 4 and 7",
    }
  }

  // Validate difficulty
  if (!["easy", "medium", "hard"].includes(req.difficulty as string)) {
    return { valid: false, error: "Difficulty must be easy, medium, or hard" }
  }

  return {
    valid: true,
    data: {
      topic: req.topic.trim(),
      numberOfSteps: req.numberOfSteps,
      difficulty: req.difficulty as "easy" | "medium" | "hard",
    },
  }
}

/**
 * Get user's current subscription plan from session/database
 */
async function getUserPlan(userId: string): Promise<"FREE" | "PREMIUM" | "PRO"> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true, subscription: { select: { status: true, plan: { select: { id: true } } } } }
    })

    if (!user) {
      return "FREE"
    }

    // Check if subscription is active and has a plan
    const subscriptionActive = user.subscription?.status === "active"
    const planId = user.subscription?.plan?.id

    // Map plan IDs to tier names (adjust based on your actual plan IDs)
    if (subscriptionActive && planId) {
      if (planId.includes("premium")) return "PREMIUM"
      if (planId.includes("pro")) return "PRO"
    }

    return "FREE"
  } catch (error) {
    console.error("Error getting user plan:", error)
    return "FREE"
  }
}

/**
 * Get today's quiz generation count for user
 * Queries UserQuiz table with quizType='ordering'
 */
async function getTodayGenerationCount(userId: string): Promise<number> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const count = await prisma.userQuiz.count({
      where: {
        userId,
        quizType: "ordering",
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    return count
  } catch (error) {
    console.error("Error getting generation count:", error)
    return 0
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateQuizResponse>> {
  try {
    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON in request body",
          error: "INVALID_JSON",
        },
        { status: 400 }
      )
    }

    // Validate request
    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error || "Invalid request",
          error: "VALIDATION_ERROR",
        },
        { status: 400 }
      )
    }

    const { topic, numberOfSteps, difficulty } = validation.data!

    // Get user session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
          error: "UNAUTHORIZED",
        },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user's subscription plan
    const userPlan = await getUserPlan(userId)

    // Get today's generation count
    const generatedToday = await getTodayGenerationCount(userId)

    // Check if user can generate more quizzes - inline limit check
    const LIMITS = { FREE: 2, PREMIUM: 10, PRO: 50 }
    const limit = LIMITS[userPlan]
    const canAccess = generatedToday < limit

    if (!canAccess) {
      return NextResponse.json(
        {
          success: false,
          message: `Daily limit reached. You have generated ${generatedToday}/${limit} quizzes today on your ${userPlan} plan.`,
          error: "DAILY_LIMIT_EXCEEDED",
          remainingQuizzes: 0,
        },
        { status: 429 }
      )
    }

    // Generate quiz using simple AI service
    let quiz: any

    try {
      const { generateOrderingQuiz } = await import("@/lib/ai/simple-ai-service");
      
      quiz = await generateOrderingQuiz(
        topic,
        numberOfSteps,
        difficulty,
        userId,
        userPlan as any
      );
    } catch (error) {
      console.error("Error generating quiz:", error)

      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      return NextResponse.json(
        {
          success: false,
          message: "Failed to generate quiz. Please try again.",
          error: "GENERATION_FAILED",
        },
        { status: 500 }
      )
    }

    // Store quiz in database (using UserQuiz with quizType='ordering')
    let slug = ""
    try {
      // Generate a slug from the title
      slug = `${topic.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      
      await prisma.userQuiz.create({
        data: {
          userId,
          title: quiz.title || `${topic} - Ordering Quiz`,
          quizType: "ordering",
          slug,
          description: `Order the steps for: ${topic}`,
          difficulty: difficulty || "medium",
          timeStarted: new Date(),
          generatedBy: "AI",
          metadata: {
            topic: topic.trim(),
            steps: quiz.steps,
            explanations: (quiz.steps as any[]).map((s: any) => s.explanation),
            correctOrder: (quiz.steps as any[]).map((_: any, i: number) => i),
            numberOfSteps
          } as any
        }
      })
    } catch (error) {
      console.error("Error saving quiz to database:", error)
      // Don't fail the request - quiz was generated, just can't track it
      // This ensures better UX
    }

    const remainingQuizzes = limit - (generatedToday + 1) // +1 for current generation

    return NextResponse.json(
      {
        success: true,
        quiz,
        slug,
        message: `Quiz generated successfully. ${remainingQuizzes} remaining today.`,
        remainingQuizzes,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Unexpected error in generate quiz route:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: "INTERNAL_ERROR",
      },
      { status: 500 }
    )
  }
}
