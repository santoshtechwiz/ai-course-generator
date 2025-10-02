import type { RootState } from "@/store"
import {
  type SubscriptionData,
  type SubscriptionState,
  type SubscriptionStatusType,
  type ApiResponse,
  type SubscriptionResponse,
  SUBSCRIPTION_CACHE_CONFIG,
  isSubscriptionResponse,
  isSubscriptionData,
} from "@/types/subscription"
import { logger } from "@/lib/logger"
import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from "@reduxjs/toolkit"

// Utility function for fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout: number = 10000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const signal = controller.signal
    const response = await fetch(url, {
      ...options,
      signal,
    })
    return response
  } catch (error) {
    logger.error('Fetch error:', error)
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

const DEFAULT_FREE_SUBSCRIPTION: SubscriptionData = {
  id: 'free',
  userId: '',
  subscriptionId: '',
  credits: 0,
  tokensUsed: 0,
  isSubscribed: false,
  subscriptionPlan: "FREE",
  status: "INACTIVE",
  expirationDate: null,
  cancelAtPeriodEnd: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    source: "default_plan",
    timestamp: new Date().toISOString()
  }
}

const initialState: SubscriptionState = {
  currentSubscription: null,
  isLoading: false,
  isFetching: false,
  error: null,
  lastSync: 0,
  cacheStatus: 'empty'
}

// Smart fetch interval based on subscription status
const getFetchInterval = (subscription: SubscriptionData | null): number => {
  if (!subscription || !subscription.isSubscribed) {
    return SUBSCRIPTION_CACHE_CONFIG.cacheTime // Use default cache time for free users
  }
  
  if (subscription.status === "ACTIVE") {
    return SUBSCRIPTION_CACHE_CONFIG.staleTime // Use shorter stale time for active subscribers
  }
  
  // Handle various status types including non-standard ones that might come from API
  if (subscription.status === "CANCELLED" || 
      subscription.status === "INACTIVE" || 
      subscription.status as string === "EXPIRED" || 
      subscription.status as string === "CANCELED") {
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
      id: data.id || 'free',
      userId: data.userId || '',
      subscriptionId: data.subscriptionId || data.id || 'free',
      credits: Math.max(0, data.credits || 0), // Ensure non-negative
      tokensUsed: Math.max(0, data.tokensUsed || 0), // Ensure non-negative
      isSubscribed: Boolean(data.isSubscribed),
      subscriptionPlan: data.subscriptionPlan || "FREE",
      expirationDate: data.expirationDate || null,
      status: (data.status as SubscriptionStatusType) || "INACTIVE",
      cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      metadata: data.metadata || {
        source: "api_fetch",
        timestamp: new Date().toISOString()
      }
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

export const subscribeToplan = createAsyncThunk<
  SubscriptionData,
  { planId: string; duration: number; userId: string },
  { state: RootState; rejectValue: string }
>("subscription/subscribeToPlan", async ({ planId, duration, userId }, { getState, rejectWithValue }) => {
  try {
    // Validate inputs
    if (!planId || !duration || !userId) {
      return rejectWithValue("Missing required parameters for subscription")
    }

    // Get current subscription state
    const currentState = getState().subscription.currentSubscription

    // Check if user is trying to subscribe to FREE plan
    if (planId === 'FREE' && currentState) {
      // Use the SubscriptionService to check free plan eligibility
      const statusResponse = await fetchWithTimeout(`/api/subscriptions/status?userId=${userId}`, {
        credentials: "include",
      }, 10000)

      if (statusResponse?.ok) {
        const statusData = await statusResponse.json()
        if (statusData.hasUsedFreePlan && !statusData.hadPreviousPaidPlan) {
          return rejectWithValue("You have already used the free plan. Please choose a paid plan.")
        }
      }
    }

    // Create checkout session
    const response = await fetchWithTimeout("/api/subscriptions/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        planId,
        duration,
        userId,
      }),
    }, 15000)

    if (!response || !response.ok) {
      const errorData = await response?.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response?.status}: ${response?.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || "Subscription failed")
    }

    // If checkout URL is provided, redirect user
    if (result.url) {
      window.location.href = result.url
      // Return current state while redirecting
      return currentState || DEFAULT_FREE_SUBSCRIPTION
    }

    // For free plan or direct activation, fetch updated subscription
    const updatedResponse = await fetchWithTimeout(`/api/subscriptions/status?nocache=${Date.now()}`, {
      credentials: "include",
    }, 10000)

    if (updatedResponse?.ok) {
      const updatedData = await updatedResponse.json()
      return {
        credits: Math.max(0, updatedData.credits || 0),
        tokensUsed: Math.max(0, updatedData.tokensUsed || 0),
        isSubscribed: Boolean(updatedData.isSubscribed),
        subscriptionPlan: updatedData.subscriptionPlan || "FREE",
        expirationDate: updatedData.expirationDate,
        trialEndsAt: updatedData.trialEndsAt,
        status: updatedData.status || "INACTIVE",
      }
    }

    return currentState || DEFAULT_FREE_SUBSCRIPTION
  } catch (error: any) {
    logger.error("Subscription failed", error)
    return rejectWithValue(error.message || "Subscription failed")
  }
})

export const forceSyncSubscription = createAsyncThunk<
  SubscriptionData,
  void,
  { state: RootState; rejectValue: string }
