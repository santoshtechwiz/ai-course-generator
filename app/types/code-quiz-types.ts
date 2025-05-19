import type React from "react"
import { QuizType } from "./quiz-types"

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
  type: 'code';
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
  createdAt?: string;
  updatedAt?: string;
}

// Define CodeQuizSubmission interface
export interface CodeQuizSubmission {
  id?: string;
  quizId: string;
  userId?: string;
  score: number;
  maxScore: number;
  percentage: number;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect?: boolean;
  }>;
  completed: boolean;
  completedAt?: string;
  timeTaken?: number;
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
  score: number
  maxScore: number
  onRetry?: () => void
}