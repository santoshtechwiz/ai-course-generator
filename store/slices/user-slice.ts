// store/slices/userSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from ".."


export interface User {
  id: string
  name: string
  email: string
  image?: string
  role?: "user" | "admin" | "instructor"
}

export interface UserState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true
      state.error = null
    },
    loginSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload
      state.isAuthenticated = true
      state.loading = false
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.error = action.payload
      state.loading = false
      state.isAuthenticated = false
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
})

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
} = userSlice.actions

// ✅ Selectors
export const selectUser = (state: RootState) => state.user.user
export const selectIsAuthenticated = (state: RootState) => state.user.isAuthenticated
export const selectLoading = (state: RootState) => state.user.loading
export const selectError = (state: RootState) => state.user.error

export default userSlice.reducer
