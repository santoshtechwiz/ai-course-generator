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
    const quizId = searchParams.get("quizId")

    if (!quizId) {
      return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 })
    }

    // Get quiz progress for the user
    const quizProgress = await prisma.userQuiz.findFirst({
      where: {
        id: quizId,
        userId: session.user.id,
      },
      include: {
        attempts: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10, // Last 10 attempts
          include: {
            attemptQuestions: {
              select: {
                isCorrect: true,
                timeSpent: true
              }
            }
          }
        }
      }
    })

    if (!quizProgress) {
      return NextResponse.json({
        quizId,
        progress: 0,
        isCompleted: false,
        bestScore: 0,
        attemptsCount: 0,
        lastAttemptAt: null,
        averageScore: 0,
        averageTime: 0
      })
    }

    // Calculate progress metrics
    const attempts = quizProgress.attempts
    const attemptsCount = attempts.length
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0
    const averageScore = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
      : 0

    const totalTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0)
    const averageTime = attemptsCount > 0 ? totalTime / attemptsCount : 0

    const lastAttemptAt = attempts.length > 0 ? attempts[0].createdAt : null

    // Determine if completed (e.g., score >= 70% or specific criteria)
    const isCompleted = bestScore >= 70

    // Calculate progress percentage based on attempts and improvement
    let progress = 0
    if (attemptsCount > 0) {
      progress = Math.min(bestScore, 100) // Cap at 100%
    }

    return NextResponse.json({
      quizId,
      progress,
      isCompleted,
      bestScore,
      attemptsCount,
      lastAttemptAt,
      averageScore: Math.round(averageScore),
      averageTime: Math.round(averageTime),
      recentAttempts: attempts.slice(0, 5).map(attempt => ({
        id: attempt.id,
        score: attempt.score,
        timeSpent: attempt.timeSpent,
        createdAt: attempt.createdAt,
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

    const body = await req.json()
    const { quizId, progress, score, timeSpent, isCompleted } = body

    if (!quizId) {
      return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 })
    }

    // Update or create quiz progress
    const quizProgress = await prisma.userQuiz.upsert({
      where: {
        id: quizId
      },
      update: {
        progress: progress || 0,
        bestScore: {
          set: Math.max(
            (await prisma.userQuiz.findUnique({
              where: { id: quizId },
              select: { bestScore: true }
            }))?.bestScore || 0,
            score || 0
          )
        },
        lastAttemptAt: new Date(),
        timeSpent: {
          increment: timeSpent || 0
        }
      },
      create: {
        id: quizId,
        userId: session.user.id,
        title: body.title || 'Unknown Quiz',
        progress: progress || 0,
        bestScore: score || 0,
        timeSpent: timeSpent || 0,
        lastAttemptAt: new Date(),
        isCompleted: isCompleted || false
      }
    })

    return NextResponse.json({
      success: true,
      quizProgress
    })

  } catch (error) {
    console.error('Error updating quiz progress:', error)
    return NextResponse.json(
      { error: "Failed to update quiz progress" },
      { status: 500 }
    )
  }
}