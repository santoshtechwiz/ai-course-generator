import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './index';

// Types
export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string | null;
    name: string | null;
    email: string | null;
  } | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  status: 'idle',
  error: null
};

// Async thunks
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would check with an API
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        return { isAuthenticated: false, user: null };
      }
      const data = await response.json();
      return {
        isAuthenticated: Boolean(data.user),
        user: data.user || null
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check authentication status');
    }
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      const data = await response.json();
      return {
        isAuthenticated: true,
        user: data.user
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Authentication failed');
    }
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      await fetch('/api/auth/signout', {
        method: 'POST',
      });
      
      return {
        isAuthenticated: false,
        user: null
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign out failed');
    }
  }
);

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      state.user = action.payload;
    },
    resetAuth: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // checkAuthStatus reducers
      .addCase(checkAuthStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
        state.status = 'authenticated';
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.status = 'error';
        state.error = action.payload as string;
      })
      
      // signIn reducers
      .addCase(signIn.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
        state.status = 'authenticated';
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      })
      
      // signOut reducers
      .addCase(signOut.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(signOut.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.status = 'idle';
        state.error = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      });
  }
});

// Export actions and reducer
export const { setAuthenticated, setUser, resetAuth } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
