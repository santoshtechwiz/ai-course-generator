import { getAuthSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import { CodeQuizService } from "@/app/services/code-quiz.service"

export async function POST(req: Request) {
  const { language, title, difficulty, amount } = await req.json()
  const session = await getAuthSession()
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in to create a quiz." }, { status: 401 })
  }

  try {
    const codeQuizService = new CodeQuizService()
    const result = await codeQuizService.generateCodeQuiz(
      session.user.id, 
      language, 
      title, 
      difficulty, 
      amount
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to generate quizzes" }, { status: 500 })
  }
}
