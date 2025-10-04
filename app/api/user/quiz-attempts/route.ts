import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    const attempts = await prisma.userQuizAttempt.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        userQuiz: {
          select: {
            id: true,
            title: true,
            slug: true,
            quizType: true,
          }
        },
        attemptQuestions: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                answer: true,
                options: true,
                questionType: true,
              }
            }
          },
          orderBy: {
            questionId: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
    })

    // Transform the data to include proper calculations
    const transformedAttempts = attempts.map(attempt => {
      const totalQuestions = attempt.attemptQuestions.length
      const correctAnswers = attempt.attemptQuestions.filter(q => q.isCorrect).length
      
      // Recalculate score and accuracy to ensure consistency
      const calculatedScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
      const calculatedAccuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
      
      return {
        ...attempt,
        score: calculatedScore,
        accuracy: calculatedAccuracy,
        totalQuestions,
        correctAnswers,
        attemptQuestions: attempt.attemptQuestions.map(aq => ({
          ...aq,
          question: {
            ...aq.question,
            options: typeof aq.question.options === "string"
              ? JSON.parse(aq.question.options as string)
              : (typeof aq.question.options === "object" ? aq.question.options : null)
          }
        }))
      }
    })

    return NextResponse.json({
      attempts: transformedAttempts,
      total: await prisma.userQuizAttempt.count({
        where: { userId: session.user.id }
      })
    })

  } catch (error) {
    console.error("Error fetching quiz attempts:", error)
    return NextResponse.json(
      { error: "Failed to fetch quiz attempts" },
      { status: 500 }
    )
  }
}

// Reset all quiz attempts for the current user
export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Delete all quiz attempts and related questions in a transaction
    // NOTE: user model does not store aggregated counters like totalQuizzesAttempted
    // anymore; compute aggregates when needed instead of persisting on the user record.
    await prisma.$transaction([
      // First delete all attempt questions that belong to user's attempts
      prisma.userQuizAttemptQuestion.deleteMany({
        where: {
          attempt: {
            userId: session.user.id,
          },
        },
      }),
      // Then delete all attempts
      prisma.userQuizAttempt.deleteMany({
        where: {
          userId: session.user.id,
        },
      }),
    ])

    return NextResponse.json({ 
      success: true, 
      message: "All quiz attempts have been reset" 
    })

  } catch (error) {
    console.error("Error resetting quiz attempts:", error)
    return NextResponse.json(
      { error: "Failed to reset quiz attempts" },
      { status: 500 }
    )
  }
}
