import { NextRequest } from "next/server"
import { createQuizForType } from "@/app/api/quizzes/_helpers/create-quiz"

export async function POST(req: NextRequest, { params }: { params: { quizType: string } }) {
  const { quizType } = params
  return createQuizForType(req, quizType)
}