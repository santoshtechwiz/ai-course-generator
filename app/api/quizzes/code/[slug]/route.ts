import prisma from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(_: Request, props: { params: Promise<{ slug: string }> }): Promise<NextResponse> {
  const { slug } = await props.params
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 })
  }

  try {
    const result = await prisma.userQuiz.findUnique({
      where: {
        slug: slug,
      },
      select: {
        id: true,
        userId: true,
        isFavorite: true,
        isPublic: true,
        title: true,
        slug: true,
        questions: {
          select: {
            question: true,
            options: true,
            codeSnippet: true,
            answer: true,
            questionType: true,
          },
        },
      },
    })

    if (!result) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

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
        id: `question-${index}-${Math.random().toString(36).substring(2, 9)}`,
        question: q.question || "",
        codeSnippet: q.codeSnippet || "",
        options: options,
        answer: q.answer || "",
        language: q.questionType === "code" ? "javascript" : undefined,
      }
    })

    // Create a serializable response object
    const quizData = {
      isFavorite: Boolean(result.isFavorite),
      isPublic: Boolean(result.isPublic),
      slug: slug,
      quizId: result.id.toString(),
      userId: result.userId,
      ownerId: result.userId, // Assuming the owner is the same as the user who created the quiz

      id: result.id.toString(),
      title: result.title,
      questions: processedQuestions,

    }

    return NextResponse.json(quizData)
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
