import { NextResponse } from "next/server"

import { prisma } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import { BlanksQuizService } from "@/app/services/blanks-quiz.service"
import { getAuthSession } from "@/lib/auth"
import { creditService, CreditOperationType } from "@/services/credit-service"

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
    const { title, amount, difficulty } = await req.json()
    const userId = session?.user.id

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    // Block inactive users from performing credit-consuming actions
    if (session.user?.isActive === false) {
      return NextResponse.json({ error: "Account inactive. Reactivate to continue." }, { status: 403 })
    }
    
    const creditDeduction = amount > 5 ? 2 : 1

    // SECURE: Atomic credit validation and deduction to prevent race conditions
    const creditResult = await creditService.executeCreditsOperation(
      userId,
      creditDeduction,
      CreditOperationType.QUIZ_CREATION,
      {
        description: `Blanks quiz creation: ${title}`,
        quizType: 'blanks',
        questionAmount: amount,
        difficulty
      }
    )

    if (!creditResult.success) {
      return NextResponse.json({ 
        error: creditResult.error || "Insufficient credits" 
      }, { status: 403 })
    }

    // Move quiz and slug generation outside the main transaction
    const blanksQuizService = new BlanksQuizService()
    const quiz = await blanksQuizService.generateQuiz({ 
      title, 
      amount,
      userId,
      userType: session.user?.userType || 'FREE',
      difficulty
    })
    let baseSlug = generateSlug(title)
    let slug = baseSlug
    let suffix = 2

    // Ensure unique slug
    while (await prisma.userQuiz.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    const userQuiz = await prisma.$transaction(async (tx) => {
      // NOTE: Credits already deducted atomically above - no need to deduct again

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

    console.log(`[BlankQuiz API] Successfully created quiz ${userQuiz.id} for user ${userId}. Credits remaining: ${creditResult.newBalance}`)

    return NextResponse.json({ 
      quizId: userQuiz.id, 
      slug: userQuiz.slug,
      creditsRemaining: creditResult.newBalance 
    })
  } catch (error) {
    console.error("Error generating quiz:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
