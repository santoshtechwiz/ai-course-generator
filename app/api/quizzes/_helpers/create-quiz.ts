import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { generateUniqueSlug } from "@/lib/utils/string"
import { McqQuizService } from "@/app/services/mcq-quiz.service"
import { OpenEndedQuizService } from "@/app/services/openended-quiz.service"
import { BlanksQuizService } from "@/app/services/blanks-quiz.service"
import { CodeQuizService } from "@/app/services/code-quiz.service"
import { QuestionRepository } from "@/app/repositories/question.repository"
import { QuizRepository } from "@/app/repositories/quiz.repository"
import { UserRepository } from "@/app/repositories/user.repository"
import { generateFlashCards } from "@/lib/chatgpt/ai-service"
import { creditService, CreditOperationType } from "@/services/credit-service"
import type { QuizType } from "@/app/types/quiz-types"

const questionRepo = new QuestionRepository()
const quizRepo = new QuizRepository()
const userRepo = new UserRepository()

function makeKey(question: any, fallbackAnswer: string = ""): string {
  const q = String(question?.question || "").trim()
  const a = String(question?.answer || question?.correct_answer || fallbackAnswer || "").trim()
  return `${q}|||${a}`
}

export async function createQuizForType(req: NextRequest, quizType: string): Promise<NextResponse> {
  try {
    const session = await getAuthSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Block inactive users from performing credit-consuming actions
    if (session.user?.isActive === false) {
      return NextResponse.json({ error: "Account inactive. Reactivate to continue." }, { status: 403 })
    }

    // Parse body safely once
    let body: any
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const normalizedType = String(quizType || body.type || body.quizType || "mcq").toLowerCase() as QuizType
    const title = (body.title || body.topic || "Untitled Quiz").toString().trim()
    const amount = Number.parseInt(String(body.amount ?? body.count ?? 5), 10)
    const difficulty = (body.difficulty || "medium").toString().toLowerCase()

    if (!title || title.length < 3) {
      return NextResponse.json({ error: "Title must be at least 3 characters" }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount < 1 || amount > 50) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // SECURE: Atomic credit validation and deduction to prevent race conditions
    const creditDeduction = 1 // Standard 1 credit per quiz
    const creditResult = await creditService.executeCreditsOperation(
      userId,
      creditDeduction,
      CreditOperationType.QUIZ_CREATION,
      {
        description: `${normalizedType} quiz creation: ${title}`,
        quizType: normalizedType,
        questionAmount: amount,
        difficulty
      }
    )

    if (!creditResult.success) {
      return NextResponse.json({ 
        error: creditResult.error || "Insufficient credits" 
      }, { status: 403 })
    }

    const slug = await generateUniqueSlug(title)

    if (normalizedType === "code") {
      const language = (body.language || body.lang || "JavaScript").toString()
      const service = new CodeQuizService()
      const result = await service.generateCodeQuiz(userId, language, title, difficulty, amount)
      
      console.log(`[Quiz API] Successfully created code quiz ${result.userQuizId} for user ${userId}. Credits remaining: ${creditResult.newBalance}`)
      return NextResponse.json({ 
        success: true,
        message: "Code quiz created successfully!",
        userQuizId: result.userQuizId, 
        slug: result.slug,
        creditsRemaining: creditResult.newBalance 
      })
    }

    if (normalizedType === "mcq") {
      const service = new McqQuizService()
      const gen = await service.generateQuiz({ amount, title, difficulty, type: "mcq" })
      const questions = Array.isArray(gen?.questions) ? gen.questions : gen

      const created = await quizRepo.createUserQuiz(userId, title, "mcq", slug)
      if (Array.isArray(questions) && questions.length > 0) {
        await questionRepo.createQuestions(questions, created.id, "mcq")
      }

      // NOTE: Credits already deducted atomically above - no need to call userRepo.updateUserCredits

      console.log(`[Quiz API] Successfully created MCQ quiz ${created.id} for user ${userId}. Credits remaining: ${creditResult.newBalance}`)
      return NextResponse.json({ 
        success: true,
        message: "MCQ quiz created successfully!",
        userQuizId: created.id, 
        slug,
        creditsRemaining: creditResult.newBalance 
      })
    }

    if (normalizedType === "openended") {
      const service = new OpenEndedQuizService()
      const quiz = await service.generateQuiz({ title, amount, difficulty })
      const qList: any[] = Array.isArray((quiz as any)?.questions) ? (quiz as any).questions : []

      const created = await quizRepo.createUserQuiz(userId, title, "openended", slug)
      if (qList.length > 0) {
        await questionRepo.createQuestions(qList, created.id, "openended")
        // Map created questions back to metadata rows by (question+answer)
        const createdQs = await prisma.userQuizQuestion.findMany({
          where: { userQuizId: created.id, questionType: "openended" },
          select: { id: true, question: true, answer: true },
          orderBy: { id: "asc" },
        })
        const map = new Map<string, number[]>()
        for (const cq of createdQs) {
          const key = makeKey({ question: cq.question, answer: cq.answer })
          const arr = map.get(key) || []
          arr.push(cq.id)
          map.set(key, arr)
        }
        const metaData = qList.map((q: any) => {
          const key = makeKey(q)
          const list = map.get(key) || []
          const questionId = list.shift()
          if (questionId !== undefined) map.set(key, list)
          return {
            questionId: questionId as number,
            userQuizId: created.id,
            hints: Array.isArray(q.hints) ? q.hints.join("|") : String(q.hints || ""),
            tags: Array.isArray(q.tags) ? q.tags.join("|") : String(q.tags || ""),
            difficulty: String(q.difficulty || difficulty || "medium"),
          }
        }).filter((m) => typeof m.questionId === "number")
        if (metaData.length > 0) {
          await prisma.openEndedQuestion.createMany({ data: metaData })
        }
      }

      // NOTE: Credits already deducted atomically above - no need to call userRepo.updateUserCredits

      console.log(`[Quiz API] Successfully created openended quiz ${created.id} for user ${userId}. Credits remaining: ${creditResult.newBalance}`)
      return NextResponse.json({ 
        success: true,
        message: "Open-ended quiz created successfully!",
        userQuizId: created.id, 
        slug,
        creditsRemaining: creditResult.newBalance 
      })
    }

    if (normalizedType === "blanks") {
      const service = new BlanksQuizService()
      const quiz = await service.generateQuiz({ title, amount })
      const qList: any[] = Array.isArray((quiz as any)?.questions) ? (quiz as any).questions : []

      const created = await quizRepo.createUserQuiz(userId, title, "blanks", slug)
      if (qList.length > 0) {
        await questionRepo.createQuestions(qList, created.id, "blanks")
        // Attach hints/tags/difficulty
        const createdQs = await prisma.userQuizQuestion.findMany({
          where: { userQuizId: created.id, questionType: "blanks" },
          select: { id: true, question: true, answer: true },
          orderBy: { id: "asc" },
        })
        const map = new Map<string, number[]>()
        for (const cq of createdQs) {
          const key = makeKey({ question: cq.question, answer: cq.answer })
          const arr = map.get(key) || []
          arr.push(cq.id)
          map.set(key, arr)
        }
        const metaData = qList.map((q: any) => {
          const key = makeKey(q)
          const list = map.get(key) || []
          const questionId = list.shift()
          if (questionId !== undefined) map.set(key, list)
          return {
            questionId: questionId as number,
            userQuizId: created.id,
            hints: Array.isArray(q.hints) ? q.hints.join("|") : String(q.hints || ""),
            tags: Array.isArray(q.tags) ? q.tags.join("|") : String(q.tags || ""),
            difficulty: String(q.difficulty || difficulty || "medium"),
          }
        }).filter((m) => typeof m.questionId === "number")
        if (metaData.length > 0) {
          await prisma.openEndedQuestion.createMany({ data: metaData })
        }
      }

      // NOTE: Credits already deducted atomically above - no need to call userRepo.updateUserCredits

      console.log(`[Quiz API] Successfully created blanks quiz ${created.id} for user ${userId}. Credits remaining: ${creditResult.newBalance}`)
      return NextResponse.json({ 
        success: true,
        message: "Blanks quiz created successfully!",
        userQuizId: created.id, 
        slug,
        creditsRemaining: creditResult.newBalance 
      })
    }

    if (normalizedType === "flashcard") {
      const count = amount
      const cards = await generateFlashCards(title, count)

      console.log(`[Quiz API] Generated ${cards?.length || 0} flashcards for "${title}"`)

      const created = await quizRepo.createUserQuiz(userId, title, "flashcard", slug)
      console.log(`[Quiz API] Created UserQuiz with ID ${created.id}`)

      if (Array.isArray(cards) && cards.length > 0) {
        const flashcardData = cards.map((c: any) => ({
          question: String(c.question),
          answer: String(c.answer),
          userId,
          userQuizId: created.id,
          slug,
        }))

        console.log(`[Quiz API] Creating ${flashcardData.length} flashcards in database`)

        const result = await prisma.flashCard.createMany({
          data: flashcardData,
        })

        console.log(`[Quiz API] Created ${result.count} flashcards in database`)
      } else {
        console.warn(`[Quiz API] No valid flashcards to create for quiz ${created.id}`)
      }

      // NOTE: Credits already deducted atomically above - no need to call userRepo.updateUserCredits

      console.log(`[Quiz API] Successfully created flashcard quiz ${created.id} for user ${userId}. Credits remaining: ${creditResult.newBalance}`)
      return NextResponse.json({ 
        success: true,
        message: "Flashcards created successfully!",
        userQuizId: created.id, 
        slug,
        creditsRemaining: creditResult.newBalance 
      })
    }

    return NextResponse.json({ error: `Unsupported quiz type: ${normalizedType}` }, { status: 400 })
  } catch (error: any) {
    console.error("Error creating quiz:", error)
    return NextResponse.json({ error: error?.message || "Failed to create quiz" }, { status: 500 })
  }
}