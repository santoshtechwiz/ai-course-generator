// Unify the quiz types to ensure consistency across the application

export type QuizType = 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard';

// Base question type with common properties
export interface BaseQuestion {
  id: string;
  question: string;
  type: QuizType;
  answer?: string;
  correctAnswer?: string;
}

// Specific question types
export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: string[];
  correctAnswer: string; // Required for MCQ
}

export interface CodeQuizQuestion extends BaseQuestion {
  type: 'code';
  codeSnippet?: string;
  options?: string[];
  answer: string; // Make this required
  correctAnswer: string; // Make this required
  language?: string;
}

export interface BlankQuestion extends BaseQuestion {
  type: 'blanks';
  text: string;
  blanks: Record<string, string>;
  answer: string; // Required for blanks
  correctAnswer: string; // Required for blanks
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: 'openended';
  modelAnswer?: string;
}

// Multiple choice question (legacy format)
export interface MultipleChoiceQuestion {
  question: string
  options: string[]
  correctAnswer: string
}

// Code challenge format
export interface CodeChallenge {
  quizId?: string | number
  question: string
  options: string[]
  correctAnswer: string
  codeSnippet?: string
  language?: string
  explanation?: string
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
export interface QuizData<T extends QuizQuestion = QuizQuestion> {
  id: string;
  title: string;
  slug: string;
  type: QuizType;
  questions: T[];
  isPublic?: boolean;
  isFavorite?: boolean;
  userId?: string;
  ownerId?: string;
  timeLimit?: number | null;
  description?: string;
}

// Make QuizQuestion more generic
export interface QuizQuestionResult {
  id: string
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  codeSnippet?: string
  type: QuizType
}

/**
 * Interface for quiz result details
 */
export interface QuizResult {
  totalTime: number;
  correctAnswers: number;
  totalQuestions: number;
  quizId: string;
  slug: string;
  title: string; // Make required
  score: number;
  maxScore: number;
  questions: QuizQuestionResult[];
  completedAt: string; // Make required
  percentage: number; // Make required
  answers: UserAnswer[];
  type: QuizType; // Make required
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

// Additional types for API responses and UI props
export interface QuizAnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  similarityScore?: number;
}

// List item for quizzes
export interface QuizListItem {
  id: string;
  title: string;
  type: QuizType;
  questionsCount: number;
  lastAttempted?: string;
  score?: number;
  slug: string;
  isPublic: boolean;
}

// Props for MCQ quiz component
export interface McqQuizProps {
  quizData: {
    id: string;
    title: string;
    questions: MultipleChoiceQuestion[];
  };
}

// Query parameters interface
export interface QueryParams {
  [key: string]: string | string[] | undefined;
}

// Breadcrumb item
export interface BreadcrumbItem {
  name: string;
  href: string;
}

// Quiz details page props
export interface QuizDetailsPageProps {
  params: {
    slug: string;
  };
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

// Flashcard interface
export interface FlashCard {
  id: string;
  front: string;
  back: string;
  userQuizId?: string | number;
}

// Question interface for backwards compatibility
export interface Question {
  id: string;
  question: string;
  answer: string;
  options?: string[];
  userQuizId?: number;
  type?: string;
  questionType?: string;
  codeSnippet?: string;
  language?: string;
  [key: string]: any;
}
