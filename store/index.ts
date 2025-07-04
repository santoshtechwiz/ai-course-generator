import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { persistReducer, persistStore } from "redux-persist"
import storage from "redux-persist/lib/storage"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"

// Reducers
import authReducer from "./slices/auth-slice"
import quizReducer from "./slices/quiz-slice"
import subscriptionReducer from "./slices/subscription-slice"
import flashcardReducer from "./slices/flashcard-slice"
import courseReducer from "./slices/course-slice"
import certificateReducer from "./slices/certificate-slice"
import userReducer from "./slices/user-slice"

// Middleware
import subscriptionListenerMiddleware from "./middleware/subscriptionMiddleware"

// 🔐 Persist configs
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["token", "user"],
}

const coursePersistConfig = {
  key: "course",
  storage,
  whitelist: [
    "autoplayEnabled",
    "bookmarks",
    "videoProgress",
    "playbackSettings",
    "courseProgress",
    "currentVideoId",
    "currentCourseId",
    "currentCourseSlug",
    "courseCompletionStatus",
  ],
}

const flashcardPersistConfig = {
  key: "flashcard",
  storage,
  whitelist: [
    "quizId",
    "slug",
    "title",
    "questions",
    "currentQuestion",
    "answers",
    "status",
    "isCompleted",
    "results",
    "shouldRedirectToResults",
    "requiresAuth",
    "pendingAuthRequired",
  ],
}

const quizPersistConfig = {
  key: "quiz",
  storage,
  whitelist: [
    "quizId",
    "slug",
    "title",
    "questions",
    "currentQuestion",
    "answers",
    "status",
    "isCompleted",
    "results",
    "shouldRedirectToResults",
  ],
}

const subscriptionPersistConfig = {
  key: "subscription",
  storage,
  whitelist: ["data"], // ✅ Only persist the subscription data
}

// ✅ Root reducer with persisted slices
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  quiz: persistReducer(quizPersistConfig, quizReducer),
  subscription: persistReducer(subscriptionPersistConfig, subscriptionReducer), // ✅
  flashcard: persistReducer(flashcardPersistConfig, flashcardReducer),
  course: persistReducer(coursePersistConfig, courseReducer),
  certificate: certificateReducer,
  user: userReducer,
})

// ✅ Store setup
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).prepend(subscriptionListenerMiddleware.middleware),
})

// ✅ Persistor for <PersistGate />
export const persistor = persistStore(store)

// ✅ Typed hooks
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
