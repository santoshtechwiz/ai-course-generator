import { ApiResponse } from './api-types'

/**
 * Core subscription types and interfaces
 */

/**
 * Subscription plans and statuses
 */
// Keep the canonical plan ids in sync with UI and plan configuration
export type SubscriptionPlanType = 'FREE' | 'BASIC' | 'PREMIUM' | 'ULTIMATE'
export type SubscriptionStatusType = 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'TRIAL' | 'EXPIRED' | 'CANCELED' | 'PAST_DUE'

/**
 * Metadata for subscription operations
 */
export interface SubscriptionMetadata {
  source?: string
  lastUpdated?: string
  cacheStatus?: 'fresh' | 'stale' | 'expired'
  clientId?: string
  timestamp: string
  requestId?: string
  message?: string // Add message for success/error messages
}

/**
 * Core subscription data interface
 */
export interface SubscriptionData {
  id: string
  userId: string
  subscriptionId: string // Add the missing subscriptionId field  
  credits: number
  tokensUsed: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType
  // alias for compatibility with session/user objects that use `plan`
  plan?: SubscriptionPlanType
  expirationDate: string | null
  trialEndsAt?: string | null
  status: SubscriptionStatusType
  cancelAtPeriodEnd: boolean
  nextBillingDate?: string | null
  createdAt: string
  updatedAt: string
  metadata?: SubscriptionMetadata
}

/**
 * Redux state for subscription management
 */
export interface SubscriptionState {
  currentSubscription: SubscriptionData | null
  isLoading: boolean
  isFetching: boolean
  error: string | null
  lastSync: number
  cacheStatus: 'fresh' | 'stale' | 'empty' | 'error'
}

/**
 * API response with subscription data
 */
export interface SubscriptionResponse extends ApiResponse<SubscriptionData> {
  metadata: SubscriptionMetadata
}

/**
 * Options for subscription data fetching
 */
export interface SubscriptionFetchOptions {
  forceRefresh?: boolean
  signal?: AbortSignal
  isBackground?: boolean
  cacheKey?: string
}

/**
 * Cache configuration for subscription data
 */
export const SUBSCRIPTION_CACHE_CONFIG = {
  staleTime: 30_000, // 30 seconds
  cacheTime: 5 * 60 * 1000, // 5 minutes
  retryDelay: 1000,
  maxRetries: 3
} as const

/**
 * Default free subscription data
 */
export const DEFAULT_FREE_SUBSCRIPTION: SubscriptionData = {
  id: 'free',
  userId: '',
  subscriptionId: 'free',
  credits: 0,
  tokensUsed: 0,
  isSubscribed: false,
  subscriptionPlan: 'FREE',
  expirationDate: null,
  status: 'INACTIVE',
  cancelAtPeriodEnd: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    source: 'default_plan',
    timestamp: new Date().toISOString()
  }
}

/**
 * Type guards for subscription data validation
 */
export function isSubscriptionResponse(response: any): response is SubscriptionResponse {
  return (
    response &&
    typeof response === 'object' &&
    'success' in response &&
    'data' in response &&
    response.data &&
    'subscriptionPlan' in response.data
  )
}

export function isSubscriptionData(data: any): data is SubscriptionData {
  return (
    data &&
    typeof data === 'object' &&
    'credits' in data &&
    'tokensUsed' in data &&
    'subscriptionPlan' in data &&
    'status' in data
  )
}