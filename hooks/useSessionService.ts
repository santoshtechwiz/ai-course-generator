import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import {
  resetQuiz,
  hydrateQuiz,
  setQuizResults,
} from "@/store/slices/quizSlice";
import { signIn as nextSignIn } from "next-auth/react";

// Safe Storage with SSR support
const safeStorage = {
  getItem(key: string) {
    try {
      if (typeof window !== "undefined") {
        return sessionStorage.getItem(key) || localStorage.getItem(key);
      }
    } catch {}
    return null;
  },
  setItem(key: string, value: string) {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(key, value);
        localStorage.setItem(key, value);
      }
    } catch {}
  },
  removeItem(key: string) {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      }
    } catch {}
  },
};

export function useSessionService() {
  const dispatch = useDispatch<AppDispatch>();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const signIn = useCallback(async (redirectState: any) => {
    safeStorage.setItem("authRedirectState", JSON.stringify(redirectState));
    await nextSignIn();
  }, []);

  const restoreAuthRedirectState = useCallback(() => {
    const raw = safeStorage.getItem("authRedirectState");
    if (!raw) return null;
    try {
      const state = JSON.parse(raw);
      dispatch(resetQuiz());
      if (state.quizState?.slug) {
        dispatch(hydrateQuiz(state.quizState));
      }
      if (state.quizState?.currentState?.results) {
        dispatch(setQuizResults(state.quizState.currentState.results));
      }
      return state;
    } catch {
      return null;
    }
  }, [dispatch]);

  const clearAuthState = useCallback(() => {
    safeStorage.removeItem("authRedirectState");
    dispatch(resetQuiz());
  }, [dispatch]);

  const storeResults = useCallback((quizId: string, results: any) => {
    safeStorage.setItem(`quiz_results_${quizId}`, JSON.stringify(results));
  }, []);

  const getStoredResults = useCallback((quizId: string) => {
    try {
      const raw = safeStorage.getItem(`quiz_results_${quizId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const clearQuizResults = useCallback((quizId: string) => {
    safeStorage.removeItem(`quiz_results_${quizId}`);
  }, []);

  // Deprecated — keep old quizService here but do not delete
  // export const quizService = ... (deprecated)

  return {
    isAuthenticated,
    isLoading,
    signIn,
    restoreAuthRedirectState,
    clearAuthState,
    storeResults,
    getStoredResults,
    clearQuizResults,
  };
}
