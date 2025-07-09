import { NextResponse } from "next/server"

import { prisma } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import { BlanksQuizService } from "@/app/services/blanks-quiz.service"
import { getAuthSession } from "@/lib/auth"

interface OpenEndedFillInTheBlanksQuestion {
  question: string
  correct_answer: string
  hints: string[]
  difficulty: string
  tags: string[]
}
export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    const { title, amount, topic, difficulty } = await req.json()
    const userId = session?.user.id

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }
    const creditDeduction = amount > 5 ? 2 : 1

    if (session.user.credits < creditDeduction) {
      return { error: "Insufficient credits", status: 403 }
    }    // Move quiz and slug generation outside the transaction
    const blanksQuizService = new BlanksQuizService()
    const quiz = await blanksQuizService.generateQuiz({ title: topic, amount })
    let baseSlug = generateSlug(topic)
    let slug = baseSlug
    let suffix = 2

    // Ensure unique slug
    while (await prisma.userQuiz.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }    const userQuiz = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: creditDeduction } },
      })

      // Create the quiz first
      const createdQuiz = await tx.userQuiz.create({
        data: {
          userId,
          title,
          timeStarted: new Date(),
          quizType: "blanks",
          slug: slug,
        },
      })

      // Create questions with proper formatting for blanks questions
      if (quiz.questions && quiz.questions.length > 0) {
        await Promise.all(
          quiz.questions.map(async (q: any) => {
            const question = await tx.userQuizQuestion.create({
              data: {
                userQuizId: createdQuiz.id,
                question: q.question,
                answer: q.correct_answer || q.answer,
                questionType: "blanks",
              },
            })

            // Create the open-ended question details for blanks
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
    }, { timeout: 15000 }) // Increased transaction timeout to 15 seconds

    return NextResponse.json({ quizId: userQuiz.id, slug: userQuiz.slug })
  } catch (error) {
    console.error("Error generating quiz:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
