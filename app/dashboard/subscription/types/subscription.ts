/**
 * Subscription Module Types
 *
 * This file contains all the type definitions for the subscription module.
 * It serves as a central place for all interfaces and types used across
 * the subscription system.
 */

import type { LucideIcon } from "lucide-react"

// Core subscription types
export type SubscriptionPlanType = "FREE" | "BASIC" | "PRO" | "ULTIMATE"
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

// Feature availability interface
export interface FeatureAvailability {
  id: string
  name: string
  description: string
  category: FeatureCategory
  icon: string
  available: boolean
  comingSoon?: boolean
}

// Feature categories enum
export enum FeatureCategory {
  CORE = "Core Features",
  CONTENT = "Content Creation",
  ANALYTICS = "Analytics & Reporting",
  SUPPORT = "Support & Services",
  ADVANCED = "Advanced Features",
}

// Plan limits interface
export interface PlanLimits {
  maxQuestionsPerQuiz: number
  maxCoursesPerMonth: number
  apiCallsPerDay: number
}

// Price option interface
export interface PriceOption {
  duration: number
  price: number
  currency: string
  savings?: number
}

// Subscription plan interface
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

// Subscription data interface
export interface SubscriptionData {
  credits: number
  tokensUsed: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType
  expirationDate?: string
  cancelAtPeriodEnd?: boolean
  status: SubscriptionStatusType
}

// Token usage interface
export interface TokenUsage {
  tokensUsed: number
  total: number
  remaining: number
  percentage: number
  hasExceededLimit: boolean
}

// Subscription status response
export interface SubscriptionStatusResponse {
  credits: number
  tokensUsed: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType
  expirationDate?: string
  cancelAtPeriodEnd?: boolean
  status: SubscriptionStatusType
  isActive?: boolean
  active?: boolean
  plan?: string
  expiresAt?: string
  features?: string[]
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
  isLoading?: boolean
  error?: string | null
}

// FAQ item interface
export interface FAQItem {
  question: string
  answer: string
}

// Add-on package interface
export interface AddOnPackage {
  id: string
  name: string
  description: string
  price: number
  features: string[]
}

// Promo validation result interface
export interface PromoValidationResult {
  isValid: boolean
  message?: string
  planId?: string
  discount?: number
  valid?: boolean
  discountPercentage?: number
}

// Payment options interface
export interface PaymentOptions {
  referralCode?: string
  promoCode?: string
  promoDiscount?: number
  metadata?: Record<string, string>
  customerEmail?: string
  customerName?: string
}

// Checkout result interface
export interface CheckoutResult {
  sessionId: string
  url: string
  customerId?: string
}

// Payment status result interface
export interface PaymentStatusResult {
  status: "succeeded" | "pending" | "failed" | "canceled"
  subscription?: any
  customerId?: string
  amountPaid?: number
}

// Subscription result interface
export interface SubscriptionResult {
  success: boolean
  redirectUrl?: string
  message?: string
  subscriptionData?: SubscriptionData
  error?: string
}

// User subscription interface
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

// API error interface
export interface ApiError {
  message: string
  code?: string
  details?: any
}

// Subscription state interface for Redux
export interface SubscriptionState {
  data: SubscriptionData | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null
  isFetching: boolean
}

// Enhanced subscription data with computed properties
export interface EnhancedSubscriptionData extends SubscriptionData {
  isActive: boolean
  isExpired: boolean
  formattedCredits: string
  hasCreditsRemaining: boolean
}
