// Create a utility service for quiz result processing
import type { QuizType } from "@/app/types/types"
// Add a debounce mechanism to prevent duplicate submissions
import { debounce } from "lodash"

// Extract user answer from different answer formats
export function extractUserAnswer(answer: any): string | string[] {
  if (!answer) return ""

  if (typeof answer === "string") return answer

  if (answer.userAnswer !== undefined) {
    return answer.userAnswer
  }

  if (answer.answer !== undefined) {
    return answer.answer
  }

  return ""
}

// Calculate score based on quiz type and answers
export function calculateQuizScore(answers: any[], questions: any[], quizType: QuizType): number {
  if (!answers || !questions || answers.length === 0 || questions.length === 0) {
    return 0
  }

  switch (quizType) {
    case "mcq":
      return answers.reduce((score, answer, index) => {
        const question = questions[index]
        if (!question) return score

        const isCorrect =
          (answer.isCorrect !== undefined && answer.isCorrect) ||
          answer.userAnswer === question.answer ||
          answer === question.answer

        return score + (isCorrect ? 1 : 0)
      }, 0)

    case "fill-blanks":
      // For fill-in-the-blanks, we typically use a percentage-based scoring
      // that's calculated elsewhere, so we just pass through the score
      return answers.reduce((score, answer) => {
        return score + (answer.score || 0)
      }, 0)

    case "openended":
      // Open-ended questions typically use a percentage-based scoring
      // that's calculated elsewhere, so we just pass through the score
      return answers.reduce((score, answer) => {
        return score + (answer.score || 0)
      }, 0)

    case "code":
      return answers.reduce((score, answer, index) => {
        const isCorrect = answer.isCorrect !== undefined ? answer.isCorrect : false
        return score + (isCorrect ? 1 : 0)
      }, 0)

    default:
      return 0
  }
}

// Format quiz data for submission
export function formatQuizSubmissionData(
  quizId: string,
  answers: any[],
  totalTime: number,
  score: number,
  quizType: QuizType,
) {
  return {
    quizId,
    answers: Array.isArray(answers)
      ? answers.map((answer) => {
          // Handle different answer formats based on quiz type
          if (quizType === "mcq") {
            return {
              answer: answer.answer || "",
              userAnswer: answer.userAnswer || answer.answer || "",
              isCorrect: answer.isCorrect || false,
              timeSpent: answer.timeSpent || 0,
            }
          } else if (quizType === "fill-blanks") {
            return {
              userAnswer: answer.answer || answer.userAnswer || "",
              timeSpent: answer.timeSpent || 0,
              hintsUsed: answer.hintsUsed || false,
            }
          } else if (quizType === "openended") {
            return {
              answer: answer.answer || "",
              timeSpent: answer.timeSpent || 0,
              hintsUsed: answer.hintsUsed || false,
            }
          } else if (quizType === "code") {
            return {
              answer: answer.answer || "",
              userAnswer: answer.userAnswer || "",
              isCorrect: answer.isCorrect || false,
              timeSpent: answer.timeSpent || 0,
            }
          }
          return answer
        })
      : answers,
    totalTime,
    score,
    type: quizType,
  }
}

// Add this function to the service
export const saveQuizResult = debounce(
  async (data: any) => {
    try {
      const { quizId, answers, totalTime, score, type } = data

      // Ensure quizId is a string
      const quizIdString = String(quizId)

      const response = await fetch(`/api/quiz/${quizIdString}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to save quiz result: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error in saveQuizResult:", error)
      throw error
    }
  },
  500,
  { leading: true, trailing: false },
) // Only execute on the leading edge, with 500ms debounce
