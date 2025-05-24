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
import textQuizReducer from "@/app/store/slices/textQuizSlice"

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
  textQuiz: persistReducer(
    makePersistConfig("textQuiz", [
      "quizId",
      "title",
      "slug",
      "currentQuestionIndex",
      "questions",
      "answers",
      "status",
      "startTime",
      "completedAt",
      "score",
      "resultsSaved",
    ]),
    textQuizReducer,
  ),
})


// Define the type for the root reducer
type RootReducerType = typeof rootReducer

// === STORE ===
export const store = configureStore({
  reducer: rootReducer,
  // Add middleware configuration to ignore non-serializable values for Redux Persist actions
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Add any specific paths that might contain non-serializable values
        ignoredActionPaths: ['register', 'meta.arg', 'payload.timestamp', 'payload.startedTimeStamp'],
        ignoredPaths: ['register'],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
})

export const persistor = persistStore(store)


// === TYPES ===
export type RootState = ReturnType<RootReducerType>
export type AppDispatch = typeof store.dispatch

// === HOOKS ===
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
export const RoootState: RootState = store.getState()
