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

