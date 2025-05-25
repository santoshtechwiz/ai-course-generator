/**
 * Quiz related types
 */

// Quiz types
export type QuizType = "mcq" | "openended" | "fill-blanks" | "code" | "flashcard"

// User answer for quiz
export interface UserAnswer {
  questionId: string | number
  answer?: string
  isCorrect?: boolean
  timeSpent?: number
}

// Processed question for rendering
export interface ProcessedQuestion {
  id: string
  question: string
  answer: string
  options?: string[]
}

// Quiz question result
export interface QuizQuestionResult {
  id: string | number
  question: string
  userAnswer: string | string[]
  correctAnswer: string
  isCorrect: boolean
  codeSnippet?: string
  type?: QuizType
}

// Open-ended quiz data
export interface OpenEndedQuizData {
  id: string
  title: string
  slug: string
  questions: {
    id: string
    question: string
    answer: string
    hints?: string[]
  }[]
}

// Quiz result data
export interface BaseQuizResultData {
  quizId: string
  slug: string
  title: string
  score: number
  maxScore: number
  percentage: number
  questions: QuizQuestionResult[]
  answers: UserAnswer[]
  completedAt: string
  type: QuizType
}

// Quiz submission types for API responses
export interface QuizAnswer {
  questionId: string | number
  isCorrect: boolean
  timeSpent: number
  answer?: string
}

export interface BlanksQuizAnswer {
  questionId: string | number
  userAnswer: string | string[]
  timeSpent: number
  isCorrect?: boolean
}

export interface CodeQuizAnswer {
  questionId: string | number
  answer: string
  timeSpent: number
  isCorrect?: boolean
}

export type QuizAnswerUnion = QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer

export interface QuizSubmission {
  quizId: string
  answers: QuizAnswerUnion[]
  totalTime: number
  score: number
  type: QuizType
  totalQuestions?: number
  correctAnswers?: number
  completedAt?: string
}

export interface QuizCompletionResponse {
  success: boolean
  result?: {
    updatedUserQuiz: any
    quizAttempt: any
    percentageScore: number
    totalQuestions: number
    score: number
    totalTime: number
  }
  error?: string
  details?: any
}

// Similar quiz interface for recommendations
export interface SimilarQuiz {
  id: string
  title: string
  type: QuizType
  difficulty: string
  slug: string
}

// Quiz result
export interface QuizResult {
  score: number
  maxScore: number
  percentage: number
  questions: QuizQuestionResult[]
}
