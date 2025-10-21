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
  userId: string
}

interface GetQuizzesResult {
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

    // Determine if we should include ordering quizzes
    const includeOrdering = !quizTypes || quizTypes.includes('ordering') || tab === 'all' || tab === 'ordering'
    const includeUserQuizzes = !quizTypes || !quizTypes.includes('ordering') || quizTypes.length > 1 || tab === 'all'

    // Build the where clause for UserQuiz
    const userQuizWhere: Record<string, unknown> = {}

    // Filter by user ID or public quizzes
    if (userId) {
      if (publicOnly) {
        userQuizWhere.isPublic = true
      } else {
        userQuizWhere.OR = [{ userId }, { isPublic: true }]
      }
    } else {
      // No userId - show only public quizzes
      userQuizWhere.isPublic = true
    }

    // Filter by search term
    if (searchTerm) {
      userQuizWhere.title = {
        contains: searchTerm,
        mode: "insensitive",
      }
    }

    // Filter by quiz type (exclude 'ordering' from UserQuiz query)
    if (quizTypes && quizTypes.length > 0 && quizTypes.includes('ordering')) {
      const nonOrderingTypes = quizTypes.filter(t => t !== 'ordering')
      if (nonOrderingTypes.length > 0) {
        userQuizWhere.quizType = { in: nonOrderingTypes }
      } else {
        userQuizWhere.quizType = 'NONE' // This won't match anything
      }
    } else if (quizTypes && quizTypes.length > 0) {
      userQuizWhere.quizType = { in: quizTypes }
    } else if (tab && tab !== "all" && tab !== 'ordering') {
      userQuizWhere.quizType = tab
    }

    // Build the where clause for OrderingQuiz
    const orderingQuizWhere: Record<string, unknown> = {}
    
    if (userId) {
      if (publicOnly) {
        orderingQuizWhere.isPublic = true
      } else {
        orderingQuizWhere.OR = [{ createdBy: userId }, { isPublic: true }]
      }
    } else {
      // No userId - show only public quizzes
      orderingQuizWhere.isPublic = true
    }

    if (searchTerm) {
      orderingQuizWhere.title = {
        contains: searchTerm,
        mode: "insensitive",
      }
    }

