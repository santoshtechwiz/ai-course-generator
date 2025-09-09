import { NextRequest } from "next/server"
import { createQuizForType } from "@/app/api/quizzes/_helpers/create-quiz"

export async function POST(req: NextRequest, { params }: { params: Promise<{ quizType: string }> }) {
  const { quizType } = await params
  return createQuizForType(req, quizType)
}