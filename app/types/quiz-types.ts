import type React from "react"

// Convert QuizType to an enum
// export const QuizType = {
//   MCQ: "mcq",
//   CODE: "code",
//   BLANKS: "blanks",
//   OPENENDED: "openended",
//   FLASHCARD: "flashcard",
//   DOCUMENT: "document",
// } as const

// export type QuizType = (typeof QuizType)[keyof typeof QuizType]
export type QuizType = "mcq" | "blanks" | "code" | "openended" | "flashcard" | "document"

// Base question interface
export interface BaseQuestion {
  id: string | number
  question: string
  explanation?: string
  difficulty?: "easy" | "medium" | "hard"
  tags?: string[]
  timeLimit?: number // in seconds
  points?: number
  category?: string
}

// MCQ question
export interface McqQuestion extends BaseQuestion {
  options: string[]
  correctAnswer: number
  multipleCorrect?: boolean
  correctAnswers?: number[]
}

// Code question
export interface CodeQuestion extends BaseQuestion {
  initialCode?: string
  solution: string
  language: string
  testCases?: {
    input: string
    expectedOutput: string
  }[]
  hints?: string[]
}

// Fill in the blanks question
export interface BlankQuestion extends BaseQuestion {
  text: string
  blanks: string[]
  caseSensitive?: boolean
}

// Open ended question
export interface OpenEndedQuestion extends BaseQuestion {
  modelAnswer: string
  keywords?: string[]
  minWordCount?: number
  maxWordCount?: number
}

// Flashcard question
export interface FlashcardQuestion extends BaseQuestion {
  answer: string
  imageUrl?: string
}

// Document question
export interface DocumentQuestion extends BaseQuestion {
  documentUrl?: string
  pageNumber?: number
}

// Union type for all question types
// export type QuizQuestion =
//   | McqQuestion
//   | CodeQuestion
//   | BlankQuestion
//   | OpenEndedQuestion
//   | FlashcardQuestion
//   | DocumentQuestion

export interface QuizQuestion {
  id: string | number
  question: string
  answer: string
  option1?: string
  option2?: string
  option3?: string
  options?: string[]
}

// Quiz metadata
export interface QuizMetadata {
  createdAt: string
  updatedAt: string
  createdBy: string
  lastAttemptedAt?: string
  completionCount?: number
  averageScore?: number
  averageTimeSpent?: number // in seconds
  difficulty?: "easy" | "medium" | "hard"
  estimatedDuration?: number // in minutes
  category?: string
  tags?: string[]
  isPublic: boolean
  isFeatured?: boolean
  isFavorite?: boolean
  viewCount?: number
  rating?: number
  ratingCount?: number
}

// Quiz data interface
export interface QuizData {
  quizId: string
  title: string
  description?: string
  quizType: QuizType | string
  slug: string
  questions: QuizQuestion[]
  metadata: QuizMetadata
  ownerId?: string
  timeLimit?: number // in minutes, for the entire quiz
  passingScore?: number // minimum score to pass the quiz
  allowReview?: boolean // whether users can review their answers after submission
  randomizeQuestions?: boolean // whether to randomize the order of questions
  showCorrectAnswers?: boolean // whether to show correct answers after submission
  maxAttempts?: number // maximum number of attempts allowed
}

// Consolidated QuizAnswer interface - making isCorrect optional to match quiz-service usage
// export interface QuizAnswer {
//   answer: string | string[]
//   userAnswer?: string | string[]
//   isCorrect: boolean
//   timeSpent: number
//   similarity?: number
//   language?: string
//   codeSnippet?: string
// }

export interface QuizAnswer {
  answer: string
  userAnswer: string
  isCorrect: boolean
  timeSpent: number
  questionId?: string | number
}

// Add the missing BlanksQuizAnswer interface
export interface BlanksQuizAnswer {
  userAnswer: string
  timeSpent: number
  hintsUsed: boolean
  elapsedTime?: number
}

// Add the missing CodeQuizAnswer interface
export interface CodeQuizAnswer {
  answer: string
  userAnswer: string
  isCorrect: boolean
  timeSpent: number
  codeSnippet?: string
  language?: string
}

