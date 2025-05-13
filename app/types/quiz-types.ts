/**
 * Common quiz types and interfaces to ensure consistency across the application
 */

export type QuizType = "mcq" | "openended" | "fill-blanks" | "code" | "flashcard";

export type QuizDifficulty = "beginner" | "easy" | "intermediate" | "medium" | "advanced" | "hard" | "expert";

export interface BaseQuiz {
  id: string;
  title: string;
  slug: string;
}

export interface QuizInfo extends BaseQuiz {
  description?: string;
  quizType: QuizType;
  difficulty?: QuizDifficulty;
  questionCount: number;
  estimatedTime?: string | number;
  duration?: number;
  bestScore?: number | null;
  completionRate?: number;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  isFavorite?: boolean;
  authorId?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: number | string;
  answer?: string;
  codeSnippet?: string;
  language?: string;
  explanation?: string;
  hints?: string[];
}

export interface QuizAnswer {
  questionId: string | number;
  question?: string;
  answer?: string;
  selectedOption?: number;
  userAnswer?: string;
  isCorrect: boolean;
  timeSpent: number;
  hintsUsed?: boolean | number;
  index?: number;
}

export interface BlanksQuizAnswer extends QuizAnswer {
  answers?: string[];
  userAnswer: string | string[];
  correctAnswers?: string[];
}

export interface CodeQuizAnswer extends QuizAnswer {
  codeSnippet?: string;
  language?: string;
  errorMessage?: string;
  executionResult?: any;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  timeSpent: number;
  accuracy: number;
  completedAt: string;
  improvement?: number;
  attemptQuestions: QuizQuestion[];
}

export interface QuizResult {
  quizId: string;
  slug: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  totalTimeSpent: number;
  formattedTimeSpent?: string;
  completedAt: string;
  answers: (QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer)[];
}

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