    // Fetch both UserQuizzes and OrderingQuizzes
    const [userQuizzes, orderingQuizzes, totalUserQuizCount, totalOrderingQuizCount] = await Promise.all([
      includeUserQuizzes ? prisma.userQuiz.findMany({
        where: userQuizWhere,
        select: {
          id: true,
          title: true,
          quizType: true,
          isPublic: true,
          isFavorite: true,
          timeStarted: true,
          slug: true,
          bestScore: true,
          userId: true,
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { timeStarted: "desc" },
      }) : Promise.resolve([]),
      includeOrdering ? prisma.orderingQuiz.findMany({
        where: orderingQuizWhere,
        select: {
          id: true,
          title: true,
          slug: true,
          isPublic: true,
          createdBy: true,
          createdAt: true,
          difficulty: true,
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }) : Promise.resolve([]),
      includeUserQuizzes ? prisma.userQuiz.count({ where: userQuizWhere }) : Promise.resolve(0),
      includeOrdering ? prisma.orderingQuiz.count({ where: orderingQuizWhere }) : Promise.resolve(0),
    ])

    // Transform UserQuizzes
    let transformedUserQuizzes: QuizListItem[] = userQuizzes.map((quiz: any) => ({
      id: quiz.id.toString(),
      title: quiz.title,
      quizType: quiz.quizType as QuizType,
      isPublic: quiz.isPublic ?? false,
      isFavorite: quiz.isFavorite ?? false,
      timeStarted: quiz.timeStarted.toISOString(),
      slug: quiz.slug,
      questionCount: quiz._count.questions,
      bestScore: quiz.bestScore,
      userId: quiz.userId,
    }))

    // Transform OrderingQuizzes
    let transformedOrderingQuizzes: QuizListItem[] = orderingQuizzes.map((quiz: any) => ({
      id: `ordering_${quiz.id}`,
      title: quiz.title,
      quizType: 'ordering' as QuizType,
      isPublic: quiz.isPublic ?? false,
      isFavorite: false,
      timeStarted: quiz.createdAt.toISOString(),
      slug: quiz.slug,
      questionCount: quiz._count.questions,
      bestScore: null,
      userId: quiz.createdBy || '',
    }))

    // Combine and sort all quizzes
    let allQuizzes = [...transformedUserQuizzes, ...transformedOrderingQuizzes]

    // Apply question count filter if needed
    if (minQuestions > 0 || maxQuestions < 50) {
      allQuizzes = allQuizzes.filter(
        (quiz) => quiz.questionCount >= minQuestions && quiz.questionCount <= maxQuestions,
      )
    }

    // Sort by timeStarted descending
    allQuizzes.sort((a, b) => new Date(b.timeStarted).getTime() - new Date(a.timeStarted).getTime())

    // Apply pagination
    const totalCount = totalUserQuizCount + totalOrderingQuizCount
    const paginatedQuizzes = allQuizzes.slice((page - 1) * limit, page * limit)
    const nextCursor = page < Math.ceil(totalCount / limit) ? page + 1 : null

    const result: GetQuizzesResult = {
      quizzes: paginatedQuizzes,
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

const invalidateQuizCache = async (slug?: string) => {
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

async function fetchQuizWithCache(quizId: string | number): Promise<Quiz | null> {
  const cacheKey = `quiz_${quizId}`

  // Check cache first
  /* `const cachedQuiz = quizDetailCache.get<Quiz>(cacheKey)` is attempting to retrieve a cached value
  from the `quizDetailCache` using the provided `cacheKey`. */
  const cachedQuiz = quizDetailCache.get<Quiz>(cacheKey)
  if (cachedQuiz) {
    return cachedQuiz
  }

  // Coerce the incoming id to a number because Prisma expects a numeric id
  const idNumber = typeof quizId === "string" ? parseInt(quizId, 10) : quizId
  if (!Number.isInteger(idNumber) || idNumber <= 0) {
    console.warn(`fetchQuizWithCache: invalid quizId provided: ${quizId}`)
    return null
  }

  // Fetch quiz from API or database
  const quiz = await prisma.userQuiz.findUnique({
    where: { id: idNumber },
  })

  if (quiz) {
    quizDetailCache.set(cacheKey, quiz)
  }

  return quiz
}

export async function getQuizCountsByType(userId?: string): Promise<Record<string, number>> {
  try {
    const cacheKey = `quiz_counts_${userId || 'public'}`

    const cachedCounts = quizCache.get<Record<string, number>>(cacheKey)
    if (cachedCounts) {
      return cachedCounts
    }

    // Build where clause for available quizzes
    const where: Record<string, unknown> = {}

    if (userId) {
      where.OR = [{ userId }, { isPublic: true }]
    } else {
      where.isPublic = true
    }

    // Get counts for each quiz type
    const counts = await prisma.userQuiz.groupBy({
      by: ['quizType'],
      where,
      _count: {
        quizType: true,
      },
    })

    // Transform to UI config keys
    const result: Record<string, number> = {
      mcq: 0,
      code: 0,
      flashcard: 0,
      openended: 0,
      blanks: 0,
      ordering: 0,
    }

    counts.forEach((count) => {
      const quizType = count.quizType
      if (quizType === 'mcq') {
        result.mcq = count._count.quizType
      } else if (quizType === 'code') {
        result.code = count._count.quizType
      } else if (quizType === 'flashcard') {
        result.flashcard = count._count.quizType
      } else if (quizType === 'openended') {
        result.openended = count._count.quizType
      } else if (quizType === 'blanks' || quizType === 'fill-blanks') {
        result.blanks = count._count.quizType
      } else if (quizType === 'ordering') {
        result.ordering = count._count.quizType
      }
    })

    quizCache.set(cacheKey, result)
    return result
  } catch (error: any) {
    console.error("Error fetching quiz counts:", error)
    return {
      mcq: 0,
      code: 0,
      flashcard: 0,
      openended: 0,
      blanks: 0,
      ordering: 0,
    }
  }
}
