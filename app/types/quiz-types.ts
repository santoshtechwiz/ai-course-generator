// Unify the quiz types to ensure consistency across the application

export type QuizType = 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard';

// Base question type with common properties
export interface BaseQuestion {
  id: string;
  question: string;
  type: QuizType;
}

// Specific question types
export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: string[];
  correctAnswer?: string;
  answer?: string;
}

export interface CodeQuizQuestion extends BaseQuestion {
  type: 'code';
  codeSnippet?: string;
  options?: string[];
  answer?: string;
  correctAnswer?: string;
  language?: string;
}

export interface BlankQuestion extends BaseQuestion {
  type: 'blanks';
  text: string;
  blanks: Record<string, string>;
  correctAnswers?: Record<string, string>;
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: 'openended';
  modelAnswer?: string;
}

// Union type for all question types
export type QuizQuestion = MCQQuestion | CodeQuizQuestion | BlankQuestion | OpenEndedQuestion;

// Answer data structure
export interface UserAnswer {
  questionId: string | number;
  answer: any;
  isCorrect?: boolean;
  timeSpent?: number;
}

// Quiz data structure
export interface QuizData {
  id: string;
  title: string;
  slug: string;
  type: QuizType;
  questions: QuizQuestion[];
  isPublic?: boolean;
  isFavorite?: boolean;
  userId?: string;
  ownerId?: string;
  timeLimit?: number | null;
  description?: string;
}

// Quiz result
/**
 * Interface for quiz result details
 */
export interface QuizResult {
  quizId: string;
  slug: string;
  title: string;
  score: number;
  maxScore: number;
  percentage?: number;
  completedAt?: string;
  questions: Array<{
    id: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

// Quiz history item
export interface QuizHistoryItem {
  id?: string;
  quizId?: string;
  quizTitle: string;
  quizType: QuizType;
  score: number;
  maxScore: number;
  percentage?: number;
  completedAt: string;
  slug: string;
}

// Quiz state interface
export interface QuizState {
  quizData: QuizData | null;
  currentQuestion: number;
  userAnswers: UserAnswer[];
  isLoading: boolean;
  isSubmitting: boolean;
  isCompleted: boolean;
  timerActive: boolean;
  timeRemaining: number | null;
  currentQuizId: string | null;
  results: QuizResult | null;
  quizHistory: QuizHistoryItem[];

  submissionStateInProgress: boolean;

  quizError: string | null;
  submissionError: string | null;
  resultsError: string | null;
  historyError: string | null;

  // For legacy/test compatibility
  error?: string | null;
}
