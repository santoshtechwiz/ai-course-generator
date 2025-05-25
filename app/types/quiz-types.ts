// Unified types for both blanks and openended quizzes to match API response
export interface OpenEndedQuestion {
  id: number;
  question: string;
  answer: string;
}

export interface BlankQuizQuestion {
  id: number;
  question: string;
  answer?: string;
  modelAnswer?: string;
}

export interface OpenEndedQuizQuestion {
  id: number;
  question: string;
  answer: string;
  hints?: string[];
  openEndedQuestion?: OpenEndedQuestion;
  type: 'openended';
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

// Enhanced types for better consistency
export interface McqQuestion {
  id: string | number;
  text?: string;
  question?: string;
  options?: Array<{id: string, text: string}> | string[];
  correctOptionId?: string;
  correctAnswer?: string;
  title?: string;
  type?: string;
}

export interface CodeQuizQuestion {
  id: string | number;
  text?: string;
  question?: string;
  codeSnippet?: string;
  options?: string[];
  answer?: string;
  correctAnswer?: string;
  language?: string;
  type?: string;
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

export interface CodeQuizAnswer {
  questionId: string | number;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  timestamp: number;
  type: "code";
}

export interface McqQuizAnswer {
  questionId: string | number;
  selectedOptionId: string;
  isCorrect?: boolean;
  timestamp: number;
  type: "mcq";
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

// Common interface for all quiz results
export interface QuizResult {
  quizId: string | number;
  slug?: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  submittedAt?: string;
  questionResults?: any[];
}

export interface QuizQuestionResult {
  id: string | number;
  question: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface CodeQuizOptionsProps {
  options: string[];
  selectedOption?: string | null;
  onSelect: (option: string) => void;
  disabled?: boolean;
  renderOptionContent?: (option: string) => React.ReactNode;
}

// Type guard
export function isOpenEndedQuestion(q: any): q is OpenEndedQuestion {
  return typeof q === "object" && typeof q.answer === "string";
}
