// Core subscription types and interfaces
export * from './api-types'
export * from './subscription-types'
export * from './utils'

export interface SubscriptionFetchOptions {
  forceRefresh?: boolean
  signal?: AbortSignal
  isBackground?: boolean
  cacheKey?: string
}

export interface SubscriptionMetadata {
  source?: string
  lastUpdated?: string
  cacheStatus?: 'fresh' | 'stale' | 'expired'
  clientId?: string
  timestamp: string
  requestId?: string
}

export interface SubscriptionData {
  credits: number
  tokensUsed: number
  isSubscribed: boolean
  subscriptionPlan: string
  expirationDate: string | null
  status: SubscriptionStatusType
  cancelAtPeriodEnd: boolean
  subscriptionId: string
  timestamp?: number
  metadata?: SubscriptionMetadata
}

export interface SubscriptionResponse extends ApiResponse<SubscriptionData> {
  metadata: SubscriptionMetadata
}

export interface SubscriptionState {
  currentSubscription: SubscriptionData | null
  isLoading: boolean
  isFetching: boolean
  error: string | null
  lastSync: number
  cacheStatus: 'fresh' | 'stale' | 'empty' | 'error'
}

export type SubscriptionStatusType = 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'TRIAL'
export type SubscriptionPlanType = 'FREE' | 'PRO' | 'ENTERPRISE' | 'CUSTOM'

// Subscription service types
export interface SubscriptionService {
  getSubscriptionStatus: (userId: string) => Promise<SubscriptionData | null>
  refreshSubscription: (userId: string, force?: boolean) => Promise<SubscriptionResponse>
  cancelSubscription: (subscriptionId: string) => Promise<boolean>
  updateSubscription: (subscriptionId: string, data: Partial<SubscriptionData>) => Promise<SubscriptionResponse>
}

// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    timestamp: string
    requestId?: string
  }
}

// Cache configuration
export const SUBSCRIPTION_CACHE_CONFIG = {
  staleTime: 30_000, // 30 seconds
  cacheTime: 5 * 60 * 1000, // 5 minutes
  retryDelay: 1000,
  maxRetries: 3
} as const

// Helper type guards
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