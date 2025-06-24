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
}
