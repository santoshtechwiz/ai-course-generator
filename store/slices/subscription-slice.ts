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

const DEFAULT_FREE_SUBSCRIPTION: SubscriptionData = {
  credits: 0,
  tokensUsed: 0,
  isSubscribed: false,
  subscriptionPlan: "FREE",
  status: "INACTIVE",
  cancelAtPeriodEnd: false,
}

const initialState: SubscriptionState = {
  data: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  isFetching: false,
}

const MIN_FETCH_INTERVAL = 30000 // 30 seconds

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ])
}

export const fetchSubscription = createAsyncThunk<
  SubscriptionData,
  { forceRefresh?: boolean } | void,
  { state: RootState; rejectValue: string }
>("subscription/fetch", async (options = {}, { getState }) => {
  const { lastFetched, isFetching, data } = getState().subscription
  const { forceRefresh = false } = options || {}

  const now = Date.now()
  const isRecent = lastFetched && now - lastFetched < MIN_FETCH_INTERVAL

  if ((isFetching || isRecent) && !forceRefresh) {
    logger.debug("Subscription fetch skipped (in-flight or recent)")
    return data ?? DEFAULT_FREE_SUBSCRIPTION
  }
  try {
    // Check if user is authenticated first by checking the auth state
    const authState = getState().auth;
    if (!authState.user?.id) {
      logger.warn("User not authenticated, skipping subscription fetch")
      return DEFAULT_FREE_SUBSCRIPTION
    }
    
    // Add cache buster to prevent browser caching
    const cacheBuster = `nocache=${Date.now()}`;
    
    const res = await withTimeout(
      fetch(`/api/subscriptions/status?${cacheBuster}`, {
        headers: {
          Accept: "application/json",
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: "include", // ✅ necessary to forward session cookies
      }),
      10000
    )

    if (res.status === 401) {
      logger.warn("User not authenticated for subscription")
      return DEFAULT_FREE_SUBSCRIPTION
    }

    if (!res.ok) {
      logger.warn(`Subscription API error: ${res.status}`)
      // Don't return default if we already have data - prevents reset to free on temporary errors
      if (data && data.subscriptionPlan !== "FREE") {
        logger.info("Keeping existing subscription data instead of resetting to FREE due to API error")
        return data
      }
      return DEFAULT_FREE_SUBSCRIPTION
    }

    const result: SubscriptionStatusResponse = await res.json()

    const transformed: SubscriptionData = {
      credits: Math.max(0, result.credits || 0),
      tokensUsed: Math.max(0, result.tokensUsed || 0),
      isSubscribed: Boolean(result.isSubscribed),
      subscriptionPlan: result.subscriptionPlan || "FREE",
      expirationDate: result.expirationDate,
      cancelAtPeriodEnd: Boolean(result.cancelAtPeriodEnd),
      status: (result.status as SubscriptionStatusType) || "INACTIVE",
    }

    const isExpired =
      transformed.expirationDate && new Date(transformed.expirationDate) < new Date()

    if (transformed.status === "INACTIVE" || isExpired) {
      transformed.status = "EXPIRED"
      transformed.isSubscribed = false
    }

    return transformed
  } catch (error) {
    logger.warn("Subscription fetch failed, using default plan", error)
    return DEFAULT_FREE_SUBSCRIPTION
  }
})
export const cancelSubscription = createAsyncThunk<
  SubscriptionData,
  void,
  { state: RootState; rejectValue: string }
>("subscription/cancel", async (_, { getState, rejectWithValue }) => {
  const { data } = getState().subscription

  if (!data || !data.isSubscribed) {
    return rejectWithValue("No active subscription to cancel")
  }

  try {
    const res = await fetch("/api/subscriptions/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subscriptionId: data.currentPlan }),
      credentials: "include", // ✅ necessary to forward session cookies
    })

    if (!res.ok) {
      throw new Error(`Failed to cancel subscription: ${res.statusText}`)
    }

    const result: SubscriptionData = await res.json()
    return result
  } catch (error: any) {
    logger.error("Subscription cancellation failed", error)
    return rejectWithValue(error.message || "Failed to cancel subscription")
  }
})

export const resumeSubscription = createAsyncThunk<
  SubscriptionData,
  void,
  { state: RootState; rejectValue: string }
>(
  "subscription/resume",
  async (_, { getState, rejectWithValue }) => {
    const { data } = getState().subscription

    if (!data || !data.isSubscribed) {
      return rejectWithValue("No active subscription to resume")
    }

    try {
      const res = await fetch("/api/subscriptions/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId: data.currentPlan }),
        credentials: "include", // ✅ necessary to forward session cookies
      })

      if (!res.ok) {
        throw new Error(`Failed to resume subscription: ${res.statusText}`)
      }

      const result: SubscriptionData = await res.json()
      return result
    } catch (error: any) {
      logger.error("Subscription resume failed", error)
      return rejectWithValue(error.message || "Failed to resume subscription")
    }
  }
)
export const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    resetSubscriptionState: () => initialState,
    setSubscriptionData: (state, action: PayloadAction<SubscriptionData>) => {
      state.data = action.payload
      state.lastFetched = Date.now()
      state.error = null
      state.isLoading = false
      state.isFetching = false
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
        state.data = action.payload
        state.lastFetched = Date.now()
        state.isFetching = false
        state.isLoading = false
        state.error = null
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.isFetching = false
        state.isLoading = false
        state.error = action.error.message || "Failed to fetch subscription"
      })
  },
})

// Actions
export const { resetSubscriptionState, setSubscriptionData } = subscriptionSlice.actions

// Selectors
export const selectSubscription = (state: RootState): SubscriptionState => state.subscription
export const selectSubscriptionData = (state: RootState) => state.subscription.data
export const selectSubscriptionError = (state: RootState) => state.subscription.error
export const selectSubscriptionLoading = (state: RootState) => state.subscription.isLoading
export const selectIsSubscriptionLoading = selectSubscriptionLoading
export const canDownloadPdfSelector = (state: RootState) => {
  const user = state.auth.user
  return user?.subscriptionPlan === "PRO" || user?.subscriptionPlan === "ENTERPRISE"
}

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
    const expirationDate = data.expirationDate ? new Date(data.expirationDate) : null
    const isExpired = expirationDate ? expirationDate < now : false
    return {
      ...data,
      isActive: data.status === "ACTIVE" && !data.cancelAtPeriodEnd && !isExpired,
      isExpired,
      formattedCredits: `${data.credits} credits`,
      hasCreditsRemaining: (data.credits || 0) > (data.tokensUsed || 0),
    }
  }
)

// Reducer
export default subscriptionSlice.reducer
