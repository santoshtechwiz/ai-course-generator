import { QuizType } from "@/app/types/quiz-types";

export interface QuizQuestion {
  id: string | number
  question: string
  type: string
  options?: { id: string | number; text: string }[]
  correctOptionId?: string,
  codeSnippet?: string
  language?: string
  answer?: string
  tags?: string[]
  hints?: string[]
  difficulty?: string
  keywords?: string[]
}

export interface QuizAnswer {
  questionId: string
  selectedOptionId?: string | null
  userAnswer: string
  isCorrect: boolean
  type: string
  timestamp: number
}

export interface QuestionResult {
  questionId: string
  userAnswer: string | null
  correctAnswer: string
  isCorrect: boolean
  skipped: boolean
}

export interface QuizResults {
  slug: string
  quizType: QuizType
  score: number
  maxScore: number
  percentage: number
  submittedAt: string
  completedAt: string
  answers: QuizAnswer[]
  results: QuestionResult[]
}

export interface QuizState {
  slug: string | null
  quizType: QuizType | null
  title: string
  questions: QuizQuestion[]
  currentQuestionIndex: number
  answers: Record<string, QuizAnswer>
  results: QuizResults | null
  isCompleted: boolean
  status: 'idle' | 'loading' | 'submitting' | 'succeeded' | 'failed'
  error: string | null
  requiresAuth: boolean
  redirectAfterLogin: string | null
  userId: string | null
}

// Type aliases for better readability
export type QuizStatus = "idle" | "loading" | "succeeded" | "failed" | "submitting"
export type AuthStatus = "checking" | "authenticated" | "unauthenticated" | "idle"
export type QuestionType = "mcq" | "code" | "blanks" | "openended"
