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

// Import quiz-related types to avoid duplication
import type {
  QuizListItem,
  UserQuiz,
  QueryParams,
  BreadcrumbItem,
  QuizDetailsPageProps,
  FlashCard,
  Question,
  McqQuizProps,
  QuizType,
  MultipleChoiceQuestion,
  CodeChallenge,
  BaseQuestion,
  MCQQuestion,
  CodeQuizQuestion,
  BlankQuestion,
  OpenEndedQuestion,
  QuizQuestion,
  UserAnswer,
  QuizData,
  QuizResult,
  QuizHistoryItem,
  QuizState,
  QuizAnswerResult
} from "./quiz-types"

// Re-export quiz-related types for backward compatibility
export type {
  QuizListItem,
  UserQuiz,
  QueryParams,
  BreadcrumbItem,
  QuizDetailsPageProps,
  FlashCard,
  Question,
  McqQuizProps,
  QuizType,
  MultipleChoiceQuestion,
  CodeChallenge,
  BaseQuestion,
  MCQQuestion,
  CodeQuizQuestion,
  BlankQuestion,
  OpenEndedQuestion,
  QuizQuestion,
  UserAnswer,
  QuizData,
  QuizResult,
  QuizHistoryItem,
  QuizState,
  QuizAnswerResult
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

// Core type definitions for the AI Learning platform

import { Prisma } from "@prisma/client"

// Video and chapter related types
export interface VideoMetadata {
  id: string;
  title?: string;
  duration?: number;
  thumbnail?: string;
}

export interface FullChapterType {
  id: number;
  title: string;
  description?: string;
  videoId: string | null; // Allow null for videoId
  order?: number;
  summary?: string | null;
  questions?: CourseQuestion[];
  name?: string; // Legacy support
  isFree?: boolean; // Added property - derived from context
  duration?: number | string; // Added property - calculated or provided
}

export interface CourseUnitType {
  id: number;
  title: string;
  order: number;
  chapters: FullChapterType[];
}

// Course unit with expanded chapter data
export interface FullCourseUnit {
  id: number
  courseId: number
  title: string
  isCompleted: boolean
  duration: number | null
  order: number
  chapters: FullChapter[]
}

// Chapter with expanded quiz data
export interface FullChapter {
  id: number
  title: string
  videoId: string | null
  order: number
  isCompleted: boolean
  summary: string | null
  description: string | null
  unitId: number
  summaryStatus: string | null
  videoStatus: string | null
  questions: CourseQuestion[]
  isFree?: boolean; // Added property
  duration?: number | string; // Added property
}

// Course question with properly typed options
export interface CourseQuestion {
  id: number | string // Accept both number and string IDs
  question: string
  answer: string
  options: string[] | string // Allow string (for JSON parsing) or string array
  explanation?: string
}

// User progress tracking for courses
export interface CourseProgress {
  id: number | string
  userId: string
  courseId: number | string
  progress: number
  completedChapters: Array<number | string>
  currentChapterId?: number | string
  lastAccessedAt?: Date | string
  isCompleted?: boolean
  course?: FullCourseType
  timeSpent?: number
}

// Define specific quiz progress type for better type safety
export interface QuizProgressType {
  completed?: boolean
  currentIndex?: number
  answers?: Record<string, string>
  score?: number
  started?: boolean
  startedAt?: string
  completedAt?: string
  lastUpdated?: string
}

// Schema for structured JSON-LD data
export interface Schema {
  '@context': string
  '@type': string
  [key: string]: any
}

// Registry for JSON-LD schemas
export const SchemaRegistry = {
  // Define schema constants here
}

// Helper function to validate schema
export function validateSchema(schema: Schema): boolean {
  return !!schema['@context'] && !!schema['@type']
}

// Generate breadcrumb items from a URL path
export function generateBreadcrumbItemsFromPath(path: string): { name: string; item: string }[] {
  const parts = path.split('/').filter(Boolean)
  return parts.map((part, index) => ({
    name: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
    item: `/${parts.slice(0, index + 1).join('/')}`,
  }))
}

// Add or modify these types to ensure proper type checking

export interface FullCourseType {
  id: number;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  courseUnits: CourseUnitType[]; // Ensure this is properly typed
  category?: {
    id: number;
    name: string;
  };
}

// Add a type guard function for checking course validity
export function isValidCourse(course: any): course is FullCourseType {
  return (
    course &&
    typeof course.id === 'number' &&
    typeof course.title === 'string' &&
    typeof course.slug === 'string' &&
    Array.isArray(course.courseUnits) &&
    course.courseUnits.length > 0
  );
}



