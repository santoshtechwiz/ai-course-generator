// Add this to your existing types/quiz.ts file or create it if it doesn't exist

// Define the structure for the quiz state that will be persisted
export interface PersistableQuizState {
  currentQuestion: number
  userAnswers: Array<any> // Replace with proper answer type
  currentQuizId?: string | null
  quizData?: any | null // Replace with proper quiz data type
  timeRemaining?: number
  timerActive?: boolean
}

// Define the structure for auth redirect state
export interface AuthRedirectState {
  slug?: string
  quizId?: string
  type?: string
  userAnswers?: Array<any> // Replace with proper answer type
  currentQuestion?: number
  fromSubmission?: boolean
  path?: string
  timestamp?: number
}

// Define the structure for the text quiz state
export interface TextQuizState {
  quizId: string | null
  title: string | null
  slug: string | null
  currentQuestionIndex: number
  questions: Array<any> // Replace with proper question type
  answers: Array<any> // Replace with proper answer type
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
  questions: any[] // Replace with proper question type
  totalQuestions: number
  completedAt: string
}
