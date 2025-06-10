"use client";

import React, { useEffect, useState, useLayoutEffect } from "react";
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
  hydrateStateFromStorage,
  setQuiz,
  normalizeSlug,
  selectQuestions,
  selectQuizState,
} from "@/store/slices/quizSlice";
import { Button } from "@/components/ui/button";
import { QuizLoader } from "@/components/ui/quiz-loader";
import { useSessionService } from "@/hooks/useSessionService";
import type { QuizType } from "@/types/quiz";
import { AnimatePresence, motion } from "framer-motion";
import { QuizResultSkeleton } from "./QuizResultSkeleton";

interface SignInPromptProps {
  onSignIn: () => void;
  onRetake: () => void;
  quizType: QuizType;
  previewData?: { percentage: number; score: number; maxScore: number };
}

const GenericSignInPrompt: React.FC<SignInPromptProps> = ({
  onSignIn,
  onRetake,
  quizType,
  previewData,
}) => (
  <div className="flex flex-col items-center justify-center gap-6 p-8 text-center max-w-md mx-auto">
    <h2 className="text-2xl font-bold">Quiz Complete!</h2>
    <p className="text-gray-600">
      Sign in to save your progress and view detailed results.
    </p>
    {previewData && (
      <div className="bg-gray-50 p-4 rounded text-center">
        <div className="text-3xl font-bold text-blue-600">
          {previewData.percentage}%
        </div>
        <p>
          {previewData.score} out of {previewData.maxScore} correct
        </p>
      </div>
    )}
    <Button onClick={onSignIn} className="w-full">
      Sign In
    </Button>
    <Button onClick={onRetake} variant="outline" className="w-full">
      Retake Quiz
    </Button>
  </div>
);

interface Props {
  slug: string;
  quizType: QuizType;
  children: (props: { result: any }) => React.ReactNode;
}

type ViewState =
  | "loading"
  | "show_results"
  | "show_signin"
  | "no_results"
  | "error";

