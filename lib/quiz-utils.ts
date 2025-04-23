
import { QuizAnswer } from "@/app/dashboard/subscription/services/QuizResultService"
import type { QuizType } from "@/app/types/quiz-types"

/**
 * Format time in seconds to a human-readable string
 */
export function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m 0s"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)

  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Calculate similarity between two strings (0-100%)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 100
  if (!str1 || !str2) return 0

  // Normalize strings
  const a = str1.toLowerCase().trim()
  const b = str2.toLowerCase().trim()

  if (a === b) return 100

  // Simple Levenshtein distance implementation
  const matrix = []

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  // Increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          ),
        )
      }
    }
  }

  // Calculate similarity as a percentage
  const maxLength = Math.max(a.length, b.length)
  const distance = matrix[b.length][a.length]
  const similarity = ((maxLength - distance) / maxLength) * 100

  return Math.round(similarity)
}

/**
 * Get performance level based on score
 */
export function getPerformanceLevel(score: number) {
  const levels = [
    {
      threshold: 90,
      color: "text-green-500",
      bgColor: "bg-green-500",
      label: "Master",
      message: "Mastery achieved! You're crushing it!",
    },
    {
      threshold: 70,
      color: "text-blue-500",
      bgColor: "bg-blue-500",
      label: "Proficient",
      message: "Great job! You have a strong understanding.",
    },
    {
      threshold: 50,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500",
      label: "Developing",
      message: "Good effort! Review these areas to improve.",
    },
    {
      threshold: 0,
      color: "text-red-500",
      bgColor: "bg-red-500",
      label: "Needs Practice",
      message: "Keep learning! Let's strengthen these concepts.",
    },
  ]

  return levels.find((level) => score >= level.threshold) || levels[levels.length - 1]
}

/**
 * Get answer class name based on similarity or correctness
 */
export function getAnswerClassName(similarity: number, isCorrect?: boolean): string {
  if (isCorrect === true || similarity === 100) return "font-bold text-green-600 dark:text-green-400"
  if (similarity > 80) return "font-bold text-yellow-600 dark:text-yellow-400"
  return "font-bold text-red-600 dark:text-red-400"
}

/**
 * Calculate score based on answers and quiz type
 */
export function calculateScore(answers: QuizAnswer[], quizType: QuizType): number {
  if (!answers || answers.length === 0) return 0

  switch (quizType) {
    case "mcq":
      const correctCount = answers.filter((a) => a.isCorrect).length
      return Math.round((correctCount / answers.length) * 100)

    case "blanks":
    case "openended":
      const totalSimilarity = answers.reduce((sum, a) => sum + (a.similarity || 0), 0)
      return Math.round(totalSimilarity / answers.length)

    case "code":
      // For code quizzes, we might have a different scoring mechanism
      const codeCorrectCount = answers.filter((a) => a.isCorrect).length
      return Math.round((codeCorrectCount / answers.length) * 100)

    default:
      return 0
  }
}
