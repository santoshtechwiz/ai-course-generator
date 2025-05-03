// Central export file for all quiz utilities
// This helps avoid circular dependencies and provides a single import point

// Import utilities from individual files
import { createQuizError, QuizErrorType, getUserFriendlyErrorMessage } from "./quiz-error-handling"
import { formatQuizTime } from "./quiz-performance"
import * as quizUtils from "./quiz-utils"
import * as quizValidation from "./quiz-validation"
import * as quizApi from "./quiz-api"
import * as quizOptions from "./quiz-options"
import * as quizStateUtils from "./quiz-state-utils"

// Calculate total time from answers
export function calculateTotalTime(answers: any[]): number {
  if (!Array.isArray(answers)) return 0
  return answers.reduce((acc, curr) => acc + (curr?.timeSpent || 0), 0)
}

// Export all utilities
export {
  // Error handling
  createQuizError,
  QuizErrorType,
  getUserFriendlyErrorMessage,
  // Performance
  formatQuizTime,
  // Utils
  quizUtils,
  // Validation
  quizValidation,
  // API
  quizApi,
  // Options
  quizOptions,
  // State utils
  quizStateUtils,
}

// Export common utility functions directly
export const isValidQuizData = (data: any): boolean => {
  if (!data) return false
  if (!data.questions || !Array.isArray(data.questions)) return false
  if (data.questions.length === 0) return false
  return true
}

export const getCorrectAnswer = (question: any): string | string[] | null => {
  if (!question) return null
  return question.answer || question.correctAnswer || null
}

export const getUserAnswer = (answer: any): string | string[] | null => {
  if (!answer) return null
  return answer.userAnswer || answer.answer || null
}
