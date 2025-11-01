import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SubscriptionData } from '@/types/subscription-plans';

interface SubscriptionState {
  data: SubscriptionData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: SubscriptionState = {
  data: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscriptionData: (state, action: PayloadAction<SubscriptionData>) => {
      state.data = action.payload;
      state.lastUpdated = Date.now();
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearSubscriptionData: (state) => {
      state.data = null;
      state.lastUpdated = null;
      state.error = null;
      state.loading = false;
    },
    updateCredits: (state, action: PayloadAction<number>) => {
      if (state.data) {
        state.data.credits = action.payload;
        state.lastUpdated = Date.now();
      }
    },
    updateTokensUsed: (state, action: PayloadAction<number>) => {
      if (state.data) {
        state.data.tokensUsed = action.payload;
        state.lastUpdated = Date.now();
      }
    },
  },
});

export const {
  setSubscriptionData,
  
  
  
  
  
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;