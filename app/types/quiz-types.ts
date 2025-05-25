// Unified types for both blanks and openended quizzes to match API response
export interface OpenEndedQuestion {
  id: number;
  question: string;
  answer: string;
}

export interface BlankQuizQuestion {
  id: number;
  question: string;
  answer: string;
  openEndedQuestion?: OpenEndedQuestion;
}

export interface OpenEndedQuizQuestion {
  id: number;
  question: string;
  answer: string;
  hints?: string[];
  openEndedQuestion?: OpenEndedQuestion;
}

export interface QuizData {
  id: number;
  slug: string;
  type: 'blanks' | 'openended' | 'mcq' | 'code';
  title: string;
  questions: BlankQuizQuestion[] | OpenEndedQuizQuestion[];
  userId: string;
}

export interface BlankQuizData extends QuizData {
  type: 'blanks';
  questions: BlankQuizQuestion[];
}

export interface OpenEndedQuizData extends QuizData {
  type: 'openended';
  questions: OpenEndedQuizQuestion[];
}

// Answer types
export interface BlankQuizAnswer {
  questionId: number;
  filledBlanks: Record<string, string>;
  timestamp: number;
}

export interface OpenEndedQuizAnswer {
  questionId: number;
  text: string;
  timestamp: number;
}

export type QuizAnswer = BlankQuizAnswer | OpenEndedQuizAnswer;

// Redux state types
export interface QuizState {
  quizId: string | number | null;
  quizType: string | null;
  title: string | null;
  questions: (BlankQuizQuestion | OpenEndedQuizQuestion)[];
  currentQuestionIndex: number;
  answers: Record<string | number, QuizAnswer>;
  status: 'idle' | 'loading' | 'submitting' | 'error';
  error: string | null;
  isQuizComplete: boolean;
  results: any | null;
}

// Authentication types
export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

// Quiz result types
export interface QuizResult {
  quizId: string | number;
  slug: string;
  title: string;
  score: number;
  maxScore: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  completedAt: string;
  questionResults?: Array<{
    questionId: number | string;
    isCorrect: boolean;
    userAnswer: any;
    correctAnswer: string;
  }>;
}
