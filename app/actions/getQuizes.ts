"use server"

import { prisma } from "@/lib/db"
import type { QuizType } from "../types/types"
import NodeCache from "node-cache"

// Add a simple cache to improve performance
const quizCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }) // 5 minute cache

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
}: GetQuizzesParams) {
  try {
    // Create a cache key based on the parameters
    const cacheKey = `quizzes_${page}_${limit}_${searchTerm}_${userId || ""}_${quizTypes?.join(",") || ""}_${minQuestions}_${maxQuestions}_${publicOnly}_${tab}_${categories.join(",")}`

    // Check if we have a cached result
    const cachedResult = quizCache.get(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    // Build the where clause
    const where: any = {}

    // Filter by user ID or public quizzes
    if (userId) {
      where.OR = [{ userId }, { isPublic: true }]
    } else if (publicOnly) {
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

    // Filter by question count
    if (minQuestions > 0 || maxQuestions < 50) {
      where.questions = {
        some: {},
      }

      // We'll filter by count after fetching
    }

    // Filter by categories
    if (categories && categories.length > 0) {
      where.OR = [
        ...(where.OR || []),
        {
          title: {
            in: categories.map((cat) => ({ contains: cat, mode: "insensitive" })),
          },
        },
      ]
    }

    // Get total count for pagination
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
    const transformedQuizzes = quizzes
      .map((quiz) => ({
        id: quiz.id.toString(),
        title: quiz.title,
        quizType: quiz.quizType,
        isPublic: quiz.isPublic || false,
        isFavorite: quiz.isFavorite || false,
        timeStarted: quiz.timeStarted.toISOString(),
        slug: quiz.slug,
        questionCount: quiz._count.questions,
        bestScore: quiz.bestScore,
      }))
      // Apply question count filter in memory
      .filter((quiz) => quiz.questionCount >= minQuestions && quiz.questionCount <= maxQuestions)

    // Calculate next cursor for infinite loading
    const nextCursor = page < Math.ceil(totalCount / limit) ? page + 1 : null

    const result = {
      quizzes: transformedQuizzes,
      totalCount,
      nextCursor,
    }

    // Cache the result
    quizCache.set(cacheKey, result)

    return result
  } catch (error) {
    console.error("Error fetching quizzes:", error)
    // Return empty data instead of throwing to allow graceful error handling
    return {
      quizzes: [],
      totalCount: 0,
      nextCursor: null,
      error: "Failed to fetch quizzes",
    }
  }
}

// Add a function to invalidate cache when quizzes are updated
export const invalidateQuizCache = async (slug?: string) => {
  if (slug) {
    // Invalidate all cache entries that might include the quiz with the given slug
    const keys = quizCache.keys()
    keys.forEach((key) => {
      if (key.includes(slug)) {
        quizCache.del(key)
      }
    })
  }
  // Delete all quiz cache entries
  const keys = quizCache.keys()
  keys.forEach((key) => {
    if (key.startsWith("quizzes_")) {
      quizCache.del(key)
    }
  })
}
