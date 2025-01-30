

import {  NextResponse } from "next/server"
import { getAuthSession } from "@/lib/authOptions"
import { prisma } from "@/lib/db"


export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const slug = (await params).slug;

    if (!slug) {
      return NextResponse.json({ error: "Quiz slug is required" }, { status: 400 })
    }

    const quiz = await prisma.userQuiz.findFirst({
      where: { slug },
      select: { isPublic: true, userId: true },
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    if (!quiz.isPublic) {
      const session = await getAuthSession()
      const userId = session?.user.id

      // if (!userId || userId !== quiz.userId) {
      //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      // }
    }

    const result = await prisma.userQuiz.findFirst({
      where: {
        slug: slug,
        OR: [{ isPublic: true }, { userId: quiz.userId }],
      },
      select: {
        id: true,
        topic: true,
        userId: true,
        questions: {
          select: {
            id: true,
            question: true,
            answer: true,
            openEndedQuestion: {
              select: {
                hints: true,
                difficulty: true,
                tags: true,
              },
            },
          },
        },
      },
    })

    if (!result) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    const transformedQuestions = result.questions.map((question) => ({
      id: question.id,
      question: question.question,
      answer: question.answer,
      openEndedQuestion: question.openEndedQuestion
        ? {
            hints: question.openEndedQuestion.hints.split("|"),
            difficulty: question.openEndedQuestion.difficulty,
            tags: question.openEndedQuestion.tags.split("|"),
          }
        : null,
    }))

    const response = {
      id: result.id,
      userId: result.userId,
      topic: result.topic,
      questions: transformedQuestions,
    }

    // Serialize dates to ISO strings
    const serializedResult = JSON.parse(
      JSON.stringify(response, (key, value) =>
        typeof value === "bigint" ? value.toString() : value instanceof Date ? value.toISOString() : value,
      ),
    )

    return NextResponse.json(serializedResult)
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

