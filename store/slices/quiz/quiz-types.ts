// Local QuizType so the slice is self-contained and doesn't depend on app/type
export type QuizType = 'blanks' | 'openended' | 'mcq' | 'code' | 'flashcard' | 'ordering'

// Unified quiz types used by the store and components. This file consolidates
// quiz-related interfaces previously split across multiple files.

export interface QuizQuestion {
  id: string | number
  question: string
  type: string
  options?: { id: string | number; text: string }[] | string[]
  correctOptionId?: string
  correctAnswer?: string
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
  selectedOptionLabel?: string | null
  userAnswer: string
  isCorrect: boolean
  type: string
  timestamp: number
  timeSpent?: number
  // optional metadata
  correctAnswer?: string
}

export interface QuestionResult {
  questionId: string
  userAnswer: string | null
  correctAnswer: string
  selectedOptionLabel?: string | null
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
  totalTime?: number
  accuracy?: number
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
  status: 'idle' | 'loading' | 'submitting' | 'succeeded' | 'failed' | 'not-found' | 'requires-auth'
  error: string | null
  requiresAuth: boolean
  redirectAfterLogin: string | null
  userId: string | null
  questionStartTimes: Record<string, number>
  // Timestamp (ms) of the last applied update to the quiz state. Used to avoid
  // race conditions where older async responses overwrite newer state.
  lastUpdated?: number | null
  isInitialized: boolean
  pendingRedirect: boolean
}

// Type aliases for better readability
type QuizStatus = "idle" | "loading" | "succeeded" | "failed" | "submitting" | "not-found" | 'requires-auth'
type AuthStatus = "checking" | "authenticated" | "unauthenticated" | "idle"
type QuestionType = "mcq" | "code" | "blanks" | "openended"
