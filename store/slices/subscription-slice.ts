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
} from "@/app/dashboard/subscription/types/subscription"
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
const MIN_FETCH_INTERVAL = 10000 // 10 seconds

// Enhanced fetch subscription thunk with better error handling and deduplication
export const fetchSubscription = createAsyncThunk<
  SubscriptionData,
  void,
  {
    state: RootState
    rejectValue: string
  }
>("subscription/fetch", async (_, { rejectWithValue, getState }) => {
  try {
    const state = getState()
    const { lastFetched, isFetching } = state.subscription

    // Check if we've fetched recently and should use cached data
    if (lastFetched && Date.now() - lastFetched < MIN_FETCH_INTERVAL) {
      logger.debug(`Skipping subscription fetch - last fetched ${Date.now() - lastFetched}ms ago`)
      return state.subscription.data || DEFAULT_FREE_SUBSCRIPTION
    }

    // If a fetch is already in progress, reuse the existing promise
    if (isFetching && subscriptionFetchPromise) {
      logger.debug("Subscription fetch already in progress, reusing promise")
      return subscriptionFetchPromise
    }

    // Create new fetch promise with timeout protection
    const FETCH_TIMEOUT = 15000 // 15 second timeout

    // Create a timeout promise that rejects after specified time
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Subscription data fetch timed out"))
      }, FETCH_TIMEOUT)
    })

    subscriptionFetchPromise = Promise.race([
      fetch("/api/subscriptions/status", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      }).then(async (response) => {
        // Handle 401 unauthorized specifically - user is not logged in
        if (response.status === 401) {
          logger.info("User is not authenticated, returning default free subscription data")
          return DEFAULT_FREE_SUBSCRIPTION
        }

        if (!response.ok) {
          const errorText = await response.text()
          logger.error(`API error: ${response.status} - ${errorText}`)
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data: SubscriptionStatusResponse = await response.json()
        logger.info(`Subscription data fetched successfully`)
        logger.debug(`Full subscription data: ${JSON.stringify(data)}`)

        // Transform API response to internal format
        const transformedData: SubscriptionData = {
          credits: data.credits || 0,
          tokensUsed: data.tokensUsed || 0,
          isSubscribed: data.isSubscribed || false,
          subscriptionPlan: data.subscriptionPlan || "FREE",
          expirationDate: data.expirationDate,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
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
      }),
      timeoutPromise,
    ])
      .catch((error) => {
        // NetworkError or AbortError indicates a connectivity issue
        if (
          error.name === "AbortError" ||
          error.name === "NetworkError" ||
          error.message.includes("NetworkError") ||
          error.message.includes("timeout")
        ) {
          logger.error(`Network connectivity issue: ${error.message}`)
          throw new Error("Network connectivity issue - please check your connection")
        } else {
          logger.error(`Failed to fetch subscription data: ${error.message}`)
          throw error
        }
      })
      .finally(() => {
        // Clear promise reference after completion
        subscriptionFetchPromise = null
      })

    return await subscriptionFetchPromise
  } catch (error: any) {
    // Enhanced error handling with clearer messages
    let errorMessage = "Failed to fetch subscription data"

    if (error instanceof Error) {
      errorMessage = error.message

      // Improve error messages for common issues
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        errorMessage = "Network connectivity issue - please check your connection"
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timed out - server might be under heavy load"
      }

      logger.error(`Failed to fetch subscription data: ${error.message}`, {
        name: error.name,
        stack: error.stack?.slice(0, 200),
      })
    } else {
      logger.error(`Failed to fetch subscription data: ${String(error)}`)
    }

    return rejectWithValue(errorMessage)
  }
})

// Async thunk for canceling subscription
export const cancelSubscription = createAsyncThunk<SubscriptionData, string, { rejectValue: string }>(
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
        const errorData = await response.json()
        return rejectWithValue(errorData.message || "Failed to cancel subscription")
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  },
)

// Async thunk for resuming subscription
export const resumeSubscription = createAsyncThunk<SubscriptionData, void, { rejectValue: string }>(
  "subscription/resume",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/subscriptions/resume", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        return rejectWithValue(errorData.message || "Failed to resume subscription")
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  },
)

// Async thunk for activating free trial
export const activateFreeTrial = createAsyncThunk<SubscriptionData, void, { rejectValue: string }>(
  "subscription/activateTrial",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/subscriptions/activate-free", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmed: true }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return rejectWithValue(errorData.details || errorData.message || "Failed to activate free trial")
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue((error as Error).message)
    }
  },
)

// Thunk to force refresh the subscription data with improved error handling
export const forceRefreshSubscription = createAsyncThunk<
  SubscriptionData,
  void,
  {
    state: RootState
    rejectValue: string
  }
>("subscription/forceRefresh", async (_, { dispatch, rejectWithValue }) => {
  // Ensure we have network connectivity
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    logger.warn("Cannot force refresh - network appears to be offline")
    return rejectWithValue("Network connectivity issue - please check your connection")
  }

  logger.info("Force refreshing subscription data")

  try {
    // Clear any cached/in-flight requests
    subscriptionFetchPromise = null

    // Clear existing data first but keep the last error if any
    dispatch(clearSubscriptionData())

    // Then fetch fresh data with a timeout to prevent hanging
    const result = await Promise.race([
      dispatch(fetchSubscription()).unwrap(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Force refresh timed out after 10s")), 10000),
      ),
    ])

    return result
  } catch (error) {
    logger.error(`Force refresh failed: ${error instanceof Error ? error.message : String(error)}`)
    return rejectWithValue(error instanceof Error ? error.message : String(error))
  }
})

