import { getAuthSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import { CodeQuizService } from "@/app/services/code-quiz.service"

export async function GET(_: Request, props: { params: Promise<{ slug: string }> }): Promise<NextResponse> {
  const { slug } = await props.params
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 })
  }

  const session = await getAuthSession()
  const userId = session?.user?.id || ""

  try {
    const codeQuizService = new CodeQuizService()
    const result = await codeQuizService.getCodeQuizBySlug(slug, userId)

    return NextResponse.json({
      ...result,
      slug,
      quizId: result.id?.toString(),
      userId,
      ownerId: result.userId || userId,
    })
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
  }
}
