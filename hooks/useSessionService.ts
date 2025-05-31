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
      try {
        const { returnPath } = state
        const quizState = state.quizState || {}
        const { slug = "", quizData = null, currentState = {} } = quizState

        // Validate required data
        if (!slug || typeof slug !== "string") {
          console.warn("saveAuthRedirectState: Invalid slug provided")
          return
        }

        console.log("Saving auth redirect state:", { 
          slug, 
          returnPath,
          hasResults: !!currentState.results,
          hasAnswers: !!currentState.answers && Object.keys(currentState.answers || {}).length > 0,
          showResults: currentState.showResults
        });

        // Create a pendingQuiz with proper structure
        const pendingQuizData = {
          slug,
          quizData,
          currentState: {
            ...currentState,
            showResults: currentState.showResults || false,
            // Store results if available
            results: currentState.results || null,
            // Store answers if available
            answers: currentState.answers || {},
          },
        }

        // Save to Redux store
        dispatch(setPendingQuiz(pendingQuizData))

        // For results pages, explicitly save the results to ensure they're available immediately
        if (currentState.showResults && currentState.results) {
          console.log("Saving quiz results for restoration after auth:", currentState.results);
          dispatch(setQuizResults(currentState.results))
        }

        // Save in both sessionStorage and localStorage for redundancy
        if (typeof window !== "undefined") {
          // Store the callback URL to ensure proper redirection after sign-in
          sessionStorage.setItem("callbackUrl", returnPath);
          sessionStorage.setItem("pendingQuiz", JSON.stringify(pendingQuizData));
          sessionStorage.setItem("authRedirectPath", returnPath);
          
          // Flag to indicate this is for viewing results after auth
          if (returnPath.includes('/results')) {
            sessionStorage.setItem(`${slug}_auth_for_results`, 'true');
          }
          
          try {
            // Also try localStorage as a backup
            localStorage.setItem("pendingQuiz", JSON.stringify(pendingQuizData))
            localStorage.setItem("authRedirectPath", returnPath);
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
            console.log("Restored quiz from sessionStorage")
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
              console.log("Restored quiz from localStorage")
            } catch (e) {
              console.error("Failed to parse localStorage quiz:", e)
            }
          }
        }
      }
      
      if (quizToRestore?.slug) {
        console.log("Restoring auth redirect state:", {
          slug: quizToRestore.slug,
          hasQuizData: !!quizToRestore.quizData,
          hasCurrentState: !!quizToRestore.currentState,
          showResults: quizToRestore.currentState?.showResults,
          hasResults: !!quizToRestore.currentState?.results,
          redirectPath
        });
        
        // Check if this restoration is specifically for showing results
        const isForResults = typeof window !== "undefined" && 
          sessionStorage.getItem(`${quizToRestore.slug}_auth_for_results`) === 'true';
        
        if (isForResults) {
          console.log("This restoration is specifically for showing results");
          
          // Apply the stored quiz state
          dispatch(hydrateQuiz({
            ...quizToRestore,
            currentState: {
              ...quizToRestore.currentState,
              showResults: true // Force showing results
            }
          }));
          
          // Remove the flag since we've used it
          sessionStorage.removeItem(`${quizToRestore.slug}_auth_for_results`);
        } else {
          // Standard restoration
          dispatch(hydrateQuiz(quizToRestore));
        }
        
        // Explicitly set results if they were stored
        if (quizToRestore.currentState?.results && 
            (quizToRestore.currentState.showResults || isForResults)) {
          console.log("Setting quiz results from pendingQuiz:", quizToRestore.currentState.results);
          
          // Wait a moment to ensure the hydrateQuiz has completed
          setTimeout(() => {
            dispatch(setQuizResults(quizToRestore.currentState.results));
          }, 100);
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
          if (key.endsWith('_auth_for_results')) {
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

  return {
    saveAuthRedirectState,
    restoreAuthRedirectState,
    clearAuthState,
    clearQuizResults,
  }
}
