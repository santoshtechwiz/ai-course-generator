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



