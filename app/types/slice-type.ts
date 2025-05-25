/**
 * Redux slice related types
 */
import type { Question } from "@/lib/quiz-store"
import type { PersistPartial } from "redux-persist/es/persistReducer"
import { QuizType } from "./quiz-types"

// Define the animation states
export type AnimationState = "idle" | "answering" | "completed"

// Define the answer type
export interface Answer {
  answer: string
  timeSpent: number
  isCorrect: boolean
  questionId?: string | number
  userAnswer?: string
  index?: number
  hintsUsed?: boolean
  similarity?: number
  codeSnippet?: string
  language?: string
}

// Define the saved state type
export interface SavedQuizState {
  quizId?: string
  slug?: string
  quizType?: string
  currentQuestionIndex?: number
  answers?: Answer[]
  isCompleted?: boolean
  score?: number
  completedAt?: string
}

// Define the quiz state
export interface QuizState {
  quizId: string
  slug: string
  title: string
  quizType: QuizType | string
  questions: Question[]
  currentQuestionIndex: number
  answers: Answer[]
  timeSpent: number[]
  isCompleted: boolean
  score: number
  requiresAuth: boolean
  pendingAuthRequired: boolean
  authCheckComplete: boolean
  error: string | null
  animationState: AnimationState
  isSavingResults: boolean
  resultsSaved: boolean
  completedAt: string | null
  startTime: number
  savedState: SavedQuizState | null
  isLoading: boolean
}

// Define the quiz state with persist partial
export type PersistedQuizState = QuizState & PersistPartial

// Define the auth state
export interface AuthState {
  isAuthenticated: boolean
  isProcessingAuth: boolean
  redirectUrl: string
  user: any
}

// Define the input types for the hook's methods
export interface QuizInitializeInput {
  id?: string
  quizId?: string
  slug?: string
  title?: string
  quizType?: QuizType | string
  questions?: Question[]
  requiresAuth?: boolean
  [key: string]: any
}

export interface CompleteQuizInput {
  answers?: Answer[]
  score?: number
  completedAt?: string
}

export interface SubmitResultsInput {
  quizId: string
  slug: string
  quizType: string
  answers: Answer[]
  score: number
}

// Define the return type of the hook
export interface UseQuizReturn {
  quizState: PersistedQuizState
  authState: AuthState
  isAuthenticated: boolean
  isLoading: boolean
  initialize: (quizData: QuizInitializeInput) => void
  submitAnswer: (answerData: Answer) => void
  nextQuestion: () => void
  completeQuiz: (data?: CompleteQuizInput) => Promise<boolean>
  restartQuiz: () => void
  submitResults: (data: SubmitResultsInput) => Promise<any>
  requireAuthentication: (redirectUrl: string) => void
  restoreState: () => (() => void) | undefined
}

/**
 * Redux slice related types
 */
// Text quiz state interface
export interface TextQuizState {
  id: string | null
  title: string
  quizType: QuizType | null
  status: "idle" | "loading" | "success" | "error" | "submitting"
  error: string | null
  questions: QuizQuestion[]
  currentQuestionIndex: number
  answers: Record<string, QuizAnswer>
  completed: boolean
  score: number | null
  startTime: number | null
  endTime: number | null
}

// Quiz question interface
export interface QuizQuestion {
  id: string
  text: string
  type: QuizType
  options?: string[]
  answer?: string
  modelAnswer?: string
  keywords?: string[]
  codeSnippet?: string
}

// Quiz answer interface
export interface QuizAnswer {
  questionId: string
  text: string
  timestamp: number
  isCorrect?: boolean
  timeSpent?: number
}
