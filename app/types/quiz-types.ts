import type { ReactNode } from "react"

// Quiz types
export type QuizType = "mcq" | "openended" | "blanks" | "code" | "flashcard" | "document"

// Base interfaces
export interface BaseQuizState {
  quizId: string
  quizType: QuizType
  quizSlug: string
  currentQuestion: number
  totalQuestions: number
  startTime: number
  isCompleted: boolean
}

export interface BaseAnswer {
  timeSpent: number
  hintsUsed?: boolean
}

// Specific answer types
export interface MCQAnswer extends BaseAnswer {
  answer: string
  isCorrect: boolean
}

export interface BlankAnswer extends BaseAnswer {
  answer: string
  similarity?: number
}

export interface OpenEndedAnswer extends BaseAnswer {
  answer: string
}

export interface CodeAnswer extends BaseAnswer {
  answer: string
  userAnswer?: string
  isCorrect: boolean
}

export interface FlashcardAnswer extends BaseAnswer {
  isCorrect: boolean
  saved?: boolean
}

// Union type for all answer types
export type QuizAnswer = MCQAnswer | BlankAnswer | OpenEndedAnswer | CodeAnswer | FlashcardAnswer

// Question interfaces
export interface BaseQuestion {
  id: string | number
  question: string
}

export interface MCQQuestion extends BaseQuestion {
  answer: string
  option1: string
  option2: string
  option3: string
}

export interface BlankQuestion extends BaseQuestion {
  answer: string
  hint?: string
}

export interface OpenEndedQuestion extends BaseQuestion {
  answer: string
  hint?: string
}

export interface CodeQuestion extends BaseQuestion {
  answer: string
  starter?: string
  hint?: string
  tests?: string[]
}

export interface FlashcardQuestion extends BaseQuestion {
  answer: string
  hint?: string
}

// Quiz result interfaces
export interface QuizResult {
  quizId: string
  slug: string
  answers: QuizAnswer[]
  totalTime: number
  score: number
  type: QuizType
  totalQuestions: number
  correctAnswers?: number
}

// Performance level interface
export interface PerformanceLevel {
  threshold: number
  color: string
  bgColor: string
  label: string
  message: string
}

// Common props for quiz components
export interface QuizBaseProps {
  quizId: string
  title: string
  slug: string
  type: QuizType
  totalQuestions: number
  children: ReactNode
}

export interface QuizResultBaseProps {
  quizId: string
  title: string
  score: number
  totalQuestions: number
  totalTime: number
  slug: string
  quizType: QuizType
  children: ReactNode
  clearGuestData?: () => void
  isSaving?: boolean
  onSaveComplete?: () => void
  onSaveError?: (error: Error) => void
}

export interface QuizWrapperProps {
  quizState: BaseQuizState
  answers: QuizAnswer[]
  redirectPath: string
  showAuthModal: boolean
  onAuthModalClose: () => void
  children: ReactNode
}
// types.ts
export type QuizType = "mcq" | "blanks" | "flashcards" | "survey"
export type QuizAnimationState = "idle" | "completing" | "showing-results" | "redirecting"

export interface QuizAnswer {
  answer: string
  timeSpent: number
  isCorrect: boolean
}

export interface QuizQuestion {
  id: string
  question: string
  options?: string[]
  correctAnswer?: string
  explanation?: string
}

export interface QuizResult {
  quizId: string
  score: number
  answers: QuizAnswer[]
  completedAt: string
  timeSpent: number
}

export interface QuizProgress {
  currentQuestionIndex: number
  answers: (QuizAnswer | null)[]
  timeSpentPerQuestion: number[]
  lastQuestionChangeTime: number
}

export interface QuizMetadata {
  quizId: string
  slug: string
  title: string
  description: string
  quizType: QuizType
  questionCount: number
  requiresAuth: boolean
}

export interface QuizContextState extends QuizMetadata, QuizProgress {
  isCompleted: boolean
  isLoading: boolean
  isLoadingResults: boolean
  resultsReady: boolean
  error: string | null
  score: number
  animationState: QuizAnimationState
  isProcessingAuth: boolean
  hasGuestResult: boolean
  quizData?: any
}