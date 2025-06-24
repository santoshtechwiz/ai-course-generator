
// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

 export interface QuestionOption {
  id?: string
  text?: string
  value?: string
}

export interface ProcessedAnswer {
  questionId: string
  question: string
  userAnswer: string
  userAnswerId: string
  correctAnswer: string
  correctAnswerId: string
  isCorrect: boolean
  type: string
  options: QuestionOption[]
  allOptions: QuestionOption[]
  explanation?: string
  difficulty?: string
  category?: string
  timeSpent?: number
}

export interface McqQuizResultProps {
  result: {
    title?: string
    slug?: string
    quizId?: string
    score: number
    maxScore: number
    percentage: number
    completedAt?: string
    submittedAt?: string
    totalTime?: number
    questions?: Array<any>
    answers?: Array<any>
    questionResults: Array<{
      questionId: string
      question: string
      userAnswer: string
      correctAnswer: string
      isCorrect: boolean
      type: string
      options?: Array<QuestionOption>
      selectedOptionId?: string
    }>
  }
  onRetake?: () => void
}