import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import { MCQQuizService } from "@/app/services/mcq-quiz.service"
import { getAuthSession } from "@/lib/auth"

interface MCQQuestion {
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
  difficulty: string
  tags: string[]
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    const { title, amount, difficulty } = await req.json()
    const userId = session?.user.id

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    // Credit deduction logic
    const creditDeduction = amount > 5 ? 2 : 1

    if (session.user.credits < creditDeduction) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 403 })
    }

    // Generate quiz using the MCQ service
    const mcqQuizService = new MCQQuizService()
    const quiz = await mcqQuizService.generateQuiz({ 
      title, 
      amount, 
      difficulty: difficulty || "medium" 
    })

    // Generate unique slug
    let baseSlug = generateSlug(title)
    let slug = baseSlug
    let suffix = 2

    while (await prisma.userQuiz.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    const userQuiz = await prisma.$transaction(async (tx) => {
      // Deduct credits
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: creditDeduction } },
      })

      // Create the quiz
      const createdQuiz = await tx.userQuiz.create({
        data: {
          userId,
          title,
          timeStarted: new Date(),
          quizType: "mcq",
          slug: slug,
        },
      })

      // Create questions with options
      if (quiz.questions && quiz.questions.length > 0) {
        await Promise.all(
          quiz.questions.map(async (q: MCQQuestion) => {
            const question = await tx.userQuizQuestion.create({
              data: {
                userQuizId: createdQuiz.id,
                question: q.question,
                answer: q.correctAnswer,
                questionType: "mcq",
              },
            })

            // Store MCQ options in the existing options field
            if (q.options && Array.isArray(q.options)) {
              await tx.userQuizQuestion.update({
                where: { id: question.id },
                data: {
                  options: q.options.join("|"),
                },
              })
            }
          })
        )
      }

      return createdQuiz
    }, { timeout: 15000 })

    return NextResponse.json({ 
      userQuizId: userQuiz.id, 
      slug: userQuiz.slug,
      message: "Quiz created successfully" 
    })
  } catch (error) {
    console.error("Error generating MCQ quiz:", error)
    return NextResponse.json({ 
      error: "Failed to generate quiz",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}