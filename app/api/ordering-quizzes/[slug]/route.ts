/**
 * GET /api/ordering-quizzes/[slug]
 * Fetch a specific ordering quiz by slug
 * Returns quiz data for rendering
 * Now uses dedicated OrderingQuiz tables instead of UserQuiz metadata
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface GetQuizResponse {
  success: boolean
  quiz?: any
  message: string
  error?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<GetQuizResponse>> {
  try {
    const { slug } = await params

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Quiz slug is required",
          error: "INVALID_SLUG",
        },
        { status: 400 }
      )
    }

    // Only check new OrderingQuiz table (dedicated table, not UserQuiz metadata)
    const orderingQuiz = await prisma.orderingQuiz.findUnique({
      where: { slug },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    if (!orderingQuiz) {
      return NextResponse.json(
        {
          success: false,
          message: "Quiz not found",
          error: "NOT_FOUND",
        },
        { status: 404 }
      )
    }

    // Format questions from new OrderingQuiz structure
    const questions = orderingQuiz.questions.map((q) => ({
      id: String(q.id),
      title: q.title,
      topic: orderingQuiz.topic || orderingQuiz.title,
      description: q.description || "",
      difficulty: orderingQuiz.difficulty,
      steps: Array.isArray(q.steps) ? q.steps : [],
      correctOrder: Array.isArray(q.correctOrder) ? q.correctOrder : [],
      numberOfSteps: Array.isArray(q.steps) ? (q.steps as any[]).length : 0,
    }))

    console.log(`[API] Fetched ${questions.length} questions from OrderingQuiz table`)

    const quizData = {
      id: orderingQuiz.id,
      slug: orderingQuiz.slug,
      title: orderingQuiz.title,
      description: orderingQuiz.description,
      difficulty: orderingQuiz.difficulty,
      type: "ordering",
      questions,
      totalQuestions: questions.length,
      createdAt: orderingQuiz.createdAt,
      isPublic: orderingQuiz.isPublic,
      userId: orderingQuiz.createdBy,
    }

    return NextResponse.json(
      {
        success: true,
        quiz: quizData,
        message: "Quiz fetched successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching quiz:", error)

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
