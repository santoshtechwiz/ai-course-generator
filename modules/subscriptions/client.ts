/**
 * Subscriptions Module - Client-side exports
 *
 * This file exports client-side hooks and components.
 * Only import this in client-side code (components, pages, etc.)
 */

// Export unified hooks (client-side only)
export { useSubscription, useSubscriptionPermissions, useSubscriptionTracking } from './hooks/use-subscription'
export { useTokenUsage } from './hooks/use-token-usage'

// Export utilities (client-side safe)
export { validateSubscription } from './utils/subscription-validation'
export { subscriptionCache } from './utils/subscription-cache-manager'

// Export types (client-side)
export type {
  SubscriptionData,
  SubscriptionResponse,
  ApiResponse,
  SubscriptionPlanType,
  SubscriptionFetchOptions
} from '@/types/subscription'