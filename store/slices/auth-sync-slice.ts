import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

// Enhanced Auth State with Real-time Sync
export interface AuthSyncState {
  isAuthenticated: boolean
  user: any | null
  isLoading: boolean
  error: string | null
  lastSyncTime: number | null
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  staleDataWarning: boolean
}

const initialState: AuthSyncState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
  lastSyncTime: null,
  syncStatus: 'idle',
  staleDataWarning: false,
}

// Thunk for syncing auth state with backend
export const syncAuthState = createAsyncThunk(
  'authSync/sync',
  async (options: { force?: boolean } = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const { lastSyncTime } = state.authSync
      const now = Date.now()
      
      // Skip sync if recent and not forced
      if (!options.force && lastSyncTime && (now - lastSyncTime) < 30000) {
        return state.authSync.user
      }

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to sync auth state')
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Sync failed')
    }
  }
)

// Thunk for handling auth state changes (login, logout, etc.)
export const handleAuthChange = createAsyncThunk(
  'authSync/handleChange',
  async (event: 'login' | 'logout' | 'refresh', { dispatch }) => {
    // Always sync after auth changes
    await dispatch(syncAuthState({ force: true }))
    
    // Sync subscription data as well
    await dispatch({ type: 'subscription/sync', payload: { force: true } })
    
    return event
  }
)

const authSyncSlice = createSlice({
  name: 'authSync',
  initialState,
  reducers: {
    markStaleData: (state) => {
      state.staleDataWarning = true
    },
    clearStaleDataWarning: (state) => {
      state.staleDataWarning = false
    },
    resetAuthState: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.error = null
      state.lastSyncTime = null
      state.syncStatus = 'idle'
      state.staleDataWarning = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncAuthState.pending, (state) => {
        state.isLoading = true
        state.syncStatus = 'syncing'
        state.error = null
      })
      .addCase(syncAuthState.fulfilled, (state, action) => {
        state.isLoading = false
        state.syncStatus = 'success'
        state.user = action.payload
        state.isAuthenticated = !!action.payload
        state.lastSyncTime = Date.now()
        state.staleDataWarning = false
        state.error = null
      })
      .addCase(syncAuthState.rejected, (state, action) => {
        state.isLoading = false
        state.syncStatus = 'error'
        state.error = action.payload as string
        state.staleDataWarning = true
      })
      .addCase(handleAuthChange.fulfilled, (state) => {
        state.lastSyncTime = Date.now()
        state.staleDataWarning = false
      })
  },
})

// Selectors
export const selectAuthSyncState = (state: RootState) => state.authSync
export const selectIsAuthenticated = (state: RootState) => state.authSync.isAuthenticated
export const selectAuthUser = (state: RootState) => state.authSync.user
export const selectAuthSyncStatus = (state: RootState) => state.authSync.syncStatus
export const selectHasStaleAuthData = (state: RootState) => state.authSync.staleDataWarning

// Memoized selector for auth status with staleness check
export const selectAuthStatusWithStaleness = createSelector(
  [selectAuthSyncState],
  (authSync) => ({
    isAuthenticated: authSync.isAuthenticated,
    user: authSync.user,
    isLoading: authSync.isLoading,
    hasStaleData: authSync.staleDataWarning,
    lastSyncTime: authSync.lastSyncTime,
    needsRefresh: authSync.lastSyncTime ? (Date.now() - authSync.lastSyncTime) > 300000 : true, // 5 minutes
  })
)

export const { markStaleData, clearStaleDataWarning, resetAuthState } = authSyncSlice.actions
export default authSyncSlice.reducer
