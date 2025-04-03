"use client"
import type { QuizType } from "@/app/types/types"

export interface QuizAnswer {
  answer: string | string[]
  isCorrect: boolean
  timeSpent: number

}

export interface BlanksQuizAnswer {
  answer: string
  timeSpent: number
  hintsUsed: boolean
  elapsedTime?: number
}

// Union type for all answer types
export type QuizAnswerUnion = QuizAnswer | BlanksQuizAnswer

interface SaveQuizResultParams {
  slug?: string
  quizId: string | number
  answers: QuizAnswerUnion[]
  totalTime: number,
  elapsedTime?: number
  score: number
  type: QuizType
}

/**
 * Unified service for saving quiz results across all quiz types
 * This can be used by any quiz component without changing their existing logic
 */
export async function saveQuizResult({ slug,quizId, answers, totalTime,elapsedTime, score, type }: SaveQuizResultParams): Promise<{
  success: boolean
  result?: any
  error?: string
  details?: any
}> {
  try {
    // Validate inputs
    if (!quizId || !Array.isArray(answers) || typeof totalTime !== "number" || typeof score !== "number") {
      return {
        success: false,
        error: "Invalid input parameters",
        details: {
          quizId: !quizId ? "Missing quiz ID" : null,
          answers: !Array.isArray(answers) ? "Answers must be an array" : null,
          totalTime: typeof totalTime !== "number" ? "Total time must be a number" : null,
          score: typeof score !== "number" ? "Score must be a number" : null,
        },
      }
    }

    // Ensure proper serialization of union types
    const serializedAnswers = answers.map((answer) => ({
      ...answer,
    
    }))

    // Make API request to save quiz result
    const response = await fetch(`/api/quiz/${quizId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quizId,
        answers: serializedAnswers,
        totalTime,
        score,
        type,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || "Failed to save quiz results",
        details: errorData.details || {},
      }
    }

    const data = await response.json()
    return {
      success: true,
      result: data.result,
    }
  } catch (error) {
    console.error("Error saving quiz result:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Format time in seconds to mm:ss format
 */
export function formatQuizTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`
}

/**
 * Calculate percentage score based on quiz type
 */
export function calculateQuizScore(score: number, totalQuestions: number, type: QuizType): number {
  if (type !== "openended" && type !== "fill-blanks" && type !== "code") {
    return (score / totalQuestions) * 100
  }
  return score
}
