'use server'

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { QuizType } from "../types/types"

interface QuizDetails {
  id: string
  title: string
  slug: string
  quizType: QuizType
  difficulty: string
}

export async function getSimilarQuiz(): Promise<{
  quiz: QuizDetails | null
  similarQuizzes: QuizDetails[]
}> {
  try {
    const quiz = await prisma.userQuiz.findFirst({
      orderBy: {
        createdAt: 'desc' // Fetch the most recent quiz
      },
      select: {
        id: true,
        title: true,
        slug: true,
        quizType: true,
        difficulty: true,
      },
    })

    if (!quiz) {
      return { quiz: null, similarQuizzes: [] }
    }

    const similarQuizzes = await prisma.userQuiz.findMany({
      where: {
        quizType: quiz.quizType,
        id: { not: quiz.id }, // Exclude the current quiz
      },
      select: {
        id: true,
        title: true,
        slug: true,
        quizType: true,
        difficulty: true,
      },
      take: 4, // Optimal number for recommendations
      orderBy: {
        createdAt: 'desc' // Show newer quizzes first
      }
    })

    return { 
      quiz: {
        id: quiz.id.toString(),
        title: quiz.title,
        slug: quiz.slug,
        quizType: quiz.quizType as QuizType,
        difficulty: quiz.difficulty ?? ""
      },
      similarQuizzes: similarQuizzes.map(q => ({
        id: q.id.toString(),
        title: q.title,
        slug: q.slug,
        quizType: q.quizType as QuizType,
        difficulty: q.difficulty ?? ""
      }))
    }
  } catch (error) {
    console.error("Error fetching similar quizzes:", error)
    return { quiz: null, similarQuizzes: [] }
  }
}