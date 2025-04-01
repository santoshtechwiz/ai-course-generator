import { prisma } from "@/lib/db"
import { getAuthSession } from "@/lib/authOptions"

import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await getAuthSession();
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (
      !body.quizId ||
      !Array.isArray(body.answers) ||
      typeof body.totalTime !== "number" ||
      typeof body.score !== "number"
    ) {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 })
    }

    const { quizId, answers, totalTime, score, type } = body

    const quiz = await prisma.userQuiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    })

    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 })
    }

    // Calculate percentage score
    let percentageScore: number;
    const totalQuestions = quiz.questions.length;

    if (type != "openended" && type != "fill-in-the-blank" && type != "code") {
      percentageScore = (score / totalQuestions) * 100;
    } else {
      percentageScore = score;
    }

    const result = await prisma.$transaction(async (tx) => {
      const [updatedUserQuiz, updatedUser, quizAttempt] = await Promise.all([
        tx.userQuiz.update({
          where: { id: quizId },
          data: {
            timeEnded: new Date(),
            lastAttempted: new Date(),
            bestScore: { set: Math.max(percentageScore, quiz.bestScore ?? 0) },
          },
        }),
        tx.user.update({
          where: { id: userId },
          data: {
            totalQuizzesAttempted: { increment: 1 },
            totalTimeSpent: { increment: Math.round(totalTime) },
          },
        }),
        tx.userQuizAttempt.upsert({
          where: {
            userId_userQuizId: {
              userId,
              userQuizId: quizId,
            },
          },
          update: {
            score: percentageScore,
            timeSpent: Math.round(totalTime),
            accuracy: percentageScore,
          },
          create: {
            userId,
            userQuizId: quizId,
            score: percentageScore,
            timeSpent: Math.round(totalTime),
            accuracy: percentageScore,
          },
        }),
      ])

      const attemptId = quizAttempt.id

      for (const [index, question] of quiz.questions.entries()) {
        await tx.userQuizAttemptQuestion.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attemptId,
              questionId: question.id,
            },
          },
          update: {
            userAnswer: answers[index].answer,
            isCorrect: answers[index].isCorrect,
            timeSpent: Math.round(answers[index].timeSpent),
          },
          create: {
            attemptId,
            questionId: question.id,
            userAnswer: answers[index].answer,
            isCorrect: answers[index].isCorrect,
            timeSpent: Math.round(answers[index].timeSpent),
          },
        })
      }

      return { updatedUserQuiz, quizAttempt }
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error processing quiz:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 },
    )
  }
}

