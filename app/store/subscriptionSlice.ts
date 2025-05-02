import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "./index"
import type {
  SubscriptionPlanType,
  SubscriptionStatusType,
  SubscriptionData,
} from "../dashboard/subscription/types/subscription"
import { dispatchSubscriptionEvent, SUBSCRIPTION_EVENTS } from "../dashboard/subscription/utils/events"
import { validateSubscriptionResponse } from "../dashboard/subscription/utils/validation"

// Define the subscription state interface
interface SubscriptionState {
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
  data: SubscriptionData | null
  lastFetched: number
  detailsData: any | null
  lastDetailsFetched: number
  isRefreshing: boolean
  isLoading: boolean
  pendingRequests: number
}

const initialState: SubscriptionState = {
  status: "idle",
  error: null,
  data: null,
  lastFetched: 0,
  detailsData: null,
  lastDetailsFetched: 0,
  isRefreshing: false,
  isLoading: false,
  pendingRequests: 0,
}

// FIX: Add proper request tracking to prevent duplicate requests
let currentFetchPromise: Promise<any> | null = null
let currentDetailsPromise: Promise<any> | null = null

// Async thunks
export const fetchSubscriptionStatus = createAsyncThunk(
  "subscription/fetchStatus",
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    const state = (getState() as RootState).subscription
    const now = Date.now()

    // FIX: Add cache check to prevent unnecessary fetches
    if (!forceRefresh && state.lastFetched > 0 && now - state.lastFetched < 30000 && state.data) {
      return { data: state.data, fromCache: true }
    }

    // FIX: Use a single in-flight request pattern
    if (currentFetchPromise) {
      try {
        return await currentFetchPromise
      } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Unknown error")
      }
    }

    try {
      const fetchPromise = new Promise(async (resolve, reject) => {
        try {
          const response = await fetch("/api/subscriptions/status", {
            credentials: "include",
            headers: {
              "x-force-refresh": forceRefresh ? "true" : "false",
              "Cache-Control": "no-cache",
            },
          })

          if (!response.ok) {
            if (response.status === 401) {
              reject("Unauthorized access. Please log in again.")
              return
            }
            reject(`Failed to fetch subscription status: ${response.statusText}`)
            return
          }

          const rawData = await response.json()
          const validatedData = validateSubscriptionResponse(rawData)
          resolve({ data: validatedData, fromCache: false })
        } catch (error) {
          reject(error instanceof Error ? error.message : "Unknown error")
        }
      })

      currentFetchPromise = fetchPromise

      const result = await fetchPromise
      currentFetchPromise = null
      return result
    } catch (error) {
      currentFetchPromise = null
      return rejectWithValue(error instanceof Error ? error.message : "Unknown error")
    }
  },
)

export const fetchSubscriptionDetails = createAsyncThunk(
  "subscription/fetchDetails",
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    const state = (getState() as RootState).subscription
    const now = Date.now()

    // FIX: Add cache check to prevent unnecessary fetches
    if (!forceRefresh && state.lastDetailsFetched > 0 && now - state.lastDetailsFetched < 120000 && state.detailsData) {
      return { data: state.detailsData, fromCache: true }
    }

    // FIX: Use a single in-flight request pattern
    if (currentDetailsPromise) {
      try {
        return await currentDetailsPromise
      } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Unknown error")
      }
    }

    try {
      const fetchPromise = new Promise(async (resolve, reject) => {
        try {
          const response = await fetch("/api/subscriptions", {
            credentials: "include",
            headers: {
              "x-data-type": "details",
              "Cache-Control": "no-cache",
            },
          })

          if (!response.ok) {
            if (response.status === 401) {
              reject("Unauthorized")
              return
            }
            reject(`Failed to fetch subscription details: ${response.statusText}`)
            return
          }

          const detailsData = await response.json()

          // Validate token usage data if it exists
          const tokenUsage = detailsData?.tokenUsage
            ? {
                used: typeof detailsData.tokenUsage.used === "number" ? detailsData.tokenUsage.used : 0,
                total: typeof detailsData.tokenUsage.total === "number" ? detailsData.tokenUsage.total : 0,
              }
            : null

          resolve({ data: detailsData, tokenUsage, fromCache: false })
        } catch (error) {
          reject(error instanceof Error ? error.message : "Unknown error")
        }
      })

      currentDetailsPromise = fetchPromise

      const result = await fetchPromise
      currentDetailsPromise = null
      return result
    } catch (error) {
      currentDetailsPromise = null
      return rejectWithValue(error instanceof Error ? error.message : "Unknown error")
    }
  },
)

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
        throw new Error(`Failed to cancel subscription: ${response.statusText}`)
      }

      const result = await response.json()

      // Dispatch event for other components
      dispatchSubscriptionEvent(SUBSCRIPTION_EVENTS.CANCELED, { reason })

      return result
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Unknown error")
    }
  },
)

