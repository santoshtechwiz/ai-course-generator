import { NextResponse } from "next/server"

import prisma from "@/lib/db"
import { getAuthSession } from "@/lib/auth"

export async function GET() {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const userQuizAttempts = await prisma.userQuizAttempt.findMany({
    where: { userId: session.user.email as string },
    include: {
      userQuiz: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5, // Limit to the 5 most recent quizzes
  })

  const quizzes = userQuizAttempts.map((attempt) => ({
    id: attempt.id,
    title: attempt.userQuiz?.title || "Unknown",
    score: attempt.score,
    accuracy: attempt.accuracy,
    timeSpent: attempt.timeSpent,
    improvement: attempt.improvement,
    completionSpeed: attempt.completionSpeed,
    difficultyRating: attempt.difficultyRating,
    date: attempt.createdAt.toISOString(),
  }))

  return NextResponse.json(quizzes)
}

