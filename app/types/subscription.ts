import type { LucideIcon } from "lucide-react"

/**
 * ---------------------------------------
 * Plan & Subscription Types
 * ---------------------------------------
 */

// Available plan IDs
export type SubscriptionPlanType = "FREE" | "BASIC" | "PREMIUM" | "ULTIMATE" 

// Possible subscription lifecycle statuses
export type SubscriptionStatusType =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "UNPAID"
  | "TRIAL"
  | "NONE"
  | "INACTIVE"
  | "EXPIRED"
  | "PENDING"

/**
 * ---------------------------------------
 * Subscription Plan Models
 * ---------------------------------------
 */

export interface PlanLimits {
  maxQuestionsPerQuiz: number
  maxCoursesPerMonth: number
  apiCallsPerDay?: number
}

export interface PriceOption {
  duration: number // in months
  price: number
  currency: string
  savings?: number // e.g., 20 means 20% saved
}

export interface FeatureAvailability {
  id?: string
  name: string
  description?: string
  category?: string
  icon?: string
  available: boolean
  comingSoon?: boolean
}

export interface SubscriptionPlan {
  id: SubscriptionPlanType
  name: string
  description: string
  icon: LucideIcon | any
  tokens: number
  options: PriceOption[]
  limits: PlanLimits
  features: FeatureAvailability[]
  popular?: boolean
}

/**
 * ---------------------------------------
 * Subscription Data / Responses
 * ---------------------------------------
 */

export interface SubscriptionData {
  credits?: number
  tokensUsed?: number
  isSubscribed: boolean
  subscriptionPlan?: SubscriptionPlanType
  currentPlan?: string | null
  expirationDate?: string
  trialEndsAt?: string | null
  cancelAtPeriodEnd?: boolean
  status?: SubscriptionStatusType | string
  features?: string[]
  subscriptionId?: string
  currentPeriodEnd?: string | null
}

export interface EnhancedSubscriptionData extends SubscriptionData {
  isActive: boolean
  isExpired: boolean
  formattedCredits: string
  hasCreditsRemaining: boolean
}

export interface SubscriptionStatusResponse {
  credits: number
  tokensUsed: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType
  expirationDate?: string
  cancelAtPeriodEnd?: boolean
  status: SubscriptionStatusType
  subscriptionId?: string
  isActive?: boolean
  active?: boolean
  plan?: string
  expiresAt?: string
  features?: string[]
}

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

/**
 * ---------------------------------------
 * Usage, Promo, Payment
 * ---------------------------------------
 */

export interface TokenUsage {
  tokensUsed: number
  total: number
  remaining?: number
  percentage?: number
  hasExceededLimit?: boolean
  resetDate?: string
}

export interface TokenUsageResponse {
  used: number
  total: number
}

export interface PaymentOptions {
  referralCode?: string
  promoCode?: string
  promoDiscount?: number
  customerEmail?: string
  customerName?: string
  metadata?: Record<string, string>
  successUrl?: string
  cancelUrl?: string
}

export interface PromoValidationResult {
  valid: boolean
  message?: string
  code?: string
  discount?: number
  discountPercentage?: number
  discountType?: "percentage" | "fixed"
}

export interface CheckoutResult {
  sessionId: string
  url: string
  customerId?: string
}

export interface PaymentStatusResult {
  status: "succeeded" | "pending" | "failed" | "canceled"
  subscription?: any
  customerId?: string
  amountPaid?: number
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

/**
 * ---------------------------------------
 * App-specific
 * ---------------------------------------
 */

export interface SubscriptionState {
  data: SubscriptionData | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null
  isFetching: boolean
}

export interface SubscriptionResult {
  success: boolean
  redirectUrl?: string
  message?: string
  error?: string
  subscriptionData?: SubscriptionData
}

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

export interface SubscriptionStatus {
  isActive: boolean
  isTrialing: boolean
  isCanceled: boolean
  isPastDue: boolean
  isUnpaid: boolean
  currentPlan?: SubscriptionPlanType
  trialEndDate?: Date
  nextBillingDate?: Date
  cancelAtPeriodEnd?: boolean
}

/**
 * ---------------------------------------
 * UI / Frontend
 * ---------------------------------------
 */

export interface PricingPageProps {
  userId: string | null
  isProd?: boolean
  onUnauthenticatedSubscribe?: (
    planName: SubscriptionPlanType,
    duration: number,
    promoCode?: string,
    promoDiscount?: number
  ) => void
  onManageSubscription?: () => void
  isMobile?: boolean
}

export interface FAQItem {
  question: string
  answer: string
}

export interface AddOnPackage {
  id: string
  name: string
  description: string
  price: number
  features: string[]
}

/**
 * ---------------------------------------
 * Gateway Interface (optional, for DI)
 * ---------------------------------------
 */

export interface PaymentGateway {
  createCheckoutSession(
    userId: string,
    planName: string,
    duration: number,
    options?: PaymentOptions
  ): Promise<CheckoutResult>
  cancelSubscription(userId: string): Promise<boolean>
  resumeSubscription(userId: string): Promise<boolean>
  verifyPaymentStatus(sessionId: string): Promise<PaymentStatusResult>
}
