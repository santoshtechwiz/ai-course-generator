import { QuizType, type QuizAnswer } from "@/app/types/quiz-types"

/**
 * Utility functions for quiz operations
 */
export const quizUtils = {
  /**
   * Calculate score for a quiz based on answers
   * @param answers Array of quiz answers
   * @param type Quiz type
   * @returns Score as a percentage (0-100)
   */
  calculateScore(answers: QuizAnswer[], type: QuizType | string): number {
    if (!answers || answers.length === 0) return 0

    switch (type) {
      case QuizType.MCQ:
      case "mcq":
      case QuizType.CODE:
      case "code":
        // Count correct answers
        const correctCount = answers.filter((a) => a.isCorrect).length
        return Math.round((correctCount / answers.length) * 100)

      case QuizType.BLANKS:
      case "blanks":
        // Average similarity scores with threshold of 80%
        const blanksSimilarity = answers.reduce((sum, a) => sum + (a.similarity || 0), 0)
        return Math.round(blanksSimilarity / answers.length)

      case QuizType.OPENENDED:
      case "openended":
        // Average similarity scores with threshold of 70%
        const openEndedSimilarity = answers.reduce((sum, a) => sum + (a.similarity || 0), 0)
        return Math.round(openEndedSimilarity / answers.length)

      default:
        return 0
    }
  },

  /**
   * Count correct answers in a quiz
   * @param answers Array of quiz answers
   * @param type Quiz type
   * @returns Number of correct answers
   */
  countCorrectAnswers(answers: QuizAnswer[], type: QuizType | string): number {
    if (!answers || answers.length === 0) return 0

    switch (type) {
      case QuizType.MCQ:
      case "mcq":
      case QuizType.CODE:
      case "code":
        return answers.filter((a) => a.isCorrect).length

      case QuizType.BLANKS:
      case "blanks":
        return answers.filter((a) => (a.similarity || 0) > 80).length

      case QuizType.OPENENDED:
      case "openended":
        return answers.filter((a) => (a.similarity || 0) > 70).length

      default:
        return 0
    }
  },

  /**
   * Calculate similarity between two strings using Levenshtein distance
   * @param str1 First string
   * @param str2 Second string
   * @returns Similarity percentage (0-100)
   */
  calculateSimilarity(str1: string, str2: string): number {
    if (!str1 && !str2) return 100
    if (!str1 || !str2) return 0

    // Normalize strings
    const a = str1.toLowerCase().trim()
    const b = str2.toLowerCase().trim()

    if (a === b) return 100

    // Simple Levenshtein distance implementation
    const an = a.length
    const bn = b.length
    const matrix = Array(bn + 1)
      .fill(0)
      .map(() => Array(an + 1).fill(0))

    for (let i = 0; i <= an; i++) matrix[0][i] = i
    for (let j = 0; j <= bn; j++) matrix[j][0] = j

    for (let j = 1; j <= bn; j++) {
      for (let i = 1; i <= an; i++) {
        const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost, // substitution
        )
      }
    }

    return 100 - (matrix[bn][an] / Math.max(an, bn)) * 100
  },

  /**
   * Format time in seconds to a human-readable string
   * @param seconds Time in seconds
   * @returns Formatted time string (e.g., "2m 30s")
   */
  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return "0s"

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    if (minutes === 0) {
      return `${remainingSeconds}s`
    }

    return `${minutes}m ${remainingSeconds}s`
  },

  /**
   * Generate a unique quiz ID
   * @returns Unique ID string
   */
  generateQuizId(): string {
    return `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  },

  /**
   * Validate quiz data
   * @param data Quiz data to validate
   * @returns Object with validation result
   */
  validateQuizData(data: any): { isValid: boolean; error?: string } {
    if (!data) {
      return { isValid: false, error: "Quiz data is missing" }
    }

    if (!data.title) {
      return { isValid: false, error: "Quiz title is required" }
    }

    if (!data.type && !data.quizType) {
      return { isValid: false, error: "Quiz type is required" }
    }

    if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
      return { isValid: false, error: "Quiz must have at least one question" }
    }

    return { isValid: true }
  },
}
