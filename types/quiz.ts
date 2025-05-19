export interface QuizQuestion {
  id: string | number
  question: string
  answer: string
  openEndedQuestion?: {
    hints?: string[]
    difficulty?: 'easy' | 'medium' | 'hard'
    tags?: string[]
    inputType?: string
  }
}

export interface QuizAnswer {
  questionId: string | number
  question: string
  answer: string
  correctAnswer: string
  timeSpent: number
  hintsUsed: boolean
  index: number
  similarity?: number
}

export interface QuizResult {
  quizId: string
  slug: string
  answers: QuizAnswer[]
  questions: QuizQuestion[]
  totalQuestions: number
  completedAt: string
}

export interface QuizResultView {
  quizId: string
  slug: string
  answers: QuizAnswer[]
  questions: QuizQuestion[]
  totalQuestions: number
  completedAt: string
}

export interface QuizState {
  quizId: string | null
  currentQuestionIndex: number
  questions: QuizQuestion[]
  answers: QuizAnswer[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  startTime: number | null
  completedAt: string | null
}

export interface TextQuizState {
  quizId: string | null
  title: string | null
  slug: string | null
  currentQuestionIndex: number
  questions: QuizQuestion[]
  answers: QuizAnswer[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  startTime: number | null
  completedAt: string | null
  score: number | null
  resultsSaved: boolean
}

export type QuizType = 'mcq' | 'openended' | 'code' | 'blanks'

export interface QuizData {
  id: string | number
  title: string
  userId: string
  questions: QuizQuestion[]
  isPublic?: boolean
}

export interface OpenEndedQuestion {
  id: string | number
  question: string
  answer: string
  openEndedQuestion?: {
    hints?: string[]
    difficulty?: 'easy' | 'medium' | 'hard'
    tags?: string[]
    inputType?: string
  }
}

export interface OpenEndedQuizData {
  id: string | number
  title: string
  userId: string
  questions: OpenEndedQuestion[]
  isPublic?: boolean
}
