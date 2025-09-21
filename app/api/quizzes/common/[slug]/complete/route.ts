import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { validateSubscriptionServer } from "@/lib/subscription-validation"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate subscription for quiz completion
    const validation = await validateSubscriptionServer(session.user.id, {
      requireCredits: true,
      requireSubscription: false, // Allow free plan users to complete quizzes
      requiredPlan: 'FREE'
    })
    
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: validation.error || "Subscription validation failed",
        requiresSubscription: true 
      }, { status: 403 })
    }

    const data = await req.json()
    const { 
      timeSpent, 
      score, 
      totalQuestions, 
      correctAnswers, 
      answers = [], 
      completed = true 
    } = data

    // Find the quiz
    const quiz = await prisma.userQuiz.findFirst({
      where: { slug }
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Create or update quiz attempt record
    const attempt = await prisma.quizAttempt.upsert({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: quiz.id
        }
      },
      update: {
        timeSpent,
        score,
        totalQuestions,
        correctAnswers,
        answers: JSON.stringify(answers),
        completed,
        completedAt: completed ? new Date() : null,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        quizId: quiz.id,
        timeSpent,
        score,
        totalQuestions,
        correctAnswers,
        answers: JSON.stringify(answers),
        completed,
        completedAt: completed ? new Date() : null
      }
    })

    // Update user progress if needed
    if (completed) {
      await prisma.userQuiz.update({
        where: { id: quiz.id },
        data: { 
          lastAttempted: new Date(),
          // Increment attempt count if this is a new completion
          ...(attempt.completedAt ? {} : { attempts: { increment: 1 } })
        }
      })
    }

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        score: attempt.score,
        completed: attempt.completed,
        completedAt: attempt.completedAt
      }
    })

  } catch (error) {
    console.error("Error saving quiz completion:", error)
    return NextResponse.json(
      { error: "Failed to save quiz completion" },
      { status: 500 }
    )
  }
}
