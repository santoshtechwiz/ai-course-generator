"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { Provider as ReduxProvider, useDispatch, useSelector } from "react-redux";
import { store } from "@/store";
import { useSession } from "next-auth/react";
import { useQuizState } from "@/hooks/useQuizState";
import {
  setIsAuthenticated,
  setRequiresAuth,
  setIsProcessingAuth,
} from "@/store/slices/quizSlice";

interface QuizProviderProps {
  children: ReactNode;
  quizId?: string;
  slug?: string;
  quizType?: string;
  quizData?: any;
  onAuthRequired?: (redirectUrl: string) => void;
}

type QuizContextValue = ReturnType<typeof useQuizState> & {
  quizData?: any;
  quizId?: string;
  slug?: string;
  quizType?: string;
};

const QuizContext = createContext<QuizContextValue | null>(null);

export const QuizProvider = ({
  children,
  quizId,
  slug,
  quizType,
  quizData,
  onAuthRequired,
}: QuizProviderProps) => {
  const initializedQuizId = useRef<string | undefined>(undefined);
  const quizState = useQuizState();
  const reduxState = useSelector((s: any) => s.quiz);
  const dispatch = useDispatch();
  const { data: session, status } = useSession();
  const isAuthenticated = Boolean(session?.user);

  // Reset init when we switch quizzes
  useEffect(() => {
    if (quizId !== initializedQuizId.current) {
      initializedQuizId.current = undefined;
    }
  }, [quizId]);

  // Initialize quiz data once per quiz
  useEffect(() => {
    if (
      quizData &&
      quizState.initializeQuiz &&
      initializedQuizId.current !== quizId
    ) {
      quizState.initializeQuiz(quizData);
      initializedQuizId.current = quizId;
    }
  }, [quizData, quizId, quizState]);

  // Keep Redux slice in sync with NextAuth
  useEffect(() => {
    if (status !== "loading") {
      dispatch(setIsAuthenticated(isAuthenticated));
    }
  }, [status, isAuthenticated, dispatch]);

  // Trigger onAuthRequired callback
  useEffect(() => {
    if (
      onAuthRequired &&
      reduxState.requiresAuth &&
      !reduxState.isAuthenticated &&
      !reduxState.isProcessingAuth
    ) {
      const currentUrl = typeof window !== "undefined" ? window.location.href : "";
      onAuthRequired(currentUrl);
    }
  }, [
    reduxState.requiresAuth,
    reduxState.isAuthenticated,
    reduxState.isProcessingAuth,
    onAuthRequired,
  ]);

  const contextValue: QuizContextValue = {
    ...quizState,
    quizData,
    quizId,
    slug,
    quizType,
  };

  return (
    <ReduxProvider store={store}>
      <QuizContext.Provider value={contextValue}>
        {children}
      </QuizContext.Provider>
    </ReduxProvider>
  );
};

export const useQuiz = () => {
  const ctx = useContext(QuizContext);
  if (!ctx) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return ctx;
};

// re-export slice actions for convenience
export {
  resetQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  setRequiresAuth,
  setIsProcessingAuth,
  fetchQuizResults,
  submitQuizResults,
  setPendingAuthRequired,
  setAuthCheckComplete,
  setHasGuestResult,
  clearGuestResults,
  setError,
} from "@/store/slices/quizSlice";
