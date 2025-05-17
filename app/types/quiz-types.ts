// Unify the quiz types to ensure consistency across the application

export type QuizType = 'mcq' | 'code' | 'blanks' | 'openended';

// Base question interface that all question types should implement
export interface BaseQuestion {
  id: string;
  question: string;
  type: QuizType;
}

// Multiple choice question
export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: string[];
  correctAnswer: string;
}

// Code question
export interface CodeQuestion extends BaseQuestion {
  type: 'code';
  codeSnippet?: string;
  options?: string[];
  answer?: string;
  correctAnswer?: string;
  language?: string;
}

// Fill in the blanks question
export interface BlankQuestion extends BaseQuestion {
  type: 'blanks';
  text: string;
  blanks: Record<string, string>;
}

// Open ended question
export interface OpenEndedQuestion extends BaseQuestion {
  type: 'openended';
  answer?: string;
  keywords?: string[];
  maxScore?: number;
}

// Union of all question types
export type QuizQuestion = MCQQuestion | CodeQuestion | BlankQuestion | OpenEndedQuestion;

// Answer data structure
export interface UserAnswer {
  questionId: string;
  answer: string | Record<string, string>;
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
  ownerId?: string;
  userId?: string;
  timeLimit?: number | null;
  description?: string;
}

// Quiz result
export interface QuizResult {
  quizId: string;
  userId?: string;
  slug: string;
  title: string;
  score: number;
  maxScore: number;
  percentage?: number;
  submittedAt?: string;
  completedAt?: string;
  questions: Array<{
    id: string;
    question: string;
    userAnswer: string | Record<string, string>;
    correctAnswer: string | Record<string, string>;
    isCorrect: boolean;
  }>;
  answers?: UserAnswer[];
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
