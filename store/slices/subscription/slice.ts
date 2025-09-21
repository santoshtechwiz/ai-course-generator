import type { RootState } from '@/store'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { logger } from '@/lib/logger'
import {
  type SubscriptionData,
  type SubscriptionState,
  type SubscriptionResponse,
  type ApiResponse,
  DEFAULT_FREE_SUBSCRIPTION,
  SUBSCRIPTION_CACHE_CONFIG
} from './types'

const initialState: SubscriptionState = {
  currentSubscription: null,
  isLoading: false,
  isFetching: false,
  error: null,
  lastSync: 0,
  cacheStatus: 'empty'
}

// Async thunks
export const fetchSubscription = createAsyncThunk<
  SubscriptionData,
  { forceRefresh?: boolean } | void,
  { state: RootState; rejectValue: string }
>("subscription/fetch", async (options = {}, { getState, signal, rejectWithValue }) => {
  const { forceRefresh = false } = options || {}
  const state = getState()

  try {
    // Check if we should use cached data
    if (!forceRefresh) {
      const lastSync = state.subscription.lastSync
      const cacheStatus = state.subscription.cacheStatus
      
      if (
        cacheStatus === 'fresh' &&
        Date.now() - lastSync < SUBSCRIPTION_CACHE_CONFIG.staleTime
      ) {
        return state.subscription.currentSubscription || DEFAULT_FREE_SUBSCRIPTION
      }
    }

    const response = await fetch('/api/subscriptions/status', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      credentials: "include",
      signal,
    })

    if (!response.ok) {
      if (response.status === 401) {
        return DEFAULT_FREE_SUBSCRIPTION
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json() as ApiResponse<SubscriptionData>
    
    return data.data || DEFAULT_FREE_SUBSCRIPTION
  } catch (error: any) {
    logger.error("Error fetching subscription:", error)
    return rejectWithValue(error.message || "Failed to fetch subscription")
  }
})

export const forceSyncSubscription = createAsyncThunk<
  SubscriptionData,
  void,
  { state: RootState; rejectValue: string }
>("subscription/forceSync", async (_, { signal, rejectWithValue }) => {
  try {
    const response = await fetch('/api/subscriptions/status?force=true', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      credentials: "include",
      signal,
    })

    if (!response.ok) {
      if (response.status === 401) {
        return DEFAULT_FREE_SUBSCRIPTION
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json() as ApiResponse<SubscriptionData>
    
    return data.data || DEFAULT_FREE_SUBSCRIPTION
  } catch (error: any) {
    logger.error("Error force syncing subscription:", error)
    return rejectWithValue(error.message || "Failed to force sync subscription")
  }
})

// Subscription slice
const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscriptionData: (state, action: PayloadAction<SubscriptionData>) => {
      state.currentSubscription = action.payload
      state.lastSync = Date.now()
      state.cacheStatus = 'fresh'
    },
    markSubscriptionStale: (state) => {
      state.cacheStatus = 'stale'
    },
    clearSubscriptionError: (state) => {
      state.error = null
    },
    resetSubscriptionState: (state) => {
      Object.assign(state, initialState)
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchSubscription
      .addCase(fetchSubscription.pending, (state) => {
        state.isFetching = true
        if (!state.currentSubscription) {
          state.isLoading = true
        }
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload
        state.isLoading = false
        state.isFetching = false
        state.error = null
        state.lastSync = Date.now()
        state.cacheStatus = 'fresh'
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch subscription'
        state.isLoading = false
        state.isFetching = false
        state.cacheStatus = 'error'
      })
      
      // forceSyncSubscription
      .addCase(forceSyncSubscription.pending, (state) => {
        state.isFetching = true
      })
      .addCase(forceSyncSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload
        state.isFetching = false
        state.error = null
        state.lastSync = Date.now()
        state.cacheStatus = 'fresh'
      })
      .addCase(forceSyncSubscription.rejected, (state, action) => {
        state.error = action.payload || 'Failed to force sync subscription'
        state.isFetching = false
        state.cacheStatus = 'error'
      })
  }
})

// Export actions and reducer
export const {
  setSubscriptionData,
  markSubscriptionStale,
  clearSubscriptionError,
  resetSubscriptionState
} = subscriptionSlice.actions

export default subscriptionSlice.reducer