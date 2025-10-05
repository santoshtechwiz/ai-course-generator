'use client';

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSubscriptionData } from '@/store/slices/subscriptionSlice';
import type { SubscriptionData, SubscriptionPlanType, SubscriptionStatusType } from '@/types/subscription';

// ============= Types =============

export interface SubscriptionContextState {
  // Core subscription data
  data: SubscriptionData | null;
  subscription: SubscriptionData | null;
  
  // Plan & Credits
  plan: string;
  credits: number;
  tokensUsed: number;
  remainingCredits: number;
  
  // Permissions & Status
  isSubscribed: boolean;
  hasCredits: boolean;
  hasActiveSubscription: boolean;
  canUseFeatures: boolean;
  canCreateQuizOrCourse: boolean;
  needsUpgrade: boolean;
  isExpired: boolean;
  
  // Loading & Error States
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshSubscription: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  
  // Debug info
  debugInfo?: {
    sessionCredits: number;
    sessionUsed: number;
    sessionPlan: string;
    effectiveCredits: number;
    effectiveUsed: number;
    effectivePlan: string;
    source: string;
  };
}

const DEFAULT_FREE_SUBSCRIPTION: SubscriptionData = {
  id: 'free',
  userId: '',
  subscriptionId: '',
  credits: 3,
  tokensUsed: 0,
  isSubscribed: true,
  subscriptionPlan: 'FREE',
  status: 'ACTIVE',
  cancelAtPeriodEnd: false,
  expirationDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    source: 'default_free',
    timestamp: new Date().toISOString(),
  },
};

// ============= Context =============

const SubscriptionContext = createContext<SubscriptionContextState | undefined>(undefined);

