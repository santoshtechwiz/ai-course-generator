'use client';

import { useSession } from 'next-auth/react';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';

export function SubscriptionTestComponent() {
  const { data: session } = useSession();
  const subscription = useUnifiedSubscription();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-md z-50 max-w-md">
      <h3 className="font-bold text-blue-800 mb-2">🧪 Subscription Test</h3>
      
      <div className="space-y-2 text-xs">
        <div className="bg-white p-2 rounded border">
          <div className="font-semibold text-green-700">Session Data (Source of Truth):</div>
          <div>Credits: {session?.user?.credits || 'N/A'}</div>
          <div>Plan: {(session?.user as any)?.plan || 'N/A'}</div>
          <div>ID: {session?.user?.id || 'N/A'}</div>
        </div>

        <div className="bg-white p-2 rounded border">
          <div className="font-semibold text-blue-700">Unified Hook Data:</div>
          <div>Credits: {subscription.credits || 'N/A'}</div>
          <div>Plan: {subscription.plan || 'N/A'}</div>
          <div>Has Credits: {subscription.hasCredits ? 'Yes' : 'No'}</div>
          <div>Loading: {subscription.loading ? 'Yes' : 'No'}</div>
        </div>

        <div className="bg-white p-2 rounded border">
          <div className="font-semibold text-purple-700">Subscription Object:</div>
          <div>Credits: {subscription.data?.credits || 'N/A'}</div>
          <div>Plan: {subscription.data?.subscriptionPlan || 'N/A'}</div>
          <div>Status: {subscription.data?.status || 'N/A'}</div>
          <div>Source: {subscription.data?.metadata?.source || 'N/A'}</div>
        </div>

        <div className="bg-white p-2 rounded border">
          <div className="font-semibold text-orange-700">Debug Info:</div>
          <div>Session Credits: {subscription.debugInfo?.sessionCredits || 'N/A'}</div>
          <div>Session Plan: {subscription.debugInfo?.sessionPlan || 'N/A'}</div>
          <div>Effective Credits: {subscription.debugInfo?.effectiveCredits || 'N/A'}</div>
          <div>Effective Plan: {subscription.debugInfo?.effectivePlan || 'N/A'}</div>
          <div>Source: {subscription.debugInfo?.source || 'N/A'}</div>
        </div>

        <button 
          onClick={subscription.refreshSubscription}
          className="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
        >
          Force Refresh
        </button>
      </div>
    </div>
  );
}