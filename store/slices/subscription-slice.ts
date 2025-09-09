import type { RootState } from "@/store"
import type {
  SubscriptionData,
  SubscriptionStatusType,
} from "@/app/types/subscription"
import { logger } from "@/lib/logger"
import { fetchWithTimeout } from "@/lib/http"
import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from "@reduxjs/toolkit"

// Normalized subscription state structure
interface NormalizedSubscriptionState {
  currentSubscription: SubscriptionData | null
  isLoading: boolean
  isFetching: boolean
  error: string | null
  lastFetched: number | null
  lastRefreshed: number | null
}

const DEFAULT_FREE_SUBSCRIPTION: SubscriptionData = {
  credits: 0,
  tokensUsed: 0,
  isSubscribed: false,
  subscriptionPlan: "FREE",
  status: "INACTIVE",
}

const initialState: NormalizedSubscriptionState = {
  currentSubscription: null,
  isLoading: false,
  isFetching: false,
  error: null,
  lastFetched: null,
  lastRefreshed: null,
}

// Smart fetch interval based on subscription status
const getFetchInterval = (subscription: SubscriptionData | null): number => {
  if (!subscription || subscription.subscriptionPlan === "FREE") {
    return 300000 // 5 minutes for free users
  }
  
  if (subscription.status === "ACTIVE") {
    return 600000 // 10 minutes for active subscribers
  }
  
  if (subscription.status === "EXPIRED" || subscription.status === "CANCELED") {
    return 1800000 // 30 minutes for expired/canceled
  }
  
  return 900000 // 15 minutes default
}

const MIN_FETCH_INTERVAL = 30000 // 30 seconds minimum

export const fetchSubscription = createAsyncThunk<
  SubscriptionData,
  { forceRefresh?: boolean } | void,
  { state: RootState; rejectValue: string }
