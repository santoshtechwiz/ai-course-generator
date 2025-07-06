import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { persistReducer, persistStore } from "redux-persist"
import storage from "redux-persist/lib/storage"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"

// Core reducers (session-based auth, no user slice needed)
import { quizReducer } from "./slices/quiz"
import flashcardReducer from "./slices/flashcard-slice"
import courseReducer from "./slices/course-slice"
import certificateReducer from "./slices/certificate-slice"
import { subscriptionSlice } from "./slices/subscription-slice"

// Persist configs for non-auth slices
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

// Root reducer with session-based auth only
const rootReducer = combineReducers({
  quiz: persistReducer(quizPersistConfig, quizReducer),
  flashcard: persistReducer(flashcardPersistConfig, flashcardReducer),
  course: persistReducer(coursePersistConfig, courseReducer),
  certificate: certificateReducer,
  subscription: subscriptionSlice.reducer,
})

// ✅ Clean store setup without auth middleware (session-based auth)
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST", 
          "persist/REHYDRATE",
        ],
      },
    }),
})

// ✅ Persistor for <PersistGate />
export const persistor = persistStore(store)

// ✅ Typed hooks
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
