import { configureStore } from "@reduxjs/toolkit"
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist"
import storage from "redux-persist/lib/storage"
import { combineReducers } from "redux"
import type { TypedUseSelectorHook } from "react-redux"
import { useDispatch, useSelector } from "react-redux"

// Import reducers
import authReducer from "./slices/authSlice"
import quizReducer from "./slices/quizSlice"
import subscriptionReducer from "./slices/subscription-slice"
import userReducer from "./slices/userSlice"

// Configure persist for each reducer
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["user", "isAuthenticated", "token"],
}

const quizPersistConfig = {
  key: "quiz",
  storage,
  whitelist: ["quizzes", "currentQuiz", "results", "progress"],
}

const subscriptionPersistConfig = {
  key: "subscription",
  storage,
  whitelist: ["data", "details", "tokenUsage", "lastFetched"],
}

const userPersistConfig = {
  key: "user",
  storage,
  whitelist: ["profile", "preferences", "statistics"],
}

// Combine reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  quiz: persistReducer(quizPersistConfig, quizReducer),
  subscription: persistReducer(subscriptionPersistConfig, subscriptionReducer),
  user: persistReducer(userPersistConfig, userReducer),
})

// Configure store with middleware options
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
})

// Create persistor
export const persistor = persistStore(store)

// Define RootState to include PersistPartial
import type { PersistPartial } from "redux-persist/es/persistReducer"

// Export types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Use these typed hooks throughout the app instead of plain useDispatch/useSelector
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Typed selectors for specific slices with PersistPartial handling
export const useQuizState = () => {
  return useAppSelector((state) => state.quiz) as typeof quizReducer extends (state: infer S, action: any) => any
    ? S & PersistPartial
    : never
}

export const useAuthState = () => {
  return useAppSelector((state) => state.auth) as typeof authReducer extends (state: infer S, action: any) => any
    ? S & PersistPartial
    : never
}

export const useSubscriptionState = () => {
  return useAppSelector((state) => state.subscription) as typeof subscriptionReducer extends (
    state: infer S,
    action: any,
  ) => any
    ? S & PersistPartial
    : never
}

export const useUserState = () => {
  return useAppSelector((state) => state.user) as typeof userReducer extends (state: infer S, action: any) => any
    ? S & PersistPartial
    : never
}
