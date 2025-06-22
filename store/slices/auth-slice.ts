import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "@/store"
import { logger } from "@/lib/logger"

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

// Async thunk to initialize auth from server session
export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Check if we're on client side to avoid calling headers outside request scope
      if (typeof window !== "undefined") {
        // Try to get auth status from API
        try {
          const response = await fetch('/api/auth/session', {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // If we have session data, return it
            if (data && data.user) {
              logger.info("Auth initialized with user data:", data.user);
              
              // Also fetch subscription data for the user
              try {
                // Use Redux thunk to fetch subscription data (prevents duplicate calls)
                const subData = await dispatch<any>(
                  // @ts-ignore
                  require("@/store/slices/subscription-slice").fetchSubscription()
                ).unwrap();
                // Enhance user object with subscription information
                data.user.subscriptionPlan = subData.subscriptionPlan;
                data.user.subscriptionStatus = subData.status;
                data.user.credits = subData.credits;
                logger.info("Enhanced user with subscription data:", subData);
              } catch (subError) {
                logger.error("Failed to fetch subscription data:", subError);
              }
              
              return { user: data.user, token: data.token || null };
            }
          }
        } catch (apiError) {
          logger.warn("Error fetching auth session:", apiError);
          // Continue to check local storage if API fails
        }
        
        // On client side, we can't use getAuthSession() directly
        // Instead, check if we have session data in localStorage or return empty
        const localSession =
          localStorage.getItem("next-auth.session-token") ||
          sessionStorage.getItem("next-auth.session-token");

        // If there's a token but we can't access the session data yet,
        // return a loading state which will be resolved by the AuthContext
        if (localSession) {
          return { pending: true, message: "Waiting for session data" };
        }
      }

      // No session found
      return { user: null, token: null };
    } catch (error) {
      logger.error("Failed to initialize auth:", error);
      return rejectWithValue("Failed to initialize authentication");
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
