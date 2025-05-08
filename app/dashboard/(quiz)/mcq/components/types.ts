export interface McqQuizContentProps {
  quizData: any
  slug: string
  userId?: string
  quizId: string
}

export interface McqQuizWrapperProps {
  quizData?: any
  slug: string
  userId?: string
  quizId?: string
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

export interface McqQuestion {
  id: string
  question: string
  options: string[]
  answer: string
}

export interface McqAnswer {
  questionId: string | number
  question: string
  selectedOption: string
  correctOption: string
  isCorrect: boolean
  timeSpent: number
  index: number
}

export interface McqQuizResult {
  quizId: string
  slug: string
  score: number
  totalQuestions: number
  correctAnswers: number
  totalTimeSpent: number
  formattedTimeSpent?: string
  completedAt: string
  answers: McqAnswer[]
}
