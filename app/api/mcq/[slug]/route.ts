import prisma from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

import { z } from "zod"

// Define the response types
interface McqQuestionsResponse {
  result: {
    id: string
    title: string
    slug: string
    isPublic: boolean
    isFavorite: boolean
    userId: string
  } | null
  questions: Question[]
}

interface Question {
  id: string
  question: string
  title: string
  answer: string
  option1: string
  option2: string
  option3: string
}

// Validation schema for the slug parameter
const slugSchema = z.string().min(1).max(100)

// Optimize the GET handler to return more structured data and avoid redundant transformations
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
        title: true,
        slug: true,
        isPublic: true,
        isFavorite: true,
        userId: true,
        quizType: true,
        difficulty: true,
        timeStarted: true,
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            answer: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Handle case where no result is found
    if (!result) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Structure the response in a more usable format
    const response = {
      result: {
        id: result.id,
        title: result.title,
        slug: result.slug,
        isPublic: result.isPublic,
        isFavorite: result.isFavorite,
        userId: result.userId,
        quizType: result.quizType,
        difficulty: result.difficulty,
        timeStarted: result.timeStarted,
        authorName: result.user?.name,
      },
      questions: result.questions.map((question) => ({
        id: question.id,
        question: question.question,
        answer: question.answer,
        option1: question.options[0] || "",
        option2: question.options[1] || "",
        option3: question.options[2] || "",
      })),
    }

    // Return the structured response
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching MCQ questions:", error)
    return NextResponse.json({ error: "Failed to fetch quiz questions" }, { status: 500 })
  }
}
