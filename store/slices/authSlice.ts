import { createSlice, PayloadAction } from "@reduxjs/toolkit"

// Define the interface for redirect state
export interface AuthRedirectState {
  path?: string;
  previewResults?: any;
  quizState?: {
    userAnswers: any[];
    currentQuestion: number;
    slug: string;
    quizId: string;
  };
}

interface AuthState {
  userRedirectState: Record<string, any> | null;
  hasRedirectState: boolean;
  // Other auth state properties can be added here
}

const initialState: AuthState = {
  userRedirectState: null,
  hasRedirectState: false,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserRedirectState: (state, action: PayloadAction<Record<string, any>>) => {
      state.userRedirectState = action.payload
      state.hasRedirectState = true
    },
    clearUserRedirectState: (state) => {
      state.userRedirectState = null
      state.hasRedirectState = false
    }
  },
})

export const {
  setUserRedirectState,
  clearUserRedirectState,
} = authSlice.actions

export default authSlice.reducer
