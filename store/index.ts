import { configureStore } from "@reduxjs/toolkit"
import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import quizReducer from "./slices/quizSlice"
import subscriptionReducer from "./slices/subscription-slice"

// Configure the Redux store with both reducers
export const store = configureStore({
  reducer: {
    quiz: quizReducer,
    subscription: subscriptionReducer, // Make sure this is included
  },
})

// Define types for RootState and AppDispatch
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Create typed hooks for useDispatch and useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
