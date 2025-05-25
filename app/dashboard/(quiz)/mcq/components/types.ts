/**
 * Types for MCQ Quiz components
 */

// Answer submitted by the user
export interface UserAnswer {
  questionId: string;
  selectedOption?: string;
  selectedOptionId?: string;
  answer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
  timestamp?: number;
}

// Base MCQ question structure
export interface McqQuestion {
  id: string;
  text?: string;
  question?: string;
  options: Array<{ id: string; text: string }> | string[];
  correctOptionId?: string;
  correctAnswer?: string;
  answer?: string;
  type: "mcq";
}

// Question result structure
export interface QuestionResult {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

// Quiz results preview structure
export interface QuizResultsPreview {
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  questions: QuestionResult[];
  slug: string;
}

// Component props interfaces
export interface McqQuizProps {
  question: McqQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string, elapsedTime: number, isCorrect: boolean) => void;
  isLastQuestion?: boolean;
  isSubmitting?: boolean;
  existingAnswer?: string;
}

export interface McqResultPreviewProps {
  result: QuizResultsPreview;
  onSubmit: () => void;
  onCancel: () => void;
  userAnswers: UserAnswer[];
  isSubmitting?: boolean;
}

export interface McqQuizWrapperProps {
  slug: string;
  userId?: string | null;
}

export interface McqQuizClientProps {
  slug: string;
  initialQuizData: any | null;
  initialError: string | null;
}

export interface McqResultsClientProps {
  slug: string;
}
