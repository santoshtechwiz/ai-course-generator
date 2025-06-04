import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

// Reducers
import authReducer from "./slices/authSlice";
import quizReducer from "./slices/quizSlice";
import subscriptionReducer from "./slices/subscription-slice";
import userReducer from "./slices/userSlice";
import flashcardReducer from "./slices/flashcardSlice";
import courseReducer from "./slices/courseSlice";

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

const rootReducer = combineReducers({
  auth: authReducer,
  quiz: quizReducer,
  subscription: subscriptionReducer,
  user: userReducer,
  flashcard: flashcardReducer,
  course: persistReducer(coursePersistConfig, courseReducer),
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

// Exports
export * from "./slices/courseSlice";
export * from "./slices/quizSlice";
export { store, persistor };