export default function GenericQuizResultHandler({
  slug,
  quizType,
  children,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Get the full quiz state for debugging
  const quizState = useSelector(selectQuizState);
  
  const {
    isAuthenticated,
    isLoading: isSessionLoading,
    restoreAuthRedirectState,
    clearAuthState,
    signIn,
    restoreQuizResults,
  } = useSessionService();

  const quizResults = useSelector(selectQuizResults);
  const generatedResults = useSelector(selectOrGenerateQuizResults);
  const quizStatus = useSelector(selectQuizStatus);
  const currentSlug = useSelector(selectQuizId);
  const questions = useSelector(selectQuestions);

  // Normalize the slug value
  const normalizedSlug = typeof slug === 'object' && slug.slug ? slug.slug : 
                        typeof slug === 'string' ? slug : 
                        currentSlug || '';

  // Use a single view state to prevent flickering
  const [viewState, setViewState] = useState<ViewState>("loading");
  
  // Hydration flag to ensure we don't render too early
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Recovery flag to track explicit recovery attempts
  const [hasAttemptedRecovery, setHasAttemptedRecovery] = useState(false);
  
  // Track loading timeouts
  const [loadingPhase, setLoadingPhase] = useState<"initial" | "extended" | "complete">("initial");

  // Use preserveState to prevent flickering on state transitions
  const [preservedResults, setPreservedResults] = useState<any>(null);

  // Use layout effect to prioritize storage restoration before render
  useLayoutEffect(() => {
    if (isAuthenticated) {
      // Try to hydrate state immediately to prevent flicker
      dispatch(hydrateStateFromStorage());
      restoreQuizResults();
    }
  }, [isAuthenticated, dispatch]);

  const handleRetake = () => {
    dispatch(resetQuiz());
    router.replace(`/dashboard/${quizType}/${normalizedSlug}`);
  };

  const handleSignIn = async () => {
    // Store quiz data more comprehensively
    if (generatedResults) {
      try {
        // Save current results to be able to show immediately after auth redirect
        setPreservedResults(generatedResults);
        
        // Store complete quiz state with normalized slug format
        const storeData = {
          slug: normalizedSlug,
          quizType,
          results: generatedResults,
          timestamp: Date.now(),
          questions: questions, // Include all questions
          title: generatedResults.title || `${quizType.toUpperCase()} Quiz`
        };
        
        // Store in localStorage with more complete information
        localStorage.setItem('pendingQuizResults', JSON.stringify(storeData));
        
        // Also store in sessionStorage as backup
        sessionStorage.setItem('pendingQuizResults', JSON.stringify(storeData));
        
        console.log('Stored quiz results before auth redirect:', storeData);
      } catch (error) {
        console.error('Failed to store quiz results before auth:', error);
      }
    }

    const returnPath = `/dashboard/${quizType}/${normalizedSlug}/results`;
    const redirectState = {
      returnPath,
      quizState: {
        slug: normalizedSlug,
        currentState: {
          results: generatedResults,
          showResults: true,
        },
      },
    };
    await signIn(redirectState);
  };

  // Hydrate state from storage on mount to ensure persistence
  useEffect(() => {
    dispatch(hydrateStateFromStorage());

    // Immediately check for results in storage - early attempt
    if (isAuthenticated && !hasAttemptedRecovery) {
      restoreQuizResults();
      setHasAttemptedRecovery(true);
    }
    
    // Progressive loading states to provide smooth transition
    const initialTimer = setTimeout(() => {
      setLoadingPhase("extended");
    }, 800);
    
    const extendedTimer = setTimeout(() => {
      setLoadingPhase("complete");
    }, 2000);
    
    // Log the initial state for debugging
    console.log('Initial quiz state:', quizState);
    console.log('Normalized slug:', normalizedSlug);
    
    // If we're on the results page, double check local storage directly
    try {
      const pendingJson = localStorage.getItem('pendingQuizResults');
      const sessionJson = sessionStorage.getItem('pendingQuizResults');
      
      console.log('Found in localStorage:', pendingJson ? 'yes' : 'no');
      console.log('Found in sessionStorage:', sessionJson ? 'yes' : 'no');
      
      if (pendingJson) {
        const pendingData = JSON.parse(pendingJson);
        console.log('Pending quiz data slug:', pendingData.slug);
        console.log('Current page slug:', normalizedSlug);

        // If this is the correct quiz and we have no results yet, restore immediately
        if (pendingData.slug === normalizedSlug && !quizResults && !generatedResults) {
          setPreservedResults(pendingData.results); // Cache results for immediate display
          dispatch(setQuizResults(pendingData.results));
          dispatch(setQuiz({
            quizId: normalizedSlug,
            title: pendingData.title || "Quiz Results",
            questions: pendingData.questions || [],
            type: pendingData.quizType || "mcq"
          }));
        }
      }
    } catch (error) {
      console.error('Error checking storage during initialization:', error);
    }
    
    // Cleanup timers
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(extendedTimer);
    };
  }, [dispatch, normalizedSlug, isAuthenticated]);

  // Handle authentication and results state
  useEffect(() => {
    // Don't proceed until session check is complete
    if (isSessionLoading) {
      console.log('Session still loading, waiting...');
      return;
    }

    console.log('Auth status updated:', isAuthenticated ? 'authenticated' : 'not authenticated');
    console.log('Current quiz state:', {
      hasResults: !!quizResults,
      hasGeneratedResults: !!generatedResults,
      hasPreservedResults: !!preservedResults,
      slug: normalizedSlug
    });

    // Once session is checked, handle results state
    if (isAuthenticated) {
      // Restore any auth redirect state
      restoreAuthRedirectState();
      
      // Try explicit recovery if we have no results yet
      if (!quizResults && !generatedResults && !preservedResults && !hasAttemptedRecovery) {
        console.log('Attempting explicit recovery of quiz results');
        const recovered = restoreQuizResults();
        setHasAttemptedRecovery(true);
        
        if (recovered) {
          console.log('Successfully recovered quiz results');
        } else {
          console.log('Could not recover quiz results');
        }
      }
      
      // Check for results, prioritizing preserved results
      if (quizResults || generatedResults || preservedResults) {
        console.log('Setting view state to show_results');
        setViewState("show_results");
      } else if (loadingPhase === "complete") {
        // Only show no_results after extended loading phase
        console.log('Setting view state to no_results');
        setViewState("no_results");
      }
    } else {
      // Not authenticated
      if (generatedResults || preservedResults) {
        console.log('Setting view state to show_signin');
        setViewState("show_signin");
      } else if (loadingPhase === "complete") {
        // Only show no_results after extended loading phase
        console.log('Setting view state to no_results');
        setViewState("no_results");
      }
    }
    
    // Mark as hydrated to prevent flickering
    if (loadingPhase === "extended") {
      setIsHydrated(true);
    }
  }, [
    isAuthenticated, 
    isSessionLoading, 
    quizResults, 
    generatedResults,
    preservedResults,
    restoreAuthRedirectState,
    hasAttemptedRecovery,
    normalizedSlug,
    loadingPhase
  ]);

  // Show appropriate loading state based on phase
  if (!isHydrated || isSessionLoading || quizStatus === "loading" || loadingPhase === "initial") {
    return (
      <QuizLoader
        message="Loading quiz results..."
        subMessage="Please wait"
        showTiming={true}
      />
    );
  }
  
  // Show skeleton for extended loading phase - gives a visual preview of results coming
  if (loadingPhase === "extended" && viewState === "loading") {
    return <QuizResultSkeleton />;
  }

  // AnimatePresence for smooth transitions between states
  return (
    <AnimatePresence mode="wait">
      {viewState === "show_signin" && (
        <motion.div
          key="signin"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GenericSignInPrompt
            onSignIn={handleSignIn}
            onRetake={handleRetake}
            quizType={quizType}
            previewData={
              (generatedResults || preservedResults)
                ? {
                    percentage: (generatedResults || preservedResults).percentage,
                    score: (generatedResults || preservedResults).score || (generatedResults || preservedResults).userScore,
                    maxScore: (generatedResults || preservedResults).maxScore,
                  }
                : undefined
            }
          />
        </motion.div>
      )}

      {viewState === "show_results" && (quizResults || generatedResults || preservedResults) && (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {children({ result: quizResults || generatedResults || preservedResults })}
        </motion.div>
      )}

      {viewState === "no_results" && (
        <motion.div
          key="no-results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center p-6"
        >
          <h2 className="text-2xl font-bold">No Results Found</h2>
          <p className="text-gray-600 mt-2 mb-6">
            Try retaking the quiz to view results.
          </p>
          <Button onClick={handleRetake} size="lg">
            Retake Quiz
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
