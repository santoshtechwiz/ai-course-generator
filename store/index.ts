import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist"
import storage from "redux-persist/lib/storage"
import type { TypedUseSelectorHook } from "react-redux"
import { useDispatch, useSelector } from "react-redux"


// Reducers
import authReducer from "./slices/authSlice"
import quizReducer from "./slices/quizSlice"
import subscriptionReducer from "./slices/subscription-slice"
import userReducer from "./slices/userSlice"
import flashcardReducer from "./slices/flashcardSlice"


// Define types for persist config
interface PersistConfig {
  key: string
  storage: typeof storage
  whitelist: string[]
}

// === PERSIST CONFIGS ===
const makePersistConfig = (key: string, whitelist: string[]): PersistConfig => ({
  key,
  storage,
  whitelist,
})

const rootReducer = combineReducers({
  auth: persistReducer(makePersistConfig("auth", ["user", "isAuthenticated", "token"]), authReducer),
  quiz: persistReducer(
    makePersistConfig("quiz", [
      "quizData",
      "currentQuestion",
      "userAnswers",
      "isLoading",
      "isSubmitting",
      "errors",
      "results",
      "isCompleted",
      "quizHistory",
      "currentQuizId",
      "timeRemaining",
      "timerActive",
    ]),
    quizReducer,
  ),
  subscription: persistReducer(
    makePersistConfig("subscription", ["data", "details", "tokenUsage", "lastFetched"]),
    subscriptionReducer,
  ),
  user: persistReducer(makePersistConfig("user", ["profile", "preferences", "statistics"]), userReducer),
  flashcard: flashcardReducer,

})


// Define the type for the root reducer
type RootReducerType = typeof rootReducer

// === STORE ===
export const store = configureStore({
  reducer: rootReducer,

  devTools: process.env.NODE_ENV !== "production",
})

export const persistor = persistStore(store)


// === TYPES ===
export type RootState = ReturnType<RootReducerType>
export type AppDispatch = typeof store.dispatch

// === HOOKS ===
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

