"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store";

import {
  resetQuiz,
  setQuizResults,
  selectQuizResults,
  selectQuizStatus,
  selectOrGenerateQuizResults,
  selectQuizId,
} from "@/store/slices/quizSlice";

import { Button } from "@/components/ui/button";
import { QuizLoader } from "@/components/ui/quiz-loader";
import { useSessionService } from "@/hooks/useSessionService";
import type { QuizType } from "@/types/quiz";

interface SignInPromptProps {
  onSignIn: () => void;
  onRetake: () => void;
  quizType: QuizType;
  previewData?: { percentage: number; score: number; maxScore: number };
}

const GenericSignInPrompt: React.FC<SignInPromptProps> = ({ onSignIn, onRetake, quizType, previewData }) => (
  <div className="flex flex-col items-center justify-center gap-6 p-8 text-center max-w-md mx-auto">
    <h2 className="text-2xl font-bold">Quiz Complete!</h2>
    <p className="text-gray-600">Sign in to save your progress and view detailed results.</p>
    {previewData && (
      <div className="bg-gray-50 p-4 rounded text-center">
        <div className="text-3xl font-bold text-blue-600">{previewData.percentage}%</div>
        <p>{previewData.score} out of {previewData.maxScore} correct</p>
      </div>
    )}
    <Button onClick={onSignIn} className="w-full">Sign In</Button>
    <Button onClick={onRetake} variant="outline" className="w-full">Retake Quiz</Button>
  </div>
);

interface Props {
  slug: string;
  quizType: QuizType;
  children: (props: { result: any }) => React.ReactNode;
}

type ViewState = "loading" | "show_results" | "show_signin" | "no_results" | "error";

export default function GenericQuizResultHandler({ slug, quizType, children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const {
    isAuthenticated,
    isLoading: isSessionLoading,
    restoreAuthRedirectState,
    clearAuthState,
    signIn,
    storeResults,
    getStoredResults,
  } = useSessionService();

  const quizResults = useSelector(selectQuizResults);
  const generatedResults = useSelector(selectOrGenerateQuizResults);
  const quizStatus = useSelector(selectQuizStatus);
  const currentSlug = useSelector(selectQuizId);

  const quizSlug = slug || currentSlug;

  const [viewState, setViewState] = useState<ViewState>("loading");

  const handleRetake = () => {
    dispatch(resetQuiz());
    router.replace(`/dashboard/${quizType}/${slug}`);
  };

  const handleSignIn = async () => {
    const returnPath = `/dashboard/${quizType}/${slug}/results`;
    const redirectState = {
      returnPath,
      quizState: {
        slug,
        currentState: {
          results: generatedResults,
          showResults: true,
        },
      },
    };
    await signIn(redirectState);
  };

  // Restore on mount if applicable
  useEffect(() => {
    if (isAuthenticated) {
      const restored = restoreAuthRedirectState();
      if (restored?.quizState?.currentState?.results) {
        dispatch(setQuizResults(restored.quizState.currentState.results));
      }
      clearAuthState();
    }
  }, [isAuthenticated, restoreAuthRedirectState, clearAuthState, dispatch]);

  // Determine state
  useEffect(() => {
    if (quizStatus === "loading") return;

    if (isSessionLoading) {
      // Prevent lock-in if unauthenticated + no results
      if (!isAuthenticated && !generatedResults) {
        setViewState("no_results");
      }
      return;
    }

    if (isAuthenticated) {
      const result = quizResults || generatedResults || getStoredResults(quizSlug);
      if (result) {
        dispatch(setQuizResults(result));
        storeResults(quizSlug, result);
        setViewState("show_results");
      } else {
        setViewState("no_results");
      }
    } else {
      setViewState(generatedResults ? "show_signin" : "no_results");
    }
  }, [
    isSessionLoading,
    isAuthenticated,
    quizStatus,
    quizResults,
    generatedResults,
    quizSlug,
    dispatch,
    getStoredResults,
    storeResults,
  ]);

  // Render
  if (viewState === "loading") {
    return <QuizLoader message="Loading quiz results..." subMessage="Please wait" />;
  }

  if (viewState === "show_signin") {
    return (
      <GenericSignInPrompt
        onSignIn={handleSignIn}
        onRetake={handleRetake}
        quizType={quizType}
        previewData={generatedResults ? {
          percentage: generatedResults.percentage,
          score: generatedResults.score || generatedResults.userScore,
          maxScore: generatedResults.maxScore
        } : undefined}
      />
    );
  }

  if (viewState === "show_results" && (quizResults || generatedResults)) {
    return children({ result: quizResults || generatedResults });
  }

  if (viewState === "no_results") {
    return (
      <div className="text-center p-6">
        <h2 className="text-2xl font-bold">No Results Found</h2>
        <p className="text-gray-600">Try retaking the quiz to view results.</p>
        <Button onClick={handleRetake} className="mt-4">Retake Quiz</Button>
      </div>
    );
  }

  return <div className="text-center text-red-600">An unexpected error occurred.</div>;
}
