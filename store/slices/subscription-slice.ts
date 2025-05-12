"use client"

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

import { fetchWithAuth } from "@/lib/utils/fetch-utils"
import type { SubscriptionData, SubscriptionDetails, TokenUsage } from "@/app/types/types"

// Define the subscription state type
export interface SubscriptionState {
  data: SubscriptionData | null
  details: SubscriptionDetails | null
  tokenUsage: TokenUsage | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null
}

// Initial state with safe defaults
const initialState: SubscriptionState = {
  data: null,
  details: null,
  tokenUsage: null,
  isLoading: false,
  error: null,
  lastFetched: null,
}

// Async thunk for fetching subscription status
export const fetchSubscriptionStatus = createAsyncThunk("subscription/fetchStatus", async (_, { rejectWithValue }) => {
  try {
    const response = await fetchWithAuth("/api/subscription/status")

    if (!response.ok) {
      const errorData = await response.json()
      return rejectWithValue(errorData.message || "Failed to fetch subscription status")
    }

    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue((error as Error).message || "An unknown error occurred")
  }
})

// Async thunk for fetching token usage
export const fetchTokenUsage = createAsyncThunk("subscription/fetchTokenUsage", async (_, { rejectWithValue }) => {
  try {
    const response = await fetchWithAuth("/api/subscription/tokens")

    if (!response.ok) {
      const errorData = await response.json()
      return rejectWithValue(errorData.message || "Failed to fetch token usage")
    }

    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue((error as Error).message || "An unknown error occurred")
  }
})

// Async thunk for canceling subscription
export const cancelSubscription = createAsyncThunk("subscription/cancel", async (_, { rejectWithValue }) => {
  try {
    const response = await fetchWithAuth("/api/subscription/cancel", {
      method: "POST",
    })

    if (!response.ok) {
      const errorData = await response.json()
      return rejectWithValue(errorData.message || "Failed to cancel subscription")
    }

    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue((error as Error).message || "An unknown error occurred")
  }
})

// Async thunk for resuming subscription
export const resumeSubscription = createAsyncThunk("subscription/resume", async (_, { rejectWithValue }) => {
  try {
    const response = await fetchWithAuth("/api/subscription/resume", {
      method: "POST",
    })

    if (!response.ok) {
      const errorData = await response.json()
      return rejectWithValue(errorData.message || "Failed to resume subscription")
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
    },
    clearSubscriptionData: (state) => {
      return initialState
    },
  },
  extraReducers: (builder) => {
    // Fetch subscription status
    builder
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(
        fetchSubscriptionStatus.fulfilled,
        (state, action: PayloadAction<{ subscription: SubscriptionData; details: SubscriptionDetails }>) => {
          state.isLoading = false
          state.data = action.payload.subscription
          state.details = action.payload.details
          state.lastFetched = Date.now()
        },
      )
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Failed to fetch subscription"
      })

    // Fetch token usage
    builder
      .addCase(fetchTokenUsage.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTokenUsage.fulfilled, (state, action: PayloadAction<TokenUsage>) => {
        state.isLoading = false
        state.tokenUsage = action.payload
      })
      .addCase(fetchTokenUsage.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Failed to fetch token usage"
      })

    // Cancel subscription
    builder
      .addCase(cancelSubscription.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(cancelSubscription.fulfilled, (state, action: PayloadAction<{ subscription: SubscriptionData }>) => {
        state.isLoading = false
        if (state.data && action.payload.subscription) {
          state.data = action.payload.subscription
        }
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Failed to cancel subscription"
      })

    // Resume subscription
    builder
      .addCase(resumeSubscription.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(resumeSubscription.fulfilled, (state, action: PayloadAction<{ subscription: SubscriptionData }>) => {
        state.isLoading = false
        if (state.data && action.payload.subscription) {
          state.data = action.payload.subscription
        }
      })
      .addCase(resumeSubscription.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Failed to resume subscription"
      })
  },
})

export const { resetSubscriptionError, clearSubscriptionData } = subscriptionSlice.actions
export default subscriptionSlice.reducer
