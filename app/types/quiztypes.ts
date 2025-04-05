import type { QuizType } from "@/app/types/types"

// Base quiz answer interface
export interface BaseQuizAnswer {
  questionId?: string | number
  timeSpent: number
}

// MCQ specific answer type
export interface McqQuizAnswer extends BaseQuizAnswer {
  userAnswer: string
  isCorrect: boolean
}

// Blanks specific answer type
export interface BlanksQuizAnswer extends BaseQuizAnswer {
  userAnswer: string
  isCorrect: boolean
  hintsUsed?: number
}

// OpenEnded specific answer type
export interface OpenEndedQuizAnswer extends BaseQuizAnswer {
  userAnswer: string
  aiScore?: number
  feedback?: string
}

// Code specific answer type
export interface CodeQuizAnswer extends BaseQuizAnswer {
  userCode: string
  testResults?: {
    passed: boolean
    message?: string
    testsPassed?: number
    totalTests?: number
  }[]
  compilationError?: string
}

// Flashcard specific answer type
export interface FlashcardQuizAnswer extends BaseQuizAnswer {
  confidence: "low" | "medium" | "high"
  isCorrect: boolean
}

// Union type for all possible quiz answer types
export type QuizAnswerUnion =
  | McqQuizAnswer
  | BlanksQuizAnswer
  | OpenEndedQuizAnswer
  | CodeQuizAnswer
  | FlashcardQuizAnswer

// Quiz submission interface
export interface QuizSubmission {
  quizId: string
  answers: QuizAnswerUnion[]
  totalTime: number
  score: number
  quizType: QuizType
  metadata?: Record<string, any>
}

// Quiz result interface
export interface QuizResult {
  id: string
  quizId: string
  userId: string
  score: number
  percentageScore: number
  totalTime: number
  completedAt: string
  quizType: QuizType
  answers: QuizAnswerUnion[]
  metadata?: Record<string, any>
}

