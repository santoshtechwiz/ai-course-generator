/**
 * Subscription Module Types
 *
 * This file contains all the type definitions for the subscription module.
 * It serves as a central place for all interfaces and types used across
 * the subscription system.
 */

import type { LucideIcon } from "lucide-react"

// Subscription plan identifiers
export type SubscriptionPlanType = "FREE" | "BASIC" | "PRO" | "ULTIMATE"

// Subscription status types
export type SubscriptionStatusType = "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID" | "TRIAL" | "NONE"

// Feature availability
export interface FeatureAvailability {
  id: string
  name: string
  description: string
  category: string
  icon: string
  available: boolean
  comingSoon?: boolean
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
  icon: LucideIcon
  tokens: number
  options: PriceOption[]
  limits: PlanLimits
  features: FeatureAvailability[]
  popular?: boolean
}

// Subscription data structure
export interface SubscriptionData {
  credits: number
  tokensUsed: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType
  expirationDate?: string
  cancelAtPeriodEnd?: boolean
  status?: SubscriptionStatusType
  features?: string[]
}

// Token usage data
export interface TokenUsage {
  used: number
  total: number
  percentage: number
  hasExceededLimit: boolean
  remaining: number
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
export interface TokenUsageResponse {
  used: number
  total: number
}

// Subscription status response
export interface SubscriptionStatusResponse {
  credits: number
  tokensUsed: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType
  expirationDate?: string
  cancelAtPeriodEnd?: boolean
  status?: string
  isActive?: boolean
  active?: boolean
  plan?: string
  expiresAt?: string
  features?: string[]
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
