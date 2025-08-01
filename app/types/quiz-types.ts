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
  tags?: string[]; // Keywords for similarity matching
  similarityThreshold?: number; // Threshold to consider answer correct (0.0-1.0)
  difficulty?: 'easy' | 'medium' | 'hard'; // Difficulty level
}

// Fill in the blanks questions
export interface BlankQuizQuestion extends BaseQuestion {
   id: number;
  question: string;
  answer: string;
  hints?: string[];
  type: 'blanks';
  tags?: string[]; // Keywords for similarity matching
  similarityThreshold?: number; // Threshold to consider answer correct (0.0-1.0)
  difficulty?: 'easy' | 'medium' | 'hard'; // Difficulty level
}

// Multiple choice questions
export interface McqQuestion extends BaseQuestion {
  id: string | number;
  text?: string;
  question?: string;
  options?: Array<{ id: string; text: string }> | string[];
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
  options?: Array<{ id: string; text: string }> | string[];
  answer?: string;
  correctAnswer?: string;
  language?: string;
  type?: 'code';
}

// Quiz data structure
export interface QuizData {
  slug: string; // Primary identifier
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
  similarity?: number; // Similarity score (0.0-1.0)
  isCorrect?: boolean; // Based on similarity threshold
  hintsUsed?: boolean; // Whether hints were used
  timeSpent?: number; // Time spent on question in seconds
}

export interface McqQuizAnswer extends BaseAnswer {
  selectedOptionId: string;
  isCorrect?: boolean;
  type: 'mcq';
  timeSpent?: number; // Time spent on question in seconds
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


// Quiz result types
export interface QuizResult {
  slug: string; // Primary identifier
  quizId?: string | number; // For backward compatibility
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  questions?: QuizQuestion[];
  questionResults?: Array<{
    questionId: string | number;
    isCorrect: boolean;
    userAnswer?: string | any;
    correctAnswer?: string;
  }>;
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
  options: Array<{ id: string; text: string }> | string[];
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

export function isQuizType(type: any): type is QuizType {
  return ["blanks", "openended", "mcq", "code", "flashcard"].includes(type);
}

export function isValidQuestion(question: any): question is QuizQuestion {
  return typeof question === "object" && "id" in question && isQuizType(question.type);
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

// Open-ended quiz data structure
export interface OpenEndedQuizData extends QuizData {
  questions: OpenEndedQuestion[];
  type: 'openended';
  evaluationMethod?: 'similarity' | 'exact' | 'keywords' | 'ai';
  similarityThreshold?: number; // Default threshold
}

export interface ProcessedQuestion extends OpenEndedQuestion {
  isProcessed: boolean;
  processingTime: number;
}

export interface BlanksQuizResult {
  questionId: string | number;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  similarity: number;
  similarityLabel: string;
}
export type DifficultyLevel = "easy" | "medium" | "hard"
export type RatingType = "correct" | "incorrect" | "still_learning"
export type SwipeDirection = "left" | "right" | "center"
export type StudyMode = "normal" | "review" | "challenge" | "easy_day"

// Core flashcard types with comprehensive type safety
export interface FlashCard {
  id: string
  question: string
  answer: string
  options?: string[]
  keywords?: string[]
  imageUrl?: string
  audioUrl?: string
  codeSnippet?: string
  language?: string
  type?: QuizType
  difficulty?: "easy" | "medium" | "hard"
  category?: string
  tags?: string[]
  estimatedTime?: number // in seconds
  createdAt?: string
  lastReviewed?: string
}
export interface MultipleChoiceQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: string
}
export interface QuizListItem{
  quizType: string;
  id: string
  title: string
  type: QuizType
  createdAt: string
  updatedAt: string
  totalQuestions: number
  averageScore?: number // Optional for quizzes that have been taken multiple times
  difficulty?: DifficultyLevel // Optional for quizzes with varying difficulty
  category?: string // Optional category for better organization
}