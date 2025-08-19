import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import type {
  SubscriptionData,
  SubscriptionState,
  SubscriptionStatusResponse,
  SubscriptionStatusType,
  TokenUsage,
  EnhancedSubscriptionData,
} from "@/app/types/subscription"
import { logger } from "@/lib/logger"
import { fetchWithTimeout } from "@/lib/http"

// Normalized subscription state structure
interface NormalizedSubscriptionState {
  // Core subscription data
  currentSubscription: SubscriptionData | null
  
  // Loading states
  isLoading: boolean
  isFetching: boolean
  
  // Error handling
  error: string | null
  
  // Cache management
  lastFetched: number | null
  lastRefreshed: number | null
  
  // Performance tracking
  fetchCount: number
  lastSuccessfulFetch: number | null
}

const DEFAULT_FREE_SUBSCRIPTION: SubscriptionData = {
  credits: 0,
  tokensUsed: 0,
  isSubscribed: false,
  subscriptionPlan: "FREE",
  status: "INACTIVE",
  cancelAtPeriodEnd: false,
  subscriptionId: "",
}

const initialState: NormalizedSubscriptionState = {
  currentSubscription: null,
  isLoading: false,
  isFetching: false,
  error: null,
  lastFetched: null,
  lastRefreshed: null,
  fetchCount: 0,
  lastSuccessfulFetch: null,
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
  { forceRefresh?: boolean; skipCache?: boolean } | void,
  { state: RootState; rejectValue: string }
>("subscription/fetch", async (options = {}, { getState }) => {
  const { lastFetched, isFetching, currentSubscription } = getState().subscription
  const { forceRefresh = false, skipCache = false } = options || {}
  const now = Date.now()

  // Smart caching based on subscription status
  const fetchInterval = getFetchInterval(currentSubscription)
  const isRecent = typeof lastFetched === "number" && now - lastFetched < fetchInterval
  const isTooFrequent = typeof lastFetched === "number" && now - lastFetched < MIN_FETCH_INTERVAL

  if ((isFetching || isRecent) && !forceRefresh && !skipCache) {
    logger.debug("Subscription fetch skipped (in-flight, recent, or cached)")
    return currentSubscription ?? DEFAULT_FREE_SUBSCRIPTION
  }

  if (isTooFrequent && !forceRefresh) {
    logger.debug("Subscription fetch skipped (too frequent)")
    return currentSubscription ?? DEFAULT_FREE_SUBSCRIPTION
  }

  try {
    const cacheBuster = `nocache=${Date.now()}`
    const res = await fetchWithTimeout(`/api/subscriptions/status?${cacheBuster}`, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      credentials: "include",
    }, 12000)

    if (res?.status === 401) {
      logger.warn("User not authenticated for subscription")
      return DEFAULT_FREE_SUBSCRIPTION
    }

    if (res && !res?.ok) {
      logger.warn(`Subscription API error: ${res.status}`)
      // Preserve existing data if API fails but user is authenticated
      if (currentSubscription && currentSubscription.subscriptionPlan !== "FREE") {
        return currentSubscription
      }
      return DEFAULT_FREE_SUBSCRIPTION
    }

    const result: SubscriptionStatusResponse = await res.json()
    
    const transformed: SubscriptionData = {
      credits: Math.max(0, result.credits || 0),
      tokensUsed: Math.max(0, result.tokensUsed || 0),
      subscriptionPlan: result.subscriptionPlan || "FREE",
      cancelAtPeriodEnd: Boolean(result.cancelAtPeriodEnd),
      expirationDate: result.expirationDate,
      status: (result.status as SubscriptionStatusType) || "INACTIVE",
      subscriptionId: result.subscriptionId || "",
      isSubscribed: false, // will be updated next
    }

    // Enhanced expiration logic
    const isExpired = transformed.expirationDate && new Date(transformed.expirationDate) < new Date()
    if (transformed.status === "INACTIVE" || isExpired) {
      transformed.status = "EXPIRED"
    }
    transformed.isSubscribed = transformed.status === "ACTIVE"

    return transformed
  } catch (error) {
    // Always return default, never throw
    logger.warn("Subscription fetch failed or timed out", error)
    return currentSubscription ?? DEFAULT_FREE_SUBSCRIPTION
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

    if (!res.ok) {
      throw new Error(`Failed to cancel subscription: ${res.statusText}`)
    }
    
    // After successful cancel, refetch status for a consistent shape
    const statusRes = await fetchWithTimeout(`/api/subscriptions/status?nocache=${Date.now()}`, { credentials: "include" }, 10000)
    if (!statusRes.ok) {
      return {
        ...currentSubscription,
        status: "CANCELED",
        cancelAtPeriodEnd: true,
        isSubscribed: false,
      }
    }
    const refreshed: SubscriptionStatusResponse = await statusRes.json()
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

    if (!res.ok) {
      throw new Error(`Failed to resume subscription: ${res.statusText}`)
    }
    
    // After successful resume, refetch status
    const statusRes = await fetchWithTimeout(`/api/subscriptions/status?nocache=${Date.now()}`, { credentials: "include" }, 10000)
    if (!statusRes.ok) {
      return {
        ...currentSubscription,
        status: "ACTIVE",
        cancelAtPeriodEnd: false,
        isSubscribed: true,
      }
    }
    const refreshed: SubscriptionStatusResponse = await statusRes.json()
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
    logger.info("Force syncing subscription with Stripe...")
    
    const res = await fetchWithTimeout("/api/subscriptions/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      credentials: "include",
    }, 15000)
 
    if (res?.status === 401) {
      logger.warn("User not authenticated for force sync")
      return DEFAULT_FREE_SUBSCRIPTION
    }
 
    if (!res?.ok) {
      const status = res?.status ?? "unknown"
      const statusText = (res && (res as any).statusText) || "Unknown"
      throw new Error(`Force sync failed: ${status} - ${statusText}`)
    }
 
    const syncResult = await res.json()
    logger.info("Force sync completed", syncResult)
    
    return syncResult.subscription
  } catch (error) {
    logger.error("Force sync failed", error)
    return rejectWithValue(error instanceof Error ? error.message : 'Force sync failed')
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
      state.lastRefreshed = Date.now()
      state.error = null
      state.isLoading = false
      state.isFetching = false
      state.fetchCount += 1
      state.lastSuccessfulFetch = Date.now()
    },
    clearSubscriptionError: (state) => {
      state.error = null
    },
    markSubscriptionStale: (state) => {
      state.lastFetched = null
      state.lastRefreshed = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscription.pending, (state) => {
        state.isFetching = true
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload
        state.lastFetched = Date.now()
        state.lastRefreshed = Date.now()
        state.isFetching = false
        state.isLoading = false
        state.error = null
        state.fetchCount += 1
        state.lastSuccessfulFetch = Date.now()
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.isFetching = false
        state.isLoading = false
        state.error = action.error.message || "Failed to fetch subscription"
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload
        state.lastFetched = Date.now()
        state.lastRefreshed = Date.now()
        state.fetchCount += 1
        state.lastSuccessfulFetch = Date.now()
      })
      .addCase(resumeSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload
        state.lastFetched = Date.now()
        state.lastRefreshed = Date.now()
        state.fetchCount += 1
        state.lastSuccessfulFetch = Date.now()
      })
      .addCase(forceSyncSubscription.pending, (state) => {
        state.isFetching = true
        state.isLoading = true
        state.error = null
      })
      .addCase(forceSyncSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload
        state.lastFetched = Date.now()
        state.lastRefreshed = Date.now()
        state.isFetching = false
        state.isLoading = false
        state.error = null
        state.fetchCount += 1
        state.lastSuccessfulFetch = Date.now()
      })
      .addCase(forceSyncSubscription.rejected, (state, action) => {
        state.isFetching = false
        state.isLoading = false
        state.error = action.payload || "Force sync failed"
      })
  },
})

