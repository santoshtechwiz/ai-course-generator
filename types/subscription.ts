/**
 * Subscription Types - Complete Type Definitions
 * 
 * Production-ready type definitions for subscription system.
 * Covers all subscription plans, statuses, API responses, and business logic types.
 * 
 * NOTE: Plan configurations moved to subscription-plans.ts for unified feature management.
 */

import SUBSCRIPTION_PLANS_DATA, { 
  getPlanConfig,
  PRICING,
  type PlanConfig 
} from './subscription-plans'

// Use clean structure directly
export const UNIFIED_SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS_DATA

// ============= Core Subscription Types =============

export type SubscriptionPlanType = 
  | "FREE" 
  | "BASIC" 
  | "PREMIUM" 
  | "ENTERPRISE"

export type SubscriptionStatusType = 
  | "ACTIVE" 
  | "INACTIVE" 
  | "CANCELED" 
  | "PAST_DUE" 
  | "TRIALING" 
  | "UNPAID"

export type SubscriptionSource = 
  | "stripe" 
  | "database" 
  | "cache" 
  | "default" 
  | "webhook" 
  | "admin"

// ============= Subscription Data Structures =============

export interface SubscriptionData {
  id: string
  userId: string
  subscriptionId: string
  credits: number
  tokensUsed: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType
  status: SubscriptionStatusType
  cancelAtPeriodEnd: boolean
  expirationDate: string | null
  createdAt: string
  updatedAt: string
  metadata?: {
    source?: string
    timestamp?: string
    stripeSubscriptionId?: string
    stripeCustomerId?: string
    [key: string]: any
  }
}

export interface SubscriptionState {
  currentSubscription: SubscriptionData | null
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
  cache: {
    [key: string]: {
      data: SubscriptionData
      timestamp: number
      ttl: number
    }
  }
}

// ============= API Response Types =============

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp?: string
}

export interface SubscriptionResponse extends ApiResponse<SubscriptionData> {
  data: SubscriptionData
}

export interface BillingHistoryItem {
  id: string
  date: Date
  amount: number
  status: string
  paymentMethod?: string
  nextBillingDate?: Date
}

export interface PaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
}

// ============= Service Types =============

export interface SubscriptionServiceOptions {
  planId?: string
  duration?: number
  metadata?: Record<string, any>
}

export interface CheckoutSessionResult {
  success: boolean
  sessionId?: string
  url?: string
  message: string
}

export interface SubscriptionOperationResult {
  success: boolean
  message: string
  data?: SubscriptionData
}

export interface CreditOperationResult {
  success: boolean
  message: string
  newBalance?: number
}

// ============= Hook Types =============

export interface UseSubscriptionOptions {
  enableRefresh?: boolean
  refreshInterval?: number
  onError?: (error: Error) => void
  onSuccess?: (data: SubscriptionData) => void
}

export interface UseSubscriptionResult {
  subscription: SubscriptionData
  isLoading: boolean
  error: Error | null
  mutate: () => Promise<SubscriptionData | undefined>
  refresh: () => Promise<void>
  isValidating: boolean
}

// ============= Plan Configuration =============

export interface PlanFeatures {
  credits: number
  maxProjects?: number
  apiAccess: boolean
  prioritySupport: boolean
  customBranding?: boolean
  analyticsAccess?: boolean
}

export interface PlanConfiguration {
  id: SubscriptionPlanType
  name: string
  price: number
  duration: string
  features: PlanFeatures
  stripePriceId?: string
  popular?: boolean
  description?: string
}

// ============= Validation & Cache Types =============

export interface CacheConfiguration {
  ttl: number
  maxAge: number
  staleWhileRevalidate: number
  dedupingInterval: number
  refreshInterval: number
}

export interface SubscriptionCacheEntry {
  data: SubscriptionData
  timestamp: number
  ttl: number
  source: SubscriptionSource
}

// ============= Constants and Defaults =============

