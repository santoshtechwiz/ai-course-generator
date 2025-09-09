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

    // Credits are already validated by subscription validation above

    const slug = await generateUniqueSlug(title)

    if (normalizedType === "code") {
      const language = (body.language || body.lang || "JavaScript").toString()
      const service = new CodeQuizService()
      const result = await service.generateCodeQuiz(userId, language, title, difficulty, amount)
      return NextResponse.json({ userQuizId: result.userQuizId, slug: result.slug })
    }

    if (normalizedType === "mcq") {
      const service = new McqQuizService()
      const gen = await service.generateQuiz({ amount, title, difficulty, type: "mcq" })
      const questions = Array.isArray(gen?.questions) ? gen.questions : gen

      const created = await quizRepo.createUserQuiz(userId, title, "mcq", slug)
      if (Array.isArray(questions) && questions.length > 0) {
        await questionRepo.createQuestions(questions, created.id, "mcq")
      }

      await Promise.all([
        userRepo.updateUserCredits(userId, "mcq"),
      ])

      console.log("MCQ Quiz created successfully:", { userQuizId: created.id, slug })
      return NextResponse.json({ userQuizId: created.id, slug })
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

      await Promise.all([
          userRepo.updateUserCredits(userId, "openended"),
      ])

      return NextResponse.json({ userQuizId: created.id, slug })
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

      await Promise.all([
       
        userRepo.updateUserCredits(userId, "blanks"),
      ])

      return NextResponse.json({ userQuizId: created.id, slug })
    }

    if (normalizedType === "flashcard") {
      const count = amount
      const cards = await generateFlashCards(title, count)

      const created = await quizRepo.createUserQuiz(userId, title, "flashcard", slug)
      if (Array.isArray(cards) && cards.length > 0) {
        await prisma.flashCard.createMany({
          data: cards.map((c: any) => ({
            question: String(c.question),
            answer: String(c.answer),
            userId,
            userQuizId: created.id,
          })),
        })
      }

      await Promise.all([
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