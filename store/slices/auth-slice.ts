import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "@/store"
import { logger } from "@/lib/logger"
import { fetchSubscription } from "./subscription-slice"

// Define types
export interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  isAdmin?: boolean
  credits?: number
  userType?: string
  subscriptionPlan?: string | null
  subscriptionStatus?: string | null
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  status: "idle" | "loading" | "authenticated" | "unauthenticated"
  error: string | null
  isInitialized: boolean
  isAdmin?: boolean
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  status: "idle",
  error: null,
  isInitialized: false,
  isAdmin: undefined,
}

import type { AppDispatch } from "@/store"

export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { dispatch, rejectWithValue }) => {
    const typedDispatch = dispatch as AppDispatch;
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/auth/session", {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          credentials: "include", // 🔐 required for auth session cookie
        })

        if (res.ok) {
          const data = await res.json()
          if (data?.user) {
           
            try {
              const subData = await typedDispatch(fetchSubscription({ forceRefresh: true })).unwrap()

              data.user.credits = subData.credits
              data.user.subscriptionPlan = subData.subscriptionPlan
              data.user.subscriptionStatus = subData.status

              logger.info("Enhanced user with subscription data:", subData)
            } catch (err) {
              logger.warn("Failed to fetch subscription data")
            }

            return { user: data.user, token: data.token || null }
          }
        }
      }

      return { user: null, token: null }
    } catch (error) {
      logger.error("Failed to initialize auth:", error)
      return rejectWithValue("Failed to initialize authentication")
    }
  }
)
// Create slice
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.status = "loading"
      state.error = null
    },
    loginSuccess: (
      state,
      action: PayloadAction<{ user: AuthUser; token?: string | null }>
    ) => {
      state.status = "authenticated"
      state.user = action.payload.user
      state.token = action.payload.token || null
      state.error = null
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.status = "unauthenticated"
      state.error = action.payload
      state.user = null
      state.token = null
    },    logout: (state) => {
      // Complete auth state reset with proper initialization status
      state.user = null;
      state.token = null;
      state.error = null;
      state.isAdmin = false;
      state.isInitialized = true; // Keep as initialized to prevent loading loops
      state.status = "unauthenticated"; // Explicitly mark as unauthenticated
    },
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload
      state.isAdmin = !!action.payload?.isAdmin
      state.status = action.payload ? "authenticated" : "unauthenticated"
    },
    // Add a synchronize subscription action to update auth user with subscription data
    syncSubscriptionData: (state, action: PayloadAction<any>) => {
      if (state.user && action.payload) {
        state.user = {
          ...state.user,
          credits: action.payload.credits,
          subscriptionPlan: action.payload.subscriptionPlan,
          subscriptionStatus: action.payload.status,
        };
        logger.info("Synchronized auth user with subscription data:", action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.status = "loading"
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        // Handle the "pending" case where we're waiting for session data
        if (action.payload.pending) {
          state.status = "loading"
          return
        }

        if (action.payload.user) {
          state.status = "authenticated"
          state.user = action.payload.user
          state.token = action.payload.token
          state.isAdmin = !!action.payload.user.isAdmin
        } else {
          state.status = "unauthenticated"
        }
        state.isInitialized = true
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.status = "unauthenticated"
        state.error = action.payload as string
        state.isInitialized = true
      })
  },
})

// Export actions
export const { loginStart, loginSuccess, loginFailure, logout, setUser, syncSubscriptionData } =
  authSlice.actions

// Export selectors
export const selectAuth = (state: RootState) => state.auth
export const selectUser = (state: RootState) => state.auth.user
export const selectToken = (state: RootState) => state.auth.token
export const selectAuthStatus = (state: RootState) => state.auth.status
export const selectIsAdmin = (state: RootState) => !!state.auth.user?.isAdmin
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.status === "authenticated" && !!state.auth.user
export const selectIsAuthLoading = (state: RootState) =>
  state.auth.status === "loading"

// Export reducer
export default authSlice.reducer
