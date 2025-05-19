import { configureStore, combineReducers } from "@reduxjs/toolkit"
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist"
import storage from "redux-persist/lib/storage"
import type { TypedUseSelectorHook } from "react-redux"
import { useDispatch, useSelector } from "react-redux"
import type { PersistPartial } from "redux-persist/es/persistReducer"

// Middlewares
import persistQuizMiddleware from "./middleware/persistQuizMiddleware"

// Reducers
import authReducer from "./slices/authSlice"
import quizReducer from "./slices/quizSlice"
import subscriptionReducer from "./slices/subscription-slice"
import userReducer from "./slices/userSlice"
import flashcardReducer from "./slices/flashcardSlice"
import textQuizReducer from "@/app/store/slices/textQuizSlice"


// === PERSIST CONFIGS ===
const makePersistConfig = (key: string, whitelist: string[]) => ({
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
      "error",
      "results",
      "isCompleted",
      "quizHistory",
      "currentQuizId",
      "timeRemaining",
      "timerActive",
    ]),
    quizReducer
  ),
  subscription: persistReducer(
    makePersistConfig("subscription", ["data", "details", "tokenUsage", "lastFetched"]),
    subscriptionReducer
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
      "resultsSaved"
    ]),
    textQuizReducer
  ),
})

// === STORE ===
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).prepend(persistQuizMiddleware.middleware),
  devTools: process.env.NODE_ENV !== "production",
})

export const persistor = persistStore(store)

// === TYPES ===
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// === HOOKS ===
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// === SLICE SELECTORS WITH PERSIST TYPES ===
const createTypedSliceSelector = <T>(selector: (state: RootState) => T) =>
  useAppSelector(selector) as T & PersistPartial

export const useQuizState = () => createTypedSliceSelector((state) => state.quiz)
export const useAuthState = () => createTypedSliceSelector((state) => state.auth)
export const useSubscriptionState = () => createTypedSliceSelector((state) => state.subscription)
export const useUserState = () => createTypedSliceSelector((state) => state.user)
