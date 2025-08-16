import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import NodeCache from "node-cache"
import type { NextRequest } from "next/server"
import { QuizListService } from "@/app/services/quiz-list.service"
import { getAuthSession } from "@/lib/auth"
import { QuizServiceFactory } from "@/app/services/quiz-service-factory"
import { titleSubTopicToSlug } from "@/lib/slug"

// Define response types for better type safety
interface QuizListItem {
  id: number
  title: string
  quizType: string
  isPublic: boolean
  timeStarted: Date
  slug: string
  questionCount: number
  isFavorite?: boolean
}

interface ErrorResponse {
  error: string
}

// Create a cache for quizzes with 15 minute TTL
const quizzesCache = new NodeCache({
  stdTTL: 900, // 15 minutes
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Disable cloning for better performance
})

/**
 * Unified entry point for all quiz operations
 * - GET returns a list of quizzes with optional type, search, limit filters
 * - POST creates a new quiz based on the type field in the request body
 */
export async function GET(req: NextRequest): Promise<NextResponse<QuizListItem[] | ErrorResponse>> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const quizType = searchParams.get("type") || undefined
    const search = searchParams.get("search") || undefined
    const slug = searchParams.get("slug") || undefined
    const favorites = searchParams.get("favorites") === "true"

    // If there's a slug parameter, redirect to the specific quiz endpoint
    if (slug) {
      // Determine the quiz type from the slug if not provided
      let type = quizType
      if (!type) {
        const quiz = await prisma.userQuiz.findUnique({
          where: { slug },
          select: { quizType: true }
        })
        type = quiz?.quizType || "mcq" // Default to mcq if not found
      }

      return NextResponse.redirect(
        new URL(`/api/quizzes/${type}/${slug}`, req.url)
      )
    }

    // Get the user session for authorization if needed
    const session = await getAuthSession()
    const userId = session?.user?.id || ""

    // Use the service to get the quiz list
    const quizListService = new QuizListService()
    const quizzes = await quizListService.listQuizzes({
      limit,
      quizType,
      search,
      userId,
      favoritesOnly: favorites,
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error("Error fetching quizzes:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * Create a new quiz based on the quiz type
 * Unified create handler to support mcq, code, blanks, openended
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the user session for authorization
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userId = session.user.id

    // Get the request body
    const body = await req.json()
    const quizType = (body.type || body.quizType || "").toString()

    if (!quizType) {
      return NextResponse.json({ error: "Quiz type is required" }, { status: 400 })
    }

    // Dispatch by quiz type
    switch (quizType) {
      case "mcq": {
        const { title, amount, difficulty = "medium" } = body
        if (!title || !amount) return NextResponse.json({ error: "Missing title or amount" }, { status: 400 })

        // Use MCQ generator to get questions
        const service = QuizServiceFactory.getQuizService("mcq") as any
        const { questions } = await service.generateQuiz({ amount, title, difficulty, type: "mcq" })

        // Create quiz and questions
        const slug = titleSubTopicToSlug("", title)
        const created = await prisma.userQuiz.create({
          data: { userId, title, quizType: "mcq", slug, timeStarted: new Date() },
        })

        // Persist questions (supports array options)
        if (Array.isArray(questions) && questions.length > 0) {
          await prisma.userQuizQuestion.createMany({
            data: questions.map((q: any) => ({
              userQuizId: created.id,
              question: q.question || q.text || "",
              // Accept array or string; store array JSON if array
              options: Array.isArray(q.options) ? JSON.stringify(q.options) : (typeof q.options === "string" ? q.options : JSON.stringify([])),
              answer: (q.correctAnswer ?? q.answer ?? "").toString(),
              questionType: "mcq",
            })),
          })
        }

        return NextResponse.json({ userQuizId: created.id, slug: created.slug })
      }
      case "code": {
        const { title, amount, difficulty = "easy", language = "JavaScript" } = body
        if (!title || !amount || !language) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

        // Use CodeQuizService which handles credit updates and persistence
        const service = QuizServiceFactory.getQuizService("code") as any
        const result = await service.generateCodeQuiz(userId, language, title, difficulty, amount)
        return NextResponse.json(result)
      }
      case "blanks": {
        const { title, amount, topic, difficulty = "easy" } = body
        if (!title || !amount || !topic) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

        // Reuse the existing blanks route logic inline
        // Generate quiz using service and persist with unique slug
        const { BlanksQuizService } = await import("@/app/services/blanks-quiz.service")
        const { generateSlug } = await import("@/lib/utils")
        const blanksQuizService = new BlanksQuizService()
        const quiz = await blanksQuizService.generateQuiz({ title: topic, amount })

        let baseSlug = generateSlug(topic)
        let slug = baseSlug
        let suffix = 2
        while (await prisma.userQuiz.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${suffix++}`
        }

        const createdQuiz = await prisma.userQuiz.create({
          data: { userId, title, timeStarted: new Date(), quizType: "blanks", slug },
        })

        if (quiz.questions && quiz.questions.length > 0) {
          await prisma.userQuizQuestion.createMany({
            data: quiz.questions.map((q: any) => ({
              userQuizId: createdQuiz.id,
              question: q.question,
              answer: q.correct_answer || q.answer,
              questionType: "blanks",
            })),
          })
        }

        return NextResponse.json({ userQuizId: createdQuiz.id, slug: createdQuiz.slug })
      }
      case "openended": {
        const { title, amount, difficulty = "medium" } = body
        if (!title || !amount) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

        const { OpenEndedQuizService } = await import("@/app/services/openended-quiz.service")
        const { generateSlug } = await import("@/lib/utils")
        const openService = new OpenEndedQuizService()
        const quiz = await openService.generateQuiz({ title, amount, difficulty })

        let baseSlug = generateSlug(title)
        let slug = baseSlug
        let suffix = 2
        while (await prisma.userQuiz.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${suffix++}`
        }

        const createdQuiz = await prisma.userQuiz.create({
          data: { userId, title, timeStarted: new Date(), quizType: "openended", slug },
        })

        if (quiz.questions && quiz.questions.length > 0) {
          await prisma.userQuizQuestion.createMany({
            data: quiz.questions.map((q: any) => ({
              userQuizId: createdQuiz.id,
              question: q.question,
              answer: q.answer,
              questionType: "openended",
            })),
          })
        }

        return NextResponse.json({ userQuizId: createdQuiz.id, slug: createdQuiz.slug })
      }
      default:
        return NextResponse.json({ error: `Unsupported quiz type: ${quizType}` }, { status: 400 })
    }
  } catch (error) {
    console.error("Error creating quiz:", error)
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 })
  }
}
