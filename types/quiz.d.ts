// Add this to your existing types/quiz.ts file or create it if it doesn't exist

// Define proper answer types
export type QuizAnswerValue = string | number | boolean | string[] | Record<string, unknown>

// Define the structure for the quiz state that will be persisted
export interface PersistableQuizState {
  currentQuestion: number
  userAnswers: Array<QuizAnswerValue>
  currentQuizId?: string | null
  quizData?: QuizData | null
  timeRemaining?: number
  timerActive?: boolean
}

// Define the structure for auth redirect state
export interface AuthRedirectState {
  slug?: string
  quizId?: string
  type?: string
  userAnswers?: Array<QuizAnswerValue>
  currentQuestion?: number
  fromSubmission?: boolean
  path?: string
  timestamp?: number
}

// Define base question interface
export interface BaseQuestion {
  id: string | number
  question: string
  type: string
  difficulty?: string
  tags?: string[]
}

// Define quiz data interface
export interface QuizData {
  id: string
  title: string
  slug: string
  questions: BaseQuestion[]
  type: string
  userId?: string
}

// Define the structure for the text quiz state
export interface TextQuizState {
  quizId: string | null
  title: string | null
  slug: string | null
  currentQuestionIndex: number
  questions: Array<BaseQuestion>
  answers: Array<QuizAnswerValue>
  status: "idle" | "active" | "answering" | "completed" | "error"
  error: string | null
  startTime: string | null
  completedAt: string | null
  score: number | null
  resultsSaved: boolean
  isCompleted?: boolean
}

// Define the structure for quiz answers
export interface QuizAnswer {
  questionId: string | number
  question: string
  answer: string
  timeSpent?: number
  hintsUsed?: boolean
}

// Define the structure for open-ended questions
export interface OpenEndedQuestion {
  id: string | number
  question: string
  answer: string
  openEndedQuestion?: {
    hints?: string | string[]
    difficulty?: string
    tags?: string | string[]
    inputType?: string
  }
}

// Define the structure for open-ended quiz data
export interface OpenEndedQuizData {
  id: string
  title: string
  questions: OpenEndedQuestion[]
  slug?: string
  userId?: string
  type?: "openended"
}

// Define the structure for quiz results
export interface QuizResult {
  quizId: string
  slug: string
  answers: QuizAnswer[]
  questions: BaseQuestion[]
  totalQuestions: number
  completedAt: string
}
