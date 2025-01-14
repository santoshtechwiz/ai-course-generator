import { NextResponse } from "next/server"

import { isAdmin, unauthorized } from "@/lib/auth"
import { prisma } from "@/lib/db"


export async function GET() {
  if (!(await isAdmin())) {
    return unauthorized()
  }

  try {
    const quizzes = await prisma.courseQuiz.findMany({
      select: {
        id: true,
        question: true,
        answer: true,
        options: true,
      },
    })
    return NextResponse.json(quizzes)
  } catch (error) {
    console.error("Failed to fetch quizzes:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return unauthorized()
  }

  try {
    const { question, answer, options, chapterId } = await request.json()
    const newQuiz = await prisma.courseQuiz.create({
      data: {
        question,
        answer,
        options,
        chapterId: parseInt(chapterId),
      },
    })
    return NextResponse.json(newQuiz)
  } catch (error) {
    console.error("Failed to create quiz:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

