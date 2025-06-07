import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

// Reducers
import authReducer from "./slices/authSlice";
import quizReducer from "./slices/quizSlice";
import subscriptionReducer from "./slices/subscriptionSlice"; // Updated import path
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

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

// Add these hooks for typed usage in app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Export slices functionality
export * from "./slices/authSlice";
export * from "./slices/courseSlice";
export * from "./slices/quizSlice";
export * from "./slices/subscriptionSlice"; // Updated export path
export * from "./slices/userSlice";
export * from "./slices/flashcardSlice";
export { store, persistor };
