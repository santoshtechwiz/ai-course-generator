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
  
  // Get pending quiz from Redux state
  const pendingQuiz = useSelector(selectPendingQuiz)

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

  const saveAuthRedirectState = useCallback(
    (state: AuthRedirectState) => {
      // Used by QuizAuthGuard to save intended path for redirect after login
      try {
        const { returnPath } = state
        const quizState = state.quizState || {}
        const { slug = "", quizData = null, currentState = {} } = quizState

        // Validate required data
        if (!slug || typeof slug !== "string") {
          console.warn("saveAuthRedirectState: Invalid slug provided")
          return
        }

        // Create a pendingQuiz with proper structure
        const pendingQuizData = {
          slug,
          quizData,
          currentState: {
            ...currentState,
            showResults: currentState.showResults || false,
            results: currentState.results || null,
            answers: currentState.answers || {},
          },
        }

        // Save to Redux store
        dispatch(setPendingQuiz(pendingQuizData))

        // For results pages, explicitly save the results to ensure they're available immediately
        if (currentState.showResults && currentState.results) {
          dispatch(setQuizResults(currentState.results))
        }

        // Save in sessionStorage and localStorage for redundancy (no fromAuth or ?fromAuth=true)
        if (typeof window !== "undefined") {
          sessionStorage.setItem("callbackUrl", returnPath)
          sessionStorage.setItem("pendingQuiz", JSON.stringify(pendingQuizData))
          sessionStorage.setItem("authRedirectPath", returnPath)
          try {
            localStorage.setItem("pendingQuiz", JSON.stringify(pendingQuizData))
            localStorage.setItem("authRedirectPath", returnPath)
          } catch (e) {
            // Ignore localStorage errors
          }
        }
      } catch (error) {
        console.error("Failed to save auth redirect state:", error)
      }
    },
    [dispatch],
  )

  const restoreAuthRedirectState = useCallback(() => {
    try {
      // Get from Redux state first
      let quizToRestore = pendingQuiz;
      let redirectPath = null;

      // If not in Redux, try sessionStorage
      if (!quizToRestore && typeof window !== "undefined") {
        const stored = sessionStorage.getItem("pendingQuiz")
        if (stored) {
          try {
            quizToRestore = JSON.parse(stored)
            redirectPath = sessionStorage.getItem("authRedirectPath");
          } catch (e) {
            console.error("Failed to parse stored quiz:", e)
          }
        }
        // If still not found, try localStorage
        if (!quizToRestore) {
          const lsStored = localStorage.getItem("pendingQuiz")
          if (lsStored) {
            try {
              quizToRestore = JSON.parse(lsStored)
              redirectPath = localStorage.getItem("authRedirectPath");
            } catch (e) {
              console.error("Failed to parse localStorage quiz:", e)
            }
          }
        }
      }

      if (quizToRestore?.slug) {
        // Standard restoration
        dispatch(hydrateQuiz(quizToRestore))

        // Explicitly set results if they were stored
        if (quizToRestore.currentState?.results) {
          dispatch(setQuizResults(quizToRestore.currentState.results))
        }

        // Clean up storage
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("callbackUrl")
          sessionStorage.removeItem("pendingQuiz")
          sessionStorage.removeItem("authRedirectPath")
          localStorage.removeItem("pendingQuiz")
          localStorage.removeItem("authRedirectPath")
        }

        return {
          quizState: quizToRestore,
          redirectPath
        };
      }

      return null;
    } catch (e) {
      console.error("Failed to restore redirect state:", e);
      return null;
    }
  }, [dispatch, pendingQuiz]);

  const clearAuthState = useCallback(() => {
    try {
      dispatch(resetPendingQuiz());
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("callbackUrl");
        sessionStorage.removeItem("pendingQuiz");
        sessionStorage.removeItem("authRedirectPath");
        
        // Clear results-specific flags
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.endsWith('_auth_for_results') || key.endsWith('_auth_restored')) {
            sessionStorage.removeItem(key);
          }
        });
        
        try {
          localStorage.removeItem("pendingQuiz");
          localStorage.removeItem("authRedirectPath");
        } catch (e) {
          // Ignore localStorage errors
        }
      }
    } catch (error) {
      console.warn("Failed to clear auth state:", error);
    }
  }, [dispatch]);

  const clearQuizResults = useCallback(() => {
    // Reset quiz results but keep quiz data
    dispatch(resetQuiz());
    
    // Also clean up sessionStorage
    if (typeof window !== "undefined") {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('quiz_results_')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }, [dispatch]);

  // New function to get stored results from sessionStorage
  const getStoredResults = useCallback((slug: string) => {
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
  const storeResults = useCallback((slug: string, results: any) => {
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
  }
  , []);

  return {
    saveAuthRedirectState,
    restoreAuthRedirectState,
    clearAuthState,
    clearQuizResults,
    getStoredResults,
    storeResults,
    clearAuthRedirectState, // Add the missing function to the returned object
  }
}
