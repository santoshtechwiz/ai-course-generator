"use client"

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { SubscriptionPlanType, SubscriptionStatusType } from "@/app/dashboard/subscription/types/subscription"

// Define proper types for the subscription state
export interface SubscriptionData {
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType
  status: SubscriptionStatusType | null
  expirationDate?: string | null
  cancelAtPeriodEnd?: boolean
  credits: number
  tokensUsed: number
  lastUpdated?: number
}

export interface SubscriptionDetails {
  paymentMethod?: string | null
  billingCycle?: string | null
  nextBillingDate?: string | null
  invoiceHistory?: Array<{
    id: string
    date: string
    amount: number
    status: string
  }>
}

export interface TokenUsage {
  used: number
  total: number
  percentage: number
  remaining: number
  hasExceededLimit: boolean
}

// Define the subscription state type
export interface SubscriptionState {
  data: SubscriptionData | null
  details: SubscriptionDetails | null
  tokenUsage: TokenUsage | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
  lastFetched: number | null
}

// Initial state with safe defaults
const initialState: SubscriptionState = {
  data: null,
  details: null,
  tokenUsage: null,
  status: "idle",
  error: null,
  lastFetched: null,
}

// Async thunk for fetching subscription status
export const fetchSubscriptionStatus = createAsyncThunk(
  "subscription/fetchStatus",
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { subscription: SubscriptionState }

      // Check if we need to fetch new data
      if (
        !forceRefresh &&
        state.subscription.lastFetched &&
        Date.now() - state.subscription.lastFetched < 60000 && // 1 minute cache
        state.subscription.data
      ) {
        return {
          subscription: state.subscription.data,
          details: state.subscription.details,
        }
      }

      const response = await fetch("/api/subscriptions/status", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return rejectWithValue(errorData.message || `Failed to fetch subscription status: ${response.statusText}`)
      }

      const data = await response.json()

      // Normalize the data structure
      const subscriptionData: SubscriptionData = {
        isSubscribed: data.isSubscribed || false,
        subscriptionPlan: (data.subscriptionPlan || data.plan || "FREE") as SubscriptionPlanType,
        status: (data.status?.toUpperCase() || null) as SubscriptionStatusType | null,
        expirationDate: data.expirationDate || data.expiresAt || null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        credits: typeof data.credits === "number" ? data.credits : 0,
        tokensUsed: typeof data.tokensUsed === "number" ? data.tokensUsed : 0,
        lastUpdated: Date.now(),
      }

      // Extract subscription details
      const subscriptionDetails: SubscriptionDetails = {
        paymentMethod: data.paymentMethod || null,
        billingCycle: data.billingCycle || null,
        nextBillingDate: data.nextBillingDate || null,
        invoiceHistory: data.invoiceHistory || [],
      }

      return {
        subscription: subscriptionData,
        details: subscriptionDetails,
      }
    } catch (error) {
      return rejectWithValue((error as Error).message || "An unknown error occurred")
    }
  },
)

// Async thunk for fetching subscription details
export const fetchSubscriptionDetails = createAsyncThunk(
  "subscription/fetchDetails",
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { subscription: SubscriptionState }

      // Check if we need to fetch new data
      if (
        !forceRefresh &&
        state.subscription.lastFetched &&
        Date.now() - state.subscription.lastFetched < 300000 && // 5 minute cache for details
        state.subscription.details
      ) {
        return state.subscription.details
      }

      const response = await fetch("/api/subscriptions/history", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return rejectWithValue(errorData.message || `Failed to fetch subscription details: ${response.statusText}`)
      }

      const data = await response.json()

      return data as SubscriptionDetails
    } catch (error) {
      return rejectWithValue((error as Error).message || "An unknown error occurred")
    }
  },
)

