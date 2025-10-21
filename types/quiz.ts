export interface QuizProgress {
  currentQuestionIndex: number
  answers: Record<string, any>
  startTime: Date
  lastUpdated: Date
  completed: boolean
  score?: number
  passed?: boolean
}

interface QuizState {
  currentQuiz: any | null
  progress: QuizProgress | null
  loading: boolean
  error: string | null
  results: any | null
}

interface QuizAnswer {
  questionId: string
  answer: any
  isCorrect?: boolean
}

interface QuizSubmission {
  quizId: string
  answers: QuizAnswer[]
  score: number
  passed: boolean
  completedAt: Date
}