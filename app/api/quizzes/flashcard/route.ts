import { getAuthSession } from "@/lib/auth"
import { generateFlashCards } from "@/lib/chatgpt/ai-service"
import prisma from "@/lib/db"

import { NextResponse } from "next/server"
import { z } from "zod"
import type { User } from "@prisma/client"
import { titleToSlug } from "@/lib/slug"

// Input validation schema
const createFlashcardSchema = z.object({
  title: z.string().min(1, "Topic is required"),
  count: z.number().int().positive(),
})

// Type for flashcard data from AI service
interface FlashCardData {
  question: string
  answer: string
}

// Optimize the generateUniqueSlug function
async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = titleToSlug(title)

  // First try with the base slug
  const existingCount = await prisma.userQuiz.count({
    where: { slug: baseSlug },
  })

  if (existingCount === 0) return baseSlug

  // Try with a timestamp suffix for uniqueness
  const timestamp = Date.now().toString().slice(-6)
  const newSlug = `${baseSlug}-${timestamp}`

  return newSlug
}

// Optimize the error handling function
function handleError(error: unknown, defaultMessage = "Internal server error") {
  console.error("API Error:", error)

  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: "Validation error", details: error.format() }, { status: 400 })
  }

  const errorMap: Record<string, { status: number; message: string }> = {
    "Authentication required": { status: 401, message: "Authentication required" },
    "User not found": { status: 404, message: "User not found" },
    "Flashcard set not found": { status: 404, message: "Flashcard set not found" },
    "Failed to generate flashcards": { status: 500, message: "Failed to generate flashcards" },
    "Insufficient credits": {
      status: 403,
      message: "Insufficient credits. You need at least 1 credit to generate flashcards",
    },
  }

  if (error instanceof Error) {
    // Check for known error messages
    for (const [key, value] of Object.entries(errorMap)) {
      if (error.message.includes(key)) {
        return NextResponse.json({ error: value.message }, { status: value.status })
      }
    }

    // Generic error handling
    return NextResponse.json({ error: defaultMessage, message: error.message }, { status: 500 })
  }

  return NextResponse.json({ error: defaultMessage }, { status: 500 })
}

// Verify user authentication and return user data
async function authenticateUser(): Promise<{
  session: { user: { id: string } }
  user: Pick<User, "id" | "credits">
}> {
  const session = await getAuthSession()

  if (!session) {
    throw new Error("Authentication required")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, credits: true },
  })

  if (!user) {
    throw new Error("User not found")
  }

  return { session, user }
}

export async function POST(req: Request) {
  try {
    // Authenticate user
    const { session, user } = await authenticateUser()

    // Parse and validate input
    const body = await req.json()
    const { title, count } = createFlashcardSchema.parse(body)

    // Check credits
    if (user.credits < 1) {
      throw new Error("Insufficient credits. You need at least 1 credit to generate flashcards")
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(title)

    // Generate flashcards first, before starting the transaction
    // This ensures we don't start a transaction that might timeout during AI generation
    //Simulate dummy flashcard data for testing
    // Use environment variable to determine whether to use dummy flashcards or AI service
    const useDummyData = process.env.NODE_ENV === "development"

    const flashcards = useDummyData
      ? ([
          { question: "What is AI?", answer: "Artificial Intelligence" },
          { question: "What is ML?", answer: "Machine Learning" },
        ] as FlashCardData[])
      : ((await generateFlashCards(title, count)) as FlashCardData[])

    if (!flashcards || flashcards.length === 0) {
      throw new Error("Failed to generate flashcards")
    }

    // Use a transaction for database operations with timeout
    const result = await prisma.$transaction(
      async (tx) => {
        // Create new quiz with flashcards
        const newQuiz = await tx.userQuiz.create({
          data: {
            title,
            quizType: "flashcard",
            slug,
            timeStarted: new Date(),
            userId: session.user.id,
          },
        })

        // Create flashcards
        await tx.flashCard.createMany({
          data: flashcards.map((flashcard: FlashCardData) => ({
            question: flashcard.question,
            answer: flashcard.answer,
            userId: session.user.id,
            difficulty: "hard",
            userQuizId: newQuiz.id,
          })),
        })

        // Deduct one credit
        await tx.user.update({
          where: { id: session.user.id },
          data: { credits: { decrement: 1 }, creditsUsed: { increment: 1 } },
        })

        return newQuiz
      },
      {
        maxWait: 5000, // 5s maximum wait time
        timeout: 15000, // 15s timeout
      },
    )

    return NextResponse.json(
      {
        success: true,
        data: result,
        slug: slug,
        message: "Flashcards created successfully. 1 credit has been deducted.",
      },
      { status: 201 },
    )
  } catch (error) {
    return handleError(error, "Failed to generate flashcards")
  }
}

export async function GET(req: Request) {
  try {
    // Get slug parameter
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get("slug")

    if (slug) {
      // Get specific quiz by slug
      const quiz = await prisma.userQuiz.findUnique({
        where: {
          slug,
        },
        include: {
          flashCards: {
            orderBy: { createdAt: "desc" },
          },
        },
      })

      if (!quiz) {
        throw new Error("Flashcard set not found")
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            quiz,
            flashCards: quiz.flashCards,
          },
        },
        { status: 200 },
      )
    } else {
      // Authenticate user to get session
      const { session } = await authenticateUser()

      // Get all user's quizzes
      const quizzes = await prisma.userQuiz.findMany({
        where: {
          userId: session.user.id,
          quizType: "flashcard",
        },
        include: {
          flashCards: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      return NextResponse.json(
        {
          success: true,
          data: {
            quizzes,
          },
        },
        { status: 200 },
      )
    }
  } catch (error) {
    return handleError(error, "Failed to fetch flashcards")
  }
}

export async function PATCH(req: Request) {
  try {
    // Authenticate user
    const { session } = await authenticateUser()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json()

    const { id, isSaved } = z.object({ isSaved: z.boolean(), id: z.number() }).parse(body)
    if (!id) {
      return NextResponse.json({ error: "Card ID is required" }, { status: 400 })
    }

    // Update flashcard in the database
    const updatedCard = await prisma.flashCard.update({
      where: { id: +id }, // Ensure `id` is the correct type (string for UUIDs)
      data: { saved: isSaved },
    })

    return NextResponse.json({ success: true, data: updatedCard }, { status: 200 })
  } catch (error) {
    console.error("Error updating flashcard:", error)
    return NextResponse.json({ error: "Failed to update flashcard" }, { status: 500 })
  }
}
