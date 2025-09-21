import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { 
  type SubscriptionState,
  type SubscriptionData,
  type SubscriptionResponse,
  type ApiResponse,
  SUBSCRIPTION_CACHE_CONFIG,
  isSubscriptionResponse,
  isSubscriptionData
} from '@/types/subscription'
import { logger } from '@/lib/logger'

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
  void,
  { rejectValue: string }
>('subscription/fetch', async (_, { signal, rejectWithValue }) => {
  try {
    const response = await fetch('/api/subscriptions/status', {
      signal,
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch subscription status')
    }

    const data: ApiResponse = await response.json()
    
    if (!isSubscriptionResponse(data)) {
      throw new Error('Invalid subscription data received')
    }

    return data.data
  } catch (error: any) {
    logger.error('Error fetching subscription:', error)
    return rejectWithValue(error.message)
  }
})

export const forceSyncSubscription = createAsyncThunk<
  SubscriptionData,
  void,
  { rejectValue: string }
>('subscription/forceSync', async (_, { signal, rejectWithValue }) => {
  try {
    const response = await fetch('/api/subscriptions/status?force=true', {
      signal,
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to force sync subscription')
    }

    const data: ApiResponse = await response.json()
    
    if (!isSubscriptionResponse(data)) {
      throw new Error('Invalid subscription data received')
    }

    return data.data
  } catch (error: any) {
    logger.error('Error force syncing subscription:', error)
    return rejectWithValue(error.message)
  }
})

// Slice
const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscriptionData: (state, action: PayloadAction<SubscriptionData>) => {
      if (isSubscriptionData(action.payload)) {
        state.currentSubscription = action.payload
        state.lastSync = Date.now()
        state.cacheStatus = 'fresh'
      }
    },
    markSubscriptionStale: (state) => {
      state.cacheStatus = 'stale'
    },
    clearSubscriptionError: (state) => {
      state.error = null
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

// Selectors with memoization
export const selectSubscriptionData = (state: RootState) => state.subscription.currentSubscription
export const selectHasActiveSubscription = (state: RootState) => 
  state.subscription.currentSubscription?.status === 'ACTIVE'

export const selectHasCredits = (state: RootState) => {
  const sub = state.subscription.currentSubscription
  return sub ? (sub.credits - sub.tokensUsed) > 0 : false
}

export const selectCanCreateQuizOrCourse = (state: RootState) => {
  const sub = state.subscription.currentSubscription
  return sub?.status === 'ACTIVE' || (sub && (sub.credits - sub.tokensUsed) > 0)
}

export const selectIsExpired = (state: RootState) => {
  const sub = state.subscription.currentSubscription
  if (!sub?.expirationDate) return false
  return new Date(sub.expirationDate) < new Date()
}

export const selectShouldRefreshSubscription = (state: RootState) => {
  const lastSync = state.subscription.lastSync
  return (
    state.subscription.cacheStatus === 'stale' ||
    Date.now() - lastSync > SUBSCRIPTION_CACHE_CONFIG.staleTime
  )
}

export const selectSubscriptionCacheStatus = (state: RootState) => state.subscription.cacheStatus

export const selectSubscription = (state: RootState) => state.subscription

export const { 
  setSubscriptionData, 
  markSubscriptionStale, 
  clearSubscriptionError 
} = subscriptionSlice.actions

export default subscriptionSlice.reducer