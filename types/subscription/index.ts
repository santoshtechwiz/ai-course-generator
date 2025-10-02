// Core subscription types and interfaces - UNIFIED MODULE
export * from './api-types'
export * from './subscription-types'
export * from './utils'

// Re-export core types for backwards compatibility
export type { SubscriptionData, SubscriptionResponse } from './subscription-types'

// Consolidated subscription hook options
export interface UseSubscriptionOptions {
  allowPlanChanges?: boolean
  allowDowngrades?: boolean
  onSubscriptionSuccess?: (result: SubscriptionResult) => void
  onSubscriptionError?: (error: SubscriptionResult) => void
  skipInitialFetch?: boolean
  lazyLoad?: boolean
  validateOnMount?: boolean
}

// Subscription operation result
export interface SubscriptionResult {
  success: boolean
  message?: string
  redirectUrl?: string
  data?: any
}

// Subscription service types - moved to subscription-types.ts for consolidation

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

// Cache configuration and helper functions are exported from subscription-types.ts