export const {
  resetSubscriptionState,
  setSubscriptionData,
  clearSubscriptionError,
  markSubscriptionStale,
} = subscriptionSlice.actions

// Enhanced selectors with memoization
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

// Core business logic selectors
export const selectHasActiveSubscription = createSelector(
  [selectSubscriptionData],
  (data): boolean => {
    if (!data) return false
    return data.isSubscribed && 
           data.status === "ACTIVE" && 
           !data.cancelAtPeriodEnd &&
           (!data.expirationDate || new Date(data.expirationDate) > new Date())
  }
)

export const selectHasCredits = createSelector(
  [selectSubscriptionData],
  (data): boolean => {
    if (!data) return false
    return (data.credits || 0) > (data.tokensUsed || 0)
  }
)

export const selectCanCreateQuizOrCourse = createSelector(
  [selectHasActiveSubscription, selectHasCredits],
  (hasActiveSubscription, hasCredits): boolean => {
    // User must have BOTH active subscription AND credits
    return hasActiveSubscription && hasCredits
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
    return data.status === "EXPIRED" || 
           (data.expirationDate && new Date(data.expirationDate) < new Date())
  }
)

export const selectTokenUsage = createSelector(
  [selectSubscriptionData],
  (data): TokenUsage | null => {
    if (!data) return null
    const used = data.tokensUsed || 0
    const total = data.credits || 0
    return {
      tokensUsed: used,
      total,
      remaining: Math.max(total - used, 0),
      percentage: total > 0 ? Math.min((used / total) * 100, 100) : 0,
      hasExceededLimit: used > total,
    }
  }
)

export const selectEnhancedSubscription = createSelector(
  [selectSubscriptionData],
  (data): EnhancedSubscriptionData | null => {
    if (!data) return null
    const now = new Date()
    const expirationDate = data.expirationDate
      ? new Date(data.expirationDate)
      : null
    const isExpired = expirationDate ? expirationDate < now : false
    return {
      ...data,
      isActive:
        data.status === "ACTIVE" &&
        !data.cancelAtPeriodEnd &&
        !isExpired,
      isExpired,
      formattedCredits: `${data.credits} credits`,
      hasCreditsRemaining: (data.credits || 0) > (data.tokensUsed || 0),
    }
  }
)

// Performance and cache selectors
export const selectShouldRefreshSubscription = createSelector(
  [selectSubscriptionLastRefreshed, selectSubscriptionData],
  (lastRefreshed, data): boolean => {
    if (!lastRefreshed || !data) return true
    
    const now = Date.now()
    const refreshInterval = getFetchInterval(data)
    return now - lastRefreshed > refreshInterval
  }
)

export const selectSubscriptionCacheStatus = createSelector(
  [selectSubscriptionLastFetched, selectSubscriptionData, selectSubscriptionError],
  (lastFetched, data, error) => {
    if (error) return "error"
    if (!data) return "empty"
    if (!lastFetched) return "stale"
    
    const now = Date.now()
    const age = now - lastFetched
    const isFresh = age < 300000 // 5 minutes
    
    return isFresh ? "fresh" : "stale"
  }
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
