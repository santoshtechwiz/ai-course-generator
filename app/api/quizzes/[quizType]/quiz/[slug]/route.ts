import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { QuizServiceFactory } from "@/app/services/quiz-service-factory"
import { QuizRepository } from "@/app/repositories/quiz.repository"

// Define response types for better type safety
interface QuizResponse {
  isPublic: boolean
  isFavorite: boolean
  quizData: {
    title: string
    questions: any[]
  }
}

interface ErrorResponse {
  error: string
}

export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = params
    const { isPublic, isFavorite } = await req.json()

    // First get the quiz to determine its type
    const quizRepository = new QuizRepository()
    const quiz = await quizRepository.findBySlug(slug)

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Get the appropriate service
    const quizService = QuizServiceFactory.getQuizService(quiz.quizType)

    // Update the quiz
    const updatedQuiz = await quizService.updateQuizProperties(
      slug,
      session.user.id,
      { isPublic, isFavorite }
    )

    return NextResponse.json(updatedQuiz)
  } catch (error) {
    console.error("Error updating quiz:", error)
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = params

    const quiz = await prisma.userQuiz.findUnique({
      where: { slug },
      select: { userId: true },
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    if (quiz.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.userQuiz.delete({
      where: { slug },
    })

    return NextResponse.json({ message: "Quiz deleted successfully" })
  } catch (error) {
    console.error("Error deleting quiz:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(
  req: Request,
  props: { params: Promise<{ slug: string }> },
): Promise<NextResponse<QuizResponse | ErrorResponse>> {
  const params = await props.params

  const { slug } = await params
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 })
  }

  try {
    const result = await prisma.userQuiz.findUnique({
      where: {
        slug: slug,
      },
      include: {
        questions: {
          select: {
            question: true,
            options: true,
            answer: true,
          },
        },
      },
    })

    if (!result) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    const data: QuizResponse = {
      isPublic: result.isPublic,
      isFavorite: result.isFavorite,
      quizData: {
        title: result.title,
        questions: result.questions,
      },
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
