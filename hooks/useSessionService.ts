import { useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import {
  resetQuiz,
  hydrateQuiz,
  setQuizResults,
  resetPendingQuiz,
} from "@/store/slices/quizSlice";
import { signIn as nextSignIn } from "next-auth/react";

const QUIZ_RESULTS_PREFIX = "quiz_results_";

const safeStorage = {
  getItem: (key: string) => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(key) || localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(key, value);
    localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
};

export function useSessionService() {
  const dispatch = useDispatch<AppDispatch>();
  const { data: session, status } = useSession();
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
    dispatch(resetPendingQuiz());
  }, [dispatch]);

  const storeResults = useCallback((quizId: string, results: any) => {
    safeStorage.setItem(`${QUIZ_RESULTS_PREFIX}${quizId}`, JSON.stringify(results));
  }, []);

  const getStoredResults = useCallback((quizId: string) => {
    const raw = safeStorage.getItem(`${QUIZ_RESULTS_PREFIX}${quizId}`);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const clearQuizResults = useCallback((quizId: string) => {
    safeStorage.removeItem(`${QUIZ_RESULTS_PREFIX}${quizId}`);
  }, []);

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