// Add Question and McqQuizProps from types.ts
export interface Question {
  id: string | number
  question: string
  answer: string
  option1?: string
  option2?: string
  option3?: string
  options?: string[] // Added for flexibility
  title?: string
}

export interface McqQuizProps {
  quizId: string
  slug: string
  title: string
  questions: Question[]
  isPublic: boolean
  isFavorite: boolean
  ownerId?: string
  difficulty?: string
}

// Add QuizListItem from types.ts
export interface QuizListItem {
  id: string
  title: string
  slug: string
  ownerId?: string
  isPublic: boolean
  isFavorite: boolean
  questionCount: number
  createdAt: string
  updatedAt: string
  quizType: QuizType
}

// Add UserQuiz from types.ts
export interface UserQuiz {
  id: string
  title: string
  slug: string
  type: "code" | "mcq" | "openended" | "blanks" | "flashcard" | "document"
  userId: string
  createdAt: Date
  updatedAt: Date
}

// Add QuizState and QuizContextType from types.ts
export interface QuizState {
  currentQuestionIndex: number
  questionCount: number
  isLoading: boolean
  error: string | null
  isCompleted: boolean
  showAuthPrompt: boolean
  answers: (QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer | null)[]
  score: number
  timeSpent: number
}

export interface QuizContextType {
  state: QuizState
  submitAnswer: (answer: string | string[], timeSpent: number, isCorrect: boolean) => void
  completeQuiz: (answers: (QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer)[]) => void
  restartQuiz: () => void
}

// Add CreateQuizResponse from types.ts
export interface CreateQuizResponse {
  userQuizId: string
  slug: string
}

// Add QuizDetailsPageProps from types.ts
export interface QuizDetailsPageProps {
  title: string
  description: string
  slug: string
  quizType: string
  questionCount: number
  estimatedTime: string
  breadcrumbItems: BreadcrumbItem[]
  quizId: string
  authorId: string
  isPublic: boolean
  isFavorite: boolean
  children: React.ReactNode
}

// Add BreadcrumbItem from types.ts
export interface BreadcrumbItem {
  name: string
  href: string
}

// Add FlashCard from types.ts
export interface FlashCard {
  id: string
  question: string
  answer: string
  isSaved: boolean
  createdAt: Date
  updatedAt: Date
}

// Add QueryParams from types.ts
export type QueryParams = {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  orderBy?: "asc" | "desc"
}

// Define a proper QuizDataInput interface for the QuizContext
export interface QuizDataInput {
  // Required fields - support both id and quizId for backward compatibility
  id?: string
  quizId?: string

  // Common fields
  title?: string
  description?: string
  quizType?: QuizType | string
  questions?: Array<Question | QuizQuestion>
  isPublic?: boolean
  isFavorite?: boolean
  userId?: string
  difficulty?: string
  slug?: string

  // Any other properties that might be used
  [key: string]: any
}

// Define a submission type for quiz results
export interface QuizSubmission {
  quizId: string
  slug: string
  type: QuizType | string
  score: number
  answers: (QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer)[]
  totalTime: number
  totalQuestions: number
  completedAt?: string
}

// Define a quiz state storage type
export interface StoredQuizState {
  quizId: string
  type: QuizType | string
  slug: string
  currentQuestion: number
  totalQuestions: number
  startTime: number
  isCompleted: boolean
  answers: (QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer | null)[]
  timeSpentPerQuestion: number[]
}

// Define a quiz result type
// export interface QuizResult {
//   quizId: string
//   slug: string
//   type: QuizType | string
//   score: number
//   answers: (QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer)[]
//   totalTime: number
//   totalQuestions: number
//   completedAt?: string
// }

export interface QuizResult {
  quizId: string
  slug: string
  score: number
  totalQuestions: number
  correctAnswers: number
  totalTimeSpent: number | string
  completedAt: string
  answers: Array<{
    questionId: string | number
    question: string
    selectedOption: string
    correctOption: string
    isCorrect: boolean
    timeSpent: number
  }>
}

// Add a utility type for API responses
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
}

// Add a utility type for quiz completion responses
export interface QuizCompletionResponse extends ApiResponse {
  result?: {
    updatedUserQuiz: any
    quizAttempt: any
    percentageScore: number
    totalQuestions: number
    score: number
    totalTime: number
  }
}
