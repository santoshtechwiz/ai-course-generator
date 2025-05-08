import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { User } from "next-auth"

// Define types
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  redirectUrl: string | null
  isProcessingAuth: boolean
}

// Define initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  redirectUrl: null,
  isProcessingAuth: false,
}

// Async thunks for authentication
export const checkAuthStatus = createAsyncThunk("auth/checkStatus", async (_, { rejectWithValue }) => {
  try {
    // This would typically check session status from an API
    // For now, we'll rely on the session from next-auth directly
    return null
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to check authentication status")
  }
})

// Create slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
    },
    setIsAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload
    },
    setIsProcessingAuth: (state, action: PayloadAction<boolean>) => {
      state.isProcessingAuth = action.payload
    },
    setRedirectUrl: (state, action: PayloadAction<string | null>) => {
      state.redirectUrl = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearAuthState: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
      state.redirectUrl = null
      state.isProcessingAuth = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(checkAuthStatus.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Authentication check failed"
      })
  },
})

// Export actions
export const { setUser, setIsAuthenticated, setIsProcessingAuth, setRedirectUrl, setError, clearAuthState } =
  authSlice.actions

// Export reducer
export default authSlice.reducer
