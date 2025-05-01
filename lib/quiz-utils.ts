import type { QuizAnswer, BlanksQuizAnswer, CodeQuizAnswer } from "@/app/types/quiz-types"

/**
 * Quiz types enum
 */
export enum QuizType {
  MCQ = "mcq",
  CODE = "code",
  BLANKS = "blanks",
  OPENENDED = "openended",
  FLASHCARD = "flashcard",
  DOCUMENT = "document",
}

import type { QuizType as TQuizType } from "@/app/types/quiz-types"

/**
 * Type guard to check if an answer is a QuizAnswer
 */
export function isQuizAnswer(answer: any): answer is QuizAnswer {
  return answer && "answer" in answer && "timeSpent" in answer && "isCorrect" in answer
}

/**
 * Type guard to check if an answer is a BlanksQuizAnswer
 */
export function isBlanksQuizAnswer(answer: any): answer is BlanksQuizAnswer {
  return answer && "userAnswer" in answer && "timeSpent" in answer && "hintsUsed" in answer
}

/**
 * Type guard to check if an answer is a CodeQuizAnswer
 */
export function isCodeQuizAnswer(answer: any): answer is CodeQuizAnswer {
  return answer && "answer" in answer && "userAnswer" in answer && "isCorrect" in answer && "timeSpent" in answer
}

/**
 * Calculate percentage score based on quiz type
 */
export function calculatePercentageScore(score: number, totalQuestions: number, type: TQuizType): number {
  // For open-ended and fill-blanks quizzes, the score is already a percentage
  if (type === QuizType.OPENENDED || type === QuizType.BLANKS) {
    // Ensure the score is within 0-100 range
    return Math.min(100, Math.max(0, score))
  }
  // For other quiz types, calculate percentage based on correct answers
  else {
    return (score / Math.max(1, totalQuestions)) * 100
  }
}

/**
 * Extract user answer from different answer types
 */
export function extractUserAnswer(answer: QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer | null): string | string[] {
  if (!answer) return ""

  if ("userAnswer" in answer && answer.userAnswer !== undefined) {
    return answer.userAnswer
  } else if ("answer" in answer && answer.answer !== undefined) {
    return answer.answer
  }
  return ""
}

/**
 * Format time in seconds to a readable format (mm:ss)
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

/**
 * Calculate estimated time to complete a quiz based on question count and type
 */
export function calculateEstimatedTime(questionCount: number, quizType: TQuizType): number {
  // Average time per question in seconds
  const timePerQuestion: Record<QuizType, number> = {
    [QuizType.MCQ]: 30,
    [QuizType.CODE]: 180,
    [QuizType.BLANKS]: 45,
    [QuizType.OPENENDED]: 120,
    [QuizType.FLASHCARD]: 20,
    [QuizType.DOCUMENT]: 60,
  }

  return questionCount * (timePerQuestion[quizType] || 30)
}

/**
 * Normalize quiz type string to enum value
 */
export function normalizeQuizType(type: string): QuizType {
  const normalizedType = type.toLowerCase()

  switch (normalizedType) {
    case "mcq":
      return QuizType.MCQ
    case "code":
      return QuizType.CODE
    case "blanks":
      return QuizType.BLANKS
    case "openended":
      return QuizType.OPENENDED
    case "flashcard":
      return QuizType.FLASHCARD
    case "document":
      return QuizType.DOCUMENT
    default:
      return QuizType.MCQ // Default to MCQ if unknown type
  }
}
