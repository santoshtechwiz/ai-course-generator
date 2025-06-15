"use client"

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { shallowEqual } from 'react-redux';
import type { RootState } from "@/store"
import type { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"
import { logger } from "@/lib/logger" // Import logger to help debug state updates
import { debounce } from 'lodash';

// Define types
export interface SubscriptionData {
  credits: number
  tokensUsed: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType
  expirationDate?: string
  status?: string
  cancelAtPeriodEnd?: boolean
}

// Define the subscription state interface
export interface SubscriptionState {
  data: SubscriptionData | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null
  isFetching: boolean
}

// Initial state
const initialState: SubscriptionState = {
  data: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  isFetching: false,
}

// Default free subscription data to use when unauthenticated
const DEFAULT_FREE_SUBSCRIPTION: SubscriptionData = {
  credits: 0,
  tokensUsed: 0,
  isSubscribed: false,
  subscriptionPlan: "FREE",
  status: "INACTIVE",
  cancelAtPeriodEnd: false
};

// Create the async thunk for fetching subscription data
export const fetchSubscription = createAsyncThunk(
  "subscription/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/subscriptions/status", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      // Handle 401 unauthorized specifically - user is not logged in
      if (response.status === 401) {
        logger.info("User is not authenticated, returning default free subscription data")
        return DEFAULT_FREE_SUBSCRIPTION;
      }

      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`API error: ${response.status} - ${errorText}`)
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      logger.info(`Subscription data fetched successfully: ${JSON.stringify(data)}`)

      // Handle edge cases for expired or inactive subscriptions
      if (data.status === "INACTIVE" || new Date(data.expirationDate) < new Date()) {
        data.status = "EXPIRED"
        data.isSubscribed = false
        logger.warn("Subscription marked as expired or inactive")
      }

      return data
    } catch (error: any) {
      logger.error(`Failed to fetch subscription data: ${error.message}`)
      return rejectWithValue(error.message || "Failed to fetch subscription data")
    }
  }
)

// Async thunk for canceling subscription
export const cancelSubscription = createAsyncThunk(
  "subscription/cancel",
  async (reason: string, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        return rejectWithValue("Failed to cancel subscription")
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  },
)

// Async thunk for resuming subscription
export const resumeSubscription = createAsyncThunk("subscription/resume", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/subscriptions/resume", {
      method: "POST",
    })

    if (!response.ok) {
      return rejectWithValue("Failed to resume subscription")
    }

    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue((error as Error).message)
  }
})

// Async thunk for activating free trial
export const activateFreeTrial = createAsyncThunk("subscription/activateTrial", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/subscriptions/activate-free", {
      method: "POST",
    })

    if (!response.ok) {
      return rejectWithValue("Failed to activate free trial")
    }

    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue((error as Error).message)
  }
})

// Thunk to force refresh the subscription data
export const forceRefreshSubscription = createAsyncThunk(
  "subscription/forceRefresh",
  async (_, { dispatch }) => {
    // Clear existing data first
    dispatch(clearSubscriptionData());
    // Then fetch fresh data
    return dispatch(fetchSubscription());
  }
);

