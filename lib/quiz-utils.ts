import { QuizAnswer, QuizType } from "./quiz-service"


/**
 * Utility functions for quiz operations
 */
export const quizUtils = {
  /**
   * Calculate similarity between two strings
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
   * Calculate score for a quiz based on answers
   */
  calculateScore(answers: QuizAnswer[], type: QuizType): number {
    if (!answers || answers.length === 0) return 0

    switch (type) {
      case "mcq":
      case "code":
        // Count correct answers
        const correctCount = answers.filter((a) => a.isCorrect).length
        return Math.round((correctCount / answers.length) * 100)

      case "blanks":
        // Average similarity scores with threshold of 80%
        const blanksSimilarity = answers.reduce((sum, a) => sum + (a.similarity || 0), 0)
        return Math.round(blanksSimilarity / answers.length)

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
   */
  countCorrectAnswers(answers: QuizAnswer[], type: QuizType): number {
    if (!answers || answers.length === 0) return 0

    switch (type) {
      case "mcq":
      case "code":
        return answers.filter((a) => a.isCorrect).length

      case "blanks":
        return answers.filter((a) => (a.similarity || 0) > 80).length

      case "openended":
        return answers.filter((a) => (a.similarity || 0) > 70).length

      default:
        return 0
    }
  },

  /**
   * Format answers based on quiz type
   */
  formatAnswers(answers: QuizAnswer[], type: QuizType): QuizAnswer[] {
    if (!answers || !Array.isArray(answers)) return []

    // Ensure all answers are valid objects
    let formattedAnswers = answers
      .filter((answer) => answer !== null)
      .map((answer) => {
        if (!answer) {
          return {
            answer: "",
            timeSpent: 0,
            isCorrect: false,
            similarity: 0,
            hintsUsed: false,
          }
        }
        return answer
      })

    // Type-specific formatting
    switch (type) {
      case "blanks":
        formattedAnswers = formattedAnswers.map((answer) => ({
          ...answer,
          userAnswer: typeof answer.answer === "string" ? answer.answer : "",
          similarity: answer.similarity || 0,
          isCorrect: (answer.similarity || 0) > 80,
        }))
        break

      case "openended":
        formattedAnswers = formattedAnswers.map((answer) => ({
          ...answer,
          similarity: answer.similarity || 0,
          isCorrect: (answer.similarity || 0) > 70,
        }))
        break
    }

    return formattedAnswers
  },
}
