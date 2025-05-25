// Unified quiz types for the entire application
export type QuizType = 'blanks' | 'openended' | 'mcq' | 'code' | 'flashcard';

// Base question interface that all quiz question types extend
export interface BaseQuestion {
  id: string | number;
  question?: string;
  text?: string;
  type?: string;
  answer?: string;
  correctAnswer?: string;
}

// Open ended questions
export interface OpenEndedQuestion extends BaseQuestion {
  id: number;
  question: string;
  answer: string;
  hints?: string[];
  type: 'openended';
}

// Fill in the blanks questions
export interface BlankQuizQuestion extends BaseQuestion {
  id: number;
  question: string;
  answer?: string;
  modelAnswer?: string;
  type?: 'blanks';
}

// Multiple choice questions
export interface McqQuestion extends BaseQuestion {
  id: string | number;
  text?: string;
  question?: string;
  options?: Array<{id: string, text: string}> | string[];
  correctOptionId?: string;
  correctAnswer?: string;
  title?: string;
  type?: 'mcq';
}

// Code quiz questions
export interface CodeQuizQuestion extends BaseQuestion {
  id: string | number;
  text?: string;
  question?: string;
  codeSnippet?: string;
  options?: string[];
  answer?: string;
  correctAnswer?: string;
  language?: string;
  type?: 'code';
}

// Quiz data structure
export interface QuizData {
  id: number | string;
  slug: string;
  type: QuizType;
  title: string;
  questions: QuizQuestion[];
  userId?: string;
}

// Union type for all question types
export type QuizQuestion = BlankQuizQuestion | OpenEndedQuestion | McqQuestion | CodeQuizQuestion;

// Answer types
export interface BaseAnswer {
  questionId: string | number;
  timestamp: number;
  type?: QuizType;
}

export interface BlankQuizAnswer extends BaseAnswer {
  filledBlanks: Record<string, string>;
  type: 'blanks';
}

export interface OpenEndedQuizAnswer extends BaseAnswer {
  text: string;
  type: 'openended';
}

export interface McqQuizAnswer extends BaseAnswer {
  selectedOptionId: string;
  isCorrect?: boolean;
  type: 'mcq';
}

export interface CodeQuizAnswer extends BaseAnswer {
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  type: 'code';
}

// Union type for all answer types
export type UserAnswer = BlankQuizAnswer | OpenEndedQuizAnswer | McqQuizAnswer | CodeQuizAnswer;

// Redux state types
export interface QuizState {
  quizId: string | number | null;
  quizType: QuizType | null;
  title: string | null;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: Record<string | number, UserAnswer>;
  status: 'idle' | 'loading' | 'submitting' | 'error';
  error: string | null;
  isCompleted: boolean;
  results: QuizResult | null;
  sessionId?: string;
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
  slug?: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  submittedAt?: string;
  questionResults?: QuizQuestionResult[];
  type?: QuizType;
}

export interface QuizResultPreview {
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  slug: string;
  type?: QuizType;
}

export interface QuizQuestionResult {
  id: string | number;
  question: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

// Component prop types
export interface CodeQuizOptionsProps {
  options: string[];
  selectedOption?: string | null;
  onSelect: (option: string) => void;
  disabled?: boolean;
  renderOptionContent?: (option: string) => React.ReactNode;
}

// Type guard functions
export function isOpenEndedQuestion(q: any): q is OpenEndedQuestion {
  return typeof q === "object" && q.type === "openended";
}

export function isBlankQuestion(q: any): q is BlankQuizQuestion {
  return typeof q === "object" && q.type === "blanks";
}

export function isMcqQuestion(q: any): q is McqQuestion {
  return typeof q === "object" && q.type === "mcq";
}

export function isCodeQuestion(q: any): q is CodeQuizQuestion {
  return typeof q === "object" && q.type === "code";
}

// User quiz attempt from user-types.ts
export interface UserQuizAttempt {
  id: string | number;
  userId: string;
  userQuizId: number;
  score?: number;
  timeSpent?: number;
  improvement?: number;
  accuracy?: number;
  createdAt: Date;
  updatedAt: Date;
  attemptQuestions?: AttemptQuestion[];
  userQuiz?: {
    id: number;
    title: string;
    quizType?: string;
    difficulty?: string;
    questions?: QuizQuestion[];
  }
}

export interface AttemptQuestion {
  id: number;
  questionId: number;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpent: number;
}
