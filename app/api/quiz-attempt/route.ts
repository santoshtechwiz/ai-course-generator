import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { attemptId, timeEnded } = body

    const attemptQuestions = await prisma.userQuizAttemptQuestion.findMany({
      where: { attemptId },
    })

    if (attemptQuestions.length === 0) {
      return NextResponse.json({ success: false, error: "No questions answered." }, { status: 400 })
    }

    const totalQuestions = attemptQuestions.length
    const correctAnswers = attemptQuestions.filter((q) => q.isCorrect).length
    const score = correctAnswers
    const accuracy = (correctAnswers / totalQuestions) * 100

    const attempt = await prisma.userQuizAttempt.findUnique({
      where: { id: attemptId },
    })

    if (!attempt) {
      return NextResponse.json({ success: false, error: "Attempt not found." }, { status: 404 })
    }

    const timeSpent = new Date(timeEnded).getTime() - new Date(attempt.createdAt).getTime()

    const finalizedAttempt = await prisma.userQuizAttempt.update({
      where: { id: attemptId },
      data: {
        timeSpent,
        score,
        accuracy,
      },
    })

    return NextResponse.json({ success: true, finalizedAttempt })
  } catch (error) {
    console.error("Error finalizing quiz attempt:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

