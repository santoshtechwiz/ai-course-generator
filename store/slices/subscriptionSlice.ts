"use client"

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import type { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"
import { createSelector } from "@reduxjs/toolkit"
import { subscriptionApiClient } from '@/app/dashboard/subscription/services/subscription-api-client';

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
interface SubscriptionState {
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

// Create the async thunk for fetching subscription data
export const fetchSubscription = createAsyncThunk(
  "subscription/fetchSubscription",
  async (_, { rejectWithValue }) => {
    try {
      // Use API client instead of direct fetch
      return await subscriptionApiClient.getDetails();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch subscription");
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
      return data as SubscriptionData
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  },
)

// Async thunk for resuming subscription
export const resumeSubscription = createAsyncThunk(
  "subscription/resume", 
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/subscriptions/resume", {
        method: "POST",
      })

      if (!response.ok) {
        return rejectWithValue("Failed to resume subscription")
      }

      const data = await response.json()
      return data as SubscriptionData
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  }
)

// Async thunk for activating free trial
export const activateFreeTrial = createAsyncThunk(
  "subscription/activateTrial", 
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/subscriptions/activate-free", {
        method: "POST",
      })

      if (!response.ok) {
        return rejectWithValue("Failed to activate free trial")
      }

      const data = await response.json()
      return data as SubscriptionData
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  }
)

// Create the subscription slice
const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    clearSubscriptionData: (state) => {
      state.data = null
      state.lastFetched = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscription.pending, (state) => {
        state.isLoading = true
        state.isFetching = true
        state.error = null
      })
      .addCase(fetchSubscription.fulfilled, (state, action: PayloadAction<SubscriptionData | null>) => {
        state.isLoading = false
        state.isFetching = false
        state.data = action.payload
        state.lastFetched = Date.now()
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.isLoading = false
        state.isFetching = false
        state.error = action.payload as string
      })

      // Cancel subscription
      .addCase(cancelSubscription.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(cancelSubscription.fulfilled, (state) => {
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
      .addCase(resumeSubscription.fulfilled, (state) => {
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
      .addCase(activateFreeTrial.fulfilled, (state) => {
        state.isLoading = false
        if (state.data) {
          state.data = {
            ...state.data,
            credits: (state.data.credits || 0) + 5,
          }
        }
      })
      .addCase(activateFreeTrial.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

// Export actions and reducer
export const { clearSubscriptionData } = subscriptionSlice.actions

// Base selectors
export const selectSubscriptionState = (state: RootState) => state.subscription;
export const selectSubscriptionData = (state: RootState) => state.subscription.data;
export const selectSubscriptionLoading = (state: RootState) => state.subscription.isLoading;
export const selectSubscriptionError = (state: RootState) => state.subscription.error;

// Enhanced selectors with transformations
export const selectSubscription = createSelector([selectSubscriptionData], (data) => {
  if (!data) return null;
  
  return {
    ...data,
    // Add derived fields to transform the data
    isActive: data.status === "ACTIVE" && !data.cancelAtPeriodEnd,
    formattedCredits: typeof data.credits === "number" ? `${data.credits} credits` : "No credits",
    hasCreditsRemaining: (data.credits || 0) > (data.tokensUsed || 0),
    statusLabel: data.status ? data.status.charAt(0) + data.status.slice(1).toLowerCase() : 'Inactive',
    expiresFormatted: data.expirationDate ? new Date(data.expirationDate).toLocaleDateString() : 'N/A',
  };
});

// Token usage selector with memoization
export const selectTokenUsage = createSelector([selectSubscriptionData], (subscription) => {
  if (!subscription) return null;

  const tokensUsed = subscription.tokensUsed || 0;
  const totalTokens = subscription.credits || 0;
  const remaining = Math.max(totalTokens - tokensUsed, 0);
  const percentage = totalTokens > 0 ? Math.min((tokensUsed / totalTokens) * 100, 100) : 0;

  return {
    tokensUsed,
    total: totalTokens,
    remaining,
    percentage,
    hasExceededLimit: tokensUsed > totalTokens,
    usageLevel: percentage > 90 ? 'high' : percentage > 70 ? 'medium' : 'low',
    formattedUsage: `${tokensUsed}/${totalTokens} (${percentage.toFixed(1)}%)`
  };
});

// Additional memoized selectors for commonly used subscription properties
export const selectIsSubscribed = createSelector(
  [selectSubscriptionData],
  (data) => Boolean(data?.isSubscribed)
);

export const selectSubscriptionPlan = createSelector(
  [selectSubscriptionData],
  (data) => data?.subscriptionPlan ?? "FREE"
);

export const selectSubscriptionStatus = createSelector(
  [selectSubscriptionData],
  (data) => data?.status || "INACTIVE"
);

export const selectIsCancelled = createSelector(
  [selectSubscriptionData],
  (data) => Boolean(data?.cancelAtPeriodEnd)
);

export default subscriptionSlice.reducer;
