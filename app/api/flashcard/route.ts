import { getAuthSession } from "@/lib/authOptions"
import { generateFlashCards } from "@/lib/chatgpt/ai-service"
import prisma from "@/lib/db"
import { titleToSlug } from "@/lib/slug"
import { NextResponse } from "next/server"
import { z } from "zod" // For input validation

// Input validation schema
const createFlashcardSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  count: z.number().int().positive().default(5),
})

// Generate a unique slug
async function generateUniqueSlug(topic: string): Promise<string> {
  const baseSlug = titleToSlug(topic)

  // Check if slug exists
  const existingQuiz = await prisma.userQuiz.findUnique({
    where: { slug: baseSlug },
  })

  if (!existingQuiz) return baseSlug

  // If slug exists, append a unique identifier
  const timestamp = Date.now().toString().slice(-6)
  return `${baseSlug}-${timestamp}`
}

export async function POST(req: Request) {
  try {
    // Get session
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Parse and validate input
    const body = await req.json()
    const validationResult = createFlashcardSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid input", details: validationResult.error.format() }, { status: 400 })
    }

    const { topic, count } = validationResult.data

    // Check if user has enough credits before proceeding
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.credits < 1) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message: "You need at least 1 credit to generate flashcards",
        },
        { status: 403 },
      )
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(topic)

    // Use a transaction for database operations
    const result = await prisma.$transaction(async (tx) => {
      // Generate flashcards
      const flashcards = await generateFlashCards(topic, count)

      if (!flashcards || flashcards.length === 0) {
        throw new Error("Failed to generate flashcards")
      }

      // Create new topic with flashcards
      const newTopic = await tx.userQuiz.create({
        data: {
          topic,
          quizType: "flashcard",
          slug,
          timeStarted: new Date(),
          userId: session.user.id,
        },
      })

      // Create flashcards
      await tx.flashCard.createMany({
        data: flashcards.map((flashcard: any) => ({
          question: flashcard.question,
          answer: flashcard.answer,
          userId: session.user.id,
          difficulty: "hard",
          userQuizId: newTopic.id,
        })),
      })

      // Deduct one credit from the user
      await tx.user.update({
        where: { id: session.user.id },
        data: { credits: { decrement: 1 } },
      })

      return newTopic
    })

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: "Flashcards created successfully. 1 credit has been deducted.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating flashcards:", error)

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.format() }, { status: 400 })
    }

    // Handle AI service errors
    if (error instanceof Error && error.message.includes("AI service")) {
      return NextResponse.json({ error: "AI service error", message: error.message }, { status: 503 })
    }

    // Handle database errors related to credits
    if (error instanceof Error && error.message.includes("credits")) {
      return NextResponse.json({ error: "Credit operation failed", message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Internal server error", message: "Failed to generate flashcards" },
      { status: 500 },
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get("slug")

    // Validate slug parameter
    if (slug && typeof slug !== "string") {
      return NextResponse.json({ error: "Invalid slug parameter" }, { status: 400 })
    }

    // Get session
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Optimize query with proper joins
    if (slug) {
      // Get specific flashcards by slug
      const quiz = await prisma.userQuiz.findUnique({
        where: {
          slug,
          userId: session.user.id, // Ensure user owns this quiz
        },
        include: {
          flashCards: {
            orderBy: { createdAt: "desc" },
          },
        },
      })

      if (!quiz) {
        return NextResponse.json({ error: "Flashcard set not found" }, { status: 404 })
      }
      console.log(quiz)
      return NextResponse.json(
        {
          success: true,
          data: {
            quiz,
            flashCards: quiz ? quiz.flashCards : [],
          },
        },
        { status: 200 },
      )
    } else {
      // Get all user's flashcard sets
      const quiz = await prisma.userQuiz.findUnique({
        where: {
          slug: slug || undefined,
        },
        include: {
          flashCards: {
            orderBy: { createdAt: "desc" },
          },
        },
      })

      return NextResponse.json(
        {
          success: true,
          data: {
            quiz,
            flashCards: quiz?.flashCards || [],
          },
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("Error fetching flashcards:", error)
    return NextResponse.json({ error: "Internal server error", message: "Failed to fetch flashcards" }, { status: 500 })
  }
}

