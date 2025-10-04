'use client';

import { useSession } from 'next-auth/react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSubscriptionData } from '@/store/slices/subscriptionSlice';
import { useEffect, useCallback, useMemo } from 'react';
import type { SubscriptionData, SubscriptionPlanType } from '@/types/subscription';

const DEFAULT_FREE_SUBSCRIPTION: SubscriptionData = {
  id: 'free',
  userId: '',
  subscriptionId: '',
  credits: 3,
  tokensUsed: 0,
  isSubscribed: true,
  subscriptionPlan: "FREE",
  status: "ACTIVE",
  cancelAtPeriodEnd: false,
  expirationDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    source: "session_authoritative",
    timestamp: new Date().toISOString()
  }
};

export function useUnifiedSubscription() {
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const status = sessionResult?.status || 'loading';
  
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector(state => state.subscription);

  const refreshSubscription = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const { update } = sessionResult;
      if (update) {
        console.log('[useUnifiedSubscription] Forcing session refresh...');
        await update();
      }
    } catch (error) {
      console.error('[useUnifiedSubscription] Failed to refresh session:', error);
    }
  }, [session?.user, sessionResult]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    const sessionCredits = typeof session.user.credits === 'number' ? session.user.credits : 3;
    const sessionUsed = typeof session.user.creditsUsed === 'number' ? session.user.creditsUsed : 0;
    const sessionPlan = session.user.userType?.toUpperCase() || 'FREE';

    const sessionBasedData: SubscriptionData = {
      id: session.user.id,
      userId: session.user.id,
      subscriptionId: '',
      credits: sessionCredits,
      tokensUsed: sessionUsed, // Use session's creditsUsed for consistency
      isSubscribed: true,
      subscriptionPlan: sessionPlan as SubscriptionPlanType,
      status: 'ACTIVE',
      cancelAtPeriodEnd: false,
      expirationDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        source: 'session_sync',
        timestamp: new Date().toISOString(),
        sessionCredits,
        sessionUsed,
        sessionPlan
      }
    };
    
    dispatch(setSubscriptionData(sessionBasedData));
  }, [session?.user?.id, session?.user?.credits, session?.user?.creditsUsed, session?.user?.userType, status, dispatch]);

  const currentData = data || DEFAULT_FREE_SUBSCRIPTION;
  const sessionCredits = session?.user?.credits;
  const sessionUsed = session?.user?.creditsUsed;
  const sessionPlan = session?.user?.userType;
  
  const effectiveCredits = typeof sessionCredits === 'number' ? sessionCredits : currentData.credits;
  const effectiveUsed = typeof sessionUsed === 'number' ? sessionUsed : currentData.tokensUsed;
  const effectivePlan = sessionPlan ? sessionPlan.toUpperCase() : currentData.subscriptionPlan;
  
  const hasCredits = effectiveCredits > 0;
  const remainingCredits = Math.max(0, effectiveCredits - effectiveUsed);

  const subscriptionObject = useMemo(() => ({
    ...currentData,
    credits: effectiveCredits,
    tokensUsed: effectiveUsed,
    subscriptionPlan: effectivePlan,
    plan: effectivePlan,
    isActive: true,
    available: remainingCredits
  }), [currentData, effectiveCredits, effectiveUsed, effectivePlan, remainingCredits]);

  const api = useMemo(() => ({
    data: subscriptionObject,
    subscription: subscriptionObject,
    credits: effectiveCredits,
    tokensUsed: effectiveUsed,
    plan: effectivePlan,
    isSubscribed: true,
    canUseFeatures: hasCredits || effectivePlan !== 'FREE',
    hasCredits: hasCredits || effectivePlan !== 'FREE',
    remainingCredits,
    needsUpgrade: effectivePlan === 'FREE' && !hasCredits,
    hasActiveSubscription: effectivePlan !== 'FREE',
    isExpired: false,
    canCreateQuizOrCourse: hasCredits || effectivePlan !== 'FREE',
    available: remainingCredits,
    isLoading: loading || status === 'loading',
    loading: loading || status === 'loading',
    error: error || null,
    isAuthenticated: status === 'authenticated',
    refreshSubscription,
    forceRefresh: refreshSubscription,
    forceSessionSync: refreshSubscription,
    debugInfo: {
      sessionCredits: sessionCredits || 0,
      sessionUsed: sessionUsed || 0,
      sessionPlan: sessionPlan || 'UNKNOWN',
      effectiveCredits,
      effectiveUsed,
      effectivePlan,
      source: 'session-authoritative'
    }
  }), [
    subscriptionObject, effectiveCredits, effectiveUsed, effectivePlan, hasCredits, remainingCredits, 
    loading, error, status, sessionCredits, sessionUsed, sessionPlan, currentData, refreshSubscription
  ]);

  return api;
}

export function useSubscriptionPermissions() {
  const { hasCredits, hasActiveSubscription, plan, needsUpgrade, canCreateQuizOrCourse, isAuthenticated } = useUnifiedSubscription();
  
  return {
    canCreateQuiz: canCreateQuizOrCourse,
    canCreateCourse: canCreateQuizOrCourse,
    needsSubscriptionUpgrade: needsUpgrade,
    needsCredits: !hasCredits,
    hasActiveSubscription,
    isAuthenticated,
    currentPlan: plan
  };
}
