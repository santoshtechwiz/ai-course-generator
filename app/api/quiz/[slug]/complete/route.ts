import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { answers } = await request.json()
    const { slug } = await params

    // Fetch the quiz based on the slug
    const userQuiz = await prisma.userQuiz.findUnique({
      where: { slug },
      include: { questions: true },
    })

    if (!userQuiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 })
    }

    // Calculate the score and create attempt questions
    let score = 0
    const attemptQuestions = userQuiz.questions.map((question, index) => {
      const isCorrect = question.answer.toLowerCase() === answers[index].toLowerCase()
      if (isCorrect) score++
      return {
        questionId: question.id,
        userAnswer: answers[index],
        isCorrect,
        timeSpent: 0, // You may want to track time spent per question in the frontend
      }
    })

    // Create a new quiz attempt
    let quizAttempt = await prisma.userQuizAttempt.findUnique({
      where: { userId_userQuizId: { userId: userQuiz.userId, userQuizId: userQuiz.id } },
    })

    if (quizAttempt) {
      quizAttempt = await prisma.userQuizAttempt.update({
        where: { id: quizAttempt.id },
        data: {
          score,
          timeSpent: 0, // You may want to calculate total time spent in the frontend
          accuracy: (score / userQuiz.questions.length) * 100,
          attemptQuestions: {
            create: attemptQuestions,
          },
        },
      })
    } else {
      quizAttempt = await prisma.userQuizAttempt.create({
        data: {
          userId: userQuiz.userId,
          userQuizId: userQuiz.id,
          score,
          timeSpent: 0, // You may want to calculate total time spent in the frontend
          accuracy: (score / userQuiz.questions.length) * 100,
          attemptQuestions: {
            create: attemptQuestions,
          },
        },
      })
    }

  

    return NextResponse.json({
      success: true,
      data: {
        attemptId: quizAttempt.id,
        score,
        totalQuestions: userQuiz.questions.length,
      },
    })
  } catch (error) {
    console.error("Error completing quiz:", error)
    return NextResponse.json({ success: false, error: "An error occurred while completing the quiz" }, { status: 500 })
  }
}

