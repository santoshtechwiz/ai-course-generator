import { NextRequest, NextResponse } from "next/server"
import { createQuizForType } from "@/app/api/quizzes/_helpers/create-quiz"
import { QuizListService } from "@/app/services/quiz-list.service"

export async function POST(req: NextRequest, { params }: { params: { quizType: string } }) {
  const { quizType } = params
  return createQuizForType(req, quizType)
}

export async function GET(req: NextRequest, { params }: { params: { quizType: string } }) {
  try {
    const { quizType } = params
    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const search = searchParams.get("search") || undefined

    const list = new QuizListService()
    const quizzes = await list.listQuizzes({ limit, quizType, search })
    return NextResponse.json(quizzes)
  } catch (error) {
    console.error("Error fetching quizzes by type:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}