// Thunk for subscribing to a plan

export const subscribeToPlan = createAsyncThunk<
  SubscriptionData,
  { planId: SubscriptionPlanType; duration: number; promoCode?: string; promoDiscount?: number },
  { rejectValue: string }
>("subscription/subscribeToPlan", async (payload, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/subscriptions/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return rejectWithValue(errorData.message || "Failed to create subscription")
    }

    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue((error as Error).message)
  }
})

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
    setSubscriptionData: (state, action: PayloadAction<SubscriptionData>) => {
      state.data = action.payload
      state.lastFetched = Date.now()
      state.isLoading = false
      state.isFetching = false
      state.error = null
      logger.info(`Subscription data manually set: ${JSON.stringify(action.payload)}`)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscription.pending, (state) => {
        state.isLoading = true
        state.isFetching = true
        state.error = null
        logger.debug("Subscription fetch pending")
      })
      .addCase(fetchSubscription.fulfilled, (state, action: PayloadAction<SubscriptionData>) => {
        state.isLoading = false
        state.isFetching = false

        // Only update if the data has actually changed
        if (!action.payload) {
          logger.warn("Received null/undefined subscription data from API")
          return
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
        state.isLoading = false
        state.isFetching = false

        // Format error message for display
        let errorMessage: string

        if (typeof action.payload === "string") {
          errorMessage = action.payload
        } else if (action.payload && typeof (action.payload as any).error === "string") {
          errorMessage = (action.payload as any).error
        } else if (action.error && action.error.message) {
          errorMessage = action.error.message
        } else {
          errorMessage = "Subscription fetch failed"
        }

        // Clean up common error messages for better user experience
        if (
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError") ||
          errorMessage.includes("network connectivity") ||
          errorMessage.includes("timeout")
        ) {
          errorMessage = "Network connectivity issue - please check your connection and try again"
        }

        state.error = errorMessage

        // Don't replace existing data when request fails unless we have no data
        // This helps maintain user experience during temporary outages
        if (!state.data) {
          state.data = DEFAULT_FREE_SUBSCRIPTION
        }

        logger.error(`Subscription fetch failed: ${errorMessage}`)
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

      // Force refresh subscription
      .addCase(forceRefreshSubscription.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(forceRefreshSubscription.fulfilled, (state, action) => {
        state.isLoading = false
        state.isFetching = false
        state.data = action.payload
        state.lastFetched = Date.now()
      })
      .addCase(forceRefreshSubscription.rejected, (state, action) => {
        state.isLoading = false
        state.isFetching = false
        state.error = action.payload as string
      })
  },
})

// Export actions
export const { clearSubscriptionData, resetState, setSubscriptionData, resetSubscriptionState } =
  subscriptionSlice.actions

// Memoized selectors for better performance

// Base selectors
const getSubscriptionState = (state: RootState) => state.subscription
export const selectSubscriptionData = (state: RootState) => state.subscription.data
export const selectSubscriptionLoading = (state: RootState) => state.subscription.isLoading
export const selectSubscriptionError = (state: RootState) => state.subscription.error

// Enhanced subscription selector with computed properties
export const selectSubscription = createSelector([selectSubscriptionData], (data): EnhancedSubscriptionData | null => {
  if (!data) return null
  return {
    ...data,
    isActive: data.status === "ACTIVE" && !data.cancelAtPeriodEnd,
    isExpired: data.status === "EXPIRED" || (data.expirationDate ? new Date(data.expirationDate) < new Date() : false),
    formattedCredits: typeof data.credits === "number" ? `${data.credits} credits` : "No credits",
    hasCreditsRemaining: (data.credits || 0) > (data.tokensUsed || 0),
  }
})

// Shallow comparison selector for performance
export const selectSubscriptionShallow = createSelector([selectSubscriptionData], (data) => data, {
  memoizeOptions: { resultEqualityCheck: shallowEqual },
})

// Token usage selector with memoization
export const selectTokenUsage = createSelector([selectSubscriptionData], (subscription): TokenUsage | null => {
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
export const selectIsSubscribed = createSelector([selectSubscriptionData], (data) => data?.isSubscribed ?? false)

export const selectSubscriptionPlan = createSelector(
  [selectSubscriptionData],
  (data): SubscriptionPlanType => data?.subscriptionPlan ?? "FREE",
)

export const selectSubscriptionStatus = createSelector(
  [selectSubscriptionData],
  (data): SubscriptionStatusType | undefined => data?.status,
)

export const selectIsCancelled = createSelector([selectSubscriptionData], (data) => data?.cancelAtPeriodEnd ?? false)

// Selector to check if user can subscribe to a specific plan
export const selectCanSubscribeToPlan = createSelector(
  [selectSubscriptionData],
  (data) =>
    (targetPlan: SubscriptionPlanType): { canSubscribe: boolean; reason?: string } => {
      if (!data) return { canSubscribe: true }

      // If user is already on this plan and it's active
      if (data.subscriptionPlan === targetPlan && data.status === "ACTIVE") {
        return { canSubscribe: false, reason: "You are already subscribed to this plan" }
      }

      // If user has an active subscription to a different plan
      if (data.isSubscribed && data.status === "ACTIVE" && data.subscriptionPlan !== targetPlan) {
        return { canSubscribe: false, reason: "Please cancel your current subscription first" }
      }

      return { canSubscribe: true }
    },
)

export default subscriptionSlice.reducer
