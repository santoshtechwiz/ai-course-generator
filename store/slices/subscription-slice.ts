"use client"

import { createSlice, createAsyncThunk, createSelector, type PayloadAction } from "@reduxjs/toolkit"
import { shallowEqual } from "react-redux"
import type { RootState } from "@/store"
import type {
  SubscriptionData,
  SubscriptionState,
  SubscriptionStatusResponse,
  SubscriptionPlanType,
  SubscriptionStatusType,
  TokenUsage,
  EnhancedSubscriptionData,
} from "@/app/types/subscription"
import { logger } from "@/lib/logger"

// Default free subscription data to use when unauthenticated
const DEFAULT_FREE_SUBSCRIPTION: SubscriptionData = {
  credits: 0,
  tokensUsed: 0,
  isSubscribed: false,
  subscriptionPlan: "FREE",
  status: "INACTIVE",
  cancelAtPeriodEnd: false,
}

// Initial state
const initialState: SubscriptionState = {
  data: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  isFetching: false,
}

// Keep track of ongoing subscription fetch request
let subscriptionFetchPromise: Promise<any> | null = null
// Minimum time between subscription fetches (in milliseconds)
const MIN_FETCH_INTERVAL = 30000 // 30 seconds for better performance

// Helper function to check if user is authenticated
const isUserAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check for common auth indicators (adjust based on your auth implementation)
  const token = localStorage.getItem('token') || 
                sessionStorage.getItem('token') || 
                document.cookie.includes('auth-token') ||
                document.cookie.includes('session')
  
  return !!token
}

// Enhanced fetch subscription thunk with authentication check
export const fetchSubscription = createAsyncThunk<
  SubscriptionData,
  { forceRefresh?: boolean } | void,
  {
    state: RootState
    rejectValue: string
  }
>("subscription/fetch", async (options = {}, { rejectWithValue, getState }) => {
  try {
    // Early return if user is not authenticated - don't make API call
    if (!isUserAuthenticated()) {
      logger.info("User not authenticated, returning default free subscription")
      return DEFAULT_FREE_SUBSCRIPTION
    }

    const state = getState()
    const { lastFetched, isFetching, data } = state.subscription
    const { forceRefresh = false } = options

    // Check if we've fetched recently and should use cached data (unless force refresh)
    if (!forceRefresh && lastFetched && data && Date.now() - lastFetched < MIN_FETCH_INTERVAL) {
      logger.debug(`Using cached subscription data - last fetched ${Date.now() - lastFetched}ms ago`)
      return data
    }

    // If a fetch is already in progress and not force refresh, reuse the existing promise
    if (!forceRefresh && isFetching && subscriptionFetchPromise) {
      logger.debug("Subscription fetch already in progress, reusing promise")
      return subscriptionFetchPromise
    }

    // Create new fetch promise with timeout protection
    const FETCH_TIMEOUT = 10000 // 10 second timeout for better performance

    subscriptionFetchPromise = fetch("/api/subscriptions/status", {
      headers: {
        "Cache-Control": forceRefresh ? "no-cache" : "max-age=30",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    }).then(async (response) => {
      // Handle 401 unauthorized specifically - user is not logged in
      if (response.status === 401) {
        logger.info("User is not authenticated, returning default free subscription data")
        return DEFAULT_FREE_SUBSCRIPTION
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        logger.error(`API error: ${response.status} - ${errorText}`)
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: SubscriptionStatusResponse = await response.json()
      logger.info(`Subscription data fetched successfully`)

      // Transform API response to internal format with better defaults
      const transformedData: SubscriptionData = {
        credits: Math.max(0, data.credits || 0),
        tokensUsed: Math.max(0, data.tokensUsed || 0),
        isSubscribed: Boolean(data.isSubscribed),
        subscriptionPlan: data.subscriptionPlan || "FREE",
        expirationDate: data.expirationDate,
        cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
        status: (data.status as SubscriptionStatusType) || "INACTIVE",
      }

      // Handle edge cases for expired or inactive subscriptions
      if (
        transformedData.status === "INACTIVE" ||
        (transformedData.expirationDate && new Date(transformedData.expirationDate) < new Date())
      ) {
        transformedData.status = "EXPIRED"
        transformedData.isSubscribed = false
        logger.warn("Subscription marked as expired or inactive")
      }

      return transformedData
    })
    .catch((error) => {
      // Enhanced error handling
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        logger.error(`Request timeout: ${error.message}`)
        throw new Error("Request timed out - please try again")
      } else if (error.name === "NetworkError" || error.message.includes("Failed to fetch")) {
        logger.error(`Network error: ${error.message}`)
        throw new Error("Network error - please check your connection")
      } else {
        logger.error(`Subscription fetch error: ${error.message}`)
        throw error
      }
    })
    .finally(() => {
      // Clear promise reference after completion
      subscriptionFetchPromise = null
    })

    return await subscriptionFetchPromise
  } catch (error: any) {
    let errorMessage = "Failed to fetch subscription data"

    if (error instanceof Error) {
      errorMessage = error.message
      logger.error(`Subscription fetch failed: ${error.message}`)
    } else {
      logger.error(`Subscription fetch failed: ${String(error)}`)
    }

    return rejectWithValue(errorMessage)
  }
})

// Optimized force refresh with authentication check
export const forceRefreshSubscription = createAsyncThunk<
  SubscriptionData,
  void,
  {
    state: RootState
    rejectValue: string
  }
>("subscription/forceRefresh", async (_, { dispatch, rejectWithValue }) => {
  // Don't fetch if user is not authenticated
  if (!isUserAuthenticated()) {
    logger.info("User not authenticated, skipping force refresh")
    return DEFAULT_FREE_SUBSCRIPTION
  }

  // Check network connectivity
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    logger.warn("Cannot force refresh - network appears to be offline")
    return rejectWithValue("Network connectivity issue - please check your connection")
  }

  logger.info("Force refreshing subscription data")

  try {
    // Clear any cached/in-flight requests
    subscriptionFetchPromise = null

    // Fetch fresh data with force refresh flag
    const result = await dispatch(fetchSubscription({ forceRefresh: true })).unwrap()
    return result
  } catch (error) {
    logger.error(`Force refresh failed: ${error instanceof Error ? error.message : String(error)}`)
    return rejectWithValue(error instanceof Error ? error.message : String(error))
  }
})

