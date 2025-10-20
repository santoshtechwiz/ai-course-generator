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

    // Try new OrderingQuiz table first
    let orderingQuiz = await prisma.orderingQuiz.findUnique({
      where: { slug },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    // If not found in new table, try legacy UserQuiz with metadata (backwards compatibility)
    if (!orderingQuiz) {
      const legacyQuiz = await prisma.userQuiz.findUnique({
        where: { slug },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          difficulty: true,
          quizType: true,
          metadata: true,
          userId: true,
          createdAt: true,
          isPublic: true,
        },
      })

      if (!legacyQuiz || legacyQuiz.quizType !== "ordering") {
        return NextResponse.json(
          {
            success: false,
            message: "Quiz not found",
            error: "NOT_FOUND",
          },
          { status: 404 }
        )
      }

      // Parse legacy metadata format
      let metadata: any = legacyQuiz.metadata
      if (typeof metadata === "string") {
        try {
          metadata = JSON.parse(metadata)
        } catch {
          metadata = {}
        }
      }

      let questions: any[] = []
      if (Array.isArray(metadata)) {
        questions = metadata
          .filter((q: any) => q.type === "ordering" && q.steps)
          .map((q: any, qIndex: number) => ({
            id: String(q.id ?? `q${qIndex + 1}`),
            title: q.title || `Question ${qIndex + 1}`,
            topic: q.topic || "",
            description: q.description || "",
            difficulty: q.difficulty || "medium",
            steps: Array.isArray(q.steps)
              ? q.steps.map((s: any, i: number) => ({
                  id: s.id ?? i,
                  description: s.description ?? `Step ${i + 1}`,
                  explanation: s.explanation ?? "",
                }))
              : [],
            correctOrder: Array.isArray(q.correctOrder) ? q.correctOrder : [],
            numberOfSteps: q.numberOfSteps || q.steps?.length || 0,
          }))
      } else if (metadata?.steps && Array.isArray(metadata.steps)) {
        // Single question old format
        const steps = metadata.steps.map((s: any, i: number) => ({
          id: s.id ?? i,
          description: s.description ?? `Step ${i + 1}`,
          explanation: s.explanation ?? "",
        }))
        questions = [{
          id: String(legacyQuiz.id),
          title: legacyQuiz.title,
          topic: legacyQuiz.title,
          description: metadata.description || "",
          difficulty: legacyQuiz.difficulty || "medium",
          steps,
          correctOrder: metadata.correctOrder ?? [],
          numberOfSteps: steps.length,
        }]
      }

      // Return legacy format
      return NextResponse.json({
        success: true,
        quiz: {
          id: legacyQuiz.id,
          slug: legacyQuiz.slug,
          title: legacyQuiz.title,
          description: legacyQuiz.description,
          difficulty: legacyQuiz.difficulty,
          type: "ordering",
          questions,
          totalQuestions: questions.length,
          createdAt: legacyQuiz.createdAt,
          isPublic: legacyQuiz.isPublic,
          userId: legacyQuiz.userId,
        },
        message: "Quiz fetched successfully (legacy format)",
      }, { status: 200 })
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
