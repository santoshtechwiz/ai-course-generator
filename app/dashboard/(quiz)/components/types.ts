export interface Question {
  id: number
  question: string
  answer: string
  option1: string
  option2: string
  option3: string
}

export interface McqQuizProps {
  quizId: number | string
  slug: string
  title: string
  questions: Question[]
  isPublic: boolean
  isFavorite: boolean
  ownerId?: string
}
