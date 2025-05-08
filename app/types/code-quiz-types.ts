import type React from "react"

// API response structure from code-quiz endpoint
export interface CodeQuizApiResponse {
  isFavorite: boolean
  isPublic: boolean
  slug: string
  quizId: string
  userId: string
  ownerId: string
  quizData: {
    id: string;
    title: string;
    slug: string;
    isPublic: boolean;
    isFavorite: boolean;
    userId?: string;
    ownerId?: string;
    difficulty?: string;
    questions: CodeQuizQuestion[]
  }
}

// Structure for a code quiz question
export interface CodeQuizQuestion {
  id?: string
  question: string
  options: string[]
  codeSnippet?: string
  language?: string
  answer: string
  correctAnswer?: string
  explanation?: string
  difficulty?: string
  timeLimit?: number
}

// Props for the CodeQuizWrapper component
export interface CodeQuizWrapperProps {
  quizData: {
    id: string
    title: string
    slug: string
    isPublic: boolean
    isFavorite: boolean
    userId?: string
    ownerId?: string
    difficulty?: string
    questions: CodeQuizQuestion[]
  }
  slug: string
  userId?: string
  quizId: string
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

// Props for the CodingQuiz component
export interface CodingQuizProps {
  question: CodeQuizQuestion
  onAnswer: (answer: string, timeSpent: number, isCorrect: boolean) => void
  questionNumber: number
  totalQuestions: number
}

// Props for the CodeQuizResult component
export interface CodeQuizResultProps {
  title: string
  onRestart: () => void
  quizId: string
  questions?: CodeQuizQuestion[]
  answers?: Array<{
    answer: string
    timeSpent: number
    isCorrect: boolean
    userAnswer?: string
    language?: string
  } | null>
  score?: number
  isGuestMode?: boolean
}

// Props for the CodeQuizEditor component
export interface CodeQuizEditorProps {
  value: string
  language: string
  readOnly?: boolean
  onChange?: (value: string | undefined) => void
}

// Props for the CodeQuizOptions component
export interface CodeQuizOptionsProps {
  options: string[]
  selectedOption: string | null
  onSelect: (option: string) => void
  disabled?: boolean
  renderOptionContent?: (option: string) => React.ReactNode
}

// Props for the CodeQuizContent component
export interface CodeQuizContentProps {
  quizData: {
    id: string
    title: string
    slug: string
    isPublic: boolean
    isFavorite: boolean
    userId?: string
    ownerId?: string
    difficulty?: string
    questions: CodeQuizQuestion[]
  }
  slug: string
  userId?: string
  quizId: string
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}
