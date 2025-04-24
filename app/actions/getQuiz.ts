"use server"

import { prisma } from "@/lib/db"
import { QuestionOpenEnded } from "../types/types"

type Result = {
  id: number
  userId: string
  title: string
  questions: QuestionOpenEnded[]
}

export async function getQuiz(slug: string): Promise<Result | null> {
  try {
    if (!slug) {
      return null
    }

    // Fetch quiz metadata
    const quiz = await prisma.userQuiz.findFirst({
      where: { slug },
      select: { isPublic: true, userId: true },
    })

    if (!quiz) {
      return null
    }

    // Fetch full quiz details
    const result = await prisma.userQuiz.findFirst({
      where: {
        slug,
        OR: [{ isPublic: true }, { userId: quiz.userId }],
      },
      select: {
        id: true,
        title: true,
        userId: true,
        questions: {
          select: {
            id: true,
            question: true,
            answer: true,
            openEndedQuestion: {
              select: {
                hints: true,
                difficulty: true,
                tags: true,
              },
            },
          },
        },
      },
    })

    if (!result) {
      return null
    }

    // Transform questions
    const transformedQuestions = result.questions.map((question) => ({
      id: question.id,
      question: question.question,
      answer: question.answer,
      openEndedQuestion: question.openEndedQuestion
        ? {
            hints: question.openEndedQuestion.hints.split("|"),
            difficulty: question.openEndedQuestion.difficulty,
            tags: question.openEndedQuestion.tags.split("|"),
          }
        : null,
    }))

    // Return structured response
    return {
      id: result.id,
      userId: result.userId,
      title: result.title,
      questions: transformedQuestions,
    }
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return null
  }
}
