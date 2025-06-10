import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "@/store"
import { getAuthSession } from "@/lib/auth"

// Define types
export interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  isAdmin?: boolean
  credits?: number
  userType?: string
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
  async (_, { rejectWithValue }) => {
    try {
      const session = await getAuthSession()

      if (session?.user) {
        return {
          user: session.user,
          token: session.token || null,
        }
      }
      return { user: null, token: null }
    } catch (error) {
      console.error("Failed to initialize auth:", error)
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
    },
    logout: () => {
      // ✅ Completely reset the auth state
      return { ...initialState }
    },
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload
      state.isAdmin = !!action.payload?.isAdmin
      state.status = action.payload ? "authenticated" : "unauthenticated"
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.status = "loading"
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
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
export const { loginStart, loginSuccess, loginFailure, logout, setUser } =
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
