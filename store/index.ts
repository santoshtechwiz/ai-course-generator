import { configureStore, combineReducers } from "@reduxjs/toolkit"
import type { TypedUseSelectorHook } from "react-redux"
import { useDispatch, useSelector } from "react-redux"

// Reducers
import authReducer from "./slices/authSlice"
import quizReducer from "./slices/quizSlice"
import subscriptionReducer from "./slices/subscription-slice"
import userReducer from "./slices/userSlice"
import flashcardReducer from "./slices/flashcardSlice"

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  quiz: quizReducer,
  subscription: subscriptionReducer,
  user: userReducer,
  flashcard: flashcardReducer,
})

// Store setup
export const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== "production",
})

// Types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Hooks
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
