"use server"

import prisma from "@/lib/db"
import type { QuizListItem, QuizType } from "../types/types"

interface GetQuizzesParams {
  page: number
  limit: number
  searchTerm?: string
  userId?: string
  quizTypes?: QuizType[] | null
}

export async function getQuizzes({
  page = 1,
  limit = 10,
  searchTerm = "",
  userId,
  quizTypes,
}: GetQuizzesParams): Promise<{ quizzes: QuizListItem[]; nextCursor: number | null }> {
  try {
    const skip = (page - 1) * limit

    const whereCondition: any = {
      AND: [
        searchTerm
          ? {
              OR: [
                {
                  title: {
                    contains: searchTerm,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {},
      ],
      OR: userId ? [{ userId: userId }, { isPublic: true }] : [{ isPublic: true }],
    }

    if (quizTypes && quizTypes.length > 0) {
      whereCondition.AND.push({
        quizType: {
          in: quizTypes,
        },
      })
    }

    const [quizzes, totalCount] = await Promise.all([
      prisma.userQuiz.findMany({
        where: whereCondition,
        select: {
          id: true,
          title: true,
          slug: true,
          isPublic: true,
          quizType: true,
          bestScore: true,
          questions: {
            select: {
              id: true,
              question: true,
              options: true,
            },
          },
          flashCards: {
            select: {
              id: true,
            },
          },
          openEndedQuestions: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: skip,
      }),
      prisma.userQuiz.count({ where: whereCondition }),
    ])

    const quizListItems: QuizListItem[] = quizzes.map((quiz) => {
      const questionCount = quiz.questions.length
      const flashCardCount = quiz.flashCards.length
      const openEndedCount = quiz.openEndedQuestions.length

      return {
        id: quiz.id,
        title: quiz.title,
        slug: quiz.slug,
        isPublic: quiz.isPublic ?? true,
        quizType: quiz.quizType as QuizType,
        bestScore: quiz.bestScore || 0,
        questionCount,
        flashCardCount,
        openEndedCount,
        tags: [],
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question: q.question,
          createdAt: new Date(),
          updatedAt: new Date(),
          options: q.options || null,
          answer: "",
          userQuizId: quiz.id,
          questionType: "default",
          codeSnippet: null,
        })),
      }
    })

    const nextCursor = totalCount > skip + limit ? page + 1 : null

    return { quizzes: quizListItems, nextCursor }
  } catch (error) {
    console.error("Failed to fetch quizzes:", error)
    return { quizzes: [], nextCursor: null }
  }
}