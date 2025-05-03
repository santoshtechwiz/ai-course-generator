import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

// Define subscription plan types
export enum SubscriptionPlanType {
  FREE = "FREE",
  BASIC = "BASIC",
  PRO = "PRO",
  PREMIUM = "PREMIUM",
}

// Define subscription status types
export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELED = "canceled",
  PAST_DUE = "past_due",
  UNPAID = "unpaid",
  TRIALING = "trialing",
  INACTIVE = "inactive",
}

// Define token usage interface
export interface TokenUsage {
  used: number
  total: number
  remaining: number
  percentage: number
}

// Define subscription state interface
export interface SubscriptionState {
  isSubscribed: boolean
  plan: SubscriptionPlanType
  status: SubscriptionStatus | null
  expiresAt: string | null
  cancelAtPeriodEnd: boolean
  credits: number
  tokensUsed: number
  tokenUsage: TokenUsage | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null
  type?: string // Added to handle the type property that was causing the error
}

// Initial state
const initialState: SubscriptionState = {
  isSubscribed: false,
  plan: SubscriptionPlanType.FREE,
  status: null,
  expiresAt: null,
  cancelAtPeriodEnd: false,
  credits: 0,
  tokensUsed: 0,
  tokenUsage: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  type: "subscription", // Default value for the type property
}

// Async thunk to fetch subscription status
export const fetchSubscriptionStatus = createAsyncThunk("subscription/fetchStatus", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/subscriptions/status", {
      headers: {
        "Cache-Control": "no-cache",
        "x-force-refresh": "true",
      },
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue((error as Error).message)
  }
})

// Async thunk to fetch token usage
export const fetchTokenUsage = createAsyncThunk("subscription/fetchTokenUsage", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/subscriptions/tokens")

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue((error as Error).message)
  }
})

// Async thunk to cancel subscription
export const cancelSubscription = createAsyncThunk("subscription/cancel", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/subscriptions/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    return rejectWithValue((error as Error).message)
  }
})

// Async thunk to resume subscription
export const resumeSubscription = createAsyncThunk("subscription/resume", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/subscriptions/resume", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
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
    resetSubscriptionError: (state) => {
      state.error = null
    },
    clearSubscriptionData: (state) => {
      return {
        ...initialState,
        lastFetched: state.lastFetched,
      }
    },
  },
  extraReducers: (builder) => {
    // Handle fetchSubscriptionStatus
    builder.addCase(fetchSubscriptionStatus.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
      const {
        isSubscribed,
        subscriptionPlan,
        plan,
        status,
        expiresAt,
        expirationDate,
        cancelAtPeriodEnd,
        credits,
        tokensUsed,
      } = action.payload

      state.isSubscribed = isSubscribed || false
      state.plan = (plan || subscriptionPlan || SubscriptionPlanType.FREE) as SubscriptionPlanType
      state.status = (status || null) as SubscriptionStatus | null
      state.expiresAt = expiresAt || expirationDate || null
      state.cancelAtPeriodEnd = cancelAtPeriodEnd || false
      state.credits = credits || 0
      state.tokensUsed = tokensUsed || 0
      state.isLoading = false
      state.lastFetched = Date.now()
      state.type = "subscription" // Ensure type is always set after fetch
    })
    builder.addCase(fetchSubscriptionStatus.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string
    })

    // Handle fetchTokenUsage
    builder.addCase(fetchTokenUsage.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(fetchTokenUsage.fulfilled, (state, action) => {
      state.tokenUsage = action.payload
      state.isLoading = false
    })
    builder.addCase(fetchTokenUsage.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string
    })

    // Handle cancelSubscription
    builder.addCase(cancelSubscription.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(cancelSubscription.fulfilled, (state) => {
      state.cancelAtPeriodEnd = true
      state.isLoading = false
    })
    builder.addCase(cancelSubscription.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string
    })

    // Handle resumeSubscription
    builder.addCase(resumeSubscription.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(resumeSubscription.fulfilled, (state) => {
      state.cancelAtPeriodEnd = false
      state.isLoading = false
    })
    builder.addCase(resumeSubscription.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string
    })
  },
})

// Export actions and reducer
export const { resetSubscriptionError, clearSubscriptionData } = subscriptionSlice.actions
export default subscriptionSlice.reducer
