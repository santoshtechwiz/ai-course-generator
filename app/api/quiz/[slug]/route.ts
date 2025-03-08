import { NextResponse } from 'next/server'
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await params
    const { isPublic, isFavorite } = await req.json()

    const quiz = await prisma.userQuiz.findUnique({
      where: { slug },
      select: { userId: true }
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    if (quiz.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updatedQuiz = await prisma.userQuiz.update({
      where: { slug },
      data: {
        isPublic: isPublic !== undefined ? isPublic : undefined,
        isFavorite: isFavorite !== undefined ? isFavorite : undefined,
      },
    })

    return NextResponse.json(updatedQuiz)
  } catch (error) {
    console.error("Error updating quiz:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = params

    const quiz = await prisma.userQuiz.findUnique({
      where: { slug },
      select: { userId: true }
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


export async function GET(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;

  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 })
  }

  const result = await prisma.userQuiz.findUnique({
    where: {
      slug: slug
    },
    include: {
      questions: {
        select: {
          question: true,
          options: true,
          answer: true
        }
      }
    }
  });

  if (!result) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
  }

  const data = {
    isPublic: result.isPublic,
    isFavorite: result.isFavorite,
    quizData: {
      title: result.title,
      questions: result.questions,
      
    }
  };
  return NextResponse.json(data)
}