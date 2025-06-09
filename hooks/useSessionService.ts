"use client";

import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store";
import {
  hydrateQuiz,
  resetPendingQuiz,
  setPendingQuiz,
  resetQuiz,
  setQuizResults
} from "@/store/slices/quizSlice";
import { selectPendingQuiz } from "@/store/slices/quizSlice";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  saveAuthRedirectState as saveAuthRedirectStateUtil,
  getAuthRedirectState,
  clearAuthRedirectState as clearAuthRedirectStateUtil
} from "@/store/utils/authUtils";

// Constants
const QUIZ_RESULTS_PREFIX = "quiz_results_";
const PENDING_QUIZ_KEY = "pendingQuiz";

// Types
export type QuizState = {
  slug: string;
  quizData?: any;
  currentState?: {
    answers?: Record<string, any>;
    results?: any;
    showResults?: boolean;
    [key: string]: any;
  };
};

export type AuthRedirectState = {
  returnPath: string;
  quizState: QuizState;
};

// Safe session/local storage utils
const safeStorage = {
  getItem: (key: string, fromLocal = false): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return fromLocal ? localStorage.getItem(key) : sessionStorage.getItem(key);
    } catch (e) {
      console.warn(`Failed to get ${key} from storage`, e);
      return null;
    }
  },
  setItem: (key: string, value: string, toLocal = false): boolean => {
    if (typeof window === "undefined") return false;
    try {
      if (toLocal) localStorage.setItem(key, value);
      else sessionStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`Failed to set ${key} in storage`, e);
      return false;
    }
  },
  removeItem: (key: string, fromLocal = false): void => {
    if (typeof window === "undefined") return;
    try {
      fromLocal ? localStorage.removeItem(key) : sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove ${key} from storage`, e);
    }
  }
};

export function useSessionService() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pendingQuiz = useSelector(selectPendingQuiz);
  const { data: session, status: authStatus } = useSession();

  // Hydrate Redux from sessionStorage on mount if needed
  useEffect(() => {
    if (!pendingQuiz && typeof window !== "undefined") {
      const storedQuiz = safeStorage.getItem(PENDING_QUIZ_KEY);
      if (storedQuiz) {
        try {
          const parsedQuiz = JSON.parse(storedQuiz);
          dispatch(setPendingQuiz(parsedQuiz));
        } catch (e) {
          console.error("Invalid pendingQuiz JSON in sessionStorage", e);
        }
      }
    }

    return () => {
      // Cleanup session keys (like restoration flags)
      if (typeof window !== "undefined") {
        Object.keys(sessionStorage).forEach(key => {
          if (key.endsWith("_auth_restored")) {
            sessionStorage.removeItem(key);
          }
        });
      }
    };
  }, [dispatch, pendingQuiz]);

  const saveAuthRedirectState = useCallback((state: AuthRedirectState) => {
    if (!state.returnPath) {
      console.error("Missing returnPath in auth redirect state");
      return;
    }
    import("@/store/utils/authUtils").then(({ saveAuthRedirectState }) => {
      saveAuthRedirectState(state);
    });
  }, []);

  const restoreAuthRedirectState = useCallback((): AuthRedirectState | null => {
    const state = getAuthRedirectState();
    if (!state) return null;

    if (state.quizState) {
      dispatch(resetQuiz());
      if (state.quizState.slug) {
        dispatch(
          hydrateQuiz({
            slug: state.quizState.slug,
            quizData: state.quizState.quizData,
            currentState: state.quizState.currentState
          })
        );
      }

      if (state.quizState.currentState?.results) {
        dispatch(setQuizResults(state.quizState.currentState.results));
      }
    }

    return state;
  }, [dispatch]);

  const clearAuthState = useCallback(() => {
    clearAuthRedirectStateUtil();
    dispatch(resetPendingQuiz());
  }, [dispatch]);

  const storeResults = useCallback((quizId: string, results: any) => {
    const key = `${QUIZ_RESULTS_PREFIX}${quizId}`;
    safeStorage.setItem(key, JSON.stringify(results));
  }, []);

  const getStoredResults = useCallback((quizId: string) => {
    const key = `${QUIZ_RESULTS_PREFIX}${quizId}`;
    const data = safeStorage.getItem(key);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Invalid JSON in stored quiz results", e);
      return null;
    }
  }, []);

  const cleanupSessionData = useCallback(() => {
    clearAuthRedirectStateUtil();

    if (typeof window !== "undefined") {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(QUIZ_RESULTS_PREFIX) || key.startsWith("quiz_session_")) {
          sessionStorage.removeItem(key);
        }
      });
    }

    dispatch(resetQuiz());
    dispatch(resetPendingQuiz());
  }, [dispatch]);

  const getStoredResultsLegacy = useCallback((slug: string) => {
    const key = `${QUIZ_RESULTS_PREFIX}${slug}`;
    const data = safeStorage.getItem(key) || safeStorage.getItem(key, true);

    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Invalid JSON in legacy stored quiz results", e);
      }
    }

    const pendingData = safeStorage.getItem(PENDING_QUIZ_KEY);
    if (pendingData) {
      try {
        const parsed = JSON.parse(pendingData);
        if (parsed.slug === slug && parsed.currentState?.results) {
          return parsed.currentState.results;
        }
      } catch (e) {
        console.error("Invalid pending quiz state JSON", e);
      }
    }

    return null;
  }, []);

  const storeResultsLegacy = useCallback((slug: string, results: any) => {
    const key = `${QUIZ_RESULTS_PREFIX}${slug}`;
    const resultStr = JSON.stringify(results);

    const success1 = safeStorage.setItem(key, resultStr);
    const success2 = safeStorage.setItem(key, resultStr, true);

    dispatch(setQuizResults(results));
    return success1 && success2;
  }, [dispatch]);

  const clearAuthRedirectState = useCallback(() => {
    ["authRedirectPath", "callbackUrl"].forEach(key => {
      safeStorage.removeItem(key);
      safeStorage.removeItem(key, true);
    });
  }, []);

  return {
    saveAuthRedirectState,
    restoreAuthRedirectState,
    clearAuthState,
    storeResults,
    getStoredResults,
    cleanupSessionData,
    pendingQuiz
  };
}
