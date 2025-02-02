"use server"
import prisma from "@/lib/db"
import type { QuizListItem } from "../types/types"

export async function getQuizzes(
  page = 1,
  limit = 20,
  searchTerm = "",
  userId?: string,
): Promise<{ quizzes: QuizListItem[]; hasMore: boolean }> {
  try {
    const skip = (page - 1) * limit

    const whereCondition = {
      AND: [
        searchTerm
          ? {
              topic: {
                contains: searchTerm,
                mode: "insensitive" as const,
              },
            }
          : {},
        {
          OR: userId ? [{ userId: userId }, { isPublic: true }] : [{ isPublic: true }],
        },
      ],
    }

    const [quizzes, totalCount] = await Promise.all([
      prisma.userQuiz.findMany({
        where: whereCondition,
        select: {
          id: true,
          topic: true,
          slug: true,
          isPublic: true,
          quizType: true,
          _count: {
            select: { questions: true },
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

    const quizListItems = quizzes.map(
      (quiz): QuizListItem => ({
        id: quiz.id,
        topic: quiz.topic,
        slug: quiz.slug,
        questionCount: quiz._count.questions,
        isPublic: quiz.isPublic ?? true,
        quizType: quiz.quizType,
        tags: [],
        questions: [],
      }),
    )

    const hasMore = totalCount > skip + limit

    return { quizzes: quizListItems, hasMore }
  } catch (error) {
    console.error("Failed to fetch quizzes:", error)
    return { quizzes: [], hasMore: false }
  }
}