// Async thunk for fetching token usage
export const fetchTokenUsage = createAsyncThunk("subscription/fetchTokenUsage", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/tokens/usage", {
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return rejectWithValue(errorData.message || `Failed to fetch token usage: ${response.statusText}`)
    }

    const data = await response.json()

    const tokenUsage: TokenUsage = {
      used: data.used || 0,
      total: data.total || 0,
      percentage: data.percentage || 0,
      remaining: data.remaining || 0,
      hasExceededLimit: data.hasExceededLimit || false,
    }

    return tokenUsage
  } catch (error) {
    return rejectWithValue((error as Error).message || "An unknown error occurred")
  }
})

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
        const errorData = await response.json().catch(() => ({}))
        return rejectWithValue(errorData.message || `Failed to cancel subscription: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue((error as Error).message || "An unknown error occurred")
    }
  },
)

// Async thunk for resuming subscription
export const resumeSubscription = createAsyncThunk("subscription/resume", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/subscriptions/resume", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return rejectWithValue(errorData.message || `Failed to resume subscription: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue((error as Error).message || "An unknown error occurred")
  }
})

// Create the subscription slice
const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    resetSubscriptionError: (state) => {
      state.error = null
      state.status = "idle"
    },
    clearSubscriptionData: () => {
      return initialState
    },
    updateTokenUsage: (state, action: PayloadAction<{ used: number; total: number }>) => {
      if (!state.tokenUsage) {
        state.tokenUsage = {
          used: action.payload.used,
          total: action.payload.total,
          percentage: action.payload.total > 0 ? (action.payload.used / action.payload.total) * 100 : 0,
          remaining: Math.max(action.payload.total - action.payload.used, 0),
          hasExceededLimit: action.payload.used > action.payload.total,
        }
      } else {
        state.tokenUsage.used = action.payload.used
        state.tokenUsage.total = action.payload.total
        state.tokenUsage.percentage = action.payload.total > 0 ? (action.payload.used / action.payload.total) * 100 : 0
        state.tokenUsage.remaining = Math.max(action.payload.total - action.payload.used, 0)
        state.tokenUsage.hasExceededLimit = action.payload.used > action.payload.total
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch subscription status
    builder
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.data = action.payload.subscription
        state.details = action.payload.details
        state.lastFetched = Date.now()
        state.error = null
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) || "Failed to fetch subscription"
      })

    // Fetch subscription details
    builder
      .addCase(fetchSubscriptionDetails.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchSubscriptionDetails.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.details = action.payload
        state.lastFetched = Date.now()
      })
      .addCase(fetchSubscriptionDetails.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) || "Failed to fetch subscription details"
      })

    // Fetch token usage
    builder
      .addCase(fetchTokenUsage.pending, (state) => {
        // Don't set the whole state to loading for token usage
        // as it's a secondary operation
      })
      .addCase(fetchTokenUsage.fulfilled, (state, action) => {
        state.tokenUsage = action.payload
      })
      .addCase(fetchTokenUsage.rejected, (state, action) => {
        state.error = (action.payload as string) || "Failed to fetch token usage"
      })

    // Cancel subscription
    builder
      .addCase(cancelSubscription.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.status = "succeeded"
        if (state.data && action.payload.subscription) {
          state.data = {
            ...state.data,
            ...action.payload.subscription,
            cancelAtPeriodEnd: true,
          }
        }
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) || "Failed to cancel subscription"
      })

    // Resume subscription
    builder
      .addCase(resumeSubscription.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(resumeSubscription.fulfilled, (state, action) => {
        state.status = "succeeded"
        if (state.data && action.payload.subscription) {
          state.data = {
            ...state.data,
            ...action.payload.subscription,
            cancelAtPeriodEnd: false,
          }
        }
      })
      .addCase(resumeSubscription.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) || "Failed to resume subscription"
      })
  },
})

export const { resetSubscriptionError, clearSubscriptionData, updateTokenUsage } = subscriptionSlice.actions
export default subscriptionSlice.reducer
