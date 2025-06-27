/**
 * Comprehensive type definitions for quiz entities
 */

// Quiz question types
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
  language: string;
  codeSnippet: string;
  options: string[];
  correctAnswer: string;
}

export interface BlankQuestion extends BaseQuestion {
  type: 'blanks';
  question: string; // Text with ________ for blanks
  answer: string;   // Correct answer
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: 'openended';
  keywords?: string[]; // Optional keywords to check against
  modelAnswer?: string; // Reference answer for comparison
  userAnswer?: string; // User's answer for grading
}

export type QuizQuestion = 
  | MCQQuestion 
  | CodeQuestion 
  | BlankQuestion 
  | OpenEndedQuestion;

// User answer types
export interface BaseAnswer {
  questionId: string;
  timeSpent: number;
}

export interface MCQAnswer extends BaseAnswer {
  selectedOptionId: string;
  isCorrect: boolean;
}

export interface CodeAnswer extends BaseAnswer {
  code: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

export interface BlankAnswer extends BaseAnswer {
  userAnswer: string;
  similarity?: number;
}

export interface OpenEndedAnswer extends BaseAnswer {
  text: string;
  similarity?: number;
}

export type QuizAnswer = 
  | MCQAnswer 
  | CodeAnswer 
  | BlankAnswer 
  | OpenEndedAnswer;

// Quiz types
export type QuizType = 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard';

// Quiz state for Redux
export interface QuizState {
  slug: string | null;
  quizId: string | null;
  quizType: QuizType | null;
  title: string;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, QuizAnswer>;
  isCompleted: boolean;
  results: QuizResult | null;
  error: string | null;
  status: "idle" | "loading" | "succeeded" | "failed" | "submitting";
  sessionId: string | null;
  isSaving: boolean;
  isSaved: boolean;
  saveError: string | null;
}

// Quiz result type
export interface QuizResult {
  slug: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  questions: QuizQuestion[];
  questionResults: Array<{
    questionId: string;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    similarity?: number;
  }>;
}
