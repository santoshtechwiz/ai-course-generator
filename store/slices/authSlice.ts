// Redux slice for authentication state management
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AuthState } from "@/types/auth-types";
import { RootState } from "../index";

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  userId: null,
  status: "idle",
  error: null,
  redirectPath: null
};

// Async thunks
export const checkAuthStatus = createAsyncThunk(
  "auth/checkStatus",
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would check with your auth provider
      const response = await fetch('/api/auth/session');
      
      if (!response.ok) {
        throw new Error('Failed to check authentication status');
      }
      
      const data = await response.json();
      return {
        isAuthenticated: !!data.user,
        userId: data.user?.id || null
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthStatus: (state, action: PayloadAction<{ isAuthenticated: boolean; userId: string | null }>) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.userId = action.payload.userId;
    },
    signOut: (state) => {
      state.isAuthenticated = false;
      state.userId = null;
    },
    setRedirectPath: (state, action: PayloadAction<string | null>) => {
      state.redirectPath = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.status = "idle";
        state.isAuthenticated = action.payload.isAuthenticated;
        state.userId = action.payload.userId;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload as string;
        // Default to not authenticated on error
        state.isAuthenticated = false;
        state.userId = null;
      });
  }
});

// Actions
export const { setAuthStatus, signOut, setRedirectPath } = authSlice.actions;

// Selectors
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectUserId = (state: RootState) => state.auth.userId;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectRedirectPath = (state: RootState) => state.auth.redirectPath;

export default authSlice.reducer;
