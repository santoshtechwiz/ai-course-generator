"use server"

import { prisma } from "@/lib/db"
import type { OpenEndedQuizData } from "@/types/quiz"
import { OpenEndedQuestion, QuizType } from "../types/quiz-types"

// Define a proper interface that represents the quiz data returned by this action
interface QuizResult {
  id: number
  userId: string
  title: string
  description?: string
  type: QuizType
  questions: OpenEndedQuestion[]
  slug: string
}

export async function getQuiz<T = OpenEndedQuizData>(slug: string): Promise<T | null> {
  try {
    const response = await fetch(`${process.env.API_URL||'http://localhost:3000'}/api/quizzes/openended/${slug}`)
    if (!response.ok) return null
    return response.json()
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return null
  }
}
