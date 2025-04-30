
import prisma from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(_: Request, props: { params: Promise< { slug: string }> }): Promise<NextResponse> {
  const { slug } = await (props.params);
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

    const quizData: any = {
      isFavorite: result.isFavorite ?? false,
      isPublic: result.isPublic ?? false,
      slug: slug,
      quizId: result.id,
      userId: result.userId,
      ownerId: result.userId, // Assuming the owner is the same as the user who created the quiz
      quizData: {
        title: result.title,
        questions: result.questions.map((q) => ({
          question: q.question,
          options: q.options ? JSON.parse(q.options) : [],
          codeSnippet: q.codeSnippet ?? undefined,
          language: q.questionType === "code" ? "javascript" : undefined, // Assuming 'code' type questions use JavaScript
          correctAnswer: q.answer,
        })),
      },
    }

    return NextResponse.json(quizData)
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