export const resumeSubscription = createAsyncThunk("subscription/resume", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/subscriptions/resume", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to resume subscription: ${response.statusText}`)
    }

    const result = await response.json()

    // Dispatch event for other components
    dispatchSubscriptionEvent(SUBSCRIPTION_EVENTS.RESUMED)

    return result
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Unknown error")
  }
})

export const activateFreePlan = createAsyncThunk("subscription/activateFree", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/subscriptions/activate-free", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ confirmed: true }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.details || "Failed to activate free plan")
    }

    const result = await response.json()

    // Dispatch event for other components
    dispatchSubscriptionEvent(SUBSCRIPTION_EVENTS.CHANGED, {
      planId: "FREE",
      status: "ACTIVE",
    })

    return result
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Unknown error")
  }
})

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    clearSubscriptionCache: (state) => {
      state.lastFetched = 0
      state.lastDetailsFetched = 0
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.isRefreshing = action.payload
    },
    incrementPendingRequests: (state) => {
      state.pendingRequests += 1
      state.isLoading = state.pendingRequests > 0
    },
    decrementPendingRequests: (state) => {
      state.pendingRequests = Math.max(0, state.pendingRequests - 1)
      state.isLoading = state.pendingRequests > 0
    },
    // Add hydrateState action to handle state hydration from localStorage or BroadcastChannel
    hydrateState: (state, action: PayloadAction<Partial<SubscriptionState>>) => {
      // Only update specific fields from the hydrated state
      if (action.payload.data) {
        state.data = action.payload.data
      }
      if (action.payload.lastFetched) {
        state.lastFetched = action.payload.lastFetched
      }
      if (action.payload.detailsData) {
        state.detailsData = action.payload.detailsData
      }
      if (action.payload.lastDetailsFetched) {
        state.lastDetailsFetched = action.payload.lastDetailsFetched
      }

      // Update status if we have data
      if (state.data && state.status !== "loading") {
        state.status = "succeeded"
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchSubscriptionStatus
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.status = state.data ? "succeeded" : "loading"
        state.isRefreshing = true
        state.pendingRequests += 1
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        // Only update lastFetched if this wasn't from cache
        if (!action.payload.fromCache) {
          state.lastFetched = Date.now()
        }

        state.status = "succeeded"
        state.data = action.payload.data
        state.error = null
        state.isRefreshing = false
        state.pendingRequests = Math.max(0, state.pendingRequests - 1)
        state.isLoading = state.pendingRequests > 0
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) || "Unknown error"
        state.isRefreshing = false
        state.pendingRequests = Math.max(0, state.pendingRequests - 1)
        state.isLoading = state.pendingRequests > 0
      })

      // Handle fetchSubscriptionDetails
      .addCase(fetchSubscriptionDetails.pending, (state) => {
        state.isRefreshing = true
        state.pendingRequests += 1
        state.isLoading = true
      })
      .addCase(fetchSubscriptionDetails.fulfilled, (state, action) => {
        // Only update lastDetailsFetched if this wasn't from cache
        if (!action.payload.fromCache) {
          state.lastDetailsFetched = Date.now()
        }

        state.detailsData = action.payload.data

        // Update tokensUsed if available in details
        if (state.data && action.payload.tokenUsage) {
          state.data = {
            ...state.data,
            tokensUsed: action.payload.tokenUsage.used,
            credits: action.payload.tokenUsage.total,
          }
        }

        state.isRefreshing = false
        state.pendingRequests = Math.max(0, state.pendingRequests - 1)
        state.isLoading = state.pendingRequests > 0
      })
      .addCase(fetchSubscriptionDetails.rejected, (state) => {
        state.isRefreshing = false
        state.pendingRequests = Math.max(0, state.pendingRequests - 1)
        state.isLoading = state.pendingRequests > 0
      })

      // Handle cancelSubscription
      .addCase(cancelSubscription.pending, (state) => {
        state.pendingRequests += 1
        state.isLoading = true
      })
      .addCase(cancelSubscription.fulfilled, (state) => {
        if (state.data) {
          state.data = {
            ...state.data,
            cancelAtPeriodEnd: true,
            status: "CANCELED" as SubscriptionStatusType,
          }
        }
        state.lastFetched = 0 // Force refresh on next fetch
        state.pendingRequests = Math.max(0, state.pendingRequests - 1)
        state.isLoading = state.pendingRequests > 0
      })
      .addCase(cancelSubscription.rejected, (state) => {
        state.pendingRequests = Math.max(0, state.pendingRequests - 1)
        state.isLoading = state.pendingRequests > 0
      })

      // Handle resumeSubscription
      .addCase(resumeSubscription.pending, (state) => {
        state.pendingRequests += 1
        state.isLoading = true
      })
      .addCase(resumeSubscription.fulfilled, (state) => {
        if (state.data) {
          state.data = {
            ...state.data,
            cancelAtPeriodEnd: false,
            status: "ACTIVE" as SubscriptionStatusType,
          }
        }
        state.lastFetched = 0 // Force refresh on next fetch
        state.pendingRequests = Math.max(0, state.pendingRequests - 1)
        state.isLoading = state.pendingRequests > 0
      })
      .addCase(resumeSubscription.rejected, (state) => {
        state.pendingRequests = Math.max(0, state.pendingRequests - 1)
        state.isLoading = state.pendingRequests > 0
      })

      // Handle activateFreePlan
      .addCase(activateFreePlan.pending, (state) => {
        state.pendingRequests += 1
        state.isLoading = true
      })
      .addCase(activateFreePlan.fulfilled, (state) => {
        if (state.data) {
          state.data = {
            ...state.data,
            subscriptionPlan: "FREE" as SubscriptionPlanType,
            status: "ACTIVE" as SubscriptionStatusType,
            isSubscribed: false,
          }
        }
        state.lastFetched = 0 // Force refresh on next fetch
        state.pendingRequests = Math.max(0, state.pendingRequests - 1)
        state.isLoading = state.pendingRequests > 0
      })
      .addCase(activateFreePlan.rejected, (state) => {
        state.pendingRequests = Math.max(0, state.pendingRequests - 1)
        state.isLoading = state.pendingRequests > 0
      })
  },
})

// Export actions
export const {
  clearSubscriptionCache,
  setRefreshing,
  incrementPendingRequests,
  decrementPendingRequests,
  hydrateState,
} = subscriptionSlice.actions

// Export selectors
export const selectSubscriptionData = (state: RootState) => state.subscription.data
export const selectSubscriptionStatus = (state: RootState) => state.subscription.status
export const selectSubscriptionError = (state: RootState) => state.subscription.error
export const selectSubscriptionLoading = (state: RootState) => state.subscription.isLoading
export const selectSubscriptionDetailsData = (state: RootState) => state.subscription.detailsData
export const selectLastFetched = (state: RootState) => state.subscription.lastFetched

// Derived selector
export const selectCanDownloadPDF = (state: RootState) => {
  const data = state.subscription.data
  return !!data?.isSubscribed && data.subscriptionPlan !== "FREE"
}

export default subscriptionSlice.reducer
