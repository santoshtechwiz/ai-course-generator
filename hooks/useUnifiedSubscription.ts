'use client';

/**
 * Legacy useUnifiedSubscription - Delegates to SubscriptionProvider
 * 
 * This file is kept for backward compatibility.
 * New code should use: import { useAuth } from '@/modules/auth'
 * 
 * The subscription logic is now in SubscriptionProvider for clean separation.
 */

import { useSubscriptionContext } from '@/modules/subscription/providers/SubscriptionProvider';
import { useSession } from 'next-auth/react';

/**
 * @deprecated Use `useAuth` from '@/modules/auth' instead for unified state
 */
export function useUnifiedSubscription() {
  const subscription = useSubscriptionContext();
  const { status } = useSession();

  // Return the same API shape for backward compatibility
  return {
    ...subscription,
    isAuthenticated: status === 'authenticated',
    forceSessionSync: subscription.refreshSubscription,
    available: subscription.remainingCredits,
  };
}

/**
 * useSubscriptionPermissions - Check user permissions for features
 */
function useSubscriptionPermissions() {
  const {
    hasCredits,
    hasActiveSubscription,
    plan,
    needsUpgrade,
    canCreateQuizOrCourse,
  } = useSubscriptionContext();

  const { status } = useSession();

  return {
    canCreateQuiz: canCreateQuizOrCourse,
    canCreateCourse: canCreateQuizOrCourse,
    needsSubscriptionUpgrade: needsUpgrade,
    needsCredits: !hasCredits,
    hasActiveSubscription,
    isAuthenticated: status === 'authenticated',
    currentPlan: plan,
  };
}
