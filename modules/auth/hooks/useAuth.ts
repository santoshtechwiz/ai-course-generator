import { useMemo } from 'react';
import { useAuthContext, type User } from '../providers/AuthProvider';
import { useSubscriptionContext } from '@/modules/subscription/providers/SubscriptionProvider';

// ============= Unified Auth + Subscription Interface =============

/**
 * Unified state returned by useAuth hook
 * Merges authentication and subscription data into a single interface
 */
interface UnifiedAuthState {
  // Authentication (from AuthProvider)
  user: User | null;
  isAuthenticated: boolean;
  
  // Subscription (from SubscriptionProvider)
  plan: string;
  credits: number;
  tokensUsed: number;
  remainingCredits: number;
  hasCredits: boolean;
  hasActiveSubscription: boolean;
  canUseFeatures: boolean;
  canCreateQuizOrCourse: boolean;
  needsUpgrade: boolean;
  
  // Loading & Error States
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  
  // Legacy compatibility
  userId?: string;
}

// ============= Unified useAuth Hook =============

/**
 * useAuth - Primary hook for consuming auth and subscription state
 * 
 * Merges AuthProvider and SubscriptionProvider contexts into a single interface.
 * This is the ONLY hook consumers should import for auth/subscription needs.
 * 
 * @example
 * ```tsx
 * import { useAuth } from '@/modules/auth'
 * 
 * function MyComponent() {
 *   const { user, plan, credits, hasCredits, refresh } = useAuth()
 *   // All auth + subscription data in one hook
 * }
 * ```
 */
export function useAuth(): UnifiedAuthState {
  const auth = useAuthContext();
  const subscription = useSubscriptionContext();

  // Unified state combining auth + subscription
  const unifiedState = useMemo<UnifiedAuthState>(
    () => ({
      // Auth fields
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      userId: auth.user?.id,

      // Subscription fields
      plan: subscription.plan,
      credits: subscription.credits,
      tokensUsed: subscription.tokensUsed,
      remainingCredits: subscription.remainingCredits,
      hasCredits: subscription.hasCredits,
      hasActiveSubscription: subscription.hasActiveSubscription,
      canUseFeatures: subscription.canUseFeatures,
      canCreateQuizOrCourse: subscription.canCreateQuizOrCourse,
      needsUpgrade: subscription.needsUpgrade,

      // Loading/Error states (auth OR subscription loading)
      isLoading: auth.isLoading || subscription.isLoading,
      loading: auth.isLoading || subscription.loading,
      error: subscription.error,

      // Actions
      refresh: subscription.refreshSubscription,
      refreshUserData: auth.refreshUserData,
      refreshSubscription: subscription.refreshSubscription,
    }),
    [auth, subscription]
  );

  return unifiedState;
}

// ============= Convenience Hooks =============

/**
 * useUser - Get current user
 */
function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

/**
 * useAuthStatus - Get authentication status
 */
function useAuthStatus(): {
  isAuthenticated: boolean;
  isLoading: boolean;
} {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}
