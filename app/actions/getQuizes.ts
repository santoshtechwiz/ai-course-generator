"use server"

import { prisma } from "@/lib/db"
import type { QuizType } from "../types/quiz-types"
import NodeCache from "node-cache"
import { Quiz } from "../types/types"

// Global singletons for caches
const globalForQuizCache = globalThis as unknown as {
	__quizListCache?: NodeCache
	__quizDetailCache?: NodeCache
}

if (!globalForQuizCache.__quizListCache) {
	globalForQuizCache.__quizListCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }) // 5 minute cache
}
if (!globalForQuizCache.__quizDetailCache) {
	globalForQuizCache.__quizDetailCache = new NodeCache({ stdTTL: 900, checkperiod: 60 }) // 15 minute cache for quiz details
}

const quizCache = globalForQuizCache.__quizListCache
const quizDetailCache = globalForQuizCache.__quizDetailCache

interface GetQuizzesParams {
  page?: number
  limit?: number
  searchTerm?: string
  userId?: string
  quizTypes?: QuizType[] | null
  minQuestions?: number
  maxQuestions?: number
  publicOnly?: boolean
  tab?: string
  categories?: string[]
}

export interface QuizListItem {
  id: string
  title: string
  quizType: QuizType
  isPublic: boolean
  isFavorite: boolean
  timeStarted: string
  slug: string
  questionCount: number
  bestScore: number | null
}

export interface GetQuizzesResult {
  quizzes: QuizListItem[]
  totalCount: number
  nextCursor: number | null
  error?: string
}

function getCacheKey(params: Partial<GetQuizzesParams>): string {
  // Use JSON.stringify for a unique and typesafe cache key
  return `quizzes_${Buffer.from(JSON.stringify(params)).toString("base64")}`
}

export async function getQuizzes({
  page = 1,
  limit = 10,
  searchTerm = "",
  userId,
  quizTypes = null,
  minQuestions = 0,
  maxQuestions = 50,
  publicOnly = false,
  tab = "all",
  categories = [],
}: GetQuizzesParams): Promise<GetQuizzesResult> {
  try {
    const cacheKey = getCacheKey({
      page,
      limit,
      searchTerm,
      userId,
      quizTypes,
      minQuestions,
      maxQuestions,
      publicOnly,
      tab,
      categories,
    })

    const cachedResult = quizCache.get<GetQuizzesResult>(cacheKey)
    if (cachedResult) {
      return cachedResult
    }
    // Build the where clause
    const where: Record<string, unknown> = {}

    // Filter by user ID or public quizzes
    if (userId) {
      if (publicOnly) {
        // If both userId and publicOnly are provided, only show public quizzes
        where.isPublic = true
      } else {
        // Otherwise show both user's quizzes and public quizzes
        where.OR = [{ userId }, { isPublic: true }]
      }
    } else if (publicOnly) {
      // If only publicOnly is provided, only show public quizzes
      where.isPublic = true
    }

    // Filter by search term
    if (searchTerm) {
      where.title = {
        contains: searchTerm,
        mode: "insensitive",
      }
    }

    // Filter by quiz type
    if (quizTypes && quizTypes.length > 0) {
      where.quizType = {
        in: quizTypes,
      }
    } else if (tab && tab !== "all") {
      where.quizType = tab
    }

    // Filter by categories
    if (categories && categories.length > 0) {
      where.OR = [
        ...(where.OR as any[] || []),
        {
          title: {
            in: categories.map((cat) => ({ contains: cat, mode: "insensitive" })),
          },
        },
      ]
    }

    // Use Prisma's _count for question count filtering (if supported)
    // Otherwise, fallback to in-memory filtering
    let useInMemoryQuestionCountFilter = false
    let having: Record<string, unknown> | undefined = undefined
    if (minQuestions > 0 || maxQuestions < 50) {
      // Prisma does not support having on findMany, so we filter in-memory
      useInMemoryQuestionCountFilter = true
    }

    // Get total count for pagination (without question count filter if in-memory)
    const totalCount = await prisma.userQuiz.count({ where })

    // Fetch quizzes with pagination
    const quizzes = await prisma.userQuiz.findMany({
      where,
      select: {
        id: true,
        title: true,
        quizType: true,
        isPublic: true,
        isFavorite: true,
        timeStarted: true,
        slug: true,
        bestScore: true,
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { timeStarted: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Transform the data
    let transformedQuizzes: QuizListItem[] = quizzes.map((quiz) => ({
      id: quiz.id.toString(),
      title: quiz.title,
      quizType: quiz.quizType as QuizType,
      isPublic: quiz.isPublic ?? false,
      isFavorite: quiz.isFavorite ?? false,
      timeStarted: quiz.timeStarted.toISOString(),
      slug: quiz.slug,
      questionCount: quiz._count.questions,
      bestScore: quiz.bestScore,
    }))

    // Apply question count filter in memory if needed
    if (useInMemoryQuestionCountFilter) {
      transformedQuizzes = transformedQuizzes.filter(
        (quiz) => quiz.questionCount >= minQuestions && quiz.questionCount <= maxQuestions,
      )
    }

    // Calculate next cursor for infinite loading
    const nextCursor = page < Math.ceil(totalCount / limit) ? page + 1 : null

    const result: GetQuizzesResult = {
      quizzes: transformedQuizzes,
      totalCount,
      nextCursor,
    }

    quizCache.set(cacheKey, result)

    return result
  } catch (error: any) {
    console.error("Error fetching quizzes:", error)
    return {
      quizzes: [],
      totalCount: 0,
      nextCursor: null,
      error: error?.message || "Failed to fetch quizzes",
    }
  }
}

export const invalidateQuizCache = async (slug?: string) => {
  if (slug) {
    const keys = quizCache.keys()
    keys.forEach((key) => {
      if (key.includes(slug)) {
        quizCache.del(key)
      }
    })
  }
  const keys = quizCache.keys()
  keys.forEach((key) => {
    if (key.startsWith("quizzes_")) {
      quizCache.del(key)
    }
  })
}

export async function fetchQuizWithCache(quizId: string): Promise<Quiz | null> {
  const cacheKey = `quiz_${quizId}`

  // Check cache first
  /* `const cachedQuiz = quizDetailCache.get<Quiz>(cacheKey)` is attempting to retrieve a cached value
  from the `quizDetailCache` using the provided `cacheKey`. */
  const cachedQuiz = quizDetailCache.get<Quiz>(cacheKey)
  if (cachedQuiz) {
    return cachedQuiz
  }

  // Fetch quiz from API or database
  const quiz = await prisma.userQuiz.findUnique({
    where: { id: quizId },
  })

  if (quiz) {
    quizDetailCache.set(cacheKey, quiz)
  }

  return quiz
}