>("subscription/forceSync", async (_, { rejectWithValue, getState }) => {
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
          // Return the current subscription state rather than a default FREE subscription
          const currentState = getState().subscription.currentSubscription
          return currentState || DEFAULT_FREE_SUBSCRIPTION
        }
      } catch (healthError) {
        logger.warn("Server not available for subscription sync, continuing with cached data")
        // Return the current subscription state rather than a default FREE subscription
        const currentState = getState().subscription.currentSubscription
        return currentState || DEFAULT_FREE_SUBSCRIPTION
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
      // Return the current subscription state if possible, fallback to FREE
      const currentState = getState().subscription.currentSubscription
      return currentState || DEFAULT_FREE_SUBSCRIPTION
    }

    if (!res.ok) {
      const status = res.status
      const statusText = res.statusText || "Unknown"
      logger.warn(`Force sync warning: ${status} - ${statusText}`)
      
      // Handle specific error cases
      if (status === 429) {
        // Rate limited, pass through the error
        return rejectWithValue("Too many requests. Please try again later.")
      }
      
      // For other errors, use current state or default to FREE
      const currentState = getState().subscription.currentSubscription
      return currentState || DEFAULT_FREE_SUBSCRIPTION
    }

    const syncResult = await res.json()
    
    if (!syncResult || !syncResult.subscription) {
      logger.error("Invalid sync response format", syncResult)
      return rejectWithValue("Invalid response from subscription service")
    }
    
    logger.info("Force sync completed successfully")

    return syncResult.subscription
  } catch (error) {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage = error instanceof Error ? error.message : 'Force sync failed'

    // In development, network errors are expected if server isn't running
    if (isDevelopment && errorMessage.includes('Failed to fetch')) {
      logger.warn("Network error during development (server may not be running)", errorMessage)
      const currentState = getState().subscription.currentSubscription
      return currentState || DEFAULT_FREE_SUBSCRIPTION
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
      state.lastSync = Date.now()
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
        state.lastSync = Date.now()
        state.cacheStatus = 'fresh'
        state.error = null // Clear any existing errors on success
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.isFetching = false
        state.error = action.payload || "Failed to fetch subscription"
        // Keep last known good state if available
        if (!state.currentSubscription) {
          state.currentSubscription = DEFAULT_FREE_SUBSCRIPTION
        }
      })
      .addCase(forceSyncSubscription.pending, (state) => {
        state.isLoading = true
        state.isFetching = true
        state.error = null
      })
      .addCase(forceSyncSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload
        state.isLoading = false
        state.isFetching = false
        state.lastSync = Date.now()
        state.cacheStatus = 'fresh'
        state.error = null
      })
      .addCase(forceSyncSubscription.rejected, (state, action) => {
        state.isLoading = false
        state.isFetching = false
        state.error = action.payload || "Forced sync failed"
        // Keep last known good state if available
        if (!state.currentSubscription) {
          state.currentSubscription = DEFAULT_FREE_SUBSCRIPTION
        }
      })
      .addCase(subscribeToplan.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(subscribeToplan.fulfilled, (state, action) => {
        state.currentSubscription = action.payload
        state.isLoading = false
        state.lastSync = Date.now()
        state.error = null
      })
      .addCase(subscribeToplan.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || "Subscription failed"
      })
  },
})

export const {
  resetSubscriptionState,
  setSubscriptionData,
  clearSubscriptionError,
} = subscriptionSlice.actions

// Selectors with memoization
export const selectSubscription = (state: RootState): SubscriptionState =>
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
  (hasActiveSubscription, hasCredits, state?: any): boolean => {
    // If user has an active subscription allow.
    if (hasActiveSubscription) return true
    // Extract current plan/status to apply stricter rule: if user HAD a paid plan but it's inactive, block creation even if credits remain.
    // (Prevents downgraded / canceled users from using leftover paid credits beyond expiry.)
    const subscription = (state as RootState | undefined)?.subscription?.currentSubscription
    const plan = subscription?.subscriptionPlan
    const status = subscription?.status?.toUpperCase?.() || 'INACTIVE'
    const hadPaidButInactive = plan && plan !== 'FREE' && status !== 'ACTIVE'
    if (hadPaidButInactive) return false
    // Otherwise (never subscribed) allow if free credits exist.
    return hasCredits
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

// Enhanced subscription state selector
export const selectSubscriptionState = createSelector(
  [selectSubscriptionData],
  (data): {
    isCancelled: boolean
    isExpired: boolean
    isGracePeriod: boolean
    daysUntilExpiration: number | null
    canReactivate: boolean
  } => {
    if (!data) {
      return {
        isCancelled: false,
        isExpired: false,
        isGracePeriod: false,
        daysUntilExpiration: null,
        canReactivate: false
      }
    }

    const now = new Date()
    const expirationDate = data.expirationDate ? new Date(data.expirationDate) : null
    const daysUntilExpiration = expirationDate 
      ? Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      isCancelled: data.cancelAtPeriodEnd || false,
      isExpired: data.status === "EXPIRED" || (expirationDate ? expirationDate < now : false),
      isGracePeriod: daysUntilExpiration !== null && daysUntilExpiration <= 7 && daysUntilExpiration > 0,
      daysUntilExpiration,
      canReactivate: ["EXPIRED", "CANCELED"].includes(data.status || "")
    }
  }
)

export const selectIsSubscribed = createSelector(
  [selectSubscriptionData],
  (data) => data?.isSubscribed || false
)

export const selectIsCancelled = createSelector(
  [selectSubscriptionState],
  (state) => state.isCancelled
)

export const selectIsExpired = createSelector(
  [selectSubscriptionState],
  (state) => state.isExpired
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
