import { configureStore } from '@reduxjs/toolkit';
import { textQuizReducer } from './slices/textQuizSlice';

export const store = configureStore({
  reducer: {
    textQuiz: textQuizReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Re-export the types and actions
export type { TextQuizState } from '@/app/types/slice-type';
export {
  initializeQuiz,
  submitAnswer,
  completeQuiz,
  setCurrentQuestion,
  selectTextQuizState,
} from './slices/textQuizSlice';

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;