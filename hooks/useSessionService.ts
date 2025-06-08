"use client"

import { useCallback, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import { 
  hydrateQuiz,
  resetPendingQuiz, 
  setPendingQuiz,
  resetQuiz,
  setQuizResults
} from "@/store/slices/quizSlice"
import { selectPendingQuiz } from "@/store/slices/quizSlice"
import { useAppDispatch, useAppSelector } from "@/store"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { 
  saveAuthRedirectState as saveAuthRedirectStateUtil, 
  getAuthRedirectState, 
  clearAuthRedirectState as clearAuthRedirectStateUtil,
  type AuthRedirectState
} from "@/store/utils/authUtils"

// Session storage keys
const QUIZ_RESULTS_PREFIX = "quiz_results_";

export type QuizState = {
  slug: string
  quizData?: any
  currentState?: {
    answers?: Record<string, any>
    results?: any
    showResults?: boolean
    [key: string]: any
  }
}

export type AuthRedirectState = {
  returnPath: string
  quizState: QuizState
}

export function useSessionService() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const pendingQuiz = useSelector(selectPendingQuiz)
  const { data: session, status: authStatus } = useSession()

  // Get pending quiz from Redux state
  // Check sessionStorage on mount for any pending quiz state
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !pendingQuiz) {
        const storedQuiz = sessionStorage.getItem('pendingQuiz')
        if (storedQuiz) {
          console.log("Found stored quiz in sessionStorage, restoring...");
          const parsedQuiz = JSON.parse(storedQuiz)
          dispatch(setPendingQuiz(parsedQuiz));
        }
      }
    } catch (e) {
      console.error("Error checking for stored quiz:", e);
    }
    
    // Cleanup function to remove temporary flags
    return () => {
      try {
        if (typeof window !== "undefined") {
          // Clear any auth restoration flags
          const keys = Object.keys(sessionStorage);
          keys.forEach(key => {
            if (key.endsWith('_auth_restored')) {
              sessionStorage.removeItem(key);
            }
          });
        }
      } catch (e) {
        console.error("Error cleaning up session flags:", e);
      }
    };
  }, [dispatch, pendingQuiz]);

  // Save authentication redirect state with proper typing
  const saveAuthRedirectState = useCallback((state: AuthRedirectState) => {
    if (!state.returnPath) {
      console.error("Missing returnPath in auth redirect state");
      return;
    }
    
    // Save to session storage via the utility function
    import("@/store/utils/authUtils").then(({ saveAuthRedirectState }) => {
      saveAuthRedirectState(state);
    });
  }, []);

  // Restore auth redirect state and dispatch appropriate actions
  const restoreAuthRedirectState = useCallback((): AuthRedirectState | null => {
    const state = getAuthRedirectState();
    if (!state) return null;
    
    // If we have quiz state to restore
    if (state.quizState) {
      // Reset current quiz state before hydrating with saved state
      dispatch(resetQuiz());
      
      // Hydrate quiz with saved state
      if (state.quizState.slug) {
        dispatch(hydrateQuiz({
          slug: state.quizState.slug,
          quizData: state.quizState.quizData,
          currentState: state.quizState.currentState
        }));
      }
      
      // Set quiz results if they exist
      if (state.quizState.currentState?.results) {
        dispatch(setQuizResults(state.quizState.currentState.results));
      }
    }
    
    return state;
  }, [dispatch]);

  // Clear auth state from session storage and Redux
  const clearAuthState = useCallback(() => {
    clearAuthRedirectStateUtil();
    dispatch(resetPendingQuiz());
  }, [dispatch]);

  // Store quiz results in session storage
  const storeResults = useCallback((quizId: string, results: any) => {
    if (typeof window === 'undefined' || !sessionStorage) return;
    
    try {
      sessionStorage.setItem(
        `${QUIZ_RESULTS_PREFIX}${quizId}`, 
        JSON.stringify(results)
      );
    } catch (error) {
      console.error("Failed to store quiz results:", error);
    }
  }, []);

  // Get stored quiz results from session storage
  const getStoredResults = useCallback((quizId: string) => {
    if (typeof window === 'undefined' || !sessionStorage) return null;
    
    try {
      const storedResults = sessionStorage.getItem(`${QUIZ_RESULTS_PREFIX}${quizId}`);
      return storedResults ? JSON.parse(storedResults) : null;
    } catch (error) {
      console.error("Failed to get stored quiz results:", error);
      return null;
    }
  }, []);

  // Cleanup all quiz-related session data
  const cleanupSessionData = useCallback(() => {
    if (typeof window === 'undefined' || !sessionStorage) return;
    
    try {
      // Clear any auth redirect state
      clearAuthRedirectStateUtil();
      
      // Clean up all quiz-related sessions
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(QUIZ_RESULTS_PREFIX) || key.startsWith("quiz_session_")) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Reset redux state
      dispatch(resetQuiz());
      dispatch(resetPendingQuiz());
    } catch (error) {
      console.error("Failed to cleanup session data:", error);
    }
  }, [dispatch]);

  // New function to get stored results from sessionStorage
  const getStoredResultsLegacy = useCallback((slug: string) => {
    if (typeof window === "undefined") return null;
    
    try {
      // Try to get quiz results specifically for this slug
      // Use both formats to ensure compatibility with tests and implementation
      const storedResults = sessionStorage.getItem(`quiz_results_${slug}`) || 
                            localStorage.getItem(`quiz_results_${slug}`);
      if (storedResults) {
        return JSON.parse(storedResults);
      }
      
      // If not found, check if there's results in pending quiz
      const pendingQuizData = sessionStorage.getItem('pendingQuiz');
      if (pendingQuizData) {
        const parsedPendingQuiz = JSON.parse(pendingQuizData);
        if (parsedPendingQuiz.slug === slug && 
            parsedPendingQuiz.currentState?.results) {
          return parsedPendingQuiz.currentState.results;
        }
      }
      
      return null;
    } catch (e) {
      console.error("Error retrieving stored results:", e);
      return null;
    }
  }, []);

  // New function to store results in sessionStorage
  const storeResultsLegacy = useCallback((slug: string, results: any) => {
    if (typeof window === "undefined") return;
    
    try {
      const resultsKey = `quiz_results_${slug}`;
      
      // Store results for this specific quiz in both storages to accommodate both implementation and tests
      sessionStorage.setItem(resultsKey, JSON.stringify(results));
      localStorage.setItem(resultsKey, JSON.stringify(results));
      
      // Also update Redux state
      dispatch(setQuizResults(results));
      
      return true;
    } catch (e) {
      console.error("Error storing results:", e);
      return false;
    }
  }, [dispatch]);

  const clearAuthRedirectState = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("authRedirectPath");
        sessionStorage.removeItem("callbackUrl");
        localStorage.removeItem("authRedirectPath");
        localStorage.removeItem("callbackUrl");
      }
    } catch (error) {
      console.warn("Failed to clear auth redirect state:", error);
    }
  }, []);

  return {
    saveAuthRedirectState,
    restoreAuthRedirectState,
    clearAuthState,
    storeResults,
    getStoredResults,
    cleanupSessionData,
    pendingQuiz
  }
}
