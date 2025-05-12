export interface BlanksQuizContentProps {
  quizData: any
  slug: string
  userId?: string
  quizId: string
}

export interface BlanksQuizWrapperProps {
  quizData?: any
  slug: string
  userId?: string
  quizId?: string
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

export interface BlanksQuestion {
  id: string
  question: string
  answer?: string
  hints?: string[]
}

export interface BlanksAnswer {
  questionId: string | number
  question: string
  answer: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  timeSpent: number
  similarity?: number
  hintsUsed?: boolean
  index: number
}

export interface BlanksQuizResult {
  quizId: string
  slug: string
  score: number
  totalQuestions: number
  correctAnswers: number
  totalTimeSpent: number
  formattedTimeSpent?: string
  completedAt: string
  answers: BlanksAnswer[]
}
