/**
 * Subscription types for the application
 */

type QuizType = "mcq" | "openended" | "fill-blanks" | "code" | "flashcard"; // Updated to match QuizDetailsPageWithContext
// Subscription plan types
export type SubscriptionPlanType = "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE"

// Subscription status types
export type SubscriptionStatusType = "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID" | "TRIAL" | "NONE"

// Subscription data interface
export interface SubscriptionData {
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType
  status?: SubscriptionStatusType
  expirationDate?: string
  cancelAtPeriodEnd?: boolean
  credits: number
  tokensUsed: number
  features?: string[]
}

// Token usage interface
export interface TokenUsage {
  used: number
  total: number
  percentage: number
  hasExceededLimit: boolean
  remaining: number
}

// Subscription details interface
export interface SubscriptionDetails {
  id?: string
  customerId?: string
  plan?: SubscriptionPlanType
  status?: SubscriptionStatusType
  currentPeriodStart?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
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

// User subscription data
export interface UserSubscription {
  userId: string
  planId: SubscriptionPlanType
  status: SubscriptionStatusType
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string
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
  discountPercentage: number
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

export interface MultipleChoiceQuestion {
  question: string
  options: string[]
  correctAnswer: string
 
}
export interface CodeChallenge {
  id?: string | number
  question: string
  options: string[]
  correctAnswer: string
  codeSnippet?: string
  language?: string
  explanation?: string
}

export interface CodingQuizProps {
  quizId: string | number
  slug: string
  isFavorite: boolean
  isPublic: boolean
  ownerId?: string
  quizData: {
    title: string
    questions: CodeChallenge[]
  }
}