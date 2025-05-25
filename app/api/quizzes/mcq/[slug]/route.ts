import prisma from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

import { z } from "zod"

// Validation schema for the slug parameter
const slugSchema = z.string().min(1).max(100)

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    // Validate the slug parameter
    const { slug } = await params

    const validatedSlug = slugSchema.safeParse(slug)
    if (!validatedSlug.success) {
      return NextResponse.json({ error: "Invalid slug parameter" }, { status: 400 })
    }

    // Query the database - fetch all needed data in a single query
    const result = await prisma.userQuiz.findUnique({
      where: { slug },
      select: {
        id: true,
        userId: true,
        isFavorite: true,
        isPublic: true,
        title: true,
        slug: true,
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            answer: true,
            questionType: true,
          },
        },
      },
    })

    // Handle case where no result is found
    if (!result) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Process questions to ensure they're serializable
    // Process questions to ensure they're serializable
    const processedQuestions = result.questions.map((q, index) => {
      // Parse options if they're stored as a JSON string
      let options = []
      if (typeof q.options === "string") {
        try {
          options = JSON.parse(q.options)
        } catch (e) {
          console.error("Failed to parse options:", e)
          options = []
        }
      } else if (Array.isArray(q.options)) {
        options = [...q.options]
      }

      return {
        id: q.id,
        question: q.question || "",
        codeSnippet: "",
        options: options,
        answer: q.answer || "",

      }
    })

    // Create a serializable response object with same structure as code quiz
    const quizData = {
      isFavorite: Boolean(result.isFavorite),
      isPublic: Boolean(result.isPublic),
      slug: slug,
      quizId: result.id.toString(),
      userId: result.userId,
      ownerId: result.userId,

      id: result.id.toString(),
      title: result.title,
      questions: processedQuestions,

    }
 
    // Return the structured response
    return NextResponse.json(quizData)
  } catch (error) {
    console.error("Error fetching MCQ questions:", error)
    return NextResponse.json({ error: "Failed to fetch quiz questions" }, { status: 500 })
  }
}