// Optimized subscription operations (only if authenticated)
export const cancelSubscription = createAsyncThunk<SubscriptionData, string, { rejectValue: string }>(
  "subscription/cancel",
  async (reason: string, { rejectWithValue }) => {
    if (!isUserAuthenticated()) {
      return rejectWithValue("Authentication required")
    }

    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        return rejectWithValue(errorData.message || "Failed to cancel subscription")
      }

      return await response.json()
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  },
)

export const resumeSubscription = createAsyncThunk<SubscriptionData, void, { rejectValue: string }>(
  "subscription/resume",
  async (_, { rejectWithValue }) => {
    if (!isUserAuthenticated()) {
      return rejectWithValue("Authentication required")
    }

    try {
      const response = await fetch("/api/subscriptions/resume", {
        method: "POST",
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        return rejectWithValue(errorData.message || "Failed to resume subscription")
      }

      return await response.json()
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  },
)

export const activateFreeTrial = createAsyncThunk<SubscriptionData, void, { rejectValue: string }>(
  "subscription/activateTrial",
  async (_, { rejectWithValue }) => {
    if (!isUserAuthenticated()) {
      return rejectWithValue("Authentication required")
    }

    try {
      const response = await fetch("/api/subscriptions/activate-free", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmed: true }),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        return rejectWithValue(errorData.details || errorData.message || "Failed to activate free trial")
      }

      return await response.json()
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  },
)

export const subscribeToPlan = createAsyncThunk<
  SubscriptionData,
  { planId: SubscriptionPlanType; duration: number; promoCode?: string; promoDiscount?: number },
  { rejectValue: string }
>("subscription/subscribeToPlan", async (payload, { rejectWithValue }) => {
  if (!isUserAuthenticated()) {
    return rejectWithValue("Authentication required")
  }

  try {
    const response = await fetch("/api/subscriptions/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000), // Longer timeout for payment processing
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      return rejectWithValue(errorData.message || "Failed to create subscription")
    }

    return await response.json()
  } catch (error) {
    return rejectWithValue((error as Error).message)
  }
})

// Create the subscription slice with optimized reducers
const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    clearSubscriptionData: (state) => {
      state.data = null
      state.lastFetched = null
      state.error = null
    },
    resetState: () => initialState,
    resetSubscriptionState: () => initialState,
    setSubscriptionData: (state, action: PayloadAction<SubscriptionData>) => {
      state.data = action.payload
      state.lastFetched = Date.now()
      state.isLoading = false
      state.isFetching = false
      state.error = null
    },
    // Add action to set unauthenticated state
    setUnauthenticatedState: (state) => {
      state.data = DEFAULT_FREE_SUBSCRIPTION
      state.isLoading = false
      state.isFetching = false
      state.error = null
      state.lastFetched = Date.now()
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch subscription
      .addCase(fetchSubscription.pending, (state) => {
        state.isLoading = true
        state.isFetching = true
        state.error = null
      })
      .addCase(fetchSubscription.fulfilled, (state, action: PayloadAction<SubscriptionData>) => {
        state.isLoading = false
        state.isFetching = false

        if (!action.payload) {
          logger.warn("Received null/undefined subscription data")
          return
        }

        // Only update if data has changed (performance optimization)
        if (!state.data || !shallowEqual(action.payload, state.data)) {
          state.data = action.payload
          state.lastFetched = Date.now()
          state.error = null
        }
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.isLoading = false
        state.isFetching = false

        const errorMessage = typeof action.payload === "string" 
          ? action.payload 
          : action.error?.message || "Subscription fetch failed"

        state.error = errorMessage

        // Set default data if we don't have any
        if (!state.data) {
          state.data = DEFAULT_FREE_SUBSCRIPTION
        }
      })

      // Cancel subscription
      .addCase(cancelSubscription.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.isLoading = false
        if (state.data) {
          state.data = { ...state.data, ...action.payload }
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
          state.data = { ...state.data, ...action.payload }
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
          state.data = { ...state.data, ...action.payload }
        }
      })
      .addCase(activateFreeTrial.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Force refresh
      .addCase(forceRefreshSubscription.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(forceRefreshSubscription.fulfilled, (state, action) => {
        state.isLoading = false
        state.isFetching = false
        state.data = action.payload
        state.lastFetched = Date.now()
        state.error = null
      })
      .addCase(forceRefreshSubscription.rejected, (state, action) => {
        state.isLoading = false
        state.isFetching = false
        state.error = action.payload as string
      })

      // Subscribe to plan
      .addCase(subscribeToPlan.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(subscribeToPlan.fulfilled, (state, action) => {
        state.isLoading = false
        state.data = action.payload
        state.lastFetched = Date.now()
      })
      .addCase(subscribeToPlan.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

// Export actions
export const { 
  clearSubscriptionData, 
  resetState, 
  setSubscriptionData, 
  resetSubscriptionState,
  setUnauthenticatedState 
} = subscriptionSlice.actions

// Optimized memoized selectors
export const selectSubscriptionData = (state: RootState) => state.subscription.data
export const selectSubscriptionLoading = (state: RootState) => state.subscription.isLoading
export const selectSubscriptionError = (state: RootState) => state.subscription.error
export const selectLastFetched = (state: RootState) => state.subscription.lastFetched

// Enhanced subscription selector with computed properties (memoized)
export const selectSubscription = createSelector(
  [selectSubscriptionData], 
  (data): EnhancedSubscriptionData | null => {
    if (!data) return null
    
    const now = new Date()
    const expirationDate = data.expirationDate ? new Date(data.expirationDate) : null
    const isExpired = expirationDate ? expirationDate < now : false
    
    return {
      ...data,
      isActive: data.status === "ACTIVE" && !data.cancelAtPeriodEnd && !isExpired,
      isExpired,
      formattedCredits: `${data.credits || 0} credits`,
      hasCreditsRemaining: (data.credits || 0) > (data.tokensUsed || 0),
    }
  }
)

// Performance-optimized selectors
export const selectTokenUsage = createSelector(
  [selectSubscriptionData], 
  (subscription): TokenUsage | null => {
    if (!subscription) return null

    const tokensUsed = subscription.tokensUsed || 0
    const totalTokens = subscription.credits || 0
    const remaining = Math.max(totalTokens - tokensUsed, 0)

    return {
      tokensUsed,
      total: totalTokens,
      remaining,
      percentage: totalTokens > 0 ? Math.min((tokensUsed / totalTokens) * 100, 100) : 0,
      hasExceededLimit: tokensUsed > totalTokens,
    }
  }
)

// Simple memoized selectors for commonly used properties
export const selectIsSubscribed = createSelector(
  [selectSubscriptionData], 
  (data) => data?.isSubscribed ?? false
)

export const selectSubscriptionPlan = createSelector(
  [selectSubscriptionData],
  (data): SubscriptionPlanType => data?.subscriptionPlan ?? "FREE"
)

export const selectSubscriptionStatus = createSelector(
  [selectSubscriptionData],
  (data): SubscriptionStatusType | undefined => data?.status
)

export const selectIsCancelled = createSelector(
  [selectSubscriptionData], 
  (data) => data?.cancelAtPeriodEnd ?? false
)

// Optimized plan subscription checker
export const selectCanSubscribeToPlan = createSelector(
  [selectSubscriptionData],
  (data) => (targetPlan: SubscriptionPlanType): { canSubscribe: boolean; reason?: string } => {
    if (!data) return { canSubscribe: true }

    if (data.subscriptionPlan === targetPlan && data.status === "ACTIVE") {
      return { canSubscribe: false, reason: "You are already subscribed to this plan" }
    }

    if (data.isSubscribed && data.status === "ACTIVE" && data.subscriptionPlan !== targetPlan) {
      return { canSubscribe: false, reason: "Please cancel your current subscription first" }
    }

    return { canSubscribe: true }
  }
)

// Selector to check if data needs refresh
export const selectNeedsRefresh = createSelector(
  [selectLastFetched],
  (lastFetched) => {
    if (!lastFetched) return true
    return Date.now() - lastFetched > MIN_FETCH_INTERVAL
  }
)

export default subscriptionSlice.reducer