import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import type { TypedStartListening } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import {
  fetchQuiz,
  saveQuizSubmissionState, 
  clearQuizSubmissionState,
  submitQuiz,
  resetQuizState,
  setUserAnswer,
  setCurrentQuestion
} from '../slices/quizSlice'

// Constants - storage keys
const STORAGE_KEYS = {
  QUIZ_STATE: 'quiz_state',
  AUTH_REDIRECT: 'auth-redirect-state',
  SUBMISSION_PREFIX: 'quiz-submission-'
}

// Types for persistent state
interface PersistentQuizState {
  quizData: any;
  currentQuestion: number;
  userAnswers: any[];
  timeRemaining?: number | null;
  timerActive?: boolean;
}

// Helper functions - moved outside of middleware for better reusability
export function persistQuizState(state: PersistentQuizState): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.QUIZ_STATE, JSON.stringify(state));
    }
  } catch (e) {
    // Silent fail on storage errors
  }
}

export function loadPersistedQuizState(): PersistentQuizState | null {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEYS.QUIZ_STATE);
      return data ? JSON.parse(data) : null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function clearPersistedQuizState(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.QUIZ_STATE);
    }
  } catch (e) {
    // Silent fail on storage errors
  }
}

// Authentication redirect state
export function persistAuthRedirectState(state: any): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH_REDIRECT, JSON.stringify(state));
    }
  } catch (e) {
    // Silent fail
  }
}

export function loadAuthRedirectState(): any {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_REDIRECT);
      return data ? JSON.parse(data) : null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function clearAuthRedirectState(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_REDIRECT);
    }
  } catch (e) {
    // Silent fail
  }
}

export function hasAuthRedirectState(): boolean {
  try {
    if (typeof window !== 'undefined') {
      return Boolean(localStorage.getItem(STORAGE_KEYS.AUTH_REDIRECT));
    }
    return false;
  } catch (e) {
    return false;
  }
}

// Submission state handling - moved from slice to middleware
export function saveSubmissionState(slug: string, state: string): void {
  if (typeof window === 'undefined' || !slug) return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.SUBMISSION_PREFIX}${slug}`, state);
  } catch (e) {
    // Silent fail
  }
}

export function clearSubmissionState(slug: string): void {
  if (typeof window === 'undefined' || !slug) return;
  try {
    localStorage.removeItem(`${STORAGE_KEYS.SUBMISSION_PREFIX}${slug}`);
  } catch (e) {
    // Silent fail
  }
}

export function getSubmissionState(slug: string): string | null {
  if (typeof window === 'undefined' || !slug) return null;
  try {
    return localStorage.getItem(`${STORAGE_KEYS.SUBMISSION_PREFIX}${slug}`);
  } catch (e) {
    return null;
  }
}

// Create and export the middleware
const persistQuizMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState>;
const startAppListening = persistQuizMiddleware.startListening as AppStartListening;

// Listen to actions that should trigger state persistence
startAppListening({
  matcher: isAnyOf(
    setUserAnswer,
    setCurrentQuestion,
    fetchQuiz.fulfilled
  ),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState().quiz;
    
    // Skip persistence for test environment
    if (process.env.NODE_ENV === 'test') return;
    
    // Skip if no quiz is loaded
    if (!state.quizData) return;
    
    // Schedule persistence during idle time
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        persistQuizState({
          quizData: state.quizData,
          currentQuestion: state.currentQuestion,
          userAnswers: state.userAnswers,
          timeRemaining: state.timeRemaining,
          timerActive: state.timerActive,
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        persistQuizState({
          quizData: state.quizData,
          currentQuestion: state.currentQuestion,
          userAnswers: state.userAnswers,
          timeRemaining: state.timeRemaining,
          timerActive: state.timerActive,
        });
      }, 100);
    }
  }
});

// Clear persistence when quiz completes
startAppListening({
  matcher: isAnyOf(
    submitQuiz.fulfilled,
    resetQuizState
  ),
  effect: async () => {
    // Skip for test environment
    if (process.env.NODE_ENV === 'test') return;
    
    clearPersistedQuizState();
  }
});

// Handle submission state persistence actions
startAppListening({
  actionCreator: saveQuizSubmissionState.fulfilled,
  effect: async (action) => {
    if (process.env.NODE_ENV === 'test') return;
    
    const { slug, state } = action.payload;
    if (slug) {
      saveSubmissionState(slug, state);
    }
  }
});

startAppListening({
  actionCreator: clearQuizSubmissionState.fulfilled,
  effect: async (action) => {
    if (process.env.NODE_ENV === 'test') return;
    
    const slug = action.payload;
    if (slug) {
      clearSubmissionState(slug);
    }
  }
});

export default persistQuizMiddleware;
