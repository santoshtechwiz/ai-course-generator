/**
 * Subscription Module Types
 *
 * This file contains all the type definitions for the subscription module.
 * It serves as a central place for all interfaces and types used across
 * the subscription system.
 */

// Subscription plan identifiers
export type SubscriptionPlanType = "FREE" | "BASIC" | "PRO" | "ULTIMATE"

// Subscription status types
export type SubscriptionStatusType = "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | "PENDING" | null


// Feature availability
export interface FeatureAvailability {
  name: string
  available: boolean
  comingSoon?: boolean
}

// Plan limits
export interface PlanLimits {
  maxQuestionsPerQuiz: number
  maxCoursesPerMonth: number
  apiCallsPerDay?: number
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

// Token usage data
export interface TokenUsage {
  used: number
  total: number
}

// Subscription status response
export interface SubscriptionStatus {
  credits: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType
  expirationDate?: string
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