// Create the subscription slice
const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    clearSubscriptionData: (state) => {
      state.data = null
      state.lastFetched = null
    },
    // Add a reset state action
    resetState: () => {
      return initialState
    },
    // Add a resetSubscriptionState action for logout
    resetSubscriptionState: () => initialState,
    // Add a direct way to set subscription data for testing/debugging
    setSubscriptionData: (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.lastFetched = Date.now();
      state.isLoading = false;
      state.isFetching = false;
      state.error = null;
      logger.info(`Subscription data manually set: ${JSON.stringify(action.payload)}`);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscription.pending, (state) => {
        state.isLoading = true
        state.isFetching = true
        state.error = null
        logger.debug("Subscription fetch pending")
      })
      .addCase(fetchSubscription.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false
        state.isFetching = false

        // Only update if the data has actually changed
        if (!action.payload) {
          logger.warn("Received null/undefined subscription data from API");
          return;
        }

        // Log complete data for debugging
        logger.info(`Received subscription data: ${JSON.stringify(action.payload)}`)
        
        // Check for data changes to avoid unnecessary updates
        if (!state.data || !shallowEqual(action.payload, state.data)) {
          state.data = action.payload
          state.lastFetched = Date.now()
          logger.info("Updated subscription state with new data")
        } else {
          logger.debug("Subscription data unchanged, skipping update")
        }
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (typeof action.payload === 'string' ? action.payload : (action.payload && (action.payload as any).error)) || "Subscription fetch failed";
        // Set default free subscription data even when fetching fails
        state.data = DEFAULT_FREE_SUBSCRIPTION;
        logger.error(`Subscription fetch failed: ${action.payload}`)
      })

      // Cancel subscription
      .addCase(cancelSubscription.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.isLoading = false
        if (state.data) {
          state.data = {
            ...state.data,
            status: "CANCELED",
            cancelAtPeriodEnd: true,
          }
        }
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Resume subscription
      .addCase(resumeSubscription.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(resumeSubscription.fulfilled, (state, action) => {
        state.isLoading = false
        if (state.data) {
          state.data = {
            ...state.data,
            status: "ACTIVE",
            cancelAtPeriodEnd: false,
          }
        }
      })
      .addCase(resumeSubscription.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Activate free trial
      .addCase(activateFreeTrial.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(activateFreeTrial.fulfilled, (state, action) => {
        state.isLoading = false
        if (state.data) {
          state.data = {
            ...state.data,
            credits: state.data.credits + 5,
          }
        }
      })
      .addCase(activateFreeTrial.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

// Export the new action
// (Only export once, after all actions are defined)
export const { clearSubscriptionData, resetState, setSubscriptionData, resetSubscriptionState } = subscriptionSlice.actions

// Memoized selectors using createSelector for better performance
import { createSelector } from "@reduxjs/toolkit"

// Base selectors
const getSubscriptionState = (state: RootState) => state.subscription
export const selectSubscriptionData = (state: RootState) => state.subscription.data
export const selectSubscriptionLoading = (state: RootState) => state.subscription.isLoading
export const selectSubscriptionError = (state: RootState) => state.subscription.error

// Fix the identity selector - transform the data instead of returning it directly
export const selectSubscription = createSelector([selectSubscriptionData], (data) => {
  if (!data) return null
  return {
    ...data,
    isActive: data.status === "ACTIVE" && !data.cancelAtPeriodEnd,
    isExpired: data.status === "EXPIRED" || (data.expirationDate ? new Date(data.expirationDate) < new Date() : false),
    formattedCredits: typeof data.credits === "number" ? `${data.credits} credits` : "No credits",
    hasCreditsRemaining: (data.credits || 0) > (data.tokensUsed || 0),
  }
})
export const selectSubscriptionShallow = createSelector([selectSubscriptionData], data => data, { memoizeOptions: { resultEqualityCheck: shallowEqual } });
// Token usage selector with memoization
export const selectTokenUsage = createSelector([selectSubscriptionData], (subscription) => {
  if (!subscription) return null

  const tokensUsed = subscription.tokensUsed || 0
  const totalTokens = subscription.credits || 0

  return {
    tokensUsed,
    total: totalTokens,
    remaining: Math.max(totalTokens - tokensUsed, 0),
    percentage: totalTokens > 0 ? Math.min((tokensUsed / totalTokens) * 100, 100) : 0,
    hasExceededLimit: tokensUsed > totalTokens,
  }
})


// Additional memoized selectors for commonly used subscription properties
export const selectIsSubscribed = createSelector([selectSubscriptionData], (data) => data?.isSubscribed ?? false);

export const selectSubscriptionPlan = createSelector(
  [selectSubscriptionData],
  (data) => data?.subscriptionPlan ?? "FREE",
)

export const selectSubscriptionStatus = createSelector([selectSubscriptionData], (data) => data?.status);

export const selectIsCancelled = createSelector([selectSubscriptionData], (data) => data?.cancelAtPeriodEnd ?? false)

export default subscriptionSlice.reducer