// ============= Provider =============

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update: updateSession } = useSession();

  const dispatch = useAppDispatch();
  const reduxState = useAppSelector((state) => state.subscription);

  // Refresh subscription by updating NextAuth session
  // ⚠️ ONLY call this after:
  // 1. Stripe checkout success (webhook updates DB)
  // 2. Credit consumption (backend updates DB)
  // 3. Manual subscription changes
  // DO NOT call on mount/navigation - session is already cached!
  const refreshSubscription = useCallback(async () => {
    if (!session?.user) {
      return;
    }

    try {
      if (updateSession) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SubscriptionProvider] 🔄 Manual refresh triggered (should be rare)');
        }
        await updateSession();
      }
    } catch (error) {
      console.error('[SubscriptionProvider] Failed to refresh session:', error);
    }
  }, [session?.user?.id, updateSession]); // Stable dependencies

  // Sync session data to Redux store - only when SESSION data changes
  // ⚠️ CRITICAL: Do NOT include reduxState.data in deps - causes infinite loop!
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    const sessionCredits = typeof session.user.credits === 'number' ? session.user.credits : 3;
    const sessionUsed = typeof session.user.creditsUsed === 'number' ? session.user.creditsUsed : 0;
    const sessionPlan = session.user.userType?.toUpperCase() || 'FREE';

    const sessionBasedData: SubscriptionData = {
      id: session.user.id,
      userId: session.user.id,
      subscriptionId: '', // Not in session type
      credits: sessionCredits,
      tokensUsed: sessionUsed,
      isSubscribed: sessionPlan !== 'FREE' || sessionCredits > 0,
      subscriptionPlan: sessionPlan as SubscriptionPlanType,
      status: (session.user.subscriptionStatus?.toUpperCase() || 'ACTIVE') as SubscriptionStatusType,
      cancelAtPeriodEnd: false, // Not in session type
      expirationDate: null, // Not available in session
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        source: 'session_sync',
        timestamp: new Date().toISOString(),
        sessionCredits,
        sessionUsed,
        sessionPlan,
      },
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[SubscriptionProvider] Syncing session → Redux:', {
        credits: sessionCredits,
        used: sessionUsed,
        plan: sessionPlan,
      });
    }

    dispatch(setSubscriptionData(sessionBasedData));
  }, [
    session?.user?.id,
    session?.user?.credits,
    session?.user?.creditsUsed,
    session?.user?.userType,
    session?.user?.subscriptionStatus,
    status,
    dispatch,
    // ⚠️ DO NOT add reduxState.data here - causes infinite loop!
  ]);



  // ⚡ CRITICAL: Memoize currentData to prevent recreation on every render
  const currentData = useMemo(
    () => reduxState.data || DEFAULT_FREE_SUBSCRIPTION,
    [reduxState.data]
  );

  // Compute effective values from session (authoritative) or Redux fallback
  const sessionCredits = session?.user?.credits;
  const sessionUsed = session?.user?.creditsUsed;
  const sessionPlan = session?.user?.userType;

  // ⚡ Memoize all computed values to prevent unnecessary recalculations
  const effectiveCredits = useMemo(
    () => typeof sessionCredits === 'number' ? sessionCredits : currentData.credits,
    [sessionCredits, currentData.credits]
  );

  const effectiveUsed = useMemo(
    () => typeof sessionUsed === 'number' ? sessionUsed : currentData.tokensUsed,
    [sessionUsed, currentData.tokensUsed]
  );

  const effectivePlan = useMemo(
    () => sessionPlan ? sessionPlan.toUpperCase() : currentData.subscriptionPlan,
    [sessionPlan, currentData.subscriptionPlan]
  );

  // ⚡ Memoize boolean flags to prevent triggering re-renders
  const hasCredits = useMemo(
    () => effectiveCredits > 0,
    [effectiveCredits]
  );

  const remainingCredits = useMemo(
    () => Math.max(0, effectiveCredits - effectiveUsed),
    [effectiveCredits, effectiveUsed]
  );

  const hasActiveSubscription = useMemo(
    () => effectivePlan !== 'FREE',
    [effectivePlan]
  );

  const canUseFeatures = useMemo(
    () => hasCredits || hasActiveSubscription,
    [hasCredits, hasActiveSubscription]
  );

  // Build subscription object
  const subscriptionObject = useMemo(
    () => ({
      ...currentData,
      credits: effectiveCredits,
      tokensUsed: effectiveUsed,
      subscriptionPlan: effectivePlan as SubscriptionPlanType,
      plan: effectivePlan,
      isActive: true,
      available: remainingCredits,
    }),
    [currentData, effectiveCredits, effectiveUsed, effectivePlan, remainingCredits]
  );

  // Build context state
  const contextValue: SubscriptionContextState = useMemo(
    () => ({
      data: subscriptionObject,
      subscription: subscriptionObject,
      credits: effectiveCredits,
      tokensUsed: effectiveUsed,
      plan: effectivePlan,
      isSubscribed: hasActiveSubscription || hasCredits,
      canUseFeatures,
      hasCredits: canUseFeatures,
      remainingCredits,
      needsUpgrade: effectivePlan === 'FREE' && !hasCredits,
      hasActiveSubscription,
      isExpired: false,
      canCreateQuizOrCourse: canUseFeatures,
      isLoading: reduxState.loading || status === 'loading',
      loading: reduxState.loading || status === 'loading',
      error: reduxState.error || null,
      refreshSubscription,
      forceRefresh: refreshSubscription,
      debugInfo: {
        sessionCredits: sessionCredits || 0,
        sessionUsed: sessionUsed || 0,
        sessionPlan: sessionPlan || 'UNKNOWN',
        effectiveCredits,
        effectiveUsed,
        effectivePlan,
        source: 'session-authoritative',
      },
    }),
    [
      subscriptionObject,
      effectiveCredits,
      effectiveUsed,
      effectivePlan,
      hasCredits,
      remainingCredits,
      hasActiveSubscription,
      canUseFeatures,
      reduxState.loading,
      reduxState.error,
      status,
      sessionCredits,
      sessionUsed,
      sessionPlan,
      refreshSubscription,
    ]
  );

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ============= Hook =============

export function useSubscriptionContext(): SubscriptionContextState {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}

// Legacy hook for backward compatibility
export function useUnifiedSubscription(): SubscriptionContextState {
  return useSubscriptionContext();
}
