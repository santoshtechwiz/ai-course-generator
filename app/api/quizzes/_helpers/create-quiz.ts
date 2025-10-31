import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { generateUniqueSlug } from "@/lib/utils/string"
import { CodeQuizService } from "@/app/services/code-quiz.service"
import { QuestionRepository } from "@/app/repositories/question.repository"
import { QuizRepository } from "@/app/repositories/quiz.repository"
import { AIContextProvider, AIServiceFactoryV2 } from "@/lib/ai/infrastructure"
import type { QuizType } from "@/app/types/quiz-types"

const questionRepo = new QuestionRepository()
const quizRepo = new QuizRepository()

function makeKey(question: any, fallbackAnswer: string = ""): string {
  const q = String(question?.question || "").trim()
  const a = String(question?.answer || question?.correct_answer || fallbackAnswer || "").trim()
  return `${q}|||${a}`
}

export async function createQuizForType(req: NextRequest, quizType: string): Promise<NextResponse> {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
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

    // Create unified AI context - this handles all validation, subscription, and credit checks
    const contextProvider = new AIContextProvider()
    const context = await contextProvider.createContext(session, req)

    // Validate that the user can create this type of quiz
    const capabilityCheck = AIServiceFactoryV2.validateServiceCapability(context, `generate${normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1)}Quiz`)
    if (!capabilityCheck.supported) {
      return NextResponse.json({
        error: capabilityCheck.reason || "Feature not available for your plan"
      }, { status: 403 })
    }

    const slug = await generateUniqueSlug(title)

    if (normalizedType === "code") {
      const language = (body.language || body.lang || "JavaScript").toString()

      // Create AI service with unified context
      const aiService = AIServiceFactoryV2.createService(context)

      // Generate code quiz using new architecture (premium feature)
      const result = await (aiService as any).generateCodeQuiz({
        topic: title,
        language,
        numberOfQuestions: amount,
        difficulty: difficulty as 'easy' | 'medium' | 'hard'
      })

      if (!result.success) {
        return NextResponse.json({
          error: result.error || "Failed to generate code quiz"
        }, { status: 500 })
      }

      const service = new CodeQuizService()
      const quizResult = await service.generateCodeQuiz(context.userId, language, title, difficulty, amount)

      console.log(`[Quiz API] Successfully created code quiz ${quizResult.userQuizId} for user ${context.userId}. Credits remaining: ${context.subscription.credits.available}`)
      return NextResponse.json({
        success: true,
        message: "Code quiz created successfully!",
        userQuizId: quizResult.userQuizId,
        slug: quizResult.slug,
        creditsRemaining: context.subscription.credits.available
      })
    }

    if (normalizedType === "mcq") {
      // Create AI service with unified context
      const aiService = AIServiceFactoryV2.createService(context)

      // Generate MCQ quiz using new architecture
      const result = await aiService.generateMultipleChoiceQuiz({
        topic: title,
        numberOfQuestions: amount,
        difficulty: difficulty as 'easy' | 'medium' | 'hard'
      })

      if (!result.success) {
        return NextResponse.json({
          error: result.error || "Failed to generate MCQ quiz"
        }, { status: 500 })
      }

      const questions = Array.isArray(result.data) ? result.data : []

      const created = await quizRepo.createUserQuiz(context.userId, title, "mcq", slug)
      if (Array.isArray(questions) && questions.length > 0) {
        await questionRepo.createQuestions(questions, created.id, "mcq")
      }

      console.log(`[Quiz API] Successfully created MCQ quiz ${created.id} for user ${context.userId}. Credits remaining: ${context.subscription.credits.available}`)
      return NextResponse.json({
        success: true,
        message: "MCQ quiz created successfully!",
        userQuizId: created.id,
        slug,
        creditsRemaining: context.subscription.credits.available
      })
    }

    if (normalizedType === "openended") {
      // Create AI service with unified context
      const aiService = AIServiceFactoryV2.createService(context)

      // Generate open-ended quiz using new architecture (premium feature)
      const result = await (aiService as any).generateOpenEndedQuestionsQuiz({
        topic: title,
        numberOfQuestions: amount,
        difficulty: difficulty as 'easy' | 'medium' | 'hard'
      })

      if (!result.success) {
        return NextResponse.json({
          error: result.error || "Failed to generate open-ended quiz"
        }, { status: 500 })
      }

      const qList: any[] = Array.isArray(result.data) ? result.data : []

      const created = await quizRepo.createUserQuiz(context.userId, title, "openended", slug)
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

      console.log(`[Quiz API] Successfully created openended quiz ${created.id} for user ${context.userId}. Credits remaining: ${context.subscription.credits.available}`)
      return NextResponse.json({
        success: true,
        message: "Open-ended quiz created successfully!",
        userQuizId: created.id,
        slug,
        creditsRemaining: context.subscription.credits.available
      })
    }

    if (normalizedType === "blanks") {
      // Create AI service with unified context
      const aiService = AIServiceFactoryV2.createService(context)

      // Generate blanks quiz using new architecture
      const result = await aiService.generateFillInTheBlanksQuiz({
        topic: title,
        numberOfQuestions: amount,
        difficulty: difficulty as 'easy' | 'medium' | 'hard'
      })

      if (!result.success) {
        return NextResponse.json({
          error: result.error || "Failed to generate blanks quiz"
        }, { status: 500 })
      }

      const qList: any[] = Array.isArray(result.data) ? result.data : []

      const created = await quizRepo.createUserQuiz(context.userId, title, "blanks", slug)
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

      console.log(`[Quiz API] Successfully created blanks quiz ${created.id} for user ${context.userId}. Credits remaining: ${context.subscription.credits.available}`)
      return NextResponse.json({
        success: true,
        message: "Blanks quiz created successfully!",
        userQuizId: created.id,
        slug,
        creditsRemaining: context.subscription.credits.available
      })
    }

    if (normalizedType === "flashcard") {
      const count = amount

      // Create AI service with unified context
      const aiService = AIServiceFactoryV2.createService(context)

      // Generate flashcards using new architecture
      const result = await aiService.generateFlashcards({
        topic: title,
        count: count
      })

      if (!result.success) {
        return NextResponse.json({
          error: result.error || "Failed to generate flashcards"
        }, { status: 500 })
      }

      const cards = result.data.map((card: any, index: number) => ({
        id: index + 1,
        question: card.question,
        answer: card.answer,
      }));

      console.log(`[Quiz API] Generated ${cards?.length || 0} flashcards for "${title}"`)

      const created = await quizRepo.createUserQuiz(context.userId, title, "flashcard", slug)
      console.log(`[Quiz API] Created UserQuiz with ID ${created.id}`)

      if (Array.isArray(cards) && cards.length > 0) {
        const flashcardData = cards.map((c: any) => ({
          question: String(c.question),
          answer: String(c.answer),
          userId: context.userId,
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

      console.log(`[Quiz API] Successfully created flashcard quiz ${created.id} for user ${context.userId}. Credits remaining: ${context.subscription.credits.available}`)
      return NextResponse.json({
        success: true,
        message: "Flashcards created successfully!",
        userQuizId: created.id,
        slug,
        creditsRemaining: context.subscription.credits.available
      })
    }

    return NextResponse.json({ error: `Unsupported quiz type: ${normalizedType}` }, { status: 400 })
  } catch (error: any) {
    console.error("Error creating quiz:", error)
    return NextResponse.json({ error: error?.message || "Failed to create quiz" }, { status: 500 })
  }
}