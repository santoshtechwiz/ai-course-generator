/**
 * Subscription types for the application
 */

// Subscription plan types
export type SubscriptionPlanType = "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE"

// Subscription status types
export type SubscriptionStatusType = "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID" | "TRIAL" | "NONE"

// Subscription data interface
export interface SubscriptionData {
  isSubscribed: boolean
  currentPlan: string | null
  trialEndsAt: string | null
  status: string
  cancelAtPeriodEnd?: boolean
  credits?: number
  tokensUsed?: number
  features?: string[]
}

// Token usage interface
export interface TokenUsage {
  total: number
  used: number
  remaining: number
  resetDate: string
  percentage?: number
  hasExceededLimit?: boolean
}

// Token usage response
export interface TokenUsageResponse {
  used: number
  total: number
}

// Subscription details interface
export interface SubscriptionDetails {
  id: string
  customerId: string
  priceId: string
  quantity: number
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
  plan?: SubscriptionPlanType
  canceledAt?: string
  endedAt?: string
  trialStart?: string
  trialEnd?: string
  tokenUsage?: TokenUsage
  paymentMethod?: any
  invoices?: any[]
}

// Feature availability
export interface FeatureAvailability {
  name: string
  available: boolean
  comingSoon?: boolean
  id?: string
  description?: string
  category?: string
  icon?: string
}

// Plan limits
export interface PlanLimits {
  maxQuestionsPerQuiz: number
  maxCoursesPerMonth: number
  apiCallsPerDay?: number
}

export interface PriceOption {
  duration: number
  price: number
  currency: string
  savings?: number
}

export interface PaymentOptions {
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, string>
}

// Complete subscription plan definition
export interface SubscriptionPlan {
  id: SubscriptionPlanType
  name: string
  description: string
  icon: any
  tokens: number
  options: PriceOption[]
  limits: PlanLimits
  features: FeatureAvailability[]
  popular?: boolean
}

// Payment gateway interface
export interface PaymentGateway {
  createCheckoutSession(
    userId: string,
    planName: string,
    duration: number,
    options?: PaymentOptions,
  ): Promise<{ sessionId: string; url: string }>

  cancelSubscription(userId: string): Promise<boolean>

  resumeSubscription(userId: string): Promise<boolean>

  verifyPaymentStatus(sessionId: string): Promise<{
    status: "succeeded" | "pending" | "failed" | "canceled"
    subscription?: any
  }>
}

// Promo code validation result
export interface PromoValidationResult {
  valid: boolean
  message: string
  discount?: number
  discountType?: 'percentage' | 'fixed'
  code?: string
}

// FAQ item structure
export interface FAQItem {
  question: string
  answer: string
}

// Add-on package structure
export interface AddOnPackage {
  id: string
  name: string
  description: string
  price: number
  features: string[]
}

// Import user-related types
import type { DashboardUser, UserStats, Course, CourseProgress, 
  UserSubscription, Favorite, UserQuizAttempt, TopicPerformance } from "./user-types"

// Re-export user-related types
export type {
  DashboardUser,
  UserStats,
  Course,
  CourseProgress,
  UserSubscription,
  Favorite,
  UserQuizAttempt,
  TopicPerformance
}

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

export type QuizType = 'mcq' | 'openended' | 'fill-blanks' | 'code';



