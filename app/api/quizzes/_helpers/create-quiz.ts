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

const questionRepo = new QuestionRepository()
const quizRepo = new QuizRepository()
const userRepo = new UserRepository()

export async function createQuizForType(req: NextRequest, quizType: string): Promise<NextResponse> {
  try {
    const session = await getAuthSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Parse body safely (support both text and json)
    let body: any = null
    try {
      const text = await req.text()
      body = text ? JSON.parse(text) : {}
    } catch {
      body = await req.json().catch(() => ({}))
    }

    const normalizedType = String(quizType || body.type || body.quizType || "mcq").toLowerCase()
    const title = (body.title || body.topic || "Untitled Quiz").toString().trim()
    const amount = Number.parseInt(String(body.amount ?? body.count ?? 5), 10)
    const difficulty = (body.difficulty || "medium").toString().toLowerCase()

    if (!title || title.length < 3) {
      return NextResponse.json({ error: "Title must be at least 3 characters" }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount < 1 || amount > 50) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Ensure user has credits before generation (avoid wasted calls)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } })
    if (!user || user.credits <= 0) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 403 })
    }

    // Prepare common values
    const slug = await generateUniqueSlug(title)
    const now = new Date()

    // Type-specific handlers
    if (normalizedType === "code") {
      // Delegate to the existing code service which manages DB and credits
      const language = (body.language || body.lang || "JavaScript").toString()
      const service = new CodeQuizService()
      const result = await service.generateCodeQuiz(userId, language, title, difficulty, amount)
      return NextResponse.json({ userQuizId: result.userQuizId, slug: result.slug })
    }

    if (normalizedType === "mcq") {
      const service = new McqQuizService()
      const gen = await service.generateQuiz({ amount, title, difficulty, type: "mcq" })
      const questions = Array.isArray(gen?.questions) ? gen.questions : gen

      // Create quiz + questions, then decrement credits and update topic count
      const created = await prisma.$transaction(async (tx) => {
        const userQuiz = await tx.userQuiz.create({
          data: {
            userId,
            title,
            quizType: "mcq",
            difficulty,
            slug,
            isPublic: false,
            timeStarted: now,
          },
        })

        if (Array.isArray(questions) && questions.length > 0) {
          await questionRepo.createQuestions(questions, userQuiz.id, "mcq")
        }

        return userQuiz
      })

      // Post-creation updates
      await Promise.all([
        quizRepo.updateTopicCount(title),
        userRepo.updateUserCredits(userId, "mcq"),
      ])

      return NextResponse.json({ userQuizId: created.id, slug })
    }

    if (normalizedType === "openended") {
      const service = new OpenEndedQuizService()
      const quiz = await service.generateQuiz({ title, amount, difficulty })
      const qList: any[] = Array.isArray((quiz as any)?.questions) ? (quiz as any).questions : []

      const created = await prisma.$transaction(async (tx) => {
        const userQuiz = await tx.userQuiz.create({
          data: {
            userId,
            title,
            quizType: "openended",
            difficulty,
            slug,
            isPublic: false,
            timeStarted: now,
          },
        })

        // Store questions with open-ended details
        for (const q of qList) {
          const questionText = q.question || ""
          const answerText = q.answer || q.correct_answer || ""
          const createdQ = await tx.userQuizQuestion.create({
            data: {
              userQuizId: userQuiz.id,
              question: String(questionText),
              answer: String(answerText),
              questionType: "openended",
            },
          })

          const hints = Array.isArray(q.hints) ? q.hints.join("|") : (q.hints || "")
          const tags = Array.isArray(q.tags) ? q.tags.join("|") : (q.tags || "")
          const qDifficulty = (q.difficulty || difficulty || "medium").toString()

          await tx.openEndedQuestion.create({
            data: {
              questionId: createdQ.id,
              userQuizId: userQuiz.id,
              hints: String(hints),
              tags: String(tags),
              difficulty: String(qDifficulty),
            },
          })
        }

        return userQuiz
      })

      await Promise.all([
        quizRepo.updateTopicCount(title),
        userRepo.updateUserCredits(userId, "openended"),
      ])

      return NextResponse.json({ userQuizId: created.id, slug })
    }

    if (normalizedType === "blanks") {
      const service = new BlanksQuizService()
      const quiz = await service.generateQuiz({ title, amount })
      const qList: any[] = Array.isArray((quiz as any)?.questions) ? (quiz as any).questions : []

      const created = await prisma.$transaction(async (tx) => {
        const userQuiz = await tx.userQuiz.create({
          data: {
            userId,
            title,
            quizType: "blanks",
            slug,
            isPublic: false,
            timeStarted: now,
          },
        })

        // Store blanks questions and open-ended details (hints/tags/difficulty)
        for (const q of qList) {
          const questionText = q.question || ""
          const answerText = q.answer || q.correct_answer || ""
          const createdQ = await tx.userQuizQuestion.create({
            data: {
              userQuizId: userQuiz.id,
              question: String(questionText),
              answer: String(answerText),
              questionType: "blanks",
            },
          })

          const hints = Array.isArray(q.hints) ? q.hints.join("|") : (q.hints || "")
          const tags = Array.isArray(q.tags) ? q.tags.join("|") : (q.tags || "")
          const qDifficulty = (q.difficulty || difficulty || "medium").toString()

          await tx.openEndedQuestion.create({
            data: {
              questionId: createdQ.id,
              userQuizId: userQuiz.id,
              hints: String(hints),
              tags: String(tags),
              difficulty: String(qDifficulty),
            },
          })
        }

        return userQuiz
      })

      await Promise.all([
        quizRepo.updateTopicCount(title),
        userRepo.updateUserCredits(userId, "blanks"),
      ])

      return NextResponse.json({ userQuizId: created.id, slug })
    }

    if (normalizedType === "flashcard") {
      const count = amount
      const cards = await generateFlashCards(title, count)

      const created = await prisma.$transaction(async (tx) => {
        const userQuiz = await tx.userQuiz.create({
          data: {
            userId,
            title,
            quizType: "flashcard",
            slug,
            isPublic: false,
            timeStarted: now,
          },
        })

        if (Array.isArray(cards) && cards.length > 0) {
          await tx.flashCard.createMany({
            data: cards.map((c: any) => ({
              question: String(c.question),
              answer: String(c.answer),
              userId,
              userQuizId: userQuiz.id,
            })),
          })
        }

        return userQuiz
      })

      await Promise.all([
        quizRepo.updateTopicCount(title),
        userRepo.updateUserCredits(userId, "flashcard"),
      ])

      return NextResponse.json({ userQuizId: created.id, slug })
    }

    return NextResponse.json({ error: `Unsupported quiz type: ${normalizedType}` }, { status: 400 })
  } catch (error: any) {
    console.error("Error creating quiz:", error)
    return NextResponse.json({ error: error?.message || "Failed to create quiz" }, { status: 500 })
  }
}