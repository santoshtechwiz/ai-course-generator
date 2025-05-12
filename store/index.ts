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

// Export types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Use these typed hooks throughout the app instead of plain useDispatch/useSelector
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
