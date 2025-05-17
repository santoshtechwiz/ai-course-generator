import type React from "react"
import { QuizQuestion, QuizData } from "./quiz-types";

// API response structure from code-quiz endpoint
export interface CodeQuizApiResponse {
  quizId: string
  quizData: CodeQuizData
  isPublic: boolean
  isFavorite: boolean
  ownerId: string
}

// Structure for a code quiz question
export interface CodeQuizQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options?: string[];
  answer?: string;
  correctAnswer?: string;
  language?: string;
  type: 'code'; // Add the missing type property
}

// Structure for code quiz data
export interface CodeQuizData {
  id: string
  title: string
  description?: string
  slug: string
  type: 'code';
  questions: CodeQuizQuestion[];
  timeLimit?: number | null;
  isPublic?: boolean;
  isFavorite?: boolean;
  userId?: string;
  ownerId?: string;
  difficulty?: string
}

// Props for the CodeQuizWrapper component
export interface CodeQuizWrapperProps {
  quizData: CodeQuizData
  slug: string
  userId?: string
  quizId: string
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

// Add validation helper
export const isValidCodeQuizQuestion = (question: any): question is CodeQuizQuestion => {
  return (
    typeof question === "object" &&
    typeof question.question === "string" &&
    typeof question.answer === "string" &&
    (!question.language || typeof question.language === "string") &&
    (!question.codeSnippet || typeof question.codeSnippet === "string") &&
    (!question.options || Array.isArray(question.options))
  )
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

export interface CodeQuizResultData {
  quizId: string
  slug: string
  score: number
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  totalTimeSpent: number
  formattedTimeSpent: string
  completedAt: string,
  answers: Array<{
    questionId: string
    question: string
    userAnswer?: string
    correctAnswer?: string
    isCorrect: boolean
    timeSpent: number
    codeSnippet?: string
    language?: string
  }>
}