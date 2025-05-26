// Centralized type definitions for quiz functionality

// Quiz types
export type QuizType = "mcq" | "code" | "blanks" | "openended"

// Question types
export interface BaseQuestion {
  id: string
  text: string
  type: QuizType
  isQuizComplete?: boolean
}

export interface MCQQuestion extends BaseQuestion {
  type: "mcq"
  options: Array<{
    id: string
    text: string
  }>
  correctOptionId: string
}

export interface CodeQuestion extends BaseQuestion {
  type: "code"
  language: string
  correctAnswer: string
  explanation?: string
  codeSnippet?: string
  // Removed duplicate 'question' field as 'text' from BaseQuestion serves the same purpose
}

export interface BlanksQuestion extends BaseQuestion {
  type: "blanks"
  textWithBlanks: string
  blanks: Array<{
    id: string
    correctAnswer: string
  }>
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: "openended"
  modelAnswer?: string
  keywords?: string[]
}

export type Question = MCQQuestion | CodeQuestion | BlanksQuestion | OpenEndedQuestion

// Answer types
export interface BaseAnswer {
  questionId: string
  timestamp: number
}

export interface MCQAnswer extends BaseAnswer {
  type: "mcq" // Added type discriminator for better type safety
  selectedOptionId: string
}

export interface CodeAnswer extends BaseAnswer {
  type: "code" // Added type discriminator
  answer: string
  isCorrect?: boolean
  timeSpent?: number
}

export interface BlanksAnswer extends BaseAnswer {
  type: "blanks" // Added type discriminator
  filledBlanks: Record<string, string>
}

export interface OpenEndedAnswer extends BaseAnswer {
  type: "openended" // Added type discriminator
  text: string
}

export type Answer = MCQAnswer | CodeAnswer | BlanksAnswer | OpenEndedAnswer

// Results type
export interface QuizResults {
  score: number
  maxScore: number
  percentage: number
  questionResults: Array<{
    questionId: string
    correct: boolean
    feedback?: string
    score?: number
  }>
  submittedAt: number
}

// Auth redirect state
export interface AuthRedirectState {
  slug: string
  quizId: string
  type: string
  answers: Record<string, Answer>
  currentQuestionIndex: number
  tempResults: QuizResults | null // Changed 'any' to a more specific type
}

// Quiz answer interface
export interface QuizAnswer {
  questionId: string | number
  selectedOption?: string
  selectedOptionId?: string
  text?: string
  filledBlanks?: Record<string, string>
  timestamp?: number
  type?: string
  isCorrect?: boolean
}

// Quiz state interface
export interface QuizState {
  quizId: string | number | null
  quizType: string | null
  title: string | null
  questions: any[]
  currentQuestionIndex: number
  answers: Record<string | number, QuizAnswer>
  status: "idle" | "loading" | "submitting" | "error"
  error: string | null
  isCompleted: boolean
  results: any
  sessionId: string
  quizData?: any
  description: string | null
  totalQuestions: number
  lastSaved: number | null
  authRedirectState: any
}
