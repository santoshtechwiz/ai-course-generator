/**
 * Subscription Module Types
 *
 * This file contains all the type definitions for the subscription module.
 * It serves as a central place for all interfaces and types used across
 * the subscription system.
 */

import type { LucideIcon } from "lucide-react"
// Import shared types from types/shared-types instead of local declarations
import type {
  SubscriptionPlanType,
  SubscriptionStatusType,
  FeatureAvailability,
  PlanLimits,
  PriceOption,
  PaymentOptions,
  SubscriptionPlan,
  SubscriptionData,
  TokenUsage,
  TokenUsageResponse,
} from '../../../../types/shared-types'

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
