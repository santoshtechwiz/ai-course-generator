'use client';

import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';

export default function SubscriptionTestDebug() {
  const subscription = useUnifiedSubscription();

  return (
    <div className="p-4 border border-green-500 bg-green-50 rounded-lg">
      <h3 className="text-lg font-semibold text-green-800 mb-4">
        🎯 Redux Subscription Test (Single Source of Truth)
      </h3>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <strong>Credits:</strong> {subscription.credits}
        </div>
        <div>
          <strong>Tokens Used:</strong> {subscription.tokensUsed}
        </div>
        <div>
          <strong>Plan:</strong> {subscription.plan}
        </div>
        <div>
          <strong>Subscribed:</strong> {subscription.isSubscribed ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Has Credits:</strong> {subscription.hasCredits ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Can Use Features:</strong> {subscription.canUseFeatures ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Loading:</strong> {subscription.loading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Error:</strong> {subscription.error || 'None'}
        </div>
      </div>

      <div className="mt-4 p-2 bg-blue-50 rounded">
        <h4 className="font-semibold text-blue-800">Debug Info:</h4>
        <pre className="text-xs">
          {JSON.stringify(subscription.debugInfo, null, 2)}
        </pre>
      </div>

      <button 
        onClick={subscription.refreshSubscription}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Refresh Subscription
      </button>
    </div>
  );
}