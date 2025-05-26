export interface McqQuestion {
  id: string | number
  title?: string
  text?: string // Some questions use text
  question?: string // Some questions use question
  options: Array<string | { id: string; text: string }>
  answer?: string
  correctOptionId?: string
  correctAnswer?: string
  explanation?: string
  type?: string
}

export interface QuizResultsPreview {
  score: number
  maxScore: number
  percentage: number
  submittedAt: string
}
