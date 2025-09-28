import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { createListenerMiddleware } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from "redux-persist"
import storage from "redux-persist/lib/storage"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"

// Core reducers
import { quizReducer, setCurrentQuestionIndex } from "./slices/quiz"
import flashcardReducer from "./slices/flashcard-slice"
import courseReducer from "./slices/course-slice"
import certificateReducer from "./slices/certificate-slice"
import { subscriptionSlice } from "./slices/subscription-slice"
import courseProgressReducer from "./slices/courseProgress-slice"
import progressEventsReducer from "./slices/progress-events-slice"

// Storage with fallback
const createStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const testKey = '__redux_persist_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return storage
    }
  } catch (error) {
    console.warn('localStorage not available, using memory storage fallback')
  }

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
const rootReducer = combineReducers({
  quiz: persistReducer(quizPersistConfig, quizReducer),
  flashcard: persistReducer(flashcardPersistConfig, flashcardReducer),
  course: persistReducer(coursePersistConfig, courseReducer),
  certificate: certificateReducer,
  subscription: subscriptionSlice.reducer,
  courseProgress: courseProgressReducer,
  progressEvents: progressEventsReducer,
})

// ---------------------
// Listener middleware: debounced persistence for quiz progress
// ---------------------
import { storageManager } from '@/utils/storage-manager'

// Simple debounce helper (module-scoped to preserve timer between invocations)
function debounce<Func extends (...args: any[]) => void>(fn: Func, wait = 250) {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<Func>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), wait)
  }
}

const listenerMiddleware = createListenerMiddleware()

// Debounced persist function: writes quiz progress into storageManager
const debouncedPersist = debounce((slug: string | null, quizType: string | null, currentQuestionIndex: number) => {
  try {
    if (!slug || !quizType) return
    // Use the same shape storageManager expects in existing code
    const progress = {
      courseId: slug,
      chapterId: `${quizType}_${slug}`,
      currentQuestionIndex,
      answers: {},
      timeSpent: 0,
      lastUpdated: Date.now(),
      isCompleted: false,
    }
    storageManager.saveQuizProgress(progress)
  } catch (e) {
    // swallow errors to avoid breaking UI
    // eslint-disable-next-line no-console
    console.warn('Failed to persist quiz progress (listener):', e)
  }
}, 300)

// Listener: responds to setCurrentQuestionIndex actions
listenerMiddleware.startListening({
  actionCreator: setCurrentQuestionIndex,
  effect: async (action, api) => {
    const state = api.getState() as any
    const quiz = (state as any).quiz || {}
    const slug = quiz.slug ?? null
    const quizType = quiz.quizType ?? null
    const idx = action.payload as number
    debouncedPersist(slug, String(quizType), idx)
  }
})

// ✅ Clean store setup without auth middleware (session-based auth)
const isProd = process.env.NODE_ENV === 'production'
// Allow opting back into safety checks if desired: NEXT_PUBLIC_REDUX_SAFETY_CHECKS=true
const safetyChecksEnabled = process.env.NEXT_PUBLIC_REDUX_SAFETY_CHECKS === 'true'
// Allow forcing Redux DevTools in non-dev environments
const forceDevtools = process.env.NEXT_PUBLIC_FORCE_REDUX_DEVTOOLS === 'true'
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => {
    const base = getDefaultMiddleware({
      // Disable costly dev-only invariant/serializable checks unless explicitly re-enabled
      immutableCheck: safetyChecksEnabled ? { warnAfter: 128 } : false,
      serializableCheck: safetyChecksEnabled ? {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
        ],
        warnAfter: 128,
      } : false,
    })
    // Attach listener middleware
    return base.concat(listenerMiddleware.middleware)
  },
  // Enable Redux DevTools with useful tracing during development
  devTools: !isProd || forceDevtools ? {
    name: 'ai-learning',
    trace: true, // enable stack trace of actions for easier debugging
    traceLimit: 25,
  } : false,
})

// ✅ Persistor for <PersistGate />
export const persistor = persistStore(store)

// ✅ Typed hooks
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
