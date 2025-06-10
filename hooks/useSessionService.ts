import { useCallback, useEffect } from "react";
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
} from "@/store/slices/quizSlice";
import { signIn as nextSignIn } from "next-auth/react";
import { safeStorage } from "@/store/middleware/persistMiddleware";

export function useSessionService() {
  const dispatch = useDispatch<AppDispatch>();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const quizState = useSelector(selectQuizState);

  // Add useEffect to automatically restore pending quiz results when authentication changes
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log(
        "Authentication state changed, attempting to restore quiz results"
      );
      restoreQuizResults();
    }
  }, [isAuthenticated, isLoading]);

  const restoreQuizResults = useCallback(() => {
    try {
      // Try both localStorage and sessionStorage
      let pendingResultsJson = localStorage.getItem("pendingQuizResults");
      if (!pendingResultsJson) {
        pendingResultsJson = sessionStorage.getItem("pendingQuizResults");
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
          localStorage.removeItem("pendingQuizResults");
          sessionStorage.removeItem("pendingQuizResults");

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
    // Create a timestamp to verify when sign-in was initiated
    if (typeof window !== "undefined") {
      localStorage.setItem("quizAuthTimestamp", Date.now().toString());
    }

    // Proceed with sign-in
    await nextSignIn();
  }, []);

  const restoreAuthRedirectState = useCallback(() => {
    // Use the Redux action to restore state (which reads from storage)
    dispatch(hydrateStateFromStorage());

    // Try to restore quiz results first
    const restoredFromLocal = restoreQuizResults();

    // If we didn't restore from localStorage, try the Redux flow
    if (!restoredFromLocal) {
      // Also try to restore through the Redux flow
      dispatch(restoreQuizAfterAuth());
    }
  }, [dispatch, restoreQuizResults]);

  const clearAuthState = useCallback(() => {
    dispatch(resetQuiz());
    safeStorage.removeItem("quiz_state");
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
