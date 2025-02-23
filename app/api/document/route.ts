import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const QuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().int().min(0).max(3),
})

const QuizSchema = z.object({
  questions: z.array(QuestionSchema),
})

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  const numberOfQuestions = formData.get("numberOfQuestions") as string
  const difficulty = formData.get("difficulty") as string

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }

  // Read file content
  const fileContent = await file.text()

  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "system",
          content: `You are a quiz generator. Create a quiz based on the given document content. 
          The quiz should have ${numberOfQuestions} questions. 
          The difficulty level should be ${difficulty}% (0% being easiest, 100% being hardest).`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Generate a quiz based on the following document:" },
            { type: "text", text: fileContent },
          ],
        },
      ],
      schema: QuizSchema,
    })

    return NextResponse.json(result.object.questions)
  } catch (error) {
    console.error("Error generating quiz:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}

