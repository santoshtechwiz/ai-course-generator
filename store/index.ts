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
import courseProgressReducer from "./slices/courseProgress-slice"

// Enhanced storage with fallback
const createStorage = () => {
  try {
    // Test if localStorage is available
    if (typeof window !== 'undefined' && window.localStorage) {
      const testKey = '__redux_persist_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return storage
    }
  } catch (error) {
    console.warn('localStorage not available, using memory storage fallback')
  }
  
  // Fallback to memory storage
  return {
    getItem: (key: string) => Promise.resolve(null),
    setItem: (key: string, value: string) => Promise.resolve(),
    removeItem: (key: string) => Promise.resolve(),
  }
}

// Persist configs for non-auth slices
const coursePersistConfig = {
  key: "course",
  storage: createStorage(),
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
  storage: createStorage(),
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
  storage: createStorage(),
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
const courseProgressPersistConfig = {
  key: "courseProgress",
  storage: createStorage(),
  whitelist: ["byCourseId"],
}

const rootReducer = combineReducers({
  quiz: persistReducer(quizPersistConfig, quizReducer),
  flashcard: persistReducer(flashcardPersistConfig, flashcardReducer),
  course: persistReducer(coursePersistConfig, courseReducer),
  certificate: certificateReducer,
  subscription: subscriptionSlice.reducer,
  courseProgress: persistReducer(courseProgressPersistConfig, courseProgressReducer),
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
