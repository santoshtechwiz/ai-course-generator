import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist"
import storage from "redux-persist/lib/storage"
import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import quizReducer from "./slices/quizSlice"
import subscriptionReducer from "./slices/subscription-slice"

// Configure persist options
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["quiz"], // Only persist the quiz slice
}

// Combine reducers
const rootReducer = combineReducers({
  quiz: quizReducer,
  subscription: subscriptionReducer,
})

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer)

// Configure the Redux store with persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

// Create persistor
export const persistor = persistStore(store)

// Define types for RootState and AppDispatch
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Create typed hooks for useDispatch and useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
