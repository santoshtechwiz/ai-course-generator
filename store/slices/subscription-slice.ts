"use client"

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "@/store/store"
import type { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"

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

export interface SubscriptionState {
  data: SubscriptionData | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null
}

// Initial state
const initialState: SubscriptionState = {
  data: null,
  isLoading: false,
  error: null,
  lastFetched: null,
}

// Async thunk for fetching subscription data
export const fetchSubscription = createAsyncThunk("subscription/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/subscriptions/status", {
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
      },
    })

    if (!response.ok) {
      return rejectWithValue("Failed to fetch subscription data")
    }

    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue((error as Error).message)
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

// Subscription slice
const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    clearSubscription: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch subscription
      .addCase(fetchSubscription.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchSubscription.fulfilled, (state, action: PayloadAction<SubscriptionData>) => {
        state.isLoading = false
        state.data = action.payload
        state.lastFetched = Date.now()
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
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

// Export actions
export const { clearSubscription } = subscriptionSlice.actions

// Export selectors
export const selectSubscription = (state: RootState) => state.subscription.data
export const selectSubscriptionLoading = (state: RootState) => state.subscription.isLoading
export const selectSubscriptionError = (state: RootState) => state.subscription.error

// Token usage selector
export const selectTokenUsage = (state: RootState) => {
  const subscription = state.subscription.data
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
}

// Export reducer
export default subscriptionSlice.reducer
