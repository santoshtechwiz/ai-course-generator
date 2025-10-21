/**
 * POST /api/ordering-quizzes/generate
 * Generate an ordering/sequencing quiz based on topic
 * Handles subscription limits and authentication
 * Uses UserQuiz table with quizType='ordering'
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { orderingQuizService } from "@/services/ordering-quiz.service"
import { creditService } from "@/services/credit-service"

interface GenerateQuizRequest {
  topic: string
  difficulty: "easy" | "medium" | "hard"
  numberOfQuestions?: number
  quizType?: string
}

interface GenerateQuizResponse {
  success: boolean
  quiz?: any
  message: string
  error?: string
  slug?: string
  creditsRemaining?: number
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

  // Validate difficulty
  if (!["easy", "medium", "hard"].includes(req.difficulty as string)) {
    return { valid: false, error: "Difficulty must be easy, medium, or hard" }
  }

  // Validate numberOfQuestions (optional, defaults to 5)
  const numberOfQuestions = typeof req.numberOfQuestions === 'number' 
    ? Math.max(1, Math.min(10, req.numberOfQuestions)) // Clamp between 1-10
    : 5;

  return {
    valid: true,
    data: {
      topic: req.topic.trim(),
      difficulty: req.difficulty as "easy" | "medium" | "hard",
      numberOfQuestions,
      quizType: (req.quizType as string) || "ordering",
    },
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateQuizResponse>> {
  try {
    const session = await getAuthSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Authentication required", error: "AUTH_REQUIRED" },
        { status: 401 }
      )
    }

    // Block inactive users
    if (session.user?.isActive === false) {
      return NextResponse.json(
        { success: false, message: "Account inactive. Reactivate to continue.", error: "ACCOUNT_INACTIVE" },
        { status: 403 }
      )
    }

    // Parse and validate request
    let body: any
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.error!, error: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    const { topic, difficulty, numberOfQuestions } = validation.data!

    // Get user's current credits for AI service
    const creditDetails = await creditService.getCreditDetails(userId)

    // Create quiz using the ordering quiz service (handles credits and database)
    const result = await orderingQuizService.createQuizWithCredits({
      topic,
      difficulty,
      userId,
      userType: session.user?.userType || 'FREE',
      credits: creditDetails.currentBalance,
      numberOfQuestions,
    })

    console.log(`[Ordering Quiz API] Successfully created ordering quiz ${result.id} for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: "Ordering quiz created successfully!",
      quiz: {
        id: result.id,
        title: result.title,
        slug: result.slug,
        steps: result.questions[0]?.steps || [], // Return steps from first question
      },
      slug: result.slug,
      creditsRemaining: result.creditsRemaining,
    })

  } catch (error) {
    console.error("Error generating ordering quiz:", error)

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
}
