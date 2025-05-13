
import { formatQuizTime } from "./quiz-performance"

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

    return 0;
  },

  /**
   * Calculates the total time spent on a quiz
   */
  calculateTotalTime: (answers: any[]): number => {
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return 0
    }

    return 0
  },

  /**
   * Formats quiz time in seconds to a human-readable string
   */
  formatTime: (seconds: number): string => {
    return formatQuizTime(seconds)
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

// Add the missing createSafeQuizData function
export const createSafeQuizData = (data: any) => {
  if (!data) return null

  // Create a safe copy of quiz data with default values for missing properties
  return {
    id: data.id || `quiz-${Date.now()}`,
    title: data.title || "Untitled Quiz",
    description: data.description || "",
    questions: Array.isArray(data.questions) ? data.questions.map(sanitizeQuestion) : [],
    requiresAuth: !!data.requiresAuth,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    slug: data.slug || `quiz-${Date.now()}`,
    quizType: data.quizType || "mcq",
    category: data.category || "general",
    difficulty: data.difficulty || "medium",
    tags: Array.isArray(data.tags) ? data.tags : [],
    author: data.author || { name: "Anonymous", id: "anonymous" },
    isPublic: data.isPublic !== undefined ? data.isPublic : true,
  }
}

// Helper function to sanitize question data
const sanitizeQuestion = (question: any) => {
  if (!question) return null

  return {
    id: question.id || `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    question: question.question || "No question provided",
    answer: question.answer || "",
    options: Array.isArray(question.options)
      ? question.options
      : [question.answer, question.option1, question.option2, question.option3].filter(Boolean),
    explanation: question.explanation || "",
    type: question.type || "mcq",
    difficulty: question.difficulty || "medium",
    tags: Array.isArray(question.tags) ? question.tags : [],
  }
}
