// Centralized type definitions for quiz functionality

// Quiz types
export type QuizType = 'mcq' | 'code' | 'blanks' | 'openended';

// Question types
export interface BaseQuestion {
  id: string;
  text: string;
  type: QuizType;
}

export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: Array<{
    id: string;
    text: string;
  }>;
  correctOptionId: string;
}

export interface CodeQuestion extends BaseQuestion {
  type: 'code';
  question: string;
  codeSnippet?: string;
  language: string;
  correctAnswer: string;
  explanation?: string;
}

export interface BlanksQuestion extends BaseQuestion {
  type: 'blanks';
  textWithBlanks: string;
  blanks: Array<{
    id: string;
    correctAnswer: string;
  }>;
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: 'openended';
  modelAnswer?: string;
  keywords?: string[];
}

export type Question = MCQQuestion | CodeQuestion | BlanksQuestion | OpenEndedQuestion;

// Answer types
export interface BaseAnswer {
  questionId: string;
  timestamp: number;
}

export interface MCQAnswer extends BaseAnswer {
  selectedOptionId: string;
}

export interface CodeAnswer extends BaseAnswer {
  answer: string;
  isCorrect?: boolean;
  timeSpent?: number;
}

export interface BlanksAnswer extends BaseAnswer {
  filledBlanks: Record<string, string>;
}

export interface OpenEndedAnswer extends BaseAnswer {
  text: string;
}

export type Answer = MCQAnswer | CodeAnswer | BlanksAnswer | OpenEndedAnswer;

// Results type
export interface QuizResults {
  score: number;
  maxScore: number;
  percentage: number;
  questionResults: Array<{
    questionId: string;
    correct: boolean;
    feedback?: string;
    score?: number;
  }>;
  submittedAt: number;
}

// Auth redirect state
export interface AuthRedirectState {
  slug: string;
  quizId: string;
  type: string;
  answers: Record<string, Answer>;
  currentQuestionIndex: number;
  tempResults: any;
}

// Quiz state interface
export interface QuizState {
  // Quiz metadata
  quizId: string | null;
  quizType: QuizType | null;
  title: string | null;
  description: string | null;

  // Quiz content
  questions: Question[];
  totalQuestions: number;

  // Quiz progress
  currentQuestionIndex: number;
  answers: Record<string, Answer>;

  // Quiz status
  status: 'idle' | 'loading' | 'submitting' | 'submitted' | 'error';
  error: string | null;

  // Quiz results
  results: QuizResults | null;

  // Session management
  sessionId: string | null;
  lastSaved: number | null;

  // Auth redirect state
  authRedirectState: AuthRedirectState | null;
}
