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
          _count: {
            select: {
              flashCards: true,
              openEndedQuestions: true,
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

      return {
        id: quiz.id,
        title: quiz.title,
        slug: quiz.slug,
        isPublic: quiz.isPublic ?? true,
        quizType: quiz.quizType as QuizType,
        bestScore: quiz.bestScore || 0,
        questionCount,
        tags: [], // You can add tags later if needed
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question: q.question,
          createdAt: new Date(), // Replace with actual createdAt if available
          updatedAt: new Date(), // Replace with actual updatedAt if available
          options: q.options || null,
          answer: "", // Replace with actual answer if available
          userQuizId: quiz.id, // Replace with actual userQuizId if available
          questionType: "default", // Replace with actual questionType if available
          codeSnippet: null, // Replace with actual codeSnippet if available
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
