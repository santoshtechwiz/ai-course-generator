export interface CodeQuizQuestion {
  id?: string | number
  question: string
  options?: string[]
  codeSnippet?: string
  language?: string
  correctAnswer?: string
  answer?: string
}

export interface CodeQuizData {
  title: string
  questions: CodeQuizQuestion[]
}

export interface CodeQuizApiResponse {
  id?: string | number
  quizId: string | number
  userId: string
  ownerId: string
  isFavorite: boolean
  isPublic: boolean
  slug: string
  title?: string
  quizData?: CodeQuizData
  questions?: CodeQuizQuestion[]
}

export interface CodeQuizWrapperProps {
  quizData: CodeQuizApiResponse
  slug: string
  userId: string | null
  quizId: string | number
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

export interface CodeQuizResultProps {
  result: {
    quizId: string | number
    slug: string
    score: number
    totalQuestions: number
    correctAnswers: number
    totalTimeSpent: number
    formattedTimeSpent: string
    completedAt: string
    answers: Array<{
      questionId: string | number
      question: string
      answer: string
      isCorrect: boolean
      timeSpent: number
      codeSnippet?: string
      language?: string
    }>
  }
}
