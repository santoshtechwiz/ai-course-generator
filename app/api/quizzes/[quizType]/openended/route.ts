import { NextResponse } from "next/server"

import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import { OpenEndedQuizService } from "@/app/services/openended-quiz.service"

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    const { topic: title, amount } = await req.json()
    const userId = session?.user.id

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const creditDeduction = amount > 5 ? 2 : 1

    if (session.user.credits < creditDeduction) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 403 })
    }

    const openEndedQuizService = new OpenEndedQuizService()
    const quiz = await openEndedQuizService.generateQuiz({ title, amount })

    let slug = generateSlug(title)
    let suffix = 1
    while (await prisma.userQuiz.findUnique({ where: { slug } })) {
      slug = `${generateSlug(title)}-${suffix++}`
    }    const userQuiz = await prisma.$transaction(
      async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { credits: { decrement: creditDeduction } },
        })

        const createdQuiz = await tx.userQuiz.create({
          data: {
            title,
            slug,
            userId,
            quizType: "openended",
            timeStarted: new Date(),
          },
        })

        // Create questions with proper formatting for open-ended questions
        if (quiz.questions && quiz.questions.length > 0) {
          await Promise.all(
            quiz.questions.map(async (q: any) => {
              const question = await tx.userQuizQuestion.create({
                data: {
                  userQuizId: createdQuiz.id,
                  question: q.question,
                  answer: q.answer,
                  questionType: "openended",
                },
              })

              // Create the open-ended question details
              if (q.hints || q.difficulty || q.tags) {
                await tx.openEndedQuestion.create({
                  data: {
                    questionId: question.id,
                    userQuizId: createdQuiz.id,
                    hints: Array.isArray(q.hints) ? q.hints.join("|") : (q.hints || ""),
                    difficulty: q.difficulty || "medium",
                    tags: Array.isArray(q.tags) ? q.tags.join("|") : (q.tags || ""),
                  },
                })
              }
            })
          )
        }

        return createdQuiz
      },
      {
        timeout: 60000, // 60 seconds timeout
      },
    )

    return NextResponse.json(userQuiz)
  } catch (error) {
    console.error("Error generating quiz:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
