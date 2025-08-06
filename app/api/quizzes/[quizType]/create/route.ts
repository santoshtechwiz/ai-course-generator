import { getAuthSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { CodeQuizService } from "@/app/services/code-quiz.service"
import { McqQuizService } from "@/app/services/mcq-quiz.service"
import { OpenEndedQuizService } from "@/app/services/openended-quiz.service"
import { BlanksQuizService } from "@/app/services/blanks-quiz.service"
import { generateFlashCards } from "@/lib/chatgpt/ai-service"
import { generateUniqueSlug } from "@/lib/utils/string"
import { generateSlug } from "@/lib/utils"
import prisma from "@/lib/db"
import { z } from "zod"

// Input validation schema for different quiz types
const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.number().int().positive().optional().default(5),
  difficulty: z.string().optional().default("medium"),
  language: z.string().optional(), // For code quizzes
  count: z.number().int().positive().optional(), // For flashcards (alias for amount)
  topic: z.string().optional(), // For some quiz types that use 'topic' instead of 'title'
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizType: string }> }
) {
  try {
    // Extract parameters
    const { quizType } = await params
    
    // Parse and validate input
    const body = await req.json()
    const validatedData = createQuizSchema.parse(body)
    
    // Get user session
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "You must be logged in to create a quiz." }, { status: 401 })
    }

    // Extract common parameters - support both 'title' and 'topic'
    const { title, amount, difficulty, language, count, topic } = validatedData
    const finalTitle = topic || title // Some endpoints use 'topic' instead of 'title'
    const finalAmount = count || amount // Support both 'amount' and 'count' for flashcards

    let result

    switch (quizType) {
      case "code": {
        if (!language) {
          return NextResponse.json({ error: "Language is required for code quizzes" }, { status: 400 })
        }
        const codeQuizService = new CodeQuizService()
        const codeResult = await codeQuizService.generateCodeQuiz(
          session.user.id,
          language,
          finalTitle,
          difficulty,
          finalAmount
        )
        result = { success: true, quizId: codeResult.userQuizId, ...codeResult }
        break
      }

      case "mcq": {
        // Check credits first
        const creditDeduction = finalAmount > 5 ? 2 : 1
        if (session.user.credits < creditDeduction) {
          return NextResponse.json({ error: "Insufficient credits" }, { status: 403 })
        }

        // Generate quiz using service
        const mcqQuizService = new McqQuizService()
        const quiz = await mcqQuizService.generateQuiz({ amount: finalAmount, title: finalTitle, difficulty })

        // Generate unique slug
        let slug = generateSlug(finalTitle)
        let suffix = 1
        while (await prisma.userQuiz.findUnique({ where: { slug } })) {
          slug = `${generateSlug(finalTitle)}-${suffix++}`
        }

        // Create quiz in database with transaction
        const userQuiz = await prisma.$transaction(async (tx) => {
          // Deduct credits
          await tx.user.update({
            where: { id: session.user.id },
            data: { credits: { decrement: creditDeduction } },
          })

          // Create the quiz
          const createdQuiz = await tx.userQuiz.create({
            data: {
              title: finalTitle,
              slug,
              userId: session.user.id,
              quizType: "mcq",
              timeStarted: new Date(),
            },
          })

          // Create questions
          if (quiz.questions && quiz.questions.length > 0) {
            await Promise.all(
              quiz.questions.map(async (q: any) => {
                await tx.userQuizQuestion.create({
                  data: {
                    userQuizId: createdQuiz.id,
                    question: q.question,
                    answer: q.answer,
                    options: JSON.stringify(q.options || []),
                    questionType: "mcq",
                  },
                })
              })
            )
          }

          return createdQuiz
        }, { timeout: 60000 })

        result = { success: true, userQuizId: userQuiz.id, quizId: userQuiz.id, slug: userQuiz.slug }
        break
      }

      case "openended": {
        // Check credits first
        const creditDeduction = finalAmount > 5 ? 2 : 1
        if (session.user.credits < creditDeduction) {
          return NextResponse.json({ error: "Insufficient credits" }, { status: 403 })
        }

        // Generate quiz using service
        const openEndedQuizService = new OpenEndedQuizService()
        const quiz = await openEndedQuizService.generateQuiz({ title: finalTitle, amount: finalAmount, difficulty })

        // Generate unique slug
        let slug = generateSlug(finalTitle)
        let suffix = 1
        while (await prisma.userQuiz.findUnique({ where: { slug } })) {
          slug = `${generateSlug(finalTitle)}-${suffix++}`
        }

        // Create quiz in database with transaction
        const userQuiz = await prisma.$transaction(async (tx) => {
          // Deduct credits
          await tx.user.update({
            where: { id: session.user.id },
            data: { credits: { decrement: creditDeduction } },
          })

          // Create the quiz
          const createdQuiz = await tx.userQuiz.create({
            data: {
              title: finalTitle,
              slug,
              userId: session.user.id,
              quizType: "openended",
              timeStarted: new Date(),
            },
          })

          // Create questions with open-ended details
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
        }, { timeout: 60000 })

        result = { success: true, userQuizId: userQuiz.id, quizId: userQuiz.id, slug: userQuiz.slug }
        break
      }

      case "blanks": {
        // Check credits first
        const creditDeduction = finalAmount > 5 ? 2 : 1
        if (session.user.credits < creditDeduction) {
          return NextResponse.json({ error: "Insufficient credits" }, { status: 403 })
        }

        // Generate quiz using service
        const blanksQuizService = new BlanksQuizService()
        const quiz = await blanksQuizService.generateQuiz({ title: finalTitle, amount: finalAmount })

        // Generate unique slug
        let slug = generateSlug(finalTitle)
        let suffix = 1
        while (await prisma.userQuiz.findUnique({ where: { slug } })) {
          slug = `${generateSlug(finalTitle)}-${suffix++}`
        }

        // Create quiz in database with transaction
        const userQuiz = await prisma.$transaction(async (tx) => {
          // Deduct credits
          await tx.user.update({
            where: { id: session.user.id },
            data: { credits: { decrement: creditDeduction } },
          })

          // Create the quiz
          const createdQuiz = await tx.userQuiz.create({
            data: {
              userId: session.user.id,
              title: finalTitle,
              timeStarted: new Date(),
              quizType: "blanks",
              slug: slug,
            },
          })

          // Create questions with blanks details
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
        }, { timeout: 15000 })

        result = { success: true, userQuizId: userQuiz.id, quizId: userQuiz.id, slug: userQuiz.slug }
        break
      }

      case "flashcard": {
        // Check user credits for flashcards
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, credits: true },
        })

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        if (user.credits < 1) {
          return NextResponse.json(
            { error: "Insufficient credits. You need at least 1 credit to generate flashcards" },
            { status: 403 }
          )
        }

        // Generate unique slug for flashcards
        const slug = await generateUniqueSlug(finalTitle)

        // Generate flashcards using AI
        const flashcards = await generateFlashCards(finalTitle, finalAmount)
        
        if (!flashcards || flashcards.length === 0) {
          return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 })
        }

        // Create flashcard quiz with transaction
        result = await prisma.$transaction(
          async (tx) => {
            // Create new quiz
            const newQuiz = await tx.userQuiz.create({
              data: {
                title: finalTitle,
                quizType: "flashcard",
                slug,
                timeStarted: new Date(),
                userId: session.user.id,
              },
            })

            // Create flashcards
            await tx.flashCard.createMany({
              data: flashcards.map((flashcard: any) => ({
                question: flashcard.question,
                answer: flashcard.answer,
                userId: session.user.id,
                difficulty: "hard",
                userQuizId: newQuiz.id,
                slug: newQuiz.slug, // Use the quiz slug for each flashcard
              })),
            })

            // Deduct one credit
            await tx.user.update({
              where: { id: session.user.id },
              data: { credits: { decrement: 1 }, creditsUsed: { increment: 1 } },
            })

            return {
              success: true,
              userQuizId: newQuiz.id,
              quizId: newQuiz.id,
              slug: newQuiz.slug,
              message: "Flashcards created successfully. 1 credit has been deducted.",
            }
          },
          {
            maxWait: 5000,
            timeout: 15000,
          }
        )
        break
      }

      default:
        return NextResponse.json(
          { error: `Unsupported quiz type: ${quizType}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error(`Error creating ${(await params).quizType} quiz:`, error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.format() },
        { status: 400 }
      )
    }

    // Handle known error messages
    if (error instanceof Error) {
      if (error.message.includes("Insufficient credits")) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes("User not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    )
  }
}
