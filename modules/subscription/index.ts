// ============= Subscription Module Exports =============

// Provider
export { SubscriptionProvider } from './providers/SubscriptionProvider'

// Hooks (use useAuth from @/modules/auth instead for unified state)
export { useSubscriptionContext, useUnifiedSubscription } from './providers/SubscriptionProvider'

// Components
export { default as NotificationsMenu } from './components/NotificationsMenu'

// Types
export type { SubscriptionContextState } from './providers/SubscriptionProvider'