/**
 * @deprecated Use UNIFIED_SUBSCRIPTION_PLANS from './subscription-plans' instead.
 * 
 * This constant is kept for backward compatibility but maps to the new unified structure.
 * The unified structure provides:
 * - Detailed feature limits (quiz questions, course limits, etc.)
 * - Quiz type restrictions per plan
 * - Support levels and AI accuracy tiers
 * - Complete feature gate configuration
 * 
 * Migration: Replace `SUBSCRIPTION_PLANS[plan].features.credits`
 * with `UNIFIED_SUBSCRIPTION_PLANS[plan].features.monthlyCredits`
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanType, PlanConfiguration> = {
  FREE: {
    id: "FREE",
    name: UNIFIED_SUBSCRIPTION_PLANS.FREE.name,
    price: UNIFIED_SUBSCRIPTION_PLANS.FREE.price,
    duration: "forever",
    features: {
      credits: UNIFIED_SUBSCRIPTION_PLANS.FREE.monthlyCredits,
      apiAccess: false,
      prioritySupport: false
    }
  },
  BASIC: {
    id: "BASIC",
    name: UNIFIED_SUBSCRIPTION_PLANS.BASIC.name,
    price: UNIFIED_SUBSCRIPTION_PLANS.BASIC.price,
    duration: "monthly",
    features: {
      credits: UNIFIED_SUBSCRIPTION_PLANS.BASIC.monthlyCredits,
      maxProjects: 10,
      apiAccess: false,
      prioritySupport: false
    }
  },
  PREMIUM: {
    id: "PREMIUM",
    name: UNIFIED_SUBSCRIPTION_PLANS.PREMIUM.name,
    price: UNIFIED_SUBSCRIPTION_PLANS.PREMIUM.price,
    duration: "monthly",
    features: {
      credits: UNIFIED_SUBSCRIPTION_PLANS.PREMIUM.monthlyCredits,
      maxProjects: 50,
      apiAccess: false,
      prioritySupport: true,
      customBranding: false
    }
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: UNIFIED_SUBSCRIPTION_PLANS.ENTERPRISE.name,
    price: UNIFIED_SUBSCRIPTION_PLANS.ENTERPRISE.price,
    duration: "monthly",
    features: {
      credits: UNIFIED_SUBSCRIPTION_PLANS.ENTERPRISE.monthlyCredits,
      apiAccess: false,
      prioritySupport: true,
      customBranding: false,
      analyticsAccess: false
    }
  }
}

/**
 * Get unified plan configuration with all features
 * @preferred Use this instead of SUBSCRIPTION_PLANS for new code
 */
export function getUnifiedPlanConfig(plan: SubscriptionPlanType): PlanConfig {
  return UNIFIED_SUBSCRIPTION_PLANS[plan]
}

export const SUBSCRIPTION_CACHE_CONFIG: CacheConfiguration = {
  ttl: 30_000, // 30 seconds
  maxAge: 5 * 60_000, // 5 minutes
  staleWhileRevalidate: 60_000, // 1 minute
  dedupingInterval: 10_000, // 10 seconds
  refreshInterval: 5 * 60_000 // 5 minutes
}

// Default free subscription state
export const DEFAULT_FREE_SUBSCRIPTION: SubscriptionData = {
  id: 'free',
  userId: '',
  subscriptionId: '',
  credits: 3, // Free users get 3 credits
  tokensUsed: 0,
  isSubscribed: true, // Free users are "subscribed" to free plan
  subscriptionPlan: "FREE",
  status: "ACTIVE", // Free plan is always active
  cancelAtPeriodEnd: false,
  expirationDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    source: "default",
    timestamp: new Date().toISOString()
  }
}

// ============= Type Guards =============

export function isSubscriptionData(data: any): data is SubscriptionData {
  if (!data || typeof data !== 'object') {
    return false
  }
  
  return (
    typeof data.id === 'string' &&
    typeof data.userId === 'string' &&
    typeof data.credits === 'number' &&
    typeof data.isSubscribed === 'boolean' &&
    ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'].includes(data.subscriptionPlan) &&
    ['ACTIVE', 'INACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'UNPAID'].includes(data.status)
  )
}

export function isSubscriptionResponse(data: any): data is SubscriptionResponse {
  if (!data || typeof data !== 'object') {
    return false
  }
  
  return (
    typeof data.success === 'boolean' &&
    data.data !== undefined &&
    isSubscriptionData(data.data)
  )
}

export function isValidPlan(plan: string): plan is SubscriptionPlanType {
  return ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'].includes(plan)
}

export function isValidStatus(status: string): status is SubscriptionStatusType {
  return ['ACTIVE', 'INACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'UNPAID'].includes(status)
}

// ============= Utility Functions =============

export function getPlanFeatures(plan: SubscriptionPlanType): PlanFeatures {
  return SUBSCRIPTION_PLANS[plan].features
}

export function hasMinimumPlan(currentPlan: SubscriptionPlanType, requiredPlan: SubscriptionPlanType): boolean {
  const planHierarchy: Record<SubscriptionPlanType, number> = {
    FREE: 0,
    BASIC: 1,
    PREMIUM: 2,
    ENTERPRISE: 3
  }
  
  return planHierarchy[currentPlan] >= planHierarchy[requiredPlan]
}

export function isActivePlan(subscription: SubscriptionData): boolean {
  return subscription.status === 'ACTIVE' && subscription.isSubscribed
}

export function getRemainingCredits(subscription: SubscriptionData): number {
  return Math.max(0, subscription.credits - subscription.tokensUsed)
}

export function createSubscriptionCache(data: SubscriptionData, source: SubscriptionSource = 'default'): SubscriptionCacheEntry {
  return {
    data,
    timestamp: Date.now(),
    ttl: SUBSCRIPTION_CACHE_CONFIG.ttl,
    source
  }
}

// ============= Error Types =============

export class SubscriptionError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'SubscriptionError'
  }
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

// Export utility functions
export * from './subscription/utils'

// ============= Webhook Types =============

export interface StripeWebhookEvent {
  id: string
  type: string
  data: {
    object: any
  }
  created: number
}

export interface SubscriptionWebhookPayload {
  userId: string
  subscriptionId: string
  planId: SubscriptionPlanType
  status: SubscriptionStatusType
  metadata?: Record<string, any>
}