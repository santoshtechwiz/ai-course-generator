import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../index";
import { AuthState, User } from "@/types/auth";
import { createSelector } from "reselect";
import { getSession } from "next-auth/react";

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null
};

// Async thunk to check auth status using NextAuth's getSession
export const checkAuthStatus = createAsyncThunk(
  "auth/checkStatus",
  async (_, { rejectWithValue }) => {
    try {
      const session = await getSession();

      return {
        isAuthenticated: !!session?.user,
        user: session?.user as User | null
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch session");
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthStatus: (state, action: PayloadAction<{ isAuthenticated: boolean; user: User | null }>) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.user = action.payload.user;
    },
    signOut: (state) => {
      state.isAuthenticated = false;
      state.user = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      });
  }
});

// Actions
export const { setAuthStatus, signOut } = authSlice.actions;

// Selectors
export const selectAuthState = (state: RootState) => state.auth;

export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (authState) => Boolean(authState.isAuthenticated)
);

export const selectUserId = createSelector(
  [selectAuthState],
  (authState) => authState.user?.id || null
);

export const selectUser = createSelector(
  [selectAuthState],
  (authState) => authState.user || null
);

export const selectUserProfile = createSelector(
  [selectUser],
  (user) => {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name || 'Anonymous',
      email: user.email,
      image: user.image || '/images/default-avatar.png',
      isComplete: Boolean(user.name && user.email)
    };
  }
);

export const selectAuthStatus = createSelector(
  [selectAuthState],
  (authState) => ({
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    loading: authState.loading,
    error: authState.error
  })
);

export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

export default authSlice.reducer;
