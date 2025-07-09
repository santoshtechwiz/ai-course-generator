import { NextResponse } from "next/server"

import { prisma } from "@/lib/db"
import { BlanksQuizService } from "@/app/services/blanks-quiz.service"
import { getAuthSession } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const slug = (await params).slug
    const session = await getAuthSession()

    if (!slug) {
      return NextResponse.json({ error: "Quiz slug is required" }, { status: 400 })
    }

    const blanksQuizService = new BlanksQuizService()
    const quiz = await blanksQuizService.getQuizBySlug(slug, session?.user?.id)

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
