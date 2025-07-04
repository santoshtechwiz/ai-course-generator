import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '@/store';
import { syncSubscriptionData } from '../slices/auth-slice';
import { fetchSubscription, setSubscriptionData } from '../slices/subscription-slice';
import { loginSuccess } from '../slices/auth-slice';
import { logger } from '@/lib/logger';
import type { SubscriptionData } from '@/app/types/subscription';

// Create the middleware
export const subscriptionListenerMiddleware = createListenerMiddleware();

// TypedStartListening for proper TypeScript support
type AppStartListening = ReturnType<typeof subscriptionListenerMiddleware.startListening>;

// Keep track of last sync time to prevent too frequent updates
let lastSyncTime = 0;
const MIN_SYNC_INTERVAL = 1000; // 1 second minimum between syncs

// Create a listener that responds to subscription data changes
subscriptionListenerMiddleware.startListening({
  // When subscription data is set or fetched successfully
  matcher: isAnyOf(
    setSubscriptionData,
    // Use type predicate for action to satisfy TypeScript
    ((action): action is { type: string } => 
      typeof action.type === 'string' && action.type.endsWith('/subscription/fetch/fulfilled')
    )
  ),
  effect: async (action, { dispatch, getState }) => {
    const state = getState() as RootState;
    const now = Date.now();
    
    // Get the subscription data, either from the action payload or state
    let subscriptionData: SubscriptionData | null = null;
    if ('payload' in action && action.payload) {
      subscriptionData = action.payload as SubscriptionData;
    } else if (state.subscription.data) {
      subscriptionData = state.subscription.data;
    }
    
    // Don't sync too frequently
    if (now - lastSyncTime < MIN_SYNC_INTERVAL || !subscriptionData) return;
    lastSyncTime = now;
    
    // Sync the data to auth state
    logger.info('Syncing subscription data to auth state:', {
      plan: subscriptionData.subscriptionPlan,
      status: subscriptionData.status,
      isSubscribed: subscriptionData.isSubscribed
    });
    dispatch(syncSubscriptionData(subscriptionData));
  }
});

// Also listen for login success to ensure we have the latest subscription data
subscriptionListenerMiddleware.startListening({
  actionCreator: loginSuccess,
  effect: async (action, { dispatch, getState }) => {
    const state = getState() as RootState;
    const now = Date.now();
    const lastFetched = state.subscription.lastFetched;
    
    // If we haven't fetched subscription data recently, do it now
    if (!lastFetched || now - lastFetched > 10000) { // 10 seconds
      logger.info('User logged in, fetching fresh subscription data');
      try {
        // Use the typed AppDispatch for proper typing
        const typedDispatch = dispatch as AppDispatch;
        const data = await typedDispatch(fetchSubscription({ forceRefresh: true })).unwrap();
        dispatch(syncSubscriptionData(data));
      } catch (err) {
        logger.error('Failed to fetch subscription after login:', err instanceof Error ? err.message : String(err));
      }
    }
  }
});

export default subscriptionListenerMiddleware;
