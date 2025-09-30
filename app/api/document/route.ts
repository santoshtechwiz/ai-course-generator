import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

import { creditService, CreditOperationType } from "@/services/credit-service"
import { getAuthSession } from "@/lib/auth"

const QuestionSchema = z.object({
  question: z.string(),
  // Allow variable number of options (minimum 2) to be more tolerant with model output
  options: z.array(z.string()).min(2),
  // correctAnswer may be omitted by the model; keep it optional and validate client-side
  correctAnswer: z.number().int().min(0).optional(),
})

const QuizSchema = z.object({
  questions: z.array(QuestionSchema),
})

// Optimize token estimation and error handling
function estimateTokenCount(text: string): number {
  // More accurate token estimation (1 token ≈ 4 chars for English text)
  const wordCount = text.split(/\s+/).length
  const charCount = text.length

  // Use a combination of word and character count for better estimation
  return Math.ceil(wordCount * 1.5 + charCount / 4)
}

// Optimize truncation to preserve document structure
function truncateToTokenLimit(text: string, maxTokens = 10000): string {
  const estimatedTokens = estimateTokenCount(text)

  if (estimatedTokens <= maxTokens) {
    return text
  }

  // More sophisticated truncation that tries to preserve document structure
  const paragraphs = text.split(/\n\n+/)
  let truncatedText = ""

  // Add paragraphs until we reach the token limit
  let currentTokens = 0
  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokenCount(paragraph)
    if (currentTokens + paragraphTokens > maxTokens * 0.95) {
      break
    }
    truncatedText += paragraph + "\n\n"
    currentTokens += paragraphTokens
  }

  return truncatedText.trim() + "\n\n[Document truncated due to length limitations]"
}

// Add error handling for the POST request
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const numberOfQuestions = formData.get("numberOfQuestions") as string
    const difficulty = formData.get("difficulty") as string
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Prevent inactive users from creating quizzes or consuming credits
    if (session.user.isActive === false) {
      console.warn(`[Document API] Blocked inactive user ${session.user.id} from generating quiz`)
      return NextResponse.json({ error: "Account inactive. Please contact support to re-activate." }, { status: 403 })
    }

    // SECURE: Atomic credit validation and deduction to prevent race conditions
    const creditDeduction = 1 // Standard 1 credit for document quiz generation
    const creditResult = await creditService.executeCreditsOperation(
      session.user.id,
      creditDeduction,
      CreditOperationType.QUIZ_CREATION,
      {
        description: `Document quiz generation from ${file?.name || 'uploaded file'}`,
        quizType: 'document',
        questionAmount: numberOfQuestions,
        difficulty
      }
    )

    if (!creditResult.success) {
      return NextResponse.json({ 
        error: creditResult.error || "Insufficient credits" 
      }, { status: 403 })
    }

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Check file size (max 0.5MB)
    const MAX_FILE_SIZE = 0.5 * 1024 * 1024 // 0.5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Please upload a file smaller than 0.5MB." }, { status: 400 })
    }

    // Read file content
    const fileContent = await file.text()

    // Truncate content to stay within token limits
    const truncatedContent = truncateToTokenLimit(fileContent, 10000)

    // Log token estimation for debugging

      try {
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

      // NOTE: Credits already deducted atomically above
      console.log(`[Document API] Successfully generated quiz for user ${session.user.id}. Credits remaining: ${creditResult.newBalance}`)

      return NextResponse.json({
        questions: result.object.questions,
        creditsRemaining: creditResult.newBalance
      })
    } catch (aiError) {
      console.error("Error generating quiz with AI:", aiError)

      // NOTE: This system does not support automatic refunds from the API layer.
      // Credits are deducted atomically prior to AI generation. If AI generation
      // fails, surface the error to the client and log for manual investigation.

      return NextResponse.json(
        {
          error: "Failed to generate quiz with AI",
          details: aiError instanceof Error ? aiError.message : "Unknown AI error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing document:", error)
    return NextResponse.json(
      {
        error: "Failed to process document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
