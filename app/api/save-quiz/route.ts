import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { generateSlug } from "@/lib/utils"

interface Question {
  id?: string
  question: string
  options: string[]
  correctAnswer: number
}

interface SaveQuizRequest {
  quiz: Question[]
  title: string
  quizType?: string
  difficulty?: string
  isPublic?: boolean
}

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "You must be logged in to save a quiz" }, { status: 401 })
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Block inactive users from saving quizzes (use isActive flag)
    if ((user as any).isActive === false) {
      return NextResponse.json({ error: "Account inactive. Reactivate to continue." }, { status: 403 })
    }

    // Parse the request body
    const body: SaveQuizRequest = await req.json()
    const { quiz, title, quizType = "MCQ", difficulty = "Medium", isPublic = false } = body

    if (!quiz || !Array.isArray(quiz) || quiz.length === 0) {
      return NextResponse.json({ error: "Invalid quiz data" }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: "Quiz title is required" }, { status: 400 })
    }

    // Generate a unique slug for the quiz
    const slug = generateSlug(title)

    // Create the quiz in the database
    const userQuiz = await prisma.userQuiz.create({
      data: {
        userId: user.id,
        title,
        quizType,
        difficulty,
        isPublic,
        slug,
        timeStarted: new Date(),
        questions: {
          create: quiz.map((q) => ({
            question: q.question,
            answer: q.correctAnswer.toString(),
            options: JSON.stringify(q.options),
            questionType: "MCQ",
          })),
        },
      },
      include: {
        questions: true,
      },
    })

    return NextResponse.json({
      success: true,
      quiz: userQuiz,
    })
  } catch (error) {
    console.error("Error saving quiz:", error)
    return NextResponse.json({ error: "Failed to save quiz" }, { status: 500 })
  }
}
