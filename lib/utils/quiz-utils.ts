import { calculateQuizScore, calculateTotalTime } from "./quiz-state-utils"

/**
 * Quiz utilities for common operations
 */
export const quizUtils = {
  /**
   * Calculates the score for a quiz
   */
  calculateScore: (answers: any[], quizType: string): number => {
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return 0
    }

    return calculateQuizScore(answers, answers.length)
  },

  /**
   * Calculates the total time spent on a quiz
   */
  calculateTotalTime: (answers: any[]): number => {
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return 0
    }

    return calculateTotalTime(answers)
  },

  /**
   * Validates a quiz question
   */
  validateQuestion: (question: any): boolean => {
    if (!question) {
      return false
    }

    // Basic validation - ensure question has required fields
    return !!(question.question && (question.answer || question.correctAnswer))
  },

  /**
   * Validates a quiz answer
   */
  validateAnswer: (answer: any): boolean => {
    if (!answer) {
      return false
    }

    // Basic validation - ensure answer has required fields
    return !!(answer.answer || answer.userAnswer)
  },

  /**
   * Gets the quiz type display name
   */
  getQuizTypeDisplayName: (quizType: string): string => {
    switch (quizType) {
      case "mcq":
        return "Multiple Choice"
      case "blanks":
        return "Fill in the Blanks"
      case "code":
        return "Coding Quiz"
      case "openended":
        return "Open Ended"
      case "flashcard":
        return "Flashcards"
      case "document":
        return "Document Quiz"
      default:
        return "Quiz"
    }
  },

  /**
   * Gets the quiz difficulty display name
   */
  getQuizDifficultyDisplayName: (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "Easy"
      case "medium":
        return "Medium"
      case "hard":
        return "Hard"
      default:
        return "Medium"
    }
  },
}
