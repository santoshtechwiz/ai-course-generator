import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LoadingState {
  // Track loading state by key/feature
  loadingStates: Record<string, boolean>;
  // Track error states by key/feature
  errorStates: Record<string, string | null>;
  // Global loading flag (true if any state is loading)
  isLoading: boolean;
}

const initialState: LoadingState = {
  loadingStates: {},
  errorStates: {},
  isLoading: false,
};

export const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    startLoading: (state, action: PayloadAction<string>) => {
      state.loadingStates[action.payload] = true;
      state.isLoading = true;
    },
    stopLoading: (state, action: PayloadAction<string>) => {
      delete state.loadingStates[action.payload];
      // Update global loading state
      state.isLoading = Object.values(state.loadingStates).some(Boolean);
    },
    setError: (state, action: PayloadAction<{ key: string; error: string | null }>) => {
      const { key, error } = action.payload;
      if (error) {
        state.errorStates[key] = error;
      } else {
        delete state.errorStates[key];
      }
    },
    resetLoading: (state) => {
      state.loadingStates = {};
      state.errorStates = {};
      state.isLoading = false;
    },
  },
});

export const { startLoading, stopLoading, setError, resetLoading } = loadingSlice.actions;

export default loadingSlice.reducer;
