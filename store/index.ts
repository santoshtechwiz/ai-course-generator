import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { createPersistMiddleware } from "./middleware/persistMiddleware";

// Reducers
import authReducer from "./slices/authSlice";
import quizReducer from "./slices/quizSlice";
import subscriptionReducer from "./slices/subscriptionSlice";
import userReducer from "./slices/userSlice";
import flashcardReducer from "./slices/flashcardSlice";
import courseReducer from "./slices/courseSlice";
import certificateReducer from "./slices/certificateSlice";

// Create a type for the certificate reducer to avoid naming conflict
type CertificateReducer = typeof certificateReducer;

// Configure persistence
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
};

const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["token", "user"], // Add any other auth state properties you want to persist
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  quiz: quizReducer,
  subscription: subscriptionReducer,
  user: userReducer,
  flashcard: flashcardReducer,
  course: persistReducer(coursePersistConfig, courseReducer),
  certificate: certificateReducer, // Fixed name to avoid collision with the import
});

// Create Redux middleware for persistence
const middleware = [
  createPersistMiddleware({
    key: "redux_state",
    whitelist: ["quiz", "flashcard", "subscription"],
  }),
];

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(middleware),
});

// Create the persistor
export const persistor = persistStore(store);

// Add these hooks for typed usage in app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Export slices functionality
export {
  initializeAuth,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
  selectAuth,
  selectUser,
  selectToken,
  selectAuthStatus,
  selectIsAdmin,
  selectIsAuthenticated,
  selectIsAuthLoading,
} from "./slices/authSlice";

// Course slice exports - avoid conflicting names
export * from "./slices/courseSlice";

// Quiz slice exports - avoid conflicting names
export {
  fetchQuiz,
  submitQuiz,
  initializeQuiz,
  restoreQuizAfterAuth,
  submitQuizAndPrepareResults,
  checkAuthAndLoadResults,
  fetchQuizResults,
  setCurrentQuestionIndex,
  saveAnswer,
  resetQuiz,
  clearResetFlag,
  setQuizResults,
  setPendingQuiz,
  hydrateQuiz,
  clearPendingQuiz,
  setAuthRedirect,
  clearAuthRedirect,
  setResultsRedirect,
  clearResultsRedirect,
  setQuizCompleted,
  setQuizType,
  setSessionId,
  resetSaveStatus,
  setQuiz,
  // Rename conflicting exports with prefixes
  resetState as resetQuizState,
  selectQuizId as selectCurrentQuizId,
  hydrateStateFromStorage,
} from "./slices/quizSlice";

// Subscription slice exports
export * from "./slices/subscriptionSlice";

// User slice exports
// Explicitly re-export conflicting members with unique names
export {
  resetState as resetUserState,
  setUserPreferences as setUserPreferencesFromUserSlice,
} from "./slices/userSlice";



// Flashcard slice exports
export * from "./slices/flashcardSlice";

