/**
 * Subscription types for the application
 */

// Subscription and plan types moved to types/shared-types.ts
// Remove duplicate type/interface definitions now in shared-types.ts

// Import course-related types from the new file
import type {
  VideoMetadata,
  FullChapterType,
  CourseUnitType,
  FullCourseUnit,
  FullChapter,
  CourseQuestion,
  FullCourseType,
  FullCourse,
  Category,
  Rating,
  CourseUnit,
  Chapter,
  Question
} from "./course-types"

// Re-export course-related types
export type {
  VideoMetadata,
  FullChapterType,
  CourseUnitType,
  FullCourseUnit,
  FullChapter,
  CourseQuestion,
  FullCourseType,
  FullCourse,
  Category,
  Rating,
  CourseUnit,
  Chapter,
  Question
}

// Core type definitions for the AI Learning platform

import { Prisma } from "@prisma/client"
import { QuizType } from "./quiz-types";

// Simplified progress type for internal use
export interface VideoProgressState {
  time: number;
  played: number;
  playedSeconds: number;
  duration: number;
  lastUpdated?: number;
}

// Dashboard user interface
export interface DashboardUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  credits: number;
  streakDays: number;
  isAdmin: boolean;
  courses: Course[];
  courseProgress: CourseProgress[];
  favorites: Favorite[];
  userQuizzes: UserQuiz[];
  quizAttempts: UserQuizAttempt[];
}

// Course interface
export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  category?: { name: string; id: string };
  estimatedHours?: number;
  progress?: number;
  isCompleted?: boolean;
}

// Course progress interface
export interface CourseProgress {
  id: string;
  slug: string;
  course: Course;
  progress: number;
  isCompleted: boolean;
  lastAccessedAt: string;
}

export interface Favorite {
  id: string;
  course: Course;
}

export interface UserQuiz {
  id: string;
  title: string;
  slug?: string;
  quizType: QuizType;
  questions?: Array<{
    id: string;
    question: string;
    answer: string;
    text?: string;
    openEndedQuestion?: {
      hints?: string[];
    };
  }>;
  _count?: {
    questions: number;
  };
  timeStarted: string;
  timeEnded: string | null;
  progress?: number;
  bestScore?: number;
}

export interface UserQuizAttempt {
  id: string;
  userQuiz: UserQuiz;
  createdAt: string;
  score: number;
  accuracy: number;
  timeSpent: number;
  improvement?: number;
  attemptQuestions: Array<{
    id: string;
    questionId: string;
    userAnswer: string | null;
    isCorrect: boolean;
    timeSpent: number;
  }>;
}

export interface TopPerformingTopic {
  title: string;
  topic: string;
  averageScore: number;
  attempts: number;
}

export interface UserStats {
  highestScore: number;
  averageScore: number;
  totalQuizzes: number;
  totalTimeSpent: number;
  quizzesPerMonth: number;
  recentImprovement: number;
  topPerformingTopics: TopPerformingTopic[];
}

export  interface FlashCard{
  id: string;
  question: string;
  options: string[];
  answer: string;
}
export interface QueryParams {
  [key: string]: string | string[] | undefined;
  title?: string;
  amount?: string;
  topic?: string;
  difficulty:["easy" | "medium" | "hard"];
  type?: "mcq" | "open_ended" | "fill_in_the_blanks";

}

export interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "function";
  content?: string;
  name?: string;
  function?: {
    name: string;
    arguments: string;
  };
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  isPublic?: boolean;
  createdAt?:string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    answer: string;
  }>;
}
export interface CodeChallenge {
  question: string;
  codeSnippet: string;
  options: string[];
  language: string;
  correctAnswer: string;
  questionType: "standard" | "fill-in-the-blank";
}
import type React from "react"
export type LoadingState = "idle" | "loading" | "success" | "error"

export interface LoadingConfig {
  id: string
  message?: string
  timeout?: number
  showProgress?: boolean
  showSpinner?: boolean
  overlay?: boolean
  persistent?: boolean
}

export interface LoadingContextValue {
  // Global loading state
  globalLoading: boolean

  // Individual loading states
  loadingStates: Record<string, LoadingConfig & { state: LoadingState }>

  // Actions
  startLoading: (config: LoadingConfig) => void
  stopLoading: (id: string) => void
  updateLoading: (id: string, updates: Partial<LoadingConfig>) => void
  clearAllLoading: () => void

  // Utilities
  isLoading: (id?: string) => boolean
  getLoadingState: (id: string) => LoadingState | undefined
  getLoadingMessage: (id: string) => string | undefined
}

export interface UnifiedLoaderProps {
  id?: string
  message?: string
  variant?: "spinner" | "skeleton" | "progress" | "overlay"
  size?: "sm" | "md" | "lg"
  showMessage?: boolean
  className?: string
}

export interface PageTransitionLoaderProps {
  enabled?: boolean
  delay?: number
  timeout?: number
}

export interface ApiLoadingWrapperProps {
  loadingId: string
  children: React.ReactNode
  fallback?: React.ReactNode
}
