import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store";
import {
  resetQuiz,
  hydrateStateFromStorage,
  restoreQuizAfterAuth,
  setQuizResults,
  setQuiz,
  selectQuizState,
} from "@/store/slices/quiz-slice";
import { signIn as nextSignIn } from "next-auth/react";
import { safeStorage } from "@/lib/client-utils";
import { loginSuccess } from "@/store/slices/auth-slice";

export function useSessionService() {
  const dispatch = useDispatch<AppDispatch>();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const quizState = useSelector(selectQuizState);
  const [hasRestoredQuiz, setHasRestoredQuiz] = useState(false);
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);

  // Add useEffect to automatically restore pending quiz results when authentication changes
  useEffect(() => {
    if (isAuthenticated && !isLoading && !hasRestoredQuiz) {
      console.log(
        "Authentication state changed, attempting to restore quiz results"
      );

      // Also update Redux auth state from session
      if (session?.user) {
        dispatch(
          loginSuccess({
            user: session.user,
            token: session.token || null,
          })
        );
      }

      // Try to restore quiz state
      try {
        const restored = restoreQuizResults();
        if (restored) {
          setHasRestoredQuiz(true);
        }
        setHasAttemptedRestore(true);
      } catch (err) {
        console.error("Failed to restore quiz results:", err);
        setHasAttemptedRestore(true);
      }
    }
  }, [isAuthenticated, isLoading, session, dispatch, hasRestoredQuiz]);

  // Reset state when session is cleared
  useEffect(() => {
    if (status === "unauthenticated" && (hasRestoredQuiz || hasAttemptedRestore)) {
      setHasRestoredQuiz(false);
      setHasAttemptedRestore(false);
    }
  }, [status, hasRestoredQuiz, hasAttemptedRestore]);

  const restoreQuizResults = useCallback(() => {
    try {
      // Check if we're on the client to avoid errors
      if (typeof window === 'undefined') {
        return false;
      }
      
      // Try both localStorage and sessionStorage
      let pendingResultsJson = null;
      
      try {
        pendingResultsJson = localStorage.getItem("pendingQuizResults");
      } catch (err) {
        console.warn("Error accessing localStorage:", err);
      }
      
      if (!pendingResultsJson) {
        try {
          pendingResultsJson = sessionStorage.getItem("pendingQuizResults");
        } catch (err) {
          console.warn("Error accessing sessionStorage:", err);
        }
      }

      if (pendingResultsJson) {
        const pendingResults = JSON.parse(pendingResultsJson);
        console.log("Found pending quiz results:", pendingResults);

        if (pendingResults.results) {
          console.log("Restoring quiz results:", {
            slug: pendingResults.slug,
            title: pendingResults.title,
            hasQuestions: !!pendingResults.questions,
            quizType: pendingResults.quizType,
          });

          // Dispatch action to set quiz results
          dispatch(setQuizResults(pendingResults.results));

          // Set other necessary quiz data
          if (pendingResults.slug) {
            const normalizedSlug =
              typeof pendingResults.slug === "object"
                ? pendingResults.slug.slug
                : pendingResults.slug;

            dispatch(
              setQuiz({
                quizId: normalizedSlug,
                title: pendingResults.title || "Quiz Results",
                questions: pendingResults.questions || [],
                type: pendingResults.quizType || "mcq",
              })
            );
          }

          // Remove from storage to prevent duplicate processing
          try {
            localStorage.removeItem("pendingQuizResults");
          } catch (err) {
            console.warn("Error removing from localStorage:", err);
          }
          
          try {
            sessionStorage.removeItem("pendingQuizResults");
          } catch (err) {
            console.warn("Error removing from sessionStorage:", err);
          }

          console.log("Quiz state after restoration:", quizState);
          return true;
        }
      } else {
        console.log("No pending quiz results found in storage");
      }
      return false;
    } catch (error) {
      console.error("Error restoring quiz results:", error);
      return false;
    }
  }, [dispatch, quizState]);

  const signIn = useCallback(async (redirectState: any) => {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Create a timestamp to verify when sign-in was initiated
      localStorage.setItem("quizAuthTimestamp", Date.now().toString());

      // If we have quiz state, preserve it for after auth
      const quizStateJson = safeStorage.getItem("quiz_state");
      if (quizStateJson) {
        // Also store in sessionStorage as a backup
        sessionStorage.setItem("pendingQuizState", quizStateJson);
      }
      
      // Check if we have quiz answers backup and store them too
      const answersBackup = localStorage.getItem("quiz_answers_backup");
      if (answersBackup) {
        sessionStorage.setItem("quiz_answers_backup", answersBackup);
      }
    } catch (err) {
      console.warn("Error storing auth state:", err);
    }

    // Proceed with sign-in
    try {
      await nextSignIn();
    } catch (err) {
      console.error("Error during sign-in:", err);
    }
  }, []);

  const restoreAuthRedirectState = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Check if we have a timestamp to verify this is a recent auth flow
      const timestamp = localStorage.getItem("quizAuthTimestamp");
      const now = Date.now();

      if (timestamp && now - parseInt(timestamp) < 5 * 60 * 1000) {
        // 5 minutes
        // Use the Redux action to restore state (which reads from storage)
        dispatch(hydrateStateFromStorage());

        // Try to restore quiz results first
        const restoredFromLocal = restoreQuizResults();

        // If we didn't restore from localStorage, try the Redux flow
        if (!restoredFromLocal) {
          try {
            // Also check sessionStorage backup
            const backupState = sessionStorage.getItem("pendingQuizState");
            if (backupState) {
              safeStorage.setItem("quiz_state", backupState);
              sessionStorage.removeItem("pendingQuizState");
              dispatch(hydrateStateFromStorage());
            }

            // Also try to restore answers backup
            const answersBackup = sessionStorage.getItem("quiz_answers_backup");
            if (answersBackup) {
              localStorage.setItem("quiz_answers_backup", answersBackup);
              sessionStorage.removeItem("quiz_answers_backup");
            }
          } catch (err) {
            console.error("Error restoring backup state:", err);
          }

          // Also try to restore through the Redux flow
          dispatch(restoreQuizAfterAuth());
        }

        // Clean up auth flow markers
        localStorage.removeItem("quizAuthTimestamp");
      }
    } catch (err) {
      console.error("Error in restoreAuthRedirectState:", err);
    }
  }, [dispatch, restoreQuizResults]);

  const clearAuthState = useCallback(() => {
    try {
      dispatch(resetQuiz());
      
      if (typeof window === 'undefined') {
        return;
      }
      
      safeStorage.removeItem("quiz_state");
      
      try {
        sessionStorage.removeItem("pendingQuizState");
        sessionStorage.removeItem("pendingQuizResults");
        sessionStorage.removeItem("quiz_answers_backup");
        localStorage.removeItem("pendingQuizResults");
        localStorage.removeItem("quizAuthTimestamp");
        localStorage.removeItem("quiz_answers_backup");
      } catch (err) {
        console.warn("Error clearing storage:", err);
      }
      
      setHasRestoredQuiz(false);
      setHasAttemptedRestore(false);
    } catch (err) {
      console.error("Error in clearAuthState:", err);
    }
  }, [dispatch]);

  return {
    isAuthenticated,
    isLoading,
    signIn,
    restoreAuthRedirectState,
    restoreQuizResults,
    clearAuthState,
  };
}
