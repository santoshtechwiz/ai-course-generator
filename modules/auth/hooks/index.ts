// ============= Primary Exports =============

// Unified auth hook - returns both auth + subscription state
export { useAuth, useUser, useAuthStatus } from './useAuth'

// Direct access to contexts (advanced usage only)
export { useAuthContext } from '../providers/AuthProvider'
export { useSubscriptionContext, useUnifiedSubscription } from '@/modules/subscription/providers/SubscriptionProvider'

// Legacy subscription permissions hook
export { useSubscriptionPermissions } from '@/hooks/useUnifiedSubscription'

// Types
export type { User } from '../providers/AuthProvider'
export type { UnifiedAuthState } from './useAuth'