>("subscription/fetch", async (options = {}, { getState, signal }) => {
  const { forceRefresh = false } = options || {}

  try {
    const cacheBuster = `nocache=${Date.now()}`
    const res = await fetchWithTimeout(`/api/subscriptions/status?${cacheBuster}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      signal, // Use AbortController signal to prevent memory leaks
    }, 12000)

    if (!res || res?.status === 401) {
      return DEFAULT_FREE_SUBSCRIPTION
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()

    // Transform the response to match our SubscriptionData interface
    const transformed: SubscriptionData = {
      credits: Math.max(0, data.credits || 0), // Ensure non-negative
      tokensUsed: Math.max(0, data.tokensUsed || 0), // Ensure non-negative
      isSubscribed: Boolean(data.isSubscribed),
      subscriptionPlan: data.subscriptionPlan || "FREE",
      expirationDate: data.expirationDate,
      trialEndsAt: data.trialEndsAt,
      status: data.status || "INACTIVE",
    }

    // Additional validation
    if ((transformed.tokensUsed || 0) > (transformed.credits || 0) && transformed.subscriptionPlan === "FREE") {
      logger.warn(`Token usage (${transformed.tokensUsed || 0}) exceeds credits (${transformed.credits || 0}) for FREE plan`)
      transformed.tokensUsed = transformed.credits || 0 // Cap usage at available credits
    }

    return transformed
  } catch (error) {
    // Always return default, never throw to prevent crashes
    logger.warn("Subscription fetch failed or timed out", error)
    return DEFAULT_FREE_SUBSCRIPTION
  }
})

export const cancelSubscription = createAsyncThunk<
  SubscriptionData,
  void,
  { state: RootState; rejectValue: string }
>("subscription/cancel", async (_, { getState, rejectWithValue }) => {
  const { currentSubscription } = getState().subscription

  if (!currentSubscription?.isSubscribed || !currentSubscription.subscriptionId) {
    return rejectWithValue("No active subscription to cancel")
  }

  try {
    const res = await fetchWithTimeout("/api/subscriptions/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ subscriptionId: currentSubscription.subscriptionId }),
    }, 10000)

    if (!res || !res.ok) {
      throw new Error(`Failed to cancel subscription: ${res?.statusText ?? 'Unknown status'}`)
    }
    
    // After successful cancel, refetch status for a consistent shape
    const statusRes = await fetchWithTimeout(`/api/subscriptions/status?nocache=${Date.now()}`, { credentials: "include" }, 10000)
  if (!statusRes || !statusRes.ok) {
      return {
        ...currentSubscription,
        status: "CANCELED",
        cancelAtPeriodEnd: true,
        isSubscribed: false,
      }
    }
  const refreshed: any = await statusRes!.json()
    return {
      credits: Math.max(0, refreshed.credits || 0),
      tokensUsed: Math.max(0, refreshed.tokensUsed || 0),
      subscriptionPlan: refreshed.subscriptionPlan || "FREE",
      cancelAtPeriodEnd: Boolean(refreshed.cancelAtPeriodEnd),
      expirationDate: refreshed.expirationDate,
      status: (refreshed.status as SubscriptionStatusType) || "INACTIVE",
      subscriptionId: refreshed.subscriptionId || "",
      isSubscribed: refreshed.status === "ACTIVE",
    }
  } catch (error: any) {
    logger.error("Subscription cancellation failed", error)
    return rejectWithValue(error.message || "Failed to cancel subscription")
  }
})

export const resumeSubscription = createAsyncThunk<
  SubscriptionData,
  void,
  { state: RootState; rejectValue: string }
>("subscription/resume", async (_, { getState, rejectWithValue }) => {
  const { currentSubscription } = getState().subscription

  if (!currentSubscription || !currentSubscription.cancelAtPeriodEnd || !currentSubscription.subscriptionId) {
    return rejectWithValue("No paused subscription to resume")
  }

  try {
    const res = await fetchWithTimeout("/api/subscriptions/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ subscriptionId: currentSubscription.subscriptionId }),
    }, 10000)

    if (!res || !res.ok) {
      throw new Error(`Failed to resume subscription: ${res?.statusText ?? 'Unknown status'}`)
    }
    
    // After successful resume, refetch status
    const statusRes = await fetchWithTimeout(`/api/subscriptions/status?nocache=${Date.now()}`, { credentials: "include" }, 10000)
  if (!statusRes || !statusRes.ok) {
      return {
        ...currentSubscription,
        status: "ACTIVE",
        cancelAtPeriodEnd: false,
        isSubscribed: true,
      }
    }
  const refreshed: any = await statusRes!.json()
    return {
      credits: Math.max(0, refreshed.credits || 0),
      tokensUsed: Math.max(0, refreshed.tokensUsed || 0),
      subscriptionPlan: refreshed.subscriptionPlan || "FREE",
      cancelAtPeriodEnd: Boolean(refreshed.cancelAtPeriodEnd),
      expirationDate: refreshed.expirationDate,
      status: (refreshed.status as SubscriptionStatusType) || "INACTIVE",
      subscriptionId: refreshed.subscriptionId || "",
      isSubscribed: refreshed.status === "ACTIVE",
    }
  } catch (error: any) {
    logger.error("Subscription resume failed", error)
    return rejectWithValue(error.message || "Failed to resume subscription")
  }
})

export const forceSyncSubscription = createAsyncThunk<
  SubscriptionData,
  void,
  { state: RootState; rejectValue: string }
>("subscription/forceSync", async (_, { rejectWithValue }) => {
  try {
    // Check if we're in development and server might not be running
    const isDevelopment = process.env.NODE_ENV === 'development'

    // Quick server availability check for development
    if (isDevelopment) {
      try {
        const healthCheck = await fetch('/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(2000) // 2 second timeout
        })
        if (!healthCheck.ok) {
          logger.warn("Server health check failed, skipping subscription sync")
          return DEFAULT_FREE_SUBSCRIPTION
        }
      } catch (healthError) {
        logger.warn("Server not available for subscription sync, continuing with cached data")
        return DEFAULT_FREE_SUBSCRIPTION
      }
    }

    logger.info("Force syncing subscription with Stripe...")

    const res = await fetchWithTimeout("/api/subscriptions/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      credentials: "include",
    }, 15000)

    if (!res) {
      // Request was aborted due to timeout
      const timeoutError = new Error('Request timed out. Please try again.')
      logger.warn("Subscription sync timed out", timeoutError)
      return rejectWithValue(timeoutError.message)
    }

    if (res.status === 401) {
      logger.warn("User not authenticated for force sync")
      return DEFAULT_FREE_SUBSCRIPTION
    }

    if (!res.ok) {
      const status = res.status
      const statusText = res.statusText || "Unknown"
      logger.warn(`Force sync warning: ${status} - ${statusText}`)
      return DEFAULT_FREE_SUBSCRIPTION
    }

    const syncResult = await res.json()
    logger.info("Force sync completed", syncResult)

    return syncResult.subscription
  } catch (error) {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage = error instanceof Error ? error.message : 'Force sync failed'

    // In development, network errors are expected if server isn't running
    if (isDevelopment && errorMessage.includes('Failed to fetch')) {
      logger.warn("Network error during development (server may not be running)", errorMessage)
      return DEFAULT_FREE_SUBSCRIPTION
    }

    logger.error("Force sync failed", error)
    return rejectWithValue(errorMessage)
  }
})

export const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    resetSubscriptionState: () => initialState,
    setSubscriptionData: (state, action: PayloadAction<SubscriptionData>) => {
      state.currentSubscription = action.payload
      state.lastFetched = Date.now()
    },
    clearSubscriptionError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscription.pending, (state) => {
        state.isFetching = true
        state.error = null
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload
        state.isFetching = false
        state.lastFetched = Date.now()
        state.lastRefreshed = Date.now()
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.isFetching = false
        state.error = action.payload || "Failed to fetch subscription"
      })
  },
})

export const {
  resetSubscriptionState,
  setSubscriptionData,
  clearSubscriptionError,
} = subscriptionSlice.actions

// Selectors with memoization
export const selectSubscription = (state: RootState): NormalizedSubscriptionState =>
  state.subscription

export const selectSubscriptionData = (state: RootState) =>
  state.subscription.currentSubscription

export const selectSubscriptionError = (state: RootState) =>
  state.subscription.error

export const selectSubscriptionLoading = (state: RootState) =>
  state.subscription.isLoading

export const selectIsSubscriptionLoading = selectSubscriptionLoading

export const selectIsSubscriptionFetching = (state: RootState) =>
  state.subscription.isFetching

export const selectSubscriptionLastFetched = (state: RootState) =>
  state.subscription.lastFetched

export const selectSubscriptionLastRefreshed = (state: RootState) =>
  state.subscription.lastRefreshed

export const selectHasActiveSubscription = createSelector(
  [selectSubscriptionData],
  (data): boolean => {
    if (!data) return false
    return data.isSubscribed && data.status === "ACTIVE"
  }
)

export const selectHasCredits = createSelector(
  [selectSubscriptionData],
  (data): boolean => {
    if (!data) return false
    return (data.credits || 0) > 0
  }
)

export const selectCanCreateQuizOrCourse = createSelector(
  [selectHasActiveSubscription, selectHasCredits],
  (hasActiveSubscription, hasCredits): boolean => {
    return hasActiveSubscription || hasCredits
  }
)

export const selectSubscriptionStatus = createSelector(
  [selectSubscriptionData],
  (data) => data?.status || "INACTIVE"
)

export const selectSubscriptionPlan = createSelector(
  [selectSubscriptionData],
  (data) => data?.subscriptionPlan || "FREE"
)

export const selectIsSubscribed = createSelector(
  [selectSubscriptionData],
  (data) => data?.isSubscribed || false
)

export const selectIsCancelled = createSelector(
  [selectSubscriptionData],
  (data) => data?.cancelAtPeriodEnd || false
)

export const selectIsExpired = createSelector(
  [selectSubscriptionData],
  (data): boolean => {
    if (!data) return false
    if (data.status === "EXPIRED") return true
    if (data.expirationDate) {
      return new Date(data.expirationDate) < new Date()
    }
    return false
  }
)

export const selectTokenUsage = createSelector(
  [selectSubscriptionData],
  (data) => ({
    used: data?.tokensUsed || 0,
    total: data?.credits || 0,
    tokensUsed: data?.tokensUsed || 0, // Backward compatibility
    remaining: Math.max((data?.credits || 0) - (data?.tokensUsed || 0), 0),
    percentage: (data?.credits || 0) > 0 ? Math.min(((data?.tokensUsed || 0) / (data?.credits || 0)) * 100, 100) : 0,
    hasExceededLimit: (data?.tokensUsed || 0) > (data?.credits || 0),
  })
)

// Additional selectors for enhanced functionality
export const selectCanResubscribe = createSelector(
  [selectSubscriptionData],
  (data): boolean => {
    if (!data) return false;
    return data.status === "EXPIRED" || data.status === "CANCELED";
  }
)

export const selectSubscriptionMessage = createSelector(
  [selectSubscriptionData],
  (data): string | null => {
    if (!data) return null;
    
    if (data.status === "EXPIRED") {
      return "Your subscription has expired. Reactivate to continue using premium features.";
    }
    
    if (data.status === "CANCELED") {
      return "Your subscription was canceled. Subscribe again to access premium features.";
    }
    
    if (data.status === "TRIAL") {
      const daysLeft = data.trialEndsAt 
        ? Math.ceil((new Date(data.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;
      return daysLeft > 0 ? `${daysLeft} days left in your trial` : "Trial has ended";
    }
    
    return null;
  }
)

export const selectHadPreviousPaidPlan = createSelector(
  [selectSubscriptionData],
  (data): boolean => {
    if (!data) return false;
    return (data.subscriptionPlan !== "FREE") && 
           (data.status === "EXPIRED" || data.status === "CANCELED");
  }
)

// Performance and cache selectors
export const selectShouldRefreshSubscription = createSelector(
  [selectSubscriptionLastRefreshed, selectSubscriptionData],
  (lastRefreshed, data): boolean => {
    if (!lastRefreshed) return true
    const timeSinceRefresh = Date.now() - lastRefreshed
    return timeSinceRefresh > 5 * 60 * 1000 // 5 minutes
  }
)

export const selectSubscriptionCacheStatus = createSelector(
  [selectSubscriptionLastFetched, selectSubscriptionData, selectSubscriptionError],
  (lastFetched, data, error) => ({
    hasData: !!data,
    isStale: !lastFetched || Date.now() - lastFetched > 5 * 60 * 1000,
    hasError: !!error,
    lastFetched,
  })
)

// Legacy selectors for backward compatibility
export const canDownloadPdfSelector = (state: RootState) => {
  const subscriptionData = state.subscription.currentSubscription
  if (!subscriptionData) return false
  return (
    // subscriptionData.subscriptionPlan === "PREMIUM" || 
    // subscriptionData.subscriptionPlan === "ULTIMATE"
    true // Always allow PDF downloads for now
  )
}

export default subscriptionSlice.reducer
