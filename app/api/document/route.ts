import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

import { updateUserCredits } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"

const QuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().int().min(0).max(3),
})

const QuizSchema = z.object({
  questions: z.array(QuestionSchema),
})

// Rough estimation of tokens in text (1 token ≈ 4 chars for English text)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

// Function to truncate text to stay within token limits
function truncateToTokenLimit(text: string, maxTokens = 10000): string {
  const estimatedTokens = estimateTokenCount(text)

  if (estimatedTokens <= maxTokens) {
    return text
  }

  // If text is too long, truncate it to fit within token limit
  // This is a simple approach - a more sophisticated one would preserve document structure
  const truncationRatio = maxTokens / estimatedTokens
  const truncatedLength = Math.floor(text.length * truncationRatio)

  const truncatedText = text.substring(0, truncatedLength)
  return truncatedText + "\n\n[Document truncated due to length limitations]"
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  const numberOfQuestions = formData.get("numberOfQuestions") as string
  const difficulty = formData.get("difficulty") as string
  const session=await getAuthSession();
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }

  // Check file size (max 1MB)
  const MAX_FILE_SIZE = .5 * 1024 * 1024 // 1MB in bytes
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large. Please upload a file smaller than 1MB." }, { status: 400 })
  }

  try {
    // Read file content
    const fileContent = await file.text()

    // Truncate content to stay within token limits
    // We use 10000 tokens for content to leave room for system prompt and completion
    const truncatedContent = truncateToTokenLimit(fileContent, 10000)

    // Log token estimation for debugging
    console.log(`Estimated tokens in truncated content: ${estimateTokenCount(truncatedContent)}`)

    const result = await generateObject({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "system",
          content: `You are a quiz generator. Create a quiz based on the given document content. 
          The quiz should have ${numberOfQuestions} questions. 
          The difficulty level should be ${difficulty}% (0% being easiest, 100% being hardest).
          ${
            truncatedContent.length < fileContent.length
              ? "Note: The document has been truncated due to length limitations. Create questions based on the available content."
              : ""
          }`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Generate a quiz based on the following document:" },
            { type: "text", text: truncatedContent },
          ],
        },
      ],
      schema: QuizSchema,
    })
    //deduct tokens used
    if (session?.user.id) {
     await updateUserCredits(session.user.id, "undefined");
    } else {
      throw new Error("User session is not valid");
    }
    return NextResponse.json(result.object.questions)
  } catch (error) {
    console.error("Error generating quiz:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}

