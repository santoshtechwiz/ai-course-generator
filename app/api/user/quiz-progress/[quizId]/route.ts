import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { progressService } from "@/app/services/progress.service"

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const quizId = searchParams.get("quizId")

    if (!quizId) {
      return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 })
    }

    // Get quiz progress using the progress service
    const quizProgress = await progressService.getQuizProgress(session.user.id, parseInt(quizId))

    if (!quizProgress) {
      return NextResponse.json({
        quizId,
        progress: 0,
        isCompleted: false,
        bestScore: 0,
        attemptsCount: 0,
        lastAttemptAt: null,
        averageScore: 0,
        averageTime: 0,
        recentAttempts: []
      })
    }

    // Get recent attempts for detailed view
    const recentAttempts = await prisma.userQuizAttempt.findMany({
      where: {
        userId: session.user.id,
        userQuizId: parseInt(quizId)
      },
      include: {
        attemptQuestions: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    return NextResponse.json({
      quizId,
      progress: quizProgress.progress,
      isCompleted: quizProgress.isCompleted,
      bestScore: quizProgress.bestScore,
      attemptsCount: quizProgress.attemptsCount,
      lastAttemptAt: quizProgress.lastAttempted.toISOString(),
      averageScore: quizProgress.averageScore,
      averageTime: quizProgress.attemptsCount > 0 ? Math.round(quizProgress.totalTimeSpent / quizProgress.attemptsCount) : 0,
      recentAttempts: recentAttempts.map(attempt => ({
        id: attempt.id.toString(),
        score: attempt.score || 0,
        timeSpent: attempt.timeSpent || 0,
        createdAt: attempt.createdAt.toISOString(),
        correctAnswers: attempt.attemptQuestions.filter(q => q.isCorrect).length,
        totalQuestions: attempt.attemptQuestions.length
      }))
    })

  } catch (error) {
    console.error('Error fetching quiz progress:', error)
    return NextResponse.json(
      { error: "Failed to fetch quiz progress" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { quizId, progress, score, timeSpent, isCompleted } = body

    if (!quizId) {
      return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 })
    }

    // Update quiz progress using the progress service
    const updatedProgress = await progressService.updateQuizProgress(
      session.user.id,
      parseInt(quizId),
      {
        score: score,
        timeSpent: timeSpent,
        isCompleted: isCompleted
      }
    )

    return NextResponse.json({
      success: true,
      quizProgress: {
        id: updatedProgress.id,
        quizId: updatedProgress.quizId.toString(),
        progress: updatedProgress.progress,
        bestScore: updatedProgress.bestScore,
        attemptsCount: updatedProgress.attemptsCount,
        totalTimeSpent: updatedProgress.totalTimeSpent,
        isCompleted: updatedProgress.isCompleted,
        lastAttempted: updatedProgress.lastAttempted.toISOString(),
        averageScore: updatedProgress.averageScore
      }
    })

  } catch (error) {
    console.error('Error updating quiz progress:', error)
    return NextResponse.json(
      { error: "Failed to update quiz progress" },
      { status: 500 }
    )
  }
}