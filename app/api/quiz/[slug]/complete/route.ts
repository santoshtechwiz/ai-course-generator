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

    if (body.quizId && body.score && body.duration && Array.isArray(body.answers)) {
      return await handleQuizAttempt(userId, body)
    } else if (body.slug && Array.isArray(body.answers) && body.totalTime) {
      return await handleQuizAnswers(userId, body)
    } else {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing quiz:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 },
    )
  }
}

async function handleQuizAttempt(userId: string, body: any) {
  const { quizId, score, duration, answers } = body

  const quizExists = await prisma.userQuiz.findUnique({
    where: { id: quizId },
    select: { id: true, bestScore: true },
  })

  if (!quizExists) {
    throw new Error("Invalid quizId: UserQuiz does not exist")
  }

  const durationInSeconds = Math.round(duration)

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [updatedUserQuiz, updatedUser, quizAttempt] = await Promise.all([
        tx.userQuiz.update({
          where: { id: quizId },
          data: {
            timeEnded: new Date(),
            lastAttempted: new Date(),
            bestScore: { set: Math.max(score, quizExists.bestScore ?? 0) },
          },
        }),
        tx.user.update({
          where: { id: userId },
          data: {
            totalQuizzesAttempted: { increment: 1 },
            totalTimeSpent: { increment: durationInSeconds },
          },
        }),
        tx.userQuizAttempt.upsert({
          where: {
            userId_userQuizId: { userId, userQuizId: quizId },
          },
          update: {
            score,
            timeSpent: durationInSeconds,
            improvement: score - (quizExists.bestScore ?? 0),
            accuracy: answers ? (answers.filter((a: any) => a.isCorrect).length / answers.length) * 100 : null,
          },
          create: {
            userId,
            userQuizId: quizId,
            score,
            timeSpent: durationInSeconds,
            accuracy: answers ? (answers.filter((a: any) => a.isCorrect).length / answers.length) * 100 : null,
          },
        }),
      ])

      if (answers && Array.isArray(answers)) {
        await tx.userQuizAttemptQuestion.createMany({
          data: answers.map((answer: any) => ({
            attemptId: quizAttempt.id,
            questionId: answer.questionId,
            userAnswer: JSON.stringify(answer.userAnswer),
            isCorrect: answer.isCorrect,
            timeSpent: Math.round(answer.timeSpent),
          })),
          skipDuplicates: true,
        })
      }

      return { updatedUserQuiz, quizAttempt }
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Transaction failed:", error)
    return NextResponse.json({ success: false, error: "Failed to process quiz attempt" }, { status: 500 })
  }
}

async function handleQuizAnswers(userId: string, body: any) {
  const { slug, answers, totalTime } = body

  const userQuiz = await prisma.userQuiz.findUnique({
    where: { slug },
    include: { questions: true },
  })

  if (!userQuiz) {
    return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 })
  }

  let score = 0
  const attemptQuestions = userQuiz.questions.map((question, index) => {
    const userAnswer = answers[index]
    const isCorrect = question.answer.toLowerCase() === userAnswer.answer.toLowerCase()
    if (isCorrect) score++
    return {
      questionId: question.id,
      userAnswer: JSON.stringify(userAnswer),
      isCorrect,
      timeSpent: userAnswer.timeSpent || Math.floor(totalTime / answers.length),
    }
  })

  try {
    const [quizAttempt, updatedUser] = await prisma.$transaction([
      prisma.userQuizAttempt.upsert({
        where: {
          userId_userQuizId: {
            userId: userQuiz.userId,
            userQuizId: userQuiz.id,
          },
        },
        update: {
          score,
          timeSpent: totalTime,
          accuracy: (score / userQuiz.questions.length) * 100,
          attemptQuestions: {
            deleteMany: {},
            create: attemptQuestions,
          },
        },
        create: {
          userId: userQuiz.userId,
          userQuizId: userQuiz.id,
          score,
          timeSpent: totalTime,
          accuracy: (score / userQuiz.questions.length) * 100,
          attemptQuestions: {
            create: attemptQuestions,
          },
        },
      }),
      prisma.user.update({
        where: { id: userQuiz.userId },
        data: {
          totalQuizzesAttempted: { increment: 1 },
          engagementScore: { increment: Math.round((score / userQuiz.questions.length) * 100) },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        attemptId: quizAttempt.id,
        score,
        totalQuestions: userQuiz.questions.length,
      },
    })
  } catch (error) {
    console.error("Transaction failed:", error)
    return NextResponse.json({ success: false, error: "Failed to process quiz answers" }, { status: 500 })
  }
}

