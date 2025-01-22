import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/authOptions"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (!body.quizId || !Array.isArray(body.answers) || typeof body.totalTime !== "number") {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 })
    }

    const { quizId, answers, totalTime } = body

    const quiz = await prisma.userQuiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    })

    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 })
    }

    const score = calculateScore(answers, quiz.questions)

    const result = await prisma.$transaction(async (tx) => {
      const [updatedUserQuiz, updatedUser, quizAttempt] = await Promise.all([
        tx.userQuiz.update({
          where: { id: quizId },
          data: {
            timeEnded: new Date(),
            lastAttempted: new Date(),
            bestScore: { set: Math.max(score, quiz.bestScore ?? 0) },
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
            score,
            timeSpent: Math.round(totalTime),
            accuracy: (score / (quiz.questions.length * 100)) * 100,
          },
          create: {
            userId,
            userQuizId: quizId,
            score,
            timeSpent: Math.round(totalTime),
            accuracy: (score / (quiz.questions.length * 100)) * 100,
          },
        })
      ])

      const attemptId = quizAttempt.id;

      for (const [index, question] of quiz.questions.entries()) {
        await tx.userQuizAttemptQuestion.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attemptId,  // Use correct variable names for `attemptId` and `questionId`
              questionId: question.id,
            }
          },
          update: {
            userAnswer: answers[index].answer,
            isCorrect: calculateQuestionScore(answers[index].answer, question.answer) > 0,
            timeSpent: Math.round(answers[index].timeSpent),
          },
          create: {
            attemptId,
            questionId: question.id,
            userAnswer: answers[index].answer,
            isCorrect: calculateQuestionScore(answers[index].answer, question.answer) > 0,
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

function calculateScore(
  answers: Array<{ answer: string; timeSpent: number; hintsUsed: boolean }>,
  questions: Array<{ answer: string }>
): number {
  return questions.reduce((total, question, index) => {
    const score = calculateQuestionScore(answers[index]?.answer || "", question.answer)
    return total + score
  }, 0)
}

function calculateQuestionScore(userAnswer: string, correctAnswer: string): number {
  return userAnswer.toLowerCase() === correctAnswer.toLowerCase() ? 100 : 0
}
