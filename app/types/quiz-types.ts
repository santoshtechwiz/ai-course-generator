// Common types for all quiz formats
export type QuizType = "mcq" | "code" | "blanks" | "openended"

export interface BaseQuestion {
  id: string
  question: string
  explanation?: string
  points?: number
}

export interface MCQQuestion extends BaseQuestion {
  type: "mcq"
  options: string[]
  correctAnswer: string
}

export interface CodeQuestion extends BaseQuestion {
  type: "code"
  codeSnippet?: string
  language: string
 
  solutionCode?: string
}

export interface BlankQuestion extends BaseQuestion {
  type: "blanks"
  text: string // Text with placeholders like [[blank1]], [[blank2]]
  answers: Record<string, string> // Map of placeholder to correct answer
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: "openended"
  expectedAnswer?: string
  keywords?: string[] // Keywords that should be present in a good answer
  minLength?: number
  maxLength?: number
}

export type QuizQuestion = MCQQuestion | CodeQuestion | BlankQuestion | OpenEndedQuestion

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  isHidden?: boolean
}

export interface QuizData {
  id: string
  title: string
  description: string
  type: QuizType
  difficulty: "easy" | "medium" | "hard" | "expert"
  timeLimit?: number // in minutes
  passingScore?: number // percentage
  questions: QuizQuestion[]
  tags?: string[]
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  isPublic?: boolean
  slug: string
  ownerId?: string
}

export interface UserAnswer {
  questionId: string
  answer: string | Record<string, string>
  isCorrect?: boolean
  points?: number
  feedback?: string
}

export interface QuizResult {
  quizId: string
  userId: string
  score: number
  maxScore: number
  percentage: number
  timeTaken?: number // in seconds
  answers: UserAnswer[]
  feedback?: string
  passedTestCases?: number
  totalTestCases?: number
  submittedAt: string

}

export interface QuizHistoryItem {
  quizId: string
  quizTitle: string
  quizType: QuizType
  score: number
  maxScore: number
  completedAt: string
  slug: string
}
