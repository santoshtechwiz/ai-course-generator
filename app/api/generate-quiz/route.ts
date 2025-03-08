import { NextResponse } from "next/server"

import { getAuthSession } from "@/lib/authOptions"
import { prisma } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import { generateOpenEndedQuiz } from "@/lib/chatgpt/userMcqQuiz"

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    const { topic: title, questionCount } = await req.json()
    const userId = session?.user.id

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }
    const creditDeduction = questionCount > 5 ? 2 : 1

    if (session.user.credits < creditDeduction) {
      return { error: "Insufficient credits", status: 403 }
    }

    const quiz = await generateOpenEndedQuiz(title, questionCount)
    const slug = generateSlug(title)

    // Increased transaction timeout to 60 seconds (60000ms)
    const userQuiz = await prisma.$transaction(
      async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { credits: { decrement: creditDeduction } },
        })

        return await tx.userQuiz.create({
          data: {
            userId,
            title: title,
            timeStarted: new Date(),
            quizType: "openended",
            slug: slug,
            questions: {
              create: quiz.questions.map(
                (q: {
                  question: string
                  correct_answer: string
                  hints: string[]
                  difficulty: string
                  tags: string[]
                }) => ({
                  question: q.question,
                  answer: q.correct_answer,
                  questionType: "openended",
                  openEndedQuestion: {
                    create: {
                      hints: q.hints.join("|"),
                      difficulty: q.difficulty,
                      tags: q.tags.join("|"),
                    },
                  },
                }),
              ),
            },
          },
          include: {
            questions: {
              include: {
                openEndedQuestion: true,
              },
            },
          },
        })
      },
      {
        timeout: 60000, // 60 seconds timeout
      },
    )

    return NextResponse.json({ quizId: userQuiz.id, slug: userQuiz.slug })
  } catch (error) {
    console.error("Error generating quiz:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